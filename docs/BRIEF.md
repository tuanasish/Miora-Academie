# 💡 BRIEF: Hệ thống CMS Miora Académie (Phần Landing Page)

**Ngày tạo:** 2026-04-10
**Brainstorm cùng:** Thống soái (Super Admin)

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT
Trang Landing Page hiện tại cần được cập nhật nội dung bài viết, tin tức, blog thường xuyên mà không phải thay đổi trực tiếp trong mã nguồn code.

## 2. GIẢI PHÁP ĐỀ XUẤT
Xây dựng một module Admin Dashboard xây trực tiếp vào website hiện tại. Sử dụng Supabase làm CSDL. Dashboard sẽ bao gồm module quản lý Bài viết, cung cấp trình soạn thảo trực quan (Rich Text Editor) để dễ định dạng nội dung.

## 3. ĐỐI TƯỢNG SỬ DỤNG
- **Người dùng duy nhất:** Tài khoản Super Admin chuyên trách (Hiện tại là chủ website).

## 4. TÍNH NĂNG

### 🚀 MVP (Bắt buộc có từ đầu - Tập trung Quản lý Bài viết):
- [ ] Giao diện CMS liệt kê Danh sách các bài viết.
- [ ] Tính năng Thêm / Sửa / Xóa bài viết.
- [ ] Quản trị chi tiết bài viết:
    - Tiêu đề (Title)
    - Mô tả ngắn (Excerpt)
    - Ảnh bìa (Thumbnail) - upload lên Supabase Storage
    - Nội dung bài viết với trình soạn thảo trực quan (Rich text - in đậm, in nghiêng, chèn ảnh...).
    - Trạng thái: Bản nháp (Draft) hoặc Đã xuất bản (Published).
- [ ] Thiết kế trang hiển thị Danh sách Blog và Chi tiết bài Blog ở phần Landing Page để người ngoài vào đọc được.

### 🎁 Phase 2 (Làm sau):
- [ ] Tính năng Quản lý Danh mục khóa học.
- [ ] Quản lý Banner / Carousel.
- [ ] Phân loại chuyên mục / Tag cho bài viết.

## 5. ƯỚC TÍNH SƠ BỘ
- **Độ phức tạp:** 🟡 Trung bình (Cần tích hợp đúng 1 thư viện Rich Edit cho dễ xài và cấu hình Storage Supabase lưu ảnh).
- **Rủi ro:** Setup upload ảnh có thể đụng giới hạn miễn phí của Supabase, nhưng với mức độ dùng cho Landing page thì rất an toàn.

## 6. BƯỚC TIẾP THEO
→ Chạy `/plan` để lên thiết kế chi tiết (Database schema & Task list).
