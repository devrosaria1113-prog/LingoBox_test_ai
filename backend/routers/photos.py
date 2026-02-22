from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Photo
from schemas import PhotoListResponse, PhotoDetailResponse, PhotoResponse
from services.s3 import upload_image_to_s3, delete_from_s3, generate_presigned_url, extract_key_from_url

router = APIRouter(prefix="/photos", tags=["photos"])


def _with_presigned_urls(photo: Photo, include_comments: bool = False) -> dict:
    thumb_key = extract_key_from_url(photo.thumbnail_url)
    result = {
        "id": photo.id,
        "filename": photo.filename,
        "original_filename": photo.original_filename,
        "s3_key": photo.s3_key,
        "s3_url": generate_presigned_url(photo.s3_key),
        "thumbnail_url": generate_presigned_url(thumb_key) if thumb_key else None,
        "content_type": photo.content_type,
        "file_size": photo.file_size,
        "created_at": photo.created_at,
        "updated_at": photo.updated_at,
    }
    if include_comments:
        result["comments"] = [
            {
                "id": c.id,
                "photo_id": c.photo_id,
                "content": c.content,
                "created_at": c.created_at,
                "updated_at": c.updated_at,
            }
            for c in photo.comments
        ]
    return result


@router.get("", response_model=List[PhotoListResponse])
def get_photos(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """사진 목록 조회 (그리드용)"""
    photos = (
        db.query(Photo)
        .order_by(Photo.created_at.desc(), Photo.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_with_presigned_urls(p) for p in photos]


@router.post("", response_model=PhotoResponse, status_code=201)
async def upload_photo(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """사진 업로드 (Multipart/form-data)"""
    upload_result = await upload_image_to_s3(file)

    photo = Photo(
        filename=upload_result["s3_key"].split("/")[-1],
        original_filename=file.filename or "unknown",
        s3_key=upload_result["s3_key"],
        s3_url=upload_result["s3_url"],
        thumbnail_url=upload_result["thumbnail_url"],
        content_type=file.content_type or "image/jpeg",
        file_size=upload_result["file_size"],
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return _with_presigned_urls(photo)


@router.get("/{photo_id}", response_model=PhotoDetailResponse)
def get_photo(photo_id: int, db: Session = Depends(get_db)):
    """특정 사진 및 코멘트 상세 조회"""
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="사진을 찾을 수 없습니다.")
    return _with_presigned_urls(photo, include_comments=True)


@router.delete("/{photo_id}", status_code=204)
def delete_photo(photo_id: int, db: Session = Depends(get_db)):
    """사진 삭제 (관련 코멘트 포함 - Cascade)"""
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="사진을 찾을 수 없습니다.")

    s3_key = photo.s3_key
    db.delete(photo)
    db.commit()

    # DB 삭제 후 S3에서 파일 삭제
    delete_from_s3(s3_key)
