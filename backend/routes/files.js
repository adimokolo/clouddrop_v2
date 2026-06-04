const express = require('express');
const { pool } = require('../config/database');
const { deleteFromS3, getPresignedUrl } = require('../config/s3');

const router = express.Router();

// List files with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const { folder, mime_type, search, page = 1, limit = 20, sort = 'created_at', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (folder) { params.push(folder); conditions.push(`folder = $${params.length}`); }
    if (mime_type) { params.push(`${mime_type}%`); conditions.push(`mime_type LIKE $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`original_name ILIKE $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const validSorts = ['created_at', 'file_size', 'original_name', 'download_count'];
    const sortCol = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    params.push(parseInt(limit), offset);
    const query = `SELECT * FROM files ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT $${params.length - 1} OFFSET $${params.length}`;
    const countQuery = `SELECT COUNT(*) FROM files ${where}`;

    const [files, count] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, -2)),
    ]);

    res.json({
      files: files.rows,
      pagination: { total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count.rows[0].count / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single file
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM files WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'File not found' });

    const file = result.rows[0];
    if (!file.is_public) file.s3_url = await getPresignedUrl(file.s3_key);
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download file (increment counter + presigned URL)
router.get('/:id/download', async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE files SET download_count = download_count + 1 WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'File not found' });
    const url = await getPresignedUrl(result.rows[0].s3_key, 300);
    res.json({ downloadUrl: url, expiresIn: 300 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update file metadata
router.patch('/:id', async (req, res) => {
  try {
    const { tags, folder, is_public, expires_at } = req.body;
    const result = await pool.query(
      `UPDATE files SET tags = COALESCE($1, tags), folder = COALESCE($2, folder),
       is_public = COALESCE($3, is_public), expires_at = COALESCE($4, expires_at)
       WHERE id = $5 RETURNING *`,
      [tags, folder, is_public, expires_at, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'File not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete file
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM files WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'File not found' });
    await deleteFromS3(result.rows[0].s3_key);
    res.json({ success: true, deleted: result.rows[0].original_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Storage stats
router.get('/stats/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        COUNT(DISTINCT folder) as total_folders,
        SUM(download_count) as total_downloads,
        AVG(file_size) as avg_file_size,
        MAX(created_at) as last_upload
      FROM files
    `);
    const byType = await pool.query(`
      SELECT split_part(mime_type, '/', 1) as type, COUNT(*) as count, SUM(file_size) as size
      FROM files GROUP BY type ORDER BY size DESC
    `);
    res.json({ summary: result.rows[0], by_type: byType.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
