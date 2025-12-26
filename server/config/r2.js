import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Cloudflare R2 client (S3-compatible)
export const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
});

const BUCKET = process.env.R2_BUCKET_NAME || 'concesionaria';
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

/**
 * Upload a file to R2
 * @param {Buffer} buffer - File buffer
 * @param {string} key - File path/name in bucket
 * @param {string} contentType - MIME type
 * @returns {Promise<{key: string, url: string}>}
 */
export async function uploadFile(buffer, key, contentType) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType
    });

    await r2Client.send(command);

    return {
        key,
        url: `${PUBLIC_URL}/${key}`
    };
}

/**
 * Delete a file from R2
 * @param {string} key - File path/name in bucket
 */
export async function deleteFile(key) {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key
    });

    await r2Client.send(command);
}

/**
 * Get a presigned URL for direct upload from browser
 * @param {string} key - File path/name
 * @param {string} contentType - MIME type
 * @param {number} expiresIn - URL expiry in seconds (default 1 hour)
 * @returns {Promise<string>}
 */
export async function getUploadPresignedUrl(key, contentType, expiresIn = 3600) {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType
    });

    return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Get a presigned URL for downloading a private file
 * @param {string} key - File path/name
 * @param {number} expiresIn - URL expiry in seconds (default 1 hour)
 * @returns {Promise<string>}
 */
export async function getDownloadPresignedUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key
    });

    return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generate a unique file key
 * @param {string} folder - Folder name (e.g., 'vehicles', 'messages')
 * @param {string} originalName - Original file name
 * @returns {string}
 */
export function generateFileKey(folder, originalName) {
    const ext = originalName.split('.').pop();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${folder}/${timestamp}-${random}.${ext}`;
}
