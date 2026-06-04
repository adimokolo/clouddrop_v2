const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const { uploadToS3 } = require('../config/s3');
const { pool } = require('../config/database');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const blocked = ['application/x-executable', 'application/x-msdownload'];
    if (blocked.includes(file.mimetype)) {
      return cb(new Error('File type not allowed'), false);
    }
    cb(null, true);
  },
});

// Single file upload
router.post('/single', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const { folder = 'root', tags = '[]', isPublic = false } = req.body;
    const checksum = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const ext = path.extname(req.file.originalname);
    const storedName = `${crypto.randomUUID()}${ext}`;
    const s3Key = `${folder}/${storedName}`;

    const s3Url = await uploadToS3(req.file.buffer, s3Key, req.file.mimetype, isPublic === 'true');

    const parsedTags = JSON.parse(tags);
    const result = await pool.query(
      `INSERT INTO files (original_name, stored_name, s3_key, s3_url, mime_type, file_size, folder, tags, is_public, checksum, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [req.file.originalname, storedName, s3Key, s3Url, req.file.mimetype,
       req.file.size, folder, parsedTags, isPublic === 'true', checksum, req.headers['x-user-id'] || 'anonymous']
    );

    res.status(201).json({ success: true, file: result.rows[0] });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Bulk file upload
router.post('/bulk', upload.array('files', 20), async (req, res) => {
  try {
    if (!req.files?.length) return res.status(400).json({ error: 'No files provided' });

    const { folder = 'root' } = req.body;
    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
        const ext = path.extname(file.originalname);
        const storedName = `${crypto.randomUUID()}${ext}`;
        const s3Key = `${folder}/${storedName}`;
        const s3Url = await uploadToS3(file.buffer, s3Key, file.mimetype, false);

        const result = await pool.query(
          `INSERT INTO files (original_name, stored_name, s3_key, s3_url, mime_type, file_size, folder, checksum, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
          [file.originalname, storedName, s3Key, s3Url, file.mimetype, file.size, folder, checksum, 'anonymous']
        );
        results.push(result.rows[0]);
      } catch (err) {
        errors.push({ file: file.originalname, error: err.message });
      }
    }

    res.status(207).json({ success: true, uploaded: results, failed: errors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
