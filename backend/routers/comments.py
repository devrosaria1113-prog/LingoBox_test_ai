from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Comment, Photo
from schemas import CommentCreate, CommentUpdate, CommentResponse

router = APIRouter(tags=["comments"])


@router.post("/photos/{photo_id}/comments", response_model=CommentResponse, status_code=201)
def create_comment(photo_id: int, comment_in: CommentCreate, db: Session = Depends(get_db)):
    """특정 사진에 코멘트 등록"""
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="사진을 찾을 수 없습니다.")

    comment = Comment(photo_id=photo_id, content=comment_in.content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.patch("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(comment_id: int, comment_in: CommentUpdate, db: Session = Depends(get_db)):
    """코멘트 내용 수정"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="코멘트를 찾을 수 없습니다.")

    comment.content = comment_in.content
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}", status_code=204)
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    """코멘트 삭제"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="코멘트를 찾을 수 없습니다.")

    db.delete(comment)
    db.commit()
