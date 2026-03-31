# 💡 BRIEF: Content Crawler - TCF Canada

**Ngày tạo:** 2026-03-30
**Nguồn:** https://app.formation-tcfcanada.com/

---

## 1. VẤN ĐỀ CẦN GIẢI QUYẾT

Cần crawl toàn bộ nội dung bài trắc nghiệm TCF Canada (nghe, nói, đọc, viết) từ website formation-tcfcanada.com để xây dựng website luyện thi riêng.

## 2. PHÂN TÍCH WEBSITE NGUỒN

### Tech Stack phát hiện:
- **Framework:** Next.js 14+ với React Server Components (RSC)
- **Auth:** Clerk Authentication (JWT tokens)
- **Deploy:** Vercel (`dpl_BJTvNTjy9ZRvvGR5bBQK5fTHzeWx`)
- **Thiết kế:** v0.app (công cụ thiết kế UI của Vercel)

### Cấu trúc nội dung:

| Kỹ năng | URL | Nội dung | Số lượng |
|---------|-----|----------|----------|
| Compréhension Orale (Nghe) | `/epreuve/comprehension-orale` | Audio + 39 MCQ, 35 phút | 40 tests |
| Compréhension Écrite (Đọc) | `/epreuve/comprehension-ecrite` | Text + 39 MCQ, 60 phút | 40 tests |
| Expression Orale (Nói) | `/epreuve/expression-orale` | 3 tâches nói, 12 phút | Nhiều sujets |
| Expression Écrite (Viết) | `/epreuve/expression-ecrite` | 3 tâches viết, 60 phút | Nhiều sujets |

### Thách thức kỹ thuật:

1. **JWT Token hết hạn nhanh (~60 giây)**
   - Cookie `__session` là JWT, `exp` chỉ cách `iat` khoảng 60s
   - Clerk JS tự động refresh token ở client-side
   - → Không thể dùng simple HTTP request với static cookies

2. **React Server Components**
   - Dữ liệu stream qua RSC protocol, không phải REST API truyền thống
   - Content render ở server nhưng cần JavaScript client để hoàn tất

3. **Toàn bộ content sau paywall**
   - Trang epreuve redirect về login nếu session không hợp lệ
   - Phải có account trả phí mới truy cập được

## 3. GIẢI PHÁP ĐỀ XUẤT

### Phương án: Playwright Browser Automation (Recommended)

**Tại sao chọn Playwright:**
- Chạy full browser → Clerk JS tự refresh JWT token
- Render JavaScript hoàn chỉnh → DOM có đủ data
- Intercept network requests → Bắt API calls + audio URLs
- Hỗ trợ download files (audio, images)

**Quy trình crawl:**
1. Khởi tạo Playwright browser + load cookies
2. Đợi Clerk JS refresh session tự động
3. Navigate đến từng page bài thi
4. Chờ content render xong
5. Extract data từ DOM (câu hỏi, đáp án, đoạn văn...)
6. Download audio files (cho phần nghe)
7. Lưu ra file JSON theo cấu trúc chuẩn

## 4. TÍNH NĂNG

### 🚀 MVP (Bắt buộc có):
- [ ] Load cookies + khởi tạo phiên đăng nhập
- [ ] Crawl Compréhension Écrite (40 tests, câu hỏi + đáp án)
- [ ] Crawl Compréhension Orale (40 tests, câu hỏi + đáp án + link audio)
- [ ] Crawl Expression Écrite (đề bài + bài mẫu/corrections)
- [ ] Crawl Expression Orale (đề bài + bài mẫu/corrections)
- [ ] Download audio files (Compréhension Orale)
- [ ] Xuất JSON có cấu trúc cho từng loại bài

### 🎁 Phase 2 (Làm sau):
- [ ] Phân loại theo level CECR (A1-C2)
- [ ] Retry logic khi gặp lỗi mạng
- [ ] Progress bar hiển thị tiến trình crawl
- [ ] Export CSV/Excel bên cạnh JSON
- [ ] Tự động phát hiện content mới

## 5. CẤU TRÚC DATA OUTPUT

### comprehension_ecrite.json
```json
{
  "type": "comprehension_ecrite",
  "total_tests": 40,
  "tests": [
    {
      "test_id": 1,
      "questions": [
        {
          "id": 1,
          "text_passage": "...",
          "question": "...",
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
          "correct_answer": "B",
          "explanation": "..."
        }
      ]
    }
  ]
}
```

### comprehension_orale.json
```json
{
  "type": "comprehension_orale",
  "total_tests": 40,
  "tests": [
    {
      "test_id": 1,
      "audio_file": "audio/co_test_01.mp3",
      "questions": [
        {
          "id": 1,
          "question": "...",
          "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
          "correct_answer": "A"
        }
      ]
    }
  ]
}
```

### expression_ecrite.json
```json
{
  "type": "expression_ecrite",
  "sujets": [
    {
      "id": 1,
      "tache": 1,
      "sujet": "...",
      "consigne": "...",
      "modele_corrige": "...",
      "level": "B2"
    }
  ]
}
```

### expression_orale.json
```json
{
  "type": "expression_orale",
  "sujets": [
    {
      "id": 1,
      "tache": 1,
      "sujet": "...",
      "consigne": "...",
      "points_cles": ["..."],
      "modele_reponse": "..."
    }
  ]
}
```

## 6. ƯỚC TÍNH SƠ BỘ

- **Độ phức tạp:** Trung bình - Cao
  - 🟡 Playwright setup + cookies: Trung bình
  - 🟡 DOM parsing cho từng loại bài: Trung bình (cần reverse-engineer DOM)
  - 🔴 Xử lý JWT refresh + session stability: Khó
  - 🟢 Export JSON: Dễ

- **Rủi ro:**
  - Session có thể hết hạn giữa chừng → cần auto-refresh hoặc re-login
  - DOM structure có thể thay đổi khi website update
  - Rate limiting có thể block nếu crawl quá nhanh

## 7. TECH STACK CHO CRAWLER

- **Runtime:** Node.js
- **Browser automation:** Playwright
- **Language:** JavaScript/TypeScript
- **Output:** JSON files + downloaded audio

## 8. BƯỚC TIẾP THEO
→ Chạy `/plan` để lên thiết kế chi tiết code
