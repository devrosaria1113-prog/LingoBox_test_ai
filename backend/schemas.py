from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


# Comment Schemas
class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    pass


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(CommentBase):
    id: int
    photo_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Photo Schemas
class PhotoBase(BaseModel):
    filename: str
    original_filename: str
    s3_url: str
    thumbnail_url: Optional[str] = None
    content_type: str
    file_size: int


class PhotoResponse(PhotoBase):
    id: int
    s3_key: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PhotoListResponse(BaseModel):
    id: int
    original_filename: str
    s3_url: str
    thumbnail_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PhotoDetailResponse(PhotoResponse):
    comments: List[CommentResponse] = []

    class Config:
        from_attributes = True
