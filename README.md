# ☁ CloudDrop

**Production-grade file upload application** — React frontend, Node.js/Express API, AWS S3 storage, PostgreSQL metadata on RDS, deployed on EC2 via GitHub Actions CI/CD.

---

## Architecture

```
Browser (React)
    │
    ▼
Nginx Reverse Proxy (EC2 :80)
    ├── /api/*  → Express API (:5000)
    │               ├── Upload files → AWS S3
    │               └── Store metadata → PostgreSQL (RDS)
    └── /*      → React SPA (:3000)
```

## Project Structure

```
clouddrop/
├── frontend/                  # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js   # Overview + stats
│   │   │   ├── UploadZone.js  # Drag-and-drop upload
│   │   │   ├── FileManager.js # Browse, search, delete
│   │   │   └── StatsPanel.js  # Analytics
│   │   └── utils/api.js       # Axios API client
│   └── Dockerfile
│
├── backend/                   # Express API
│   ├── server.js              # App entry point
│   ├── config/
│   │   ├── database.js        # PostgreSQL pool + schema init
│   │   └── s3.js              # AWS S3 client
│   ├── routes/
│   │   ├── uploads.js         # POST /api/uploads/single|bulk
│   │   └── files.js           # GET/PATCH/DELETE /api/files
│   └── Dockerfile
│
├── infrastructure/
│   ├── docker-compose.yml     # EC2 deployment compose
│   ├── nginx.conf             # Reverse proxy
│   ├── ec2-setup.sh           # EC2 bootstrap script
│   └── AWS_SETUP.md           # Full AWS resource setup guide
│
└── .github/workflows/
    └── deploy.yml             # CI/CD: test → build → deploy
```

## Quick Start (Local)

```bash
# 1. Clone and install
git clone https://github.com/yourorg/clouddrop.git
cd clouddrop

# 2. Configure backend
cp backend/.env.example backend/.env
# Fill in your AWS + DB credentials

# 3. Start backend
cd backend && npm install && npm run dev

# 4. Start frontend (new terminal)
cd frontend && npm install && npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/uploads/single` | Upload single file to S3 |
| `POST` | `/api/uploads/bulk` | Upload up to 20 files |
| `GET` | `/api/files` | List files (paginated, filtered) |
| `GET` | `/api/files/:id` | Get file metadata + signed URL |
| `GET` | `/api/files/:id/download` | Increment counter + get download URL |
| `PATCH` | `/api/files/:id` | Update tags, folder, visibility |
| `DELETE` | `/api/files/:id` | Delete from S3 + PostgreSQL |
| `GET` | `/api/files/stats/summary` | Storage analytics |
| `GET` | `/health` | Health check (DB connection) |

## CI/CD Pipeline

```
Push to main
    │
    ├── test-backend (Jest + PostgreSQL service container)
    ├── test-frontend (React tests + build check)
    │
    ├── build-and-push (Docker → Amazon ECR)
    │
    └── deploy (SSH to EC2 → docker compose up)
```

## AWS Resources Required

- **S3 Bucket** — file storage with versioning
- **RDS PostgreSQL** — file metadata (`files` table auto-created)
- **EC2 t3.small** — runs Docker Compose stack
- **ECR** — Docker image registry
- **IAM Role** — EC2 → S3 + ECR + CloudWatch permissions

See `infrastructure/AWS_SETUP.md` for full provisioning commands.

## Features

- ✅ Drag-and-drop single & bulk upload
- ✅ File type filtering (images, video, audio, docs)
- ✅ Presigned S3 URLs for secure private downloads
- ✅ Public/private file visibility toggle
- ✅ Folder organization
- ✅ Download count tracking
- ✅ SHA-256 checksum integrity
- ✅ Paginated file browser with search
- ✅ Storage analytics dashboard
- ✅ 500MB per-file limit
- ✅ Automatic DB schema migration on startup
# clouddrop_v2
