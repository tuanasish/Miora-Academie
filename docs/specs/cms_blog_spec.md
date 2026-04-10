# System CMS - Quản lý Bài viết

**Ngày tạo:** 2026-04-10
**Dự án:** Miora Académie

## 1. Executive Summary
Xây dựng module Admin Dashboard nội bộ để Thống soái (Super Admin) tự quản lý (Thêm/Sửa/Xóa) bài viết, tin tức trên Landing Page của trung tâm Miora Académie. Bài viết sẽ có đầy đủ Rich Text, Ảnh Thumbnail, và được lưu trữ trên Supabase.

## 2. User Stories
- Như một Super Admin, tôi muốn thêm bài viết mới với nội dung tuỳ chỉnh in đậm, chèn ảnh (Rich Text) để nó trông chuyên nghiệp.
- Như một Super Admin, tôi muốn tải lên Ảnh bìa (Thumbnail) để bài viết hiển thị hấp dẫn trên trang chủ.
- Như một Super Admin, tôi muốn ẩn/hiện bài viết bằng cách chỉnh trạng thái thành Bản nháp (Draft) hoặc Xuất bản (Published).
- Như một Khách Truy Cập, tôi muốn xem danh sách các bài viết mới nhất trên Landing Page.

## 3. Database Design (Trọng tâm)
Tạo bảng `posts` trong Supabase:
- `id`: uuid (Primary Key)
- `title`: text (Tiêu đề)
- `slug`: text (Đường dẫn tĩnh, ví dụ: bai-viet-so-1, unique)
- `content`: text (Nội dung HTML sinh ra từ Rich Text)
- `excerpt`: text (Mô tả ngắn, cắt từ content hoặc nhập tay)
- `thumbnail_url`: text (Link ảnh lấy từ Supabase Storage)
- `status`: text (draft | published)
- `created_at` / `updated_at`

**Storage:** Bucket `blog-images`.

## 4. API Contract & Logic Flow (Quy ước)
- `GET /api/posts`: Lấy danh sách bài viết (Public nếu published, Private nếu admin).
- `POST /api/posts`: Tạo bài viết mới (Chỉ Admin có session).
- `PUT /api/posts/:id`: Cập nhật bài viết.

## 5. UI Components
- **Admin Layout**: Giao diện Layout có thanh bên (Sidebar) dành riêng cho Route `/admin`.
- **Rich Text Editor**: Dùng thư viện `@tiptap/react` hoặc `react-quill` để edit HTML.
- **Image Uploader**: Component tải file lên Supabase bucket, lấy Public URL về.
- **Blog Card**: Thẻ hiển thị ngoài trang chủ (Ảnh, Tiêu đề, Mô tả).

## 6. Tech Stack
- Frontend: Next.js 16 (App Router), TailwindCSS, TypeScript.
- Editor: Tiptap.
- Backend/DB: Supabase (PostgreSQL, Storage).
- Auth: Supabase Auth (Chỉ email Admin được cấp quyền).
