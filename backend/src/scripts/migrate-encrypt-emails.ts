import 'reflect-metadata'
import { config } from 'dotenv'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { KMSClient, DecryptCommand } from '@aws-sdk/client-kms'
import { EncryptionService } from '../services/implementations/EncryptionService'

config()

const BATCH_SIZE = 20
const DELAY_BETWEEN_BATCHES = 5000 

interface BookingSeat {
  ticket_id: number
  booking_id: number
  seat_id: number
  customer_email: string
}

function isAlreadyEncrypted(email: string): boolean {
  if (!email) return false
  const parts = email.split('.')
  return parts.length === 3 && /^[0-9a-f]+$/i.test(parts[0]) && /^[0-9a-f]+$/i.test(parts[1])
}

async function initializeEncryption(): Promise<EncryptionService> {
  const { AWS_REGION, PII_ENCRYPTION_KEY_ID, ENCRYPTED_DATA_KEY } = process.env
  if (!AWS_REGION || !PII_ENCRYPTION_KEY_ID || !ENCRYPTED_DATA_KEY) {
    throw new Error('Missing required environment variables for AWS KMS')
  }

  console.log('🔑 Initializing encryption service...')
  const kmsClient = new KMSClient({ region: AWS_REGION })
  const { Plaintext } = await kmsClient.send(
    new DecryptCommand({
      CiphertextBlob: Buffer.from(ENCRYPTED_DATA_KEY, 'base64'),
      KeyId: PII_ENCRYPTION_KEY_ID,
    }),
  )

  if (!Plaintext) throw new Error('Failed to decrypt data key from KMS')

  const encryptionService = new EncryptionService()
  encryptionService.setDecryptionKey(Buffer.from(Plaintext))
  console.log('✅ Encryption service initialized\n')
  return encryptionService
}

function getSupabaseClient(): SupabaseClient {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

async function fetchUnencryptedBookingSeats(
  supabase: SupabaseClient,
  limit: number,
  lastBookingId: number,
): Promise<BookingSeat[]> {
  const { data, error } = await supabase
    .from('Booking_seat')
    .select('ticket_id, booking_id, seat_id, customer_email')
    .gt('booking_id', lastBookingId)
    .order('booking_id', { ascending: true })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch booking seats: ${error.message}`)

  const unencrypted = (data || []).filter(seat => seat.customer_email && !isAlreadyEncrypted(seat.customer_email))

  const skippedCount = (data || []).length - unencrypted.length
  if (skippedCount > 0) {
    console.log(`   Filtered out ${skippedCount} already-encrypted or empty records from this fetch`)
  }

  return unencrypted
}

// Updates a single booking seat record with the encrypted email
async function updateBookingSeat(
  supabase: SupabaseClient,
  bookingId: number,
  seatId: number,
  encryptedEmail: string,
): Promise<void> {
  const { error } = await supabase
    .from('Booking_seat')
    .update({ customer_email: encryptedEmail })
    .eq('booking_id', bookingId)
    .eq('seat_id', seatId)

  if (error) {
    throw new Error(`Failed to update booking_id ${bookingId}, seat_id ${seatId}: ${error.message}`)
  }
}

// Utility function to pause execution
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function migrateEmails() {
  console.log('🚀 Starting email encryption migration\n')
  console.log(`📦 Batch size: ${BATCH_SIZE}`)
  console.log(`⏱️ Delay between batches: ${DELAY_BETWEEN_BATCHES}ms\n`)

  const encryptionService = await initializeEncryption()
  const supabase = getSupabaseClient()

  let lastBookingId = 0
  let totalEncrypted = 0
  let totalFailures = 0
  let hasMore = true

  while (hasMore) {
    console.log(`📊 Fetching batch starting after booking_id > ${lastBookingId}...`)
    const batch = await fetchUnencryptedBookingSeats(supabase, BATCH_SIZE, lastBookingId)

    if (batch.length === 0) {
      hasMore = false
      break
    }

    console.log(`   Found ${batch.length} records to process in this batch.`)
    lastBookingId = batch[batch.length - 1].booking_id

    const updatePromises = batch.map(seat => {
      try {
        const encryptedEmail = encryptionService.encrypt(seat.customer_email)
        return updateBookingSeat(supabase, seat.booking_id, seat.seat_id, encryptedEmail)
      } catch (error) {
        return Promise.reject(new Error(`Encryption failed for booking_id ${seat.booking_id}: ${(error as Error).message}`))
      }
    })

    const results = await Promise.allSettled(updatePromises)

    let batchEncrypted = 0
    results.forEach((result, index) => {
      const seat = batch[index]
      if (result.status === 'fulfilled') {
        console.log(`   ✅ Encrypted ticket_id ${seat.ticket_id} (booking_id: ${seat.booking_id})`)
        batchEncrypted++
      } else {
        console.error(`   ❌ Failed to process ticket_id ${seat.ticket_id} (booking_id: ${seat.booking_id}):`, result.reason.message)
        totalFailures++
      }
    })

    totalEncrypted += batchEncrypted
    console.log(`\n   Batch complete: ${batchEncrypted} encrypted, ${results.length - batchEncrypted} failed`)
    console.log(`   Last processed booking_id: ${lastBookingId}\n`)

    if (batch.length === BATCH_SIZE) {
      console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...\n`)
      await sleep(DELAY_BETWEEN_BATCHES)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✨ Migration phase completed!')
  console.log('='.repeat(60))
  console.log(`🔐 Total emails encrypted: ${totalEncrypted}`)
  console.log(`❌ Total failures: ${totalFailures}`)
  console.log(`📍 Last processed booking_id: ${lastBookingId}`)
  console.log('='.repeat(60) + '\n')

  console.log('🔍 Starting final verification...')
  const { data: finalCheck, error } = await supabase.from('Booking_seat').select('customer_email')
  if (error) throw new Error(`Verification failed: ${error.message}`)

  const remainingUnencrypted = (finalCheck || []).filter(
    seat => seat.customer_email && !isAlreadyEncrypted(seat.customer_email),
  )

  console.log('='.repeat(60))
  console.log('🎉 Migration complete!')
  if (remainingUnencrypted.length === 0) {
    console.log('✅ Success! All emails have been verified as encrypted.')
  } else {
    console.error(`⚠️ WARNING: ${remainingUnencrypted.length} unencrypted emails remain. Please investigate or re-run the script.`)
  }
  console.log('='.repeat(60) + '\n')

  if (remainingUnencrypted.length > 0) {
    process.exit(1)
  }
}

if (require.main === module) {
  migrateEmails()
    .then(() => {
      console.log('👋 Exiting...')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ A fatal error occurred during migration:', error)
      process.exit(1)
    })
}

export { migrateEmails }