# 🎨 DESIGN: RBAC & Tracking System (Miora Académie)

Ngày tạo: 2026-04-13
Dựa trên: [rbac_system_spec.md](../specs/rbac_system_spec.md)

---

## 1. Cách Lưu Thông Tin (Database Schema)

Để đáp ứng 3 vai trò và hệ thống Streak, chúng ta cần tổ chức dữ liệu như sau:

📦 **SƠ ĐỒ LƯU TRỮ CHÍNH:**

┌─────────────────────────────────────────────────────────────┐
│  👤 PROFILES (Thông tin người dùng mở rộng từ Supabase Auth)│
│  ├── id (Liên kết auth.users)                               │
│  ├── full_name (Tên đầy đủ)                                 │
│  ├── email                                                  │
│  ├── role (ADMIN | TEACHER | STUDENT)                       │
│  └── status (PENDING | ACTIVE)                              │
└───────────────────────────┬─────────────────────────────────┘
                            │ (Admin gán Học viên cho Giáo viên)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  🔗 TEACHER_STUDENTS (Phân công lớp)                        │
│  ├── teacher_id (Trỏ tới PROFILES)                          │
│  ├── student_id (Trỏ tới PROFILES)                          │
│  └── created_at                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🔥 STREAKS (Theo dõi chuỗi học tập của Student)            │
│  ├── student_id (Trỏ tới PROFILES)                          │
│  ├── current_streak (Số ngày liên tiếp)                     │
│  ├── highest_streak (Thành tích cao nhất)                   │
│  └── last_activity_date (Giờ VN - để tính chuỗi)            │
└─────────────────────────────────────────────────────────────┘

## 2. Danh Sách Màn Hình (Các Trang Của App)

Dựa vào spec phân quyền, hệ thống sẽ có các khu vực màn hình tách biệt:

| # | Tên Màn Hình | Dành cho | Mục đích |
|---|--------------|----------|----------|
| 1 | **Admin - User Management** | Admin | Xem danh sách user, Duyệt GV mới (Pending -> Active), Phân công HV cho GV. |
| 2 | **Admin - Content Management** | Admin | Tạo/Sửa/Xóa Đề thi, bài tập gốc. |
| 3 | **Teacher - Lớp Của Tôi** | Teacher | Nhìn thấy danh sách học viên đang quản lý và tiến độ của họ. |
| 4 | **Teacher - Chấm Bài** | Teacher | Xem bài học viên nộp, nhập điểm, ghi feedback. |
| 5 | **Student - Bàn Học (Dashboard)** | Student | Xem: Bài đang chờ, Bài sắp hết hạn, Bài quá hạn. Nộp bài. |
| 6 | **Student - Streak & Hành Trình** | Student | Xem chuỗi ngày học hiện tại, tiến độ các khóa học. |

## 3. Luồng Hoạt Động (User Journeys)

📍 **HÀNH TRÌNH 1: Giáo viên mới gia nhập**
1️⃣ Giáo viên đăng ký tài khoản (Auto set role = TEACHER, status = PENDING).
2️⃣ Đăng nhập lần đầu -> Dashboard báo: "Vui lòng đợi Admin duyệt".
3️⃣ Admin nhận email/thông báo -> Vào User Management -> Đổi PENDING thành ACTIVE.
4️⃣ Admin phân công 5 học viên cho Giáo viên này.
5️⃣ Giáo viên F5 -> Thấy 5 học viên trong mục "Lớp Của Tôi".

📍 **HÀNH TRÌNH 2: Học viên giữ Streak (Chuỗi)**
1️⃣ Học viên mở app.
2️⃣ Bấm vào 1 bài tập do Giáo viên giao -> Nộp bài.
3️⃣ Hệ thống trigger: Cập nhật `last_activity_date` = Hôm nay, `current_streak` + 1.
4️⃣ Hiển thị hiệu ứng pháo hoa chúc mừng +1 Chuỗi.

📍 **HÀNH TRÌNH 3: Chống mất Streak (Cảnh báo 18:00)**
1️⃣ Cronjob chạy tự động lúc 18:00 (Giờ VN) mỗi ngày.
2️⃣ Tìm các học viên có `last_activity_date` < Ngày hôm nay (nghĩa là chưa học).
3️⃣ Bắn Notification / Email: "Sắp mất chuỗi! Cố lên bạn ơi!".

## 4. Checklist Kiểm Tra & Test Cases

### 📋 TC-01: Admin Duyệt Giáo Viên (Happy Path)
- **Given:** Có 1 Giáo viên trạng thái PENDING.
- **When:** Admin bấm duyệt thành ACTIVE.
- **Then:**
  ✓ Tần suất DB được cập nhật.
  ✓ Giáo viên này có thể vào Teacher Dashboard.

### 📋 TC-02: RLS (Row Level Security) - Bảo mật dữ liệu
- **Given:** Một Giáo viên đang xem danh sách học viên.
- **When:** Giáo viên fetch API `/api/students`.
- **Then:**
  ✓ Bắt buộc CHỈ trả về đúng sinh viên có trong bảng `teacher_students` đã gán cho mình.
  ✓ Không xem được học viên của giáo viên khác.

### 📋 TC-03: Tính điểm Streak
- **Given:** Học viên đã nộp 1 bài hôm qua, `current_streak` là 3.
- **When:** Hôm nay nộp thêm 1 bài.
- **Then:**
  ✓ `current_streak` nhảy lên 4.
  ✓ `last_activity_date` được ghi nhận đúng chuẩn Timezone VN.

### 📋 TC-04: Tính điểm Streak - Vi Phạm
- **Given:** Học viên đã nộp 1 bài (cập nhật log thành công).
- **When:** Trong CÙNG NGÀY hôm đó, xem thêm 1 feedback.
- **Then:**
  ✓ `current_streak` vẫn giữ nguyên (chưa qua ngày mới).
  ✓ `last_activity_date` chỉ cập nhật thời gian mới nhất (cùng ngày).

---
*Tạo bởi AWF - Design Phase*
