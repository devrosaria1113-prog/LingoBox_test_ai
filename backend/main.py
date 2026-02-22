from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine
import models
from routers import photos, comments

# DB 테이블 생성
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="LingoBox API",
    description="사진 업로드 및 코멘트 관리 서비스",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 배포 시 실제 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(photos.router)
app.include_router(comments.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
