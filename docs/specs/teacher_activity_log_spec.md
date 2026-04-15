# Teacher Activity Log (Nhật ký hoạt động giáo viên)

## 1. Executive Summary
Tính năng giúp Admin theo dõi các hoạt động xử lý tác vụ của giáo viên trong hệ thống (gán bài, chấm điểm, phản hồi). Cung cấp khả năng lọc, tìm kiếm và truy xuất nhanh đến nội dung gốc.

## 2. User Stories
- **Là Admin**, tôi muốn xem danh sách các hoạt động mới nhất của giáo viên để biết tiến độ xử lý công việc.
- **Là Admin**, tôi muốn lọc hoạt động theo giáo viên cụ thể để đánh giá hiệu suất.
- **Là Admin**, tôi muốn lọc theo loại hoạt động (VD: chỉ xem các bài đã chấm) để dễ hàng xuất báo cáo.
- **Là Admin**, tôi muốn click vào một hoạt động để nhảy tới trang bài tập liên quan để kiểm tra đối chiếu.

## 3. Database Design

### Table: `teacher_activities`
Bảng lưu trữ thông tin log tập trung.
- `id` (uuid, PK)
- `teacher_id` (uuid, FK -> profiles/users): ID giáo viên thực hiện
- `action_type` (text): Loại hành động (ASSIGN_EXAM, GRADE_SUBMISSION, ADD_FEEDBACK, etc.)
- `student_id` (uuid, FK -> profiles/users, nullable): ID học viên nhận tác động
- `resource_id` (uuid, nullable): ID của bài tập/đề thi liên quan
- `resource_type` (text, nullable): 'EXAM', 'SUBMISSION', etc.
- `metadata` (jsonb, nullable): Dữ liệu bổ sung (ví dụ: điểm số vừa chấm)
- `created_at` (timestamptz, index)

### Enum / Constants cho Action Type:
- `ASSIGN_EXAM`: Gán đề thi cho học viên
- `GRADE_SUBMISSION`: Chấm điểm bài nộp
- `ADD_FEEDBACK`: Gửi phản hồi / Nhận xét

## 4. API Contract

### Backend (Supabase server actions / API routes)
**1. `logTeacherActivity(data)`**
- Hàm internal để gọi khi giáo viên thực hiện tác vụ. Ghi 1 dòng vào bảng.

**2. `getTeacherActivities(filters, page, limit)`**
- Lấy danh sách logs cho Admin dashboard.
- Param: `teacherId`, `actionType`, `startDate`, `endDate`, `limit`, `offset`.
- Output: Mảng `TeacherActivity`.

## 5. UI Components

**Admin Dashboard -> Quản lý Giáo viên -> Nhật ký Hoạt động**
- **ActivityFilterBar**: Thanh lọc (Select Giáo viên, Select Loại action, DatePicker).
- **ActivityTimeline**: List danh sách các sự kiện dạng timeline dội từ trên xuống.
- **ActivityCard**: Component hiển thị chi tiết 1 dòng log. Chứa avatar giáo viên, action name, tên học sinh, thời gian, và nút link tới bài làm.

## 6. Logic Flowchart
1. Giáo viên thực hiện thao tác duyệt bài -> Server API xử lý -> Song song gọi `logTeacherActivity`.
2. Admin vào trang Nhật ký -> Giao diện gọi `getTeacherActivities` -> Render Timeline.
3. Admin đổi filter -> Tải lại danh sách theo filter.
