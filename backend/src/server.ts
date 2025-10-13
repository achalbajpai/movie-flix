import { createApp } from './app'
import { env, logger } from '@/config'
import { getContainer } from './container'
import * as crypto from 'crypto'
import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms'

async function initializeEncryptionKey(): Promise<void> {
  // Only initialize encryption if AWS credentials are provided
  if (!env.AWS_REGION || !env.PII_ENCRYPTION_KEY_ID) {
    logger.warn('⚠️  AWS encryption not configured. Skipping encryption initialization.')
    logger.warn('   Set AWS_REGION and PII_ENCRYPTION_KEY_ID in .env to enable booking email encryption.')
    return
  }

  const container = getContainer()
  const encryptionService = container.encryptionService as any
  const kmsClient = new KMSClient({ region: env.AWS_REGION })
  let plaintextDataKey: Buffer

  if (env.ENCRYPTED_DATA_KEY) {
    logger.info('Encrypted data key found, attempting to decrypt...')
    try {
      const { Plaintext } = await kmsClient.send(
        new DecryptCommand({
          CiphertextBlob: Buffer.from(env.ENCRYPTED_DATA_KEY, 'base64'),
          KeyId: env.PII_ENCRYPTION_KEY_ID
        })
      )
      if (!Plaintext) throw new Error('KMS DecryptCommand returned empty Plaintext.')
      plaintextDataKey = Buffer.from(Plaintext)
      logger.info('✅ Data key decrypted successfully and is ready.')
    } catch (error) {
      logger.error('Fatal: Could not decrypt ENCRYPTED_DATA_KEY.', { error: (error as Error).message })
      process.exit(1)
    }
  } else {
    logger.warn('⚠️  No ENCRYPTED_DATA_KEY found. Generating a new key.')
    const localKey = crypto.randomBytes(32)
    const { CiphertextBlob } = await kmsClient.send(
      new EncryptCommand({ KeyId: env.PII_ENCRYPTION_KEY_ID, Plaintext: localKey })
    )
    plaintextDataKey = localKey

    console.log(`\n--- 🔑 ACTION REQUIRED 🔑 ---
A new data key has been generated. Set this in your .env file
to ensure consistent encryption across restarts.

ENCRYPTED_DATA_KEY=${Buffer.from(CiphertextBlob!).toString('base64')}
---------------------------\n`)
  }
  encryptionService.setDecryptionKey(plaintextDataKey)
}

const startServer = async (): Promise<void> => {
  try {
    // Initialize encryption before starting the web server
    await initializeEncryptionKey()

    const app = createApp()

    const server = app.listen(env.PORT, () => {
      logger.info('Server started successfully', {
        port: env.PORT,
        environment: env.NODE_ENV,
        version: env.API_VERSION,
        timestamp: new Date().toISOString()
      })

      logger.info('API endpoints available:', {
        health: `http://localhost:${env.PORT}/health`,
        api: `http://localhost:${env.PORT}${env.API_BASE_PATH}/${env.API_VERSION}`,
        docs: `http://localhost:${env.PORT}/`
      })
    })

    // Graceful shutdown handlers
    const shutdown = (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`)

      server.close((err) => {
        if (err) {
          logger.error('Error during server shutdown', { error: err.message })
          process.exit(1)
        }

        logger.info('Server closed successfully')
        process.exit(0)
      })

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Force shutdown after 10 seconds')
        process.exit(1)
      }, 10000)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))

  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message })
    process.exit(1)
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer()
}

export { startServer }