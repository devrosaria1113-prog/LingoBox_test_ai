# LingoBox

사진 업로드 및 코멘트 관리 서비스. 웹과 모바일을 동시에 지원하는 풀스택 사진첩 애플리케이션입니다.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| **Backend** | FastAPI · SQLAlchemy · Pydantic v2 · SQLite / PostgreSQL |
| **Storage** | AWS S3 · Pillow (썸네일 생성) |
| **Web** | Next.js 14 (App Router) · TypeScript · Tailwind CSS · SWR |
| **Mobile** | Expo (React Native) · TypeScript · Expo Router |

---

## Project Structure

```
LingoBox_test_app/
├── backend/          # FastAPI 서버
│   ├── main.py
│   ├── models.py     # SQLAlchemy ORM
│   ├── schemas.py    # Pydantic 스키마
│   ├── database.py
│   ├── routers/      # photos, comments
│   ├── services/
│   └── tests/
├── web/              # Next.js 웹 클라이언트
│   ├── app/
│   ├── components/
│   └── lib/
└── mobile/           # Expo 모바일 앱
    ├── app/
    ├── components/
    └── lib/
```

---

## Features

- **사진 업로드** — 드래그앤드롭(웹) / 갤러리·카메라 선택(모바일), AWS S3 저장
- **썸네일 자동 생성** — Pillow로 서버 사이드 리사이징
- **사진 피드** — 업로드된 사진 목록 조회 (Pull-to-refresh 지원)
- **코멘트 CRUD** — 사진별 코멘트 작성 · 수정 · 삭제
- **Cascade 삭제** — 사진 삭제 시 연관 코멘트 자동 삭제

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- AWS S3 버킷

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# .env 파일에 DB URL, AWS 자격증명 입력

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

> 웹 앱: http://localhost:3000

### Mobile

```bash
cd mobile
npm install
npx expo start
```

> iOS Simulator, Android Emulator, 또는 Expo Go 앱으로 실행

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
| `GET` | `/photos` | 사진 목록 조회 |
| `POST` | `/photos` | 사진 업로드 |
| `GET` | `/photos/{id}` | 사진 상세 조회 |
| `DELETE` | `/photos/{id}` | 사진 삭제 |
| `POST` | `/photos/{id}/comments` | 코멘트 등록 |
| `PATCH` | `/comments/{id}` | 코멘트 수정 |
| `DELETE` | `/comments/{id}` | 코멘트 삭제 |
| `GET` | `/health` | 헬스체크 |

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
