import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { uploadFile, generateFileKey, getUploadPresignedUrl } from '../config/r2.js';
import logger from '../utils/logger.js';

const router = Router();

// Multer config for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
        files: 5 // Max 5 files per request
    },
    fileFilter: (req, file, cb) => {
        // Allow images, videos, PDFs
        const allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm',
            'application/pdf'
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

/**
 * POST /upload
 * Upload files to R2
 */
router.post('/', authenticate, uploadLimiter, upload.array('files', 5), asyncHandler(async (req, res) => {
    const { folder = 'uploads' } = req.body;

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
    }

    const uploadResults = [];

    for (const file of req.files) {
        const key = generateFileKey(folder, file.originalname);
        const result = await uploadFile(file.buffer, key, file.mimetype);

        uploadResults.push({
            name: file.originalname,
            key: result.key,
            url: result.url,
            type: file.mimetype,
            size: file.size
        });

        logger.info('File uploaded', {
            key: result.key,
            size: file.size,
            userId: req.user.id
        });
    }

    res.json({ files: uploadResults });
}));

/**
 * POST /upload/presigned
 * Get presigned URL for direct browser upload
 */
router.post('/presigned', authenticate, uploadLimiter, asyncHandler(async (req, res) => {
    const { filename, contentType, folder = 'uploads' } = req.body;

    if (!filename || !contentType) {
        return res.status(400).json({ error: 'filename and contentType are required' });
    }

    const key = generateFileKey(folder, filename);
    const uploadUrl = await getUploadPresignedUrl(key, contentType);
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    res.json({
        uploadUrl,
        key,
        publicUrl
    });
}));

export default router;
