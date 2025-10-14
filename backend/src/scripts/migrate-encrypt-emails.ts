import 'reflect-metadata'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as crypto from 'crypto'
import { KMSClient, DecryptCommand } from '@aws-sdk/client-kms'
import { EncryptionService } from '../services/implementations/EncryptionService'

config()

const BATCH_SIZE = 20
const DELAY_BETWEEN_BATCHES = 1000

interface BookingSeat {
  idx: number
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
  offset: number
): Promise<BookingSeat[]> {
  const { data, error } = await supabase
    .from('booking_seat')
    .select('idx, booking_id, seat_id, customer_email')
    .range(offset, offset + limit - 1)
    .order('idx', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch booking seats: ${error.message}`)
  }

  return (data || []).filter(seat => !isAlreadyEncrypted(seat.customer_email))
}

async function updateBookingSeat(
  supabase: ReturnType<typeof getSupabaseClient>,
  idx: number,
  encryptedEmail: string
): Promise<void> {
  const { error } = await supabase
    .from('booking_seat')
    .update({ customer_email: encryptedEmail })
    .eq('idx', idx)

  if (error) {
    throw new Error(`Failed to update booking seat ${idx}: ${error.message}`)
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

    let offset = 0
    let totalProcessed = 0
    let totalEncrypted = 0
    let totalSkipped = 0
    let hasMore = true

    while (hasMore) {
      console.log(`📊 Fetching batch at offset ${offset}...`)

      const batch = await fetchUnencryptedBookingSeats(supabase, BATCH_SIZE, offset)

      if (batch.length === 0) {
        hasMore = false
        break
      }

      console.log(`   Found ${batch.length} records to process`)

      for (const seat of batch) {
        try {
          if (!seat.customer_email) {
            console.log(`   ⚠️  Skipping idx ${seat.idx} - no email`)
            totalSkipped++
            continue
          }

          if (isAlreadyEncrypted(seat.customer_email)) {
            console.log(`   ✓ Skipping idx ${seat.idx} - already encrypted`)
            totalSkipped++
            continue
          }

          const encryptedEmail = encryptionService.encrypt(seat.customer_email)

          await updateBookingSeat(supabase, seat.idx, encryptedEmail)

          console.log(`   ✅ Encrypted idx ${seat.idx} - ${seat.customer_email}`)
          totalEncrypted++

        } catch (error) {
          console.error(`   ❌ Failed to process idx ${seat.idx}:`, (error as Error).message)
        }

        totalProcessed++
      }

      console.log(`   Batch complete: ${totalEncrypted} encrypted, ${totalSkipped} skipped\n`)

      offset += BATCH_SIZE

      if (hasMore && batch.length === BATCH_SIZE) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...\n`)
        await sleep(DELAY_BETWEEN_BATCHES)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✨ Migration completed successfully!')
    console.log('='.repeat(60))
    console.log(`📊 Total records processed: ${totalProcessed}`)
    console.log(`🔐 Total emails encrypted: ${totalEncrypted}`)
    console.log(`⏭️  Total records skipped: ${totalSkipped}`)
    console.log('='.repeat(60) + '\n')

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