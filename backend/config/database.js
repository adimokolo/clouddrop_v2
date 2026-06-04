const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'clouddrop',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        original_name VARCHAR(500) NOT NULL,
        stored_name VARCHAR(500) NOT NULL,
        s3_key VARCHAR(1000) NOT NULL UNIQUE,
        s3_url TEXT NOT NULL,
        mime_type VARCHAR(200),
        file_size BIGINT,
        folder VARCHAR(500) DEFAULT 'root',
        tags TEXT[] DEFAULT '{}',
        download_count INTEGER DEFAULT 0,
        is_public BOOLEAN DEFAULT false,
        checksum VARCHAR(64),
        uploaded_by VARCHAR(200),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ
      );

      CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder);
      CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_files_mime_type ON files(mime_type);

      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_files_updated_at ON files;
      CREATE TRIGGER update_files_updated_at
        BEFORE UPDATE ON files
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    `);
    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
};

initDB().catch(console.error);

module.exports = { pool };
