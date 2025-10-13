import * as crypto from 'crypto';
import { IEncryptionService } from '@/services';

export class EncryptionService implements IEncryptionService {
    private key: Buffer;

    constructor() {
        // This key will be securely set on server startup.
        this.key = Buffer.alloc(32);
    }

    public setDecryptionKey(key: Buffer): void {
        if (key.length !== 32) {
            throw new Error('Encryption key must be 32 bytes for aes-256-gcm.');
        }
        this.key = key;
    }

    encrypt(data: string): string {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
        const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return `${iv.toString('hex')}.${authTag.toString('hex')}.${encrypted.toString('hex')}`;
    }

    decrypt(data: string): string {
        try {
            const parts = data.split('.');
            if (parts.length !== 3) {
                console.error('Invalid encrypted data format:', data);
                return '[invalid data format]';
            }
            const [ivHex, authTagHex, encryptedHex] = parts;
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            const encrypted = Buffer.from(encryptedHex, 'hex');

            const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
            decipher.setAuthTag(authTag);
            const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
            return decrypted.toString('utf8');
        } catch (error) {
            console.error('Decryption failed:', (error as Error).message);
            return '[decryption error]';
        }
    }
}
