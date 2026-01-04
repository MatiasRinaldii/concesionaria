import { NextResponse } from 'next/server';
import { Client } from 'minio';

// Initialize MinIO client (lazy loading)
let minioClient = null;

function getMinioClient() {
    if (!minioClient && process.env.MINIO_ENDPOINT) {
        minioClient = new Client({
            endPoint: process.env.MINIO_ENDPOINT,
            port: parseInt(process.env.MINIO_PORT || '9000'),
            useSSL: process.env.MINIO_USE_SSL === 'true',
            accessKey: process.env.MINIO_ACCESS_KEY,
            secretKey: process.env.MINIO_SECRET_KEY,
        });
    }
    return minioClient;
}

// Ensure bucket exists
async function ensureBucket(bucketName) {
    const client = getMinioClient();
    if (!client) return false;

    try {
        const exists = await client.bucketExists(bucketName);
        if (!exists) {
            await client.makeBucket(bucketName);
            // Set bucket policy to allow public read
            const policy = {
                Version: '2012-10-17',
                Statement: [{
                    Effect: 'Allow',
                    Principal: { AWS: ['*'] },
                    Action: ['s3:GetObject'],
                    Resource: [`arn:aws:s3:::${bucketName}/*`]
                }]
            };
            await client.setBucketPolicy(bucketName, JSON.stringify(policy));
        }
        return true;
    } catch (error) {
        console.error('Error ensuring bucket:', error);
        return false;
    }
}

// POST /api/upload - Upload a file
export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const bucket = formData.get('bucket') || 'uploads';

        if (!file) {
            return NextResponse.json({ error: 'File required' }, { status: 400 });
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const objectPath = `${bucket}/${fileName}`;

        // Check if MinIO is configured
        const client = getMinioClient();

        if (client) {
            // Use MinIO
            await ensureBucket(bucket);

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            await client.putObject(bucket, fileName, buffer, buffer.length, {
                'Content-Type': file.type,
            });

            // Construct public URL
            const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
            const port = process.env.MINIO_PORT || '9000';
            const publicUrl = process.env.MINIO_PUBLIC_URL
                ? `${process.env.MINIO_PUBLIC_URL}/${bucket}/${fileName}`
                : `${protocol}://${process.env.MINIO_ENDPOINT}:${port}/${bucket}/${fileName}`;

            return NextResponse.json({
                path: objectPath,
                url: publicUrl
            }, { status: 201 });
        }

        // Fallback: Store file locally in public folder (development only)
        const fs = await import('fs/promises');
        const path = await import('path');

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', bucket);
        await fs.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, fileName);
        const arrayBuffer = await file.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(arrayBuffer));

        const publicUrl = `/uploads/${bucket}/${fileName}`;

        return NextResponse.json({
            path: objectPath,
            url: publicUrl
        }, { status: 201 });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/upload - Delete a file
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const path = searchParams.get('path');
        const bucket = searchParams.get('bucket') || 'uploads';

        if (!path) {
            return NextResponse.json({ error: 'Path required' }, { status: 400 });
        }

        const client = getMinioClient();

        if (client) {
            // Extract filename from path
            const fileName = path.includes('/') ? path.split('/').pop() : path;
            await client.removeObject(bucket, fileName);
        } else {
            // Local file deletion
            const fs = await import('fs/promises');
            const pathModule = await import('path');
            const filePath = pathModule.join(process.cwd(), 'public', 'uploads', path);
            await fs.unlink(filePath);
        }

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
