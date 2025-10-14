import 'reflect-metadata'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'
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
  if (parts.length !== 3) return false

  const hexRegex = /^[0-9a-f]+$/i
  return parts.every(part => hexRegex.test(part))
}

async function initializeEncryption(): Promise<EncryptionService> {
  const { AWS_REGION, PII_ENCRYPTION_KEY_ID, ENCRYPTED_DATA_KEY } = process.env

  if (!AWS_REGION || !PII_ENCRYPTION_KEY_ID || !ENCRYPTED_DATA_KEY) {
    throw new Error('Missing required environment variables: AWS_REGION, PII_ENCRYPTION_KEY_ID, ENCRYPTED_DATA_KEY')
  }

  console.log('🔑 Initializing encryption service...')

  const encryptionService = new EncryptionService()
  const kmsClient = new KMSClient({ region: AWS_REGION })

  const { Plaintext } = await kmsClient.send(
    new DecryptCommand({
      CiphertextBlob: Buffer.from(ENCRYPTED_DATA_KEY, 'base64'),
      KeyId: PII_ENCRYPTION_KEY_ID
    })
  )

  if (!Plaintext) {
    throw new Error('Failed to decrypt data key from KMS')
  }

  encryptionService.setDecryptionKey(Buffer.from(Plaintext))
  console.log('✅ Encryption service initialized\n')

  return encryptionService
}

function getSupabaseClient() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

async function fetchUnencryptedBookingSeats(
  supabase: ReturnType<typeof getSupabaseClient>,
  limit: number,
  lastBookingId: number
): Promise<BookingSeat[]> {
  const { data, error } = await supabase
    .from('Booking_seat')
    .select('ticket_id, booking_id, seat_id, customer_email')
    .gt('booking_id', lastBookingId)
    .order('booking_id', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to fetch booking seats: ${error.message}`)
  }

  const allRecords = data || []

  // Filter out already encrypted emails
  const unencrypted = allRecords.filter(seat => !isAlreadyEncrypted(seat.customer_email))

  const skippedCount = allRecords.length - unencrypted.length
  if (skippedCount > 0) {
    console.log(`   Filtered out ${skippedCount} already-encrypted records from this batch`)
  }

  return unencrypted
}async function updateBookingSeat(
  supabase: ReturnType<typeof getSupabaseClient>,
  bookingId: number,
  seatId: number,
  encryptedEmail: string
): Promise<void> {
  const { data, error } = await supabase
    .from('Booking_seat')
    .update({ customer_email: encryptedEmail })
    .eq('booking_id', bookingId)
    .eq('seat_id', seatId)
    .select()

  if (error) {
    throw new Error(`Failed to update booking seat (booking_id: ${bookingId}, seat_id: ${seatId}): ${error.message}`)
  }

  if (!data || data.length === 0) {
    console.warn(`   ⚠️  Warning: No rows updated for booking_id ${bookingId}, seat_id ${seatId}`)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function migrateEmails() {
  console.log('🚀 Starting email encryption migration\n')
  console.log(`📦 Batch size: ${BATCH_SIZE}`)
  console.log(`⏱️  Delay between batches: ${DELAY_BETWEEN_BATCHES}ms\n`)

  try {
    const encryptionService = await initializeEncryption()
    const supabase = getSupabaseClient()

    let lastBookingId = 0
    let totalProcessed = 0
    let totalEncrypted = 0
    let totalSkipped = 0
    let hasMore = true

    while (hasMore) {
      console.log(`📊 Fetching batch starting from booking_id > ${lastBookingId}...`)

      const batch = await fetchUnencryptedBookingSeats(supabase, BATCH_SIZE, lastBookingId)

      if (batch.length === 0) {
        hasMore = false
        break
      }

      console.log(`   Found ${batch.length} unencrypted records to process`)

      for (const seat of batch) {
        try {
          if (!seat.customer_email) {
            console.log(`   ⚠️  Skipping ticket_id ${seat.ticket_id} (booking_id: ${seat.booking_id}) - no email`)
            totalSkipped++
            continue
          }

          if (isAlreadyEncrypted(seat.customer_email)) {
            console.log(`   ✓ Skipping ticket_id ${seat.ticket_id} (booking_id: ${seat.booking_id}) - already encrypted`)
            totalSkipped++
            continue
          }

          const encryptedEmail = encryptionService.encrypt(seat.customer_email)

          await updateBookingSeat(supabase, seat.booking_id, seat.seat_id, encryptedEmail)

          console.log(`   ✅ Encrypted ticket_id ${seat.ticket_id} (booking_id: ${seat.booking_id}) - ${seat.customer_email}`)
          totalEncrypted++

          lastBookingId = seat.booking_id

        } catch (error) {
          console.error(`   ❌ Failed to process ticket_id ${seat.ticket_id} (booking_id: ${seat.booking_id}):`, (error as Error).message)
        }

        totalProcessed++
      }

      console.log(`   Batch complete: ${totalEncrypted} encrypted, ${totalSkipped} skipped`)
      console.log(`   Last processed booking_id: ${lastBookingId}\n`)

      if (hasMore && batch.length === BATCH_SIZE) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...\n`)
        await sleep(DELAY_BETWEEN_BATCHES)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✨ Migration phase completed!')
    console.log('='.repeat(60))
    console.log(`📊 Total records processed: ${totalProcessed}`)
    console.log(`🔐 Total emails encrypted: ${totalEncrypted}`)
    console.log(`⏭️  Total records skipped: ${totalSkipped}`)
    console.log(`📍 Last processed booking_id: ${lastBookingId}`)
    console.log('='.repeat(60) + '\n')

    // rechecking
    console.log('🔍 Starting verification phase...')
    console.log('   Rechecking database for any remaining unencrypted emails...\n')

    const { data: allRecords, error: verifyError } = await supabase
      .from('Booking_seat')
      .select('ticket_id, booking_id, seat_id, customer_email')
      .order('booking_id', { ascending: true })

    if (verifyError) {
      throw new Error(`Failed to verify records: ${verifyError.message}`)
    }

    const remainingUnencrypted = (allRecords || []).filter(
      seat => seat.customer_email && !isAlreadyEncrypted(seat.customer_email)
    )

    if (remainingUnencrypted.length > 0) {
      console.log(`⚠️  Found ${remainingUnencrypted.length} remaining unencrypted records!`)
      console.log('   Processing remaining records...\n')

      let verifyEncrypted = 0
      for (const seat of remainingUnencrypted) {
        try {
          const encryptedEmail = encryptionService.encrypt(seat.customer_email)
          await updateBookingSeat(supabase, seat.booking_id, seat.seat_id, encryptedEmail)
          console.log(`   ✅ Encrypted booking_id: ${seat.booking_id}, seat_id: ${seat.seat_id}`)
          verifyEncrypted++
        } catch (error) {
          console.error(`   ❌ Failed to encrypt booking_id: ${seat.booking_id}, seat_id: ${seat.seat_id}:`, (error as Error).message)
        }
      }

      console.log(`\n   Verification phase encrypted ${verifyEncrypted} additional records\n`)
    } else {
      console.log('✅ Verification passed! All emails are encrypted.\n')
    }

    const { data: finalCheck, error: finalError } = await supabase
      .from('Booking_seat')
      .select('customer_email')

    if (finalError) {
      throw new Error(`Failed to perform final check: ${finalError.message}`)
    }

    const finalUnencrypted = (finalCheck || []).filter(
      seat => seat.customer_email && !isAlreadyEncrypted(seat.customer_email)
    )

    console.log('='.repeat(60))
    console.log('🎉 Migration completed successfully!')
    console.log('='.repeat(60))
    console.log(`📊 Total records in database: ${finalCheck?.length || 0}`)
    console.log(`🔐 Total encrypted in main phase: ${totalEncrypted}`)
    console.log(`🔍 Additional encrypted in verification: ${remainingUnencrypted.length}`)
    console.log(`✅ Final status: ${finalUnencrypted.length === 0 ? 'ALL EMAILS ENCRYPTED' : `${finalUnencrypted.length} REMAINING UNENCRYPTED`}`)
    console.log('='.repeat(60) + '\n')

    if (finalUnencrypted.length > 0) {
      console.error('⚠️  WARNING: Some emails are still unencrypted. Please run the migration again.')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', (error as Error).message)
    console.error((error as Error).stack)
    process.exit(1)
  }
}

if (require.main === module) {
  migrateEmails()
    .then(() => {
      console.log('👋 Exiting...')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

export { migrateEmails }