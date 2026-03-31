# 💡 BRIEF: Miora Académie

**Ngày tạo:** 31/03/2026

---

## 1. VẤN ĐỀ & GIẢI PHÁP
- **Vấn đề:** Cần một website để luyện thi và làm bài tập theo chuẩn bài thi TCF (Tiếng Pháp), đặc biệt quản lý tốt quá trình làm bài giả lập thời gian thực.
- **Giải pháp:** Xây dựng hệ thống web online giả lập môi trường thi TCF với 4 kỹ năng (Nghe, Đọc, Nói, Viết). Có tính năng xét duyệt bằng email và các công cụ bổ trợ quá trình thi (đếm chữ, đếm giờ, bàn phím tiếng Pháp).

## 2. ĐỐI TƯỢNG SỬ DỤNG
- **Học viên:** Những người đã được admin cấp quyền (thêm email vào danh sách) mới được phép vào làm từng bài cụ thể.
- **Admin/Giáo viên:** Quản lý giao bài (thêm/xóa email), nhận thông báo (email) ngay lập tức khi học viên nộp bài.

## 3. TÍNH NĂNG CHÍNH (🚀 MVP - Tính năng bắt buộc)

### 👤 THEO DÕI & QUẢN LÝ (Admin Dashboard)
- [ ] Đăng nhập/Quyền truy cập: Chỉ email được admin thêm vào mới được làm bài thi tương ứng.
- [ ] Notification: Tự động gửi email thông báo kết quả/tình trạng nộp bài về cho giáo viên.

### 🎧 NGHE (Compréhension Orale) & 📖 ĐỌC (Compréhension Écrite)
- [ ] Module thi trắc nghiệm theo dữ liệu JSON có sẵn của 2 kỹ năng này.

### ✍️ VIẾT (Expression Écrite)
- [ ] Giao diện chia 3 khu vực:
  - **Cột trái:** Điều hướng giữa Task 1, 2 và 3.
  - **Cột giữa:** Khu vực làm bài (1 dòng nhỏ hiện đề bài/cho phép copy-paste, 1 khung lớn để học viên gõ bài làm).
  - **Cột phải:** Bàn phím tiếng Pháp ảo hỗ trợ gõ nhanh, đồng hồ và số lượng từ (word count).
- [ ] Đồng hồ đếm TỚI cho tổng thời gian học viên đã dùng ở mỗi Task (để biết Task 1 tốn bao lâu, Task 2 tốn bao lâu).
- [ ] Đồng hồ đếm LÙI 60 phút tổng cho cả bài thi Viết.

### 🗣️ NÓI (Expression Orale)
- [ ] Gồm 2 Tasks.
- [ ] Đồng hồ đếm LÙI: Task 1 đếm lùi `2p30s`, Task 2 đếm lùi `4p30s`.
- [ ] Học viên tự quay video câu trả lời và upload file video nộp lên hệ thống.

---

## 4. LƯU Ý / ĐÁNH GIÁ SƠ BỘ VỀ MẶT KỸ THUẬT
- **Độ phức tạp:** Ở mức TRUNG BÌNH - KHÓ do cần quản lý trạng thái đồng hồ khá phức tạp cho từng task và lưu trữ file nặng.
- **Lưu ý:** Upload file Video cần một kho lưu trữ dung lượng lớn (Cloud Storage) vì video sẽ nặng. Các tính năng gửi Email báo cáo đều cần cấu hình dịch vụ gửi nhận mail ổn định.
