# Spec: Góc Học Viên (Student Hub) - Miora Académie

## 1. Executive Summary
Trang "Góc Học Viên" là một hub tập trung nội dung dành cho học viên Miora Académie. Mục tiêu: tăng engagement, cung cấp giá trị miễn phí, và xây dựng social proof qua thành tựu & feedback học viên. Route: `/goc-hoc-vien`.

## 2. User Stories

| # | As a... | I want to... | So that... |
|---|---------|-------------|-----------|
| 1 | Khách truy cập | Xem blog mới nhất | Cập nhật tin tức Miora |
| 2 | Học viên | Đọc tips học tiếng Pháp | Cải thiện phương pháp học |
| 3 | Học viên | Tải tài liệu miễn phí (PDF, Audio) | Có thêm tài liệu luyện tập |
| 4 | Khách tiềm năng | Xem feedback học viên cũ | Tin tưởng hơn để đăng ký |
| 5 | Khách tiềm năng | Xem thành tựu học viên | Biết chất lượng đào tạo |
| 6 | Admin | Thêm/sửa/xóa tài liệu, feedback, thành tựu | Quản lý nội dung dễ dàng |
| 7 | Admin | Phân loại bài viết (blog/tips) | Nội dung hiển thị đúng section |

## 3. Database Design

### Bảng `posts` (MỞ RỘNG - thêm cột):
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| category | text | 'blog' / 'tips' / 'news' (default: 'blog') |

### Bảng `resources` (MỚI):
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid | PK, auto-gen |
| title | text | Tên tài liệu |
| description | text | Mô tả ngắn |
| file_url | text | Link file (Supabase Storage) |
| file_type | text | 'pdf' / 'audio' / 'doc' / 'other' |
| file_size | text | VD: "2.5 MB" |
| download_count | integer | Đếm lượt tải (default: 0) |
| is_active | boolean | Hiển thị hay ẩn (default: true) |
| created_at | timestamptz | Ngày tạo |

### Bảng `testimonials` (MỚI):
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid | PK |
| student_name | text | Tên học viên |
| avatar_url | text | Ảnh đại diện (nullable) |
| course | text | Khóa đã học (VD: "DELF B1") |
| quote | text | Trích dẫn feedback |
| rating | integer | Số sao (1-5) |
| is_active | boolean | Hiển thị (default: true) |
| display_order | integer | Thứ tự hiển thị |
| created_at | timestamptz | Ngày tạo |

### Bảng `achievements` (MỚI):
| Cột | Kiểu | Mô tả |
|-----|------|-------|
| id | uuid | PK |
| student_name | text | Tên học viên |
| avatar_url | text | Ảnh (nullable) |
| achievement | text | Thành tích (VD: "DELF B2 - 85/100") |
| description | text | Mô tả ngắn |
| year | text | Năm đạt được |
| is_active | boolean | Hiển thị (default: true) |
| display_order | integer | Thứ tự hiển thị |
| created_at | timestamptz | Ngày tạo |

## 4. UI Sections

### Section 1: Hero Banner
- Background gradient xanh Pháp → tím nhạt
- Heading: "Góc Học Viên Miora"
- Subtext: "Cùng Miora chinh phục tiếng Pháp"
- Scroll-down CTA

### Section 2: Blog & Cập nhật
- 3 cards ngang (grid 3 cột), lấy từ posts WHERE category = 'blog'
- Thumbnail + title + excerpt + date
- Nút "Xem tất cả bài viết →"

### Section 3: Tips Học Tập
- 3-4 cards, lấy từ posts WHERE category = 'tips'
- Icon lightbulb + tag "Tips"
- Tone màu khác (vàng/cam nhạt) để phân biệt với Blog

### Section 4: Tài Liệu Miễn Phí
- Danh sách file (icon theo file_type: PDF, Audio...)
- Nút Download + Số lượt tải
- Background: nhẹ nhàng, sạch sẽ

### Section 5: Thành Tựu Học Viên
- Cards hoặc Timeline hiển thị: ảnh + tên + thành tích + năm
- Có thể kèm confetti/badge decoration
- Tone: vàng gold, sang trọng

### Section 6: Feedback Học Viên
- Carousel auto-slide (3-5 giây/slide)
- Mỗi slide: avatar + tên + quote + rating stars + khóa học
- Dots indicator phía dưới

## 5. Tech Stack
- Next.js 16 (App Router, Server Components)
- Tailwind CSS 4
- Supabase (Database + Storage)
- Lucide Icons (đã có)
- Không cần dependency mới

## 6. Build Checklist
- [ ] Phase 01: Database schema + Server actions
- [ ] Phase 02: Frontend 6 sections
- [ ] Phase 03: Admin UI mở rộng
- [ ] Phase 04: Testing & Polish
