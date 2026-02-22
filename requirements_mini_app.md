이 프로젝트는 웹과 모바일 환경에서 사진을 업로드하고, 개인의 코멘트를 추가하여 관리하는 서비스입니다.

---

## 🛠 Tech Stack

- **Backend**: FastAPI (Python)    
- **Web Frontend**: Next.js (React)    
- **Mobile App**: React Native (Expo 또는 Bare CLI)    
- **Database**: SQLite (초기 단계) 또는 PostgreSQL    
- **Storage**: AWS S3 또는 로컬 파일 시스템 (이미지 저장용)    

---

## 1. Functional Requirements (기능적 요구사항)

### 1.1 사진 생성 (Photo Upload)

- **Common**: 모든 사진 데이터는 Backend API를 통해 저장됨.    
- **Mobile App (React Native)**:    
    - 장치 카메라를 호출하여 즉석에서 사진 촬영 및 업로드.        
    - 기기 내 갤러리(앨범)에서 기존 사진을 선택하여 업로드.        
- **Web Page (Next.js)**:    
    - 로컬 파일 탐색기를 통한 파일 선택.        
    - 드래그 앤 드롭(Drag & Drop) 영역을 통한 사진 업로드.        

### 1.2 사진 리스트 (Photo Feed)

- **Grid View**: 사진들을 격자(Grid) 형태로 나열.    
- **Thumbnail**: 리스트에서는 최적화를 위해 원본 대신 썸네일 또는 크기가 조정된 이미지 출력.    
- **Navigation**: 특정 사진 클릭 시 상세 페이지(또는 모달)로 이동.    

### 1.3 사진 상세 및 관리 (Detail & Management)

- **View**: 선택한 사진 한 장을 크게 출력.    
- **Comment System**:    
    - 사진 하단에 해당 사진에 달린 코멘트 리스트 출력.        
    - 새 코멘트 작성, 기존 코멘트 수정 및 삭제 기능.        
- **Delete**: 사진 삭제 기능.    
    - **Cascading Delete**: 사진 삭제 시 서버 데이터베이스에서 해당 사진과 연결된 모든 코멘트가 자동으로 삭제되어야 함.        

---

## 2. Interface Requirements (인터페이스 요구사항)

### 2.1 API Endpoints (FastAPI)

|**Method**|**Endpoint**|**Description**|
|---|---|---|
|`GET`|`/photos`|사진 목록 조회 (그리드용)|
|`POST`|`/photos`|사진 업로드 (Multipart/form-data)|
|`GET`|`/photos/{id}`|특정 사진 및 코멘트 상세 조회|
|`DELETE`|`/photos/{id}`|사진 삭제 (관련 코멘트 포함)|
|`POST`|`/photos/{id}/comments`|특정 사진에 코멘트 등록|
|`PATCH`|`/comments/{id}`|코멘트 내용 수정|
|`DELETE`|`/comments/{id}`|코멘트 삭제|

---

## 3. Non-Functional Requirements (비기능적 요구사항)

- **성능**: 모바일 환경에서의 이미지 로딩 최적화.    
- **UI/UX**: Web(Responsive Design)과 App(Native Touch) 각각의 환경에 맞는 일관된 디자인 시스템 적용.    
- **데이터 무결성**: DB 외래키(Foreign Key) 설정을 통해 사진 삭제 시 코멘트 누락 방지.    

---

## 4. Development Roadmap (단계별 계획)

1. **Phase 1** ✅: FastAPI 기반 기본 CRUD 및 이미지 저장 로직 구현.
2. **Phase 2** ✅: Next.js 웹 대시보드 및 드래그 앤 드롭 업로드 구현.
3. **Phase 3** ✅: React Native 앱 카메라 연동 및 모바일 뷰 구현.
4. **Phase 4** ✅: 코멘트 시스템 및 삭제 로직(Cascade) 통합 테스트.

---

## 5. Implementation Details (구현 기록)

### Phase 1 — FastAPI 백엔드

**선택 사항**: 이미지 저장 → AWS S3 / DB → SQLite

**파일 구조**

```
backend/
├── main.py              # FastAPI 앱, CORS 미들웨어, 라우터 등록
├── database.py          # SQLAlchemy 엔진, 세션, Base 정의
├── models.py            # ORM 모델 (Photo, Comment)
├── schemas.py           # Pydantic 스키마 (요청/응답 형태)
├── requirements.txt
├── .env.example
├── routers/
│   ├── photos.py        # GET/POST /photos, GET/DELETE /photos/{id}
│   └── comments.py      # POST /photos/{id}/comments, PATCH/DELETE /comments/{id}
└── services/
    └── s3.py            # S3 업로드, 썸네일(400×400) 생성, 삭제
```

**주요 구현 내용**

| 항목 | 내용 |
|---|---|
| DB 모델 | `Photo` ↔ `Comment` 1:N 관계, `cascade="all, delete-orphan"` |
| S3 업로드 | 원본(`photos/`) + 썸네일(`thumbnails/`) 자동 생성 (Pillow) |
| 파일 검증 | MIME 타입 화이트리스트, 최대 10MB 제한 |
| Cascade Delete | SQLAlchemy relationship + DB Foreign Key `ondelete="CASCADE"` 이중 보장 |

**실행 방법**

```bash
cd backend
cp .env.example .env   # AWS 키, DB URL 입력
source venv/bin/activate      # 가상환경 활성화
pip install -r requirements.txt

uvicorn main:app --reload     # 서버 시작
uvicorn main:app --host 0.0.0.0 --port 8000 --reload    # 외부 기기에서 접근하기 위한 옵션 추가

# Swagger 문서: http://localhost:8000/docs
```

---

### Phase 2 — Next.js 웹 프론트엔드

**선택 사항**: App Router / TypeScript / Tailwind CSS / SWR

**파일 구조**

```
web/
├── app/
│   ├── layout.tsx              # 공통 헤더 + 레이아웃
│   ├── page.tsx                # 피드 페이지 (Grid + UploadZone)
│   ├── globals.css
│   └── photos/[id]/
│       └── page.tsx            # 상세 페이지 (이미지 + 코멘트)
├── components/
│   ├── UploadZone.tsx          # 드래그앤드롭 + 클릭 파일 선택
│   ├── PhotoGrid.tsx           # 5열 반응형 그리드 (Next/Image 최적화)
│   └── CommentSection.tsx      # 코멘트 등록 / 인라인 수정 / 삭제
├── lib/
│   └── api.ts                  # fetch 기반 API 클라이언트
├── types/
│   └── index.ts
├── package.json
├── next.config.js              # S3 도메인 remotePatterns 허용
└── .env.local.example
```

**주요 구현 내용**

| 항목 | 내용 |
|---|---|
| UploadZone | `onDragOver/onDrop` + `<input type="file">` 조합, 업로드 스피너 |
| PhotoGrid | 5열 CSS Grid, `next/image` fill + `object-cover`, hover 확대 |
| CommentSection | 인라인 수정 (Enter 키), SWR `mutate`로 낙관적 UI 갱신 |
| 사진 삭제 | Cascade 안내 confirm 후 DELETE → 목록으로 리다이렉트 |

**실행 방법**

```bash
cd web
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL 확인
npm install
npm run dev
# http://localhost:3000
```

---

### Phase 3 — React Native 앱 (Expo)

**선택 사항**: Expo Managed / Expo Router (파일 기반 라우팅)

**파일 구조**

```
mobile/
├── app/
│   ├── _layout.tsx           # Stack 네비게이터, 공통 헤더 스타일
│   ├── index.tsx             # 피드 화면 (3열 Grid + 업로드 버튼)
│   └── photos/[id].tsx       # 상세 화면 (이미지 + 코멘트 + 헤더 삭제 버튼)
├── components/
│   ├── PhotoGrid.tsx         # FlatList numColumns=3, 화면 너비 자동 계산
│   ├── UploadModal.tsx       # 바텀시트 — 카메라 촬영 / 갤러리 선택
│   └── CommentSection.tsx    # 코멘트 CRUD + KeyboardAvoidingView
├── lib/
│   └── api.ts                # FormData 기반 multipart 업로드
├── types/
│   └── index.ts
├── constants/
│   └── api.ts                # API_URL (기기별 주소 주석 포함)
├── app.json                  # 카메라·갤러리 권한 (iOS plist / Android permissions)
└── package.json
```

**주요 구현 내용**

| 항목 | 내용 |
|---|---|
| 카메라 | `expo-image-picker` → `launchCameraAsync`, 편집(4:3 크롭) 허용 |
| 갤러리 | `expo-image-picker` → `launchImageLibraryAsync` |
| 권한 처리 | 런타임 권한 요청, 거부 시 Alert로 설정 안내 |
| Pull-to-refresh | `useFocusEffect`로 화면 복귀 시 자동 목록 갱신 |
| 키보드 대응 | `KeyboardAvoidingView` iOS `padding` / Android `undefined` 분기 |
| 사진 삭제 | 헤더 우측 버튼 → `Alert.alert` 확인 후 DELETE → `router.back()` |

**실행 방법**

```bash
cd mobile
npm install

# Android 에뮬레이터 사용 시 constants/api.ts 수정:
# export const API_URL = "http://10.0.2.2:8000";

npx expo start
```

---

### Phase 4 — 통합 테스트 (pytest)

**도구**: pytest + moto (S3 mock) + StaticPool SQLite

**파일 구조**

```
backend/
├── requirements-dev.txt         # pytest, httpx, moto[s3] 포함
└── tests/
    ├── conftest.py              # 공통 픽스처 (DB, mock S3, sample_image)
    ├── test_photos.py           # Photo API 18개 테스트
    ├── test_comments.py         # Comment API 10개 테스트
    └── test_cascade.py          # Cascade Delete 핵심 테스트 6개 (DB 레벨 포함)
```

**테스트 결과**: `31 passed, 0 failed`

| 파일 | 테스트 수 | 검증 범위 |
|---|---|---|
| `test_photos.py` | 15개 | 업로드(JPEG/PNG/invalid/oversized), 목록, 상세, 삭제, S3 오브젝트 |
| `test_comments.py` | 10개 | 등록, 다중 등록, 수정(반영 확인), 삭제(반영 확인), 404 케이스 |
| `test_cascade.py` | 6개 | API 레벨·DB 레벨 cascade, 격리성, 다중 사진, 이중 삭제 |

**주요 픽스처 설계**

| 픽스처 | 역할 |
|---|---|
| `StaticPool` | in-memory SQLite 단일 커넥션 공유 → 테이블 가시성 보장 |
| `mock_aws` (moto) | 실제 AWS 호출 차단, 가짜 S3 버킷 제공 |
| `PRAGMA foreign_keys=ON` | SQLite CASCADE DELETE 활성화 |
| `reset_db` (autouse) | 매 테스트 전/후 테이블 생성·삭제 → 테스트 독립성 |

**버그 수정 사항** (테스트로 발견)

- `GET /photos` 정렬 기준에 `id DESC` 2차 정렬 추가 → `created_at`이 동일할 때 순서 보장

**실행 방법**

```bash
cd backend
pip install -r requirements-dev.txt
python3 -m pytest tests/ -v
```