# TCF Final Build Notes

Generated at: 2026-03-30T14:53:31.282Z

## Overall

- Folder này đủ để bắt đầu build website.
- Data chưa sạch tuyệt đối 100%, nên frontend/backend nên có fallback ở vài chỗ.
- File nào sạch hơn: `comprehension_ecrite`, `comprehension_orale`, `expression_orale`.
- File cần lưu ý nhất: `expression_ecrite`.

## comprehension_ecrite.json

- Trạng thái: dùng ổn cho website.
- Tổng: 40 tests, 1560 questions.
- Ảnh câu hỏi: 1560/1560.
- Bộ đáp án 4 lựa chọn: 1560/1560.
- 4 đáp án đều có text: 1560/1560.
- `correctAnswerIndex` hợp lệ: 1560/1560.
- Placeholder series description `AAZZAAZZ`: 40/40.
- Placeholder explanation `$20`: 1.
- Lưu ý khi build:
  - Không nên dùng `series.description` để hiển thị nội dung thật.
  - `prompt` hầu như không có giá trị sử dụng riêng: null 1557, empty 2.

## comprehension_orale.json

- Trạng thái: dùng ổn nếu UI hỗ trợ mode chọn `A/B/C/D`.
- Tổng: 40 tests, 1560 questions.
- Audio: 1560/1560.
- Có ảnh: 96/1560.
- Bộ đáp án 4 lựa chọn: 1560/1560.
- Bộ đáp án rỗng hoàn toàn: 337/1560.
- `correctAnswerIndex` hợp lệ: 1560/1560.
- Placeholder series description `AAZZAAZZ`: 40/40.
- `prompt = null`: 2.
- Lưu ý khi build:
  - Với 337 câu, nên cho user bấm `A/B/C/D` thay vì cố hiển thị text đáp án.
  - Không nên giả định mọi câu đều có ảnh.

## expression_ecrite.json

- Trạng thái: đây là bản clean tốt nhất hiện có và có thể dùng để build, nhưng vẫn còn lỗi dữ liệu gốc.
- Tổng: 320 items.
- Item đầy đủ các field chính: 228/320.
- Item thiếu ít nhất 1 field chính: 92/320.
- Item thiếu ít nhất 1 correction: 77/320.
- Item có 2 document cùng opinion: 208/320.
- Item có doc task 3 rỗng: 11/320.
- Parser artifact còn sót: 0.
- `titre` lệch `orderIndex`: 0.
- Lưu ý khi build:
  - Phải có fallback `chưa có correction` cho item thiếu correction.
  - Với item doc rỗng, nên ẩn task 3 hoặc đánh dấu `dữ liệu chưa hoàn chỉnh`.
  - Không nên tin tuyệt đối field `opinion`; nếu app có logic màu xanh/đỏ theo `pour/contre`, nên cho phép override sau.

## expression_orale.json

- Trạng thái: dùng được cho source hiện tại.
- Tổng: 38 months, 314 parties, 2745 sujets.
- Task counts: task 2 = 1525, task 3 = 1220.
- `description = null`: 2594/2745.
- `question = null`: 2562/2745.
- `correction = $undefined`: 4.
- Tháng thiếu task 2: Janvier 2025.
- Tháng thiếu task 3: Janvier 2023, Février 2023, Mars 2023, Avril 2023, Mai 2023, Juin 2023, Juillet 2023, Août 2023.
- Slug cần lưu ý: Février 2026 -> fvrier-2026, Janvier 2026 -> httpsstaging-tcf-canada-nextbendevaiepreuveexpression-oralesujets-actualitesjanvier-2026.
- Lưu ý khi build:
  - Source hiện tại chỉ cung cấp task 2/3, không nên build UI theo giả định luôn có task 1.
  - Nên render prompt chính từ `title`, không phụ thuộc `description` hoặc `question`.
  - Với 4 sujet correction undefined, nên hiển thị `chưa có bài mẫu`.

## Web Checklist

- expression_ecrite: thêm fallback khi correction thiếu hoặc doc rỗng.
- comprehension_orale: hỗ trợ mode `A/B/C/D` không cần text option.
- expression_orale: build theo `title + correction.exemple`, không chờ `task 1`.
- Nếu làm trang admin/review, nên đọc thêm file issue report ở `content-crawler/expression_ecrite_issues_2026-03-30.json`.
