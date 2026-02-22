import boto3
import uuid
import os
from urllib.parse import urlparse
from botocore.exceptions import ClientError
from fastapi import UploadFile, HTTPException
from PIL import Image, ImageOps
import io
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "ap-northeast-2")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

THUMBNAIL_SIZE = (400, 400)


def get_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
    )


def generate_s3_key(filename: str, prefix: str = "photos") -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    unique_id = uuid.uuid4().hex
    return f"{prefix}/{unique_id}.{ext}"


def get_public_url(s3_key: str) -> str:
    return f"https://{S3_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"


async def upload_image_to_s3(file: UploadFile) -> dict:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 파일 형식입니다. 허용: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )

    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"파일 크기가 너무 큽니다. 최대 {MAX_FILE_SIZE // (1024 * 1024)}MB",
        )

    s3_client = get_s3_client()
    s3_key = generate_s3_key(file.filename or "image.jpg")

    try:
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=s3_key,
            Body=contents,
            ContentType=file.content_type,
        )
        print("success")

    except ClientError as e:
        print("ClientError")
        raise HTTPException(status_code=500, detail=f"S3 업로드 실패: {str(e)}")

    # Generate thumbnail
    thumbnail_url = None
    try:
        image = Image.open(io.BytesIO(contents))
        image = ImageOps.exif_transpose(image)
        image.thumbnail(THUMBNAIL_SIZE, Image.LANCZOS)

        thumb_buffer = io.BytesIO()
        fmt = "JPEG" if file.content_type != "image/png" else "PNG"
        image.save(thumb_buffer, format=fmt, quality=85)
        thumb_buffer.seek(0)

        thumb_key = generate_s3_key(file.filename or "image.jpg", prefix="thumbnails")
        s3_client.put_object(
            Bucket=S3_BUCKET_NAME,
            Key=thumb_key,
            Body=thumb_buffer.getvalue(),
            ContentType=file.content_type,
        )
        thumbnail_url = get_public_url(thumb_key)
    except Exception:
        # 썸네일 생성 실패 시 원본 URL 사용
        thumbnail_url = get_public_url(s3_key)

    return {
        "s3_key": s3_key,
        "s3_url": get_public_url(s3_key),
        "thumbnail_url": thumbnail_url,
        "file_size": len(contents),
    }


def extract_key_from_url(url: str) -> str | None:
    """저장된 S3 public URL에서 오브젝트 키를 추출"""
    if not url:
        return None
    try:
        return urlparse(url).path.lstrip("/")
    except Exception:
        return None


def generate_presigned_url(s3_key: str, expiration: int = 3600) -> str:
    """S3 키에 대한 Presigned URL 생성 (기본 1시간 유효)"""
    s3_client = get_s3_client()
    try:
        return s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET_NAME, "Key": s3_key},
            ExpiresIn=expiration,
        )
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Presigned URL 생성 실패: {str(e)}")


def delete_from_s3(s3_key: str) -> None:
    s3_client = get_s3_client()
    try:
        s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=s3_key)

        # 썸네일도 삭제 시도 (존재하면)
        thumb_key = s3_key.replace("photos/", "thumbnails/", 1)
        s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=thumb_key)
    except ClientError as e:
        # S3 삭제 실패는 로그만 기록 (DB 삭제는 계속 진행)
        print(f"S3 삭제 경고: {str(e)}")
