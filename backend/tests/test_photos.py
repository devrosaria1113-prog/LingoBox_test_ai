"""
Photo API 통합 테스트

대상 엔드포인트:
  POST   /photos          — 업로드
  GET    /photos          — 목록
  GET    /photos/{id}     — 상세
  DELETE /photos/{id}     — 삭제
"""
import io
import pytest


class TestPhotoUpload:
    def test_upload_jpeg_success(self, client, sample_image):
        """정상 JPEG 업로드 → 201, 필수 필드 반환"""
        res = client.post(
            "/photos",
            files={"file": ("photo.jpg", sample_image, "image/jpeg")},
        )
        assert res.status_code == 201
        body = res.json()
        assert body["id"] is not None
        assert body["original_filename"] == "photo.jpg"
        assert body["s3_url"].startswith("https://")
        assert body["thumbnail_url"].startswith("https://")
        assert body["file_size"] > 0

    def test_upload_png_success(self, client):
        """PNG 업로드도 성공해야 한다"""
        from PIL import Image

        buf = io.BytesIO()
        Image.new("RGBA", (2, 2)).save(buf, format="PNG")
        res = client.post(
            "/photos",
            files={"file": ("img.png", buf.getvalue(), "image/png")},
        )
        assert res.status_code == 201
        assert res.json()["content_type"] == "image/png"

    def test_upload_invalid_mime_rejected(self, client):
        """이미지가 아닌 파일은 400 반환"""
        res = client.post(
            "/photos",
            files={"file": ("doc.pdf", b"%PDF-1.4", "application/pdf")},
        )
        assert res.status_code == 400

    def test_upload_oversized_file_rejected(self, client):
        """10MB 초과 파일은 400 반환"""
        big = b"x" * (10 * 1024 * 1024 + 1)
        res = client.post(
            "/photos",
            files={"file": ("big.jpg", big, "image/jpeg")},
        )
        assert res.status_code == 400

    def test_s3_object_created(self, client, mock_s3, sample_image):
        """업로드 후 S3 버킷에 실제 오브젝트가 존재해야 한다"""
        res = client.post(
            "/photos",
            files={"file": ("check.jpg", sample_image, "image/jpeg")},
        )
        s3_key = res.json()["s3_key"]
        obj = mock_s3.get_object(Bucket="test-bucket", Key=s3_key)
        assert obj["ContentType"] == "image/jpeg"


class TestPhotoList:
    def test_empty_list(self, client):
        """사진이 없으면 빈 배열 반환"""
        res = client.get("/photos")
        assert res.status_code == 200
        assert res.json() == []

    def test_list_returns_uploaded_photos(self, client, uploaded_photo):
        """업로드 후 목록에 해당 사진이 포함돼야 한다"""
        res = client.get("/photos")
        assert res.status_code == 200
        ids = [p["id"] for p in res.json()]
        assert uploaded_photo["id"] in ids

    def test_list_ordered_newest_first(self, client, sample_image):
        """최신 업로드 순으로 정렬되어야 한다"""
        for _ in range(3):
            client.post(
                "/photos",
                files={"file": ("p.jpg", sample_image, "image/jpeg")},
            )
        photos = client.get("/photos").json()
        ids = [p["id"] for p in photos]
        assert ids == sorted(ids, reverse=True)

    def test_list_contains_only_list_fields(self, client, uploaded_photo):
        """목록 응답에는 s3_key 같은 내부 필드가 없어야 한다"""
        photos = client.get("/photos").json()
        assert "s3_key" not in photos[0]
        assert "thumbnail_url" in photos[0]


class TestPhotoDetail:
    def test_get_existing_photo(self, client, uploaded_photo):
        """존재하는 사진 조회 → 200, comments 배열 포함"""
        photo_id = uploaded_photo["id"]
        res = client.get(f"/photos/{photo_id}")
        assert res.status_code == 200
        body = res.json()
        assert body["id"] == photo_id
        assert "comments" in body
        assert isinstance(body["comments"], list)

    def test_get_nonexistent_photo_returns_404(self, client):
        """존재하지 않는 ID → 404"""
        res = client.get("/photos/99999")
        assert res.status_code == 404


class TestPhotoDelete:
    def test_delete_existing_photo(self, client, uploaded_photo):
        """사진 삭제 → 204, 이후 조회 시 404"""
        photo_id = uploaded_photo["id"]
        res = client.delete(f"/photos/{photo_id}")
        assert res.status_code == 204
        assert client.get(f"/photos/{photo_id}").status_code == 404

    def test_delete_removes_from_list(self, client, uploaded_photo):
        """삭제 후 목록에서도 제거되어야 한다"""
        photo_id = uploaded_photo["id"]
        client.delete(f"/photos/{photo_id}")
        ids = [p["id"] for p in client.get("/photos").json()]
        assert photo_id not in ids

    def test_delete_nonexistent_returns_404(self, client):
        """없는 사진 삭제 → 404"""
        res = client.delete("/photos/99999")
        assert res.status_code == 404

    def test_delete_removes_s3_object(self, client, mock_s3, uploaded_photo):
        """삭제 후 S3 오브젝트도 사라져야 한다"""
        import botocore.exceptions

        s3_key = uploaded_photo["s3_key"]
        client.delete(f"/photos/{uploaded_photo['id']}")

        with pytest.raises(botocore.exceptions.ClientError) as exc:
            mock_s3.get_object(Bucket="test-bucket", Key=s3_key)
        assert exc.value.response["Error"]["Code"] == "NoSuchKey"
