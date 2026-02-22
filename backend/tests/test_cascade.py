"""
Cascade Delete 통합 테스트 (Phase 4 핵심)

요구사항:
  "사진 삭제 시 서버 데이터베이스에서 해당 사진과 연결된
   모든 코멘트가 자동으로 삭제되어야 함" — requirements_mini_app.md 1.3

검증 레이어:
  1. API 레벨 — 사진 삭제 후 코멘트 개별 조회 시 404
  2. DB 레벨  — SQLAlchemy 세션으로 Comment 레코드 직접 확인
  3. 격리성   — 다른 사진의 코멘트는 영향받지 않아야 함
"""
import pytest
from sqlalchemy.orm import Session
from tests.conftest import TestSessionLocal
from models import Comment


def _upload_photo(client, sample_image):
    res = client.post(
        "/photos",
        files={"file": ("photo.jpg", sample_image, "image/jpeg")},
    )
    assert res.status_code == 201
    return res.json()


def _add_comment(client, photo_id, content):
    res = client.post(
        f"/photos/{photo_id}/comments",
        json={"content": content},
    )
    assert res.status_code == 201
    return res.json()


class TestCascadeDelete:
    def test_delete_photo_removes_all_comments_via_api(
        self, client, sample_image
    ):
        """[API 레벨] 사진 삭제 후 코멘트 개별 조회 → 404"""
        photo = _upload_photo(client, sample_image)
        c1 = _add_comment(client, photo["id"], "코멘트 A")
        c2 = _add_comment(client, photo["id"], "코멘트 B")
        c3 = _add_comment(client, photo["id"], "코멘트 C")

        client.delete(f"/photos/{photo['id']}")

        # 삭제된 코멘트 개별 조회 시도 → 모두 404여야 함
        # (현재 개별 코멘트 GET 엔드포인트는 없으므로
        #  사진 상세 조회가 404가 되는 것으로 간접 검증)
        res = client.get(f"/photos/{photo['id']}")
        assert res.status_code == 404

    def test_delete_photo_removes_all_comments_via_db(
        self, client, sample_image
    ):
        """[DB 레벨] 사진 삭제 후 Comment 레코드가 실제로 없어야 한다"""
        photo = _upload_photo(client, sample_image)
        _add_comment(client, photo["id"], "DB 레벨 검증 코멘트 1")
        _add_comment(client, photo["id"], "DB 레벨 검증 코멘트 2")

        photo_id = photo["id"]

        # 삭제 전 코멘트 수 확인
        db: Session = TestSessionLocal()
        before_count = db.query(Comment).filter(Comment.photo_id == photo_id).count()
        assert before_count == 2

        client.delete(f"/photos/{photo_id}")

        # 삭제 후 DB에서 직접 확인
        after_count = db.query(Comment).filter(Comment.photo_id == photo_id).count()
        db.close()

        assert after_count == 0, (
            f"사진 삭제 후 DB에 코멘트 {after_count}개가 남아 있습니다. "
            "Cascade 설정을 확인하세요."
        )

    def test_cascade_does_not_affect_other_photos(
        self, client, sample_image
    ):
        """[격리성] 사진 A 삭제가 사진 B의 코멘트에 영향을 주면 안 된다"""
        photo_a = _upload_photo(client, sample_image)
        photo_b = _upload_photo(client, sample_image)

        _add_comment(client, photo_a["id"], "A의 코멘트")
        b_comment = _add_comment(client, photo_b["id"], "B의 코멘트 — 살아야 함")

        client.delete(f"/photos/{photo_a['id']}")

        # 사진 B와 그 코멘트는 그대로 존재해야 한다
        detail_b = client.get(f"/photos/{photo_b['id']}")
        assert detail_b.status_code == 200

        comment_ids = [c["id"] for c in detail_b.json()["comments"]]
        assert b_comment["id"] in comment_ids

    def test_multiple_photos_cascade_independent(
        self, client, sample_image
    ):
        """여러 사진에 각각 코멘트가 있을 때, 삭제는 해당 사진만 영향"""
        photos = [_upload_photo(client, sample_image) for _ in range(3)]
        comment_ids_per_photo = {}

        for photo in photos:
            ids = []
            for i in range(2):
                c = _add_comment(client, photo["id"], f"photo {photo['id']} - comment {i}")
                ids.append(c["id"])
            comment_ids_per_photo[photo["id"]] = ids

        # 첫 번째 사진만 삭제
        client.delete(f"/photos/{photos[0]['id']}")

        db: Session = TestSessionLocal()
        # 삭제된 사진의 코멘트 → 0개
        deleted_count = (
            db.query(Comment)
            .filter(Comment.photo_id == photos[0]["id"])
            .count()
        )
        # 나머지 사진들의 코멘트 → 각 2개
        remaining_counts = [
            db.query(Comment).filter(Comment.photo_id == p["id"]).count()
            for p in photos[1:]
        ]
        db.close()

        assert deleted_count == 0
        assert all(c == 2 for c in remaining_counts)

    def test_photo_with_no_comments_deletes_cleanly(
        self, client, sample_image
    ):
        """코멘트가 없는 사진도 오류 없이 삭제되어야 한다"""
        photo = _upload_photo(client, sample_image)
        res = client.delete(f"/photos/{photo['id']}")
        assert res.status_code == 204

    def test_double_delete_returns_404(self, client, sample_image):
        """이미 삭제된 사진을 다시 삭제하면 404"""
        photo = _upload_photo(client, sample_image)
        client.delete(f"/photos/{photo['id']}")
        res = client.delete(f"/photos/{photo['id']}")
        assert res.status_code == 404
