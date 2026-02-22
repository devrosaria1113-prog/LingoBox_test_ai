"""
공통 테스트 픽스처 및 설정

- 인메모리 SQLite DB로 실제 DB 격리
- moto 라이브러리로 AWS S3 호출을 가짜(mock) 서버로 대체
- 매 테스트마다 DB 테이블을 초기화하여 독립성 보장
"""
import io
import os
import pytest
import boto3
from moto import mock_aws
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# 테스트 전 환경변수 설정 (실제 AWS 호출 방지)
os.environ.setdefault("AWS_ACCESS_KEY_ID", "test-key")
os.environ.setdefault("AWS_SECRET_ACCESS_KEY", "test-secret")
os.environ.setdefault("AWS_REGION", "ap-northeast-2")
os.environ.setdefault("S3_BUCKET_NAME", "test-bucket")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")

from database import Base, get_db  # noqa: E402
from main import app  # noqa: E402

# StaticPool: 모든 세션이 동일한 in-memory 커넥션을 공유
# → create_all 후 생성된 테이블이 TestSessionLocal에서도 보임
TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

# SQLite foreign key CASCADE 활성화
@event.listens_for(TEST_ENGINE, "connect")
def enable_foreign_keys(dbapi_conn, _):
    dbapi_conn.execute("PRAGMA foreign_keys=ON")

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_db():
    """각 테스트마다 테이블 초기화"""
    Base.metadata.create_all(bind=TEST_ENGINE)
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)


@pytest.fixture
def client(mock_s3):
    """FastAPI TestClient"""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def mock_s3():
    """moto로 S3 가상 서버 구동 및 버킷 생성"""
    with mock_aws():
        s3 = boto3.client(
            "s3",
            region_name="ap-northeast-2",
            aws_access_key_id="test-key",
            aws_secret_access_key="test-secret",
        )
        s3.create_bucket(
            Bucket="test-bucket",
            CreateBucketConfiguration={"LocationConstraint": "ap-northeast-2"},
        )
        yield s3


@pytest.fixture
def sample_image() -> bytes:
    """최소한의 유효한 JPEG 바이너리 (1×1 픽셀)"""
    from PIL import Image

    buf = io.BytesIO()
    img = Image.new("RGB", (1, 1), color=(255, 0, 0))
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
def uploaded_photo(client, sample_image):
    """업로드된 사진 1장을 반환하는 편의 픽스처"""
    res = client.post(
        "/photos",
        files={"file": ("test.jpg", sample_image, "image/jpeg")},
    )
    assert res.status_code == 201
    return res.json()
