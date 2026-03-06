# LingoBox

A full-stack photo album application for uploading photos and managing comments, with support for both web and mobile.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Backend** | FastAPI · SQLAlchemy · Pydantic v2 · SQLite / PostgreSQL |
| **Storage** | AWS S3 · Pillow (thumbnail generation) |
| **Web** | Next.js 14 (App Router) · TypeScript · Tailwind CSS · SWR |
| **Mobile** | Expo (React Native) · TypeScript · Expo Router |

---

## Project Structure

```
LingoBox_test_app/
├── backend/          # FastAPI server
│   ├── main.py
│   ├── models.py     # SQLAlchemy ORM
│   ├── schemas.py    # Pydantic schemas
│   ├── database.py
│   ├── routers/      # photos, comments
│   ├── services/
│   └── tests/
├── web/              # Next.js web client
│   ├── app/
│   ├── components/
│   └── lib/
└── mobile/           # Expo mobile app
    ├── app/
    ├── components/
    └── lib/
```

---

## Features

- **Photo Upload** — Drag-and-drop (web) / gallery & camera picker (mobile), stored on AWS S3
- **Auto Thumbnail Generation** — Server-side resizing with Pillow
- **Photo Feed** — Browse uploaded photos (pull-to-refresh supported)
- **Comment CRUD** — Create, edit, and delete comments per photo
- **Cascade Delete** — Automatically removes associated comments when a photo is deleted

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- AWS S3 bucket

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Fill in DB URL and AWS credentials in .env

uvicorn main:app --reload
```

> API 문서: http://localhost:8000/docs

### Web

```bash
cd web
npm install

cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

> Web app: http://localhost:3000

### Mobile

```bash
cd mobile
npm install
npx expo start
```

> Run on iOS Simulator, Android Emulator, or the Expo Go app

---

## Environment Variables

### Backend (`.env`)

```env
DATABASE_URL=sqlite:///./lingobox.db
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-northeast-2
S3_BUCKET_NAME=your_bucket_name
```

### Web (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/photos` | List photos |
| `POST` | `/photos` | Upload a photo |
| `GET` | `/photos/{id}` | Get photo detail |
| `DELETE` | `/photos/{id}` | Delete a photo |
| `POST` | `/photos/{id}/comments` | Add a comment |
| `PATCH` | `/comments/{id}` | Update a comment |
| `DELETE` | `/comments/{id}` | Delete a comment |
| `GET` | `/health` | Health check |

---

## Testing

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

---

## License

MIT
