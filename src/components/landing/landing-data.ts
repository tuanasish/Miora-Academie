export const ASSETS = {
  logo: "https://www.figma.com/api/mcp/asset/76035ed9-22f1-42e9-b003-6ba304a425c1",
  challengeIcon1: "https://www.figma.com/api/mcp/asset/717bd302-f56a-45fb-973b-8a7de691b0fa",
  challengeIcon2: "https://www.figma.com/api/mcp/asset/bfb7c531-7b73-4d41-866d-95ac04c7e092",
  challengeIcon3: "https://www.figma.com/api/mcp/asset/617b16e6-af73-40ed-8569-62b8716a222c",
  feedbackLeft: "https://www.figma.com/api/mcp/asset/f494de90-846e-4f99-9271-d424faff8139",
  feedbackCard1: "https://www.figma.com/api/mcp/asset/5a8e7369-7086-408e-9034-0836a6e806bf",
  feedbackCard2: "https://www.figma.com/api/mcp/asset/74eef2c7-0512-4171-a83d-a7baed1c86cd",
  result1: "https://www.figma.com/api/mcp/asset/067617cb-b5e7-4a51-bda3-140bc170ddfa",
  result2: "https://www.figma.com/api/mcp/asset/82ad19ec-7b2a-4e97-9061-2a25b5beca75",
  consultVisual: "https://www.figma.com/api/mcp/asset/96386fb0-f449-43a3-a98e-f3baf0d39a37",
  methodPlaceholder: "https://www.figma.com/api/mcp/asset/5cd2fb8b-8944-44d0-b6a5-d869bf939c77",
};

export const heroSlides = [
  { id: 1, bg: "#000000", label: "Banner 1" },
  { id: 2, bg: "#c80000", label: "Banner 2" },
  { id: 3, bg: "#e2cc5f", label: "Banner 3" },
];

export const challengeCards = [
  {
    id: "01",
    title: "Phát âm khó",
    description: "Bạn hiểu nhưng không nói được, dẫn đến mất tự tin khi giao tiếp.",
  },
  {
    id: "02",
    title: "Ngữ pháp rối",
    description: "Bạn học nhiều nhưng không hệ thống, dễ quên và khó áp dụng.",
  },
  {
    id: "03",
    title: "Thiếu môi trường",
    description: "Bạn thiếu thực hành liên tục khiến kiến thức chỉ nằm mãi trên sách.",
  },
];

export const methodZBlocks = [
  {
    title: "Miora bắt đầu từ việc hiểu đúng năng lực của bạn",
    body:
      "Có thể bạn đã từng thử nhiều cách học khác nhau nhưng vẫn không thấy tiến bộ rõ ràng. Không phải vì bạn không đủ khả năng, mà vì cách học chưa phù hợp. Tại Miora, lộ trình được thiết kế dựa trên chính mục tiêu và tốc độ của bạn, để mỗi bước đi đều có ý nghĩa.",
    reverse: false,
  },
  {
    title: "Xây dựng 1 lộ trình cho riêng cho bạn",
    body:
      "Một bài kiểm tra không chỉ cho biết bạn đang ở đâu, mà còn chỉ ra cụ thể những điểm đang cản bạn tiến bộ. Từ đó, bạn không cần học lại từ đầu hay học lan man, mà tập trung đúng vào điều mình thực sự cần.",
    reverse: true,
  },
  {
    title: "Học và sửa lỗi sai ngay trong từng buổi",
    body:
      "Trong quá trình học, bạn không chỉ tiếp nhận kiến thức mà còn được chỉ ra lỗi sai và hướng dẫn cách điều chỉnh. Việc sửa đúng ngay từ đầu giúp bạn tránh lặp lại sai lầm và tiến bộ một cách rõ ràng qua từng buổi học.",
    reverse: false,
  },
  {
    title: "Miora luôn đồng hành, cả ngoài giờ học",
    body:
      "Việc học không dừng lại khi buổi học kết thúc. Khi bạn gặp khó khăn, luôn có sự hỗ trợ để giải đáp, điều chỉnh và giữ cho quá trình học của bạn không bị gián đoạn.",
    reverse: true,
  },
];

export const processSteps = [
  {
    n: "01",
    title: "Khám phá",
    body: "Nền tảng. Học cách chào hỏi, giới thiệu bản thân và các động từ thiết yếu hàng ngày.",
    tag: "A1",
  },
  {
    n: "02",
    title: "Sinh tồn",
    body: "Giao tiếp về môi trường sống, các nhu cầu cơ bản và trải nghiệm trong quá khứ.",
    tag: "A2",
  },
  {
    n: "03",
    title: "Vượt ngưỡng",
    body: "Xử lý các tình huống bất ngờ và bày tỏ ý kiến về các chủ đề văn hóa trừu tượng.",
    tag: "B1",
  },
  {
    n: "04",
    title: "Làm chủ",
    body: "Tranh luận các vấn đề phức tạp và thấu hiểu các văn bản chuyên ngành với sắc thái bản ngữ.",
    tag: "B2",
  },
];

export const teachPills = [
  { value: "100%", label: "Cam kết đầu ra rõ ràng" },
  { value: "3+", label: "Năm kinh nghiệm đào tạo" },
  { value: "99%", label: "Học viên hài lòng" },
];

export const studyFormats = {
  title: "I. Hình thức học tập",
  columns: [
    {
      title: "Cá nhân hóa",
      items: [
        "Đặc điểm: Lớp 1:1, lộ trình hoàn toàn dựa trên xuất phát điểm và mục tiêu riêng biệt của học viên.",
        "Ưu điểm: Tương tác tối đa với giáo viên, sửa lỗi phát âm và phản xạ ngay lập tức. Phù hợp cho người bận rộn cần lịch học linh hoạt hoặc muốn đẩy nhanh tiến độ gấp 2–3 lần.",
        "Mục tiêu: Đạt kết quả mong muốn trong thời gian ngắn nhất với sự kèm cặp sâu sát.",
      ],
    },
    {
      title: "Những bông hoa nhỏ (Max 6 học viên)",
      items: [
        "Đặc điểm: Sĩ số lớp từ 3–6 học viên có trình độ tương đương, đảm bảo mỗi học viên đều được tương tác và thực hành.",
        "Ưu điểm: Môi trường học năng động, có bạn đồng hành, giúp duy trì động lực và tăng phản xạ tự nhiên.",
        "Mục tiêu: Phát triển toàn diện các kỹ năng và tăng cường khả năng phản xạ trong môi trường tương tác.",
      ],
    },
  ],
};

export const examPrograms = {
  title: "II. Chương trình luyện thi",
  columns: [
    {
      title: "Luyện thi DELF (Trình độ A1 – B2)",
      items: [
        "Đối tượng: Học sinh, sinh viên có ý định du học Pháp hoặc người muốn sở hữu bằng tiếng Pháp có giá trị vĩnh viễn.",
        "Nội dung: Tập trung hệ thống hóa kiến thức và rèn luyện chuyên sâu 4 kỹ năng: Nghe – Nói – Đọc – Viết theo chuẩn khung tham chiếu Châu Âu (CEFR).",
        "Đầu ra: Nắm vững cấu trúc đề thi, làm chủ chiến thuật làm bài và đạt kết quả thi đúng mục tiêu.",
      ],
    },
    {
      title: "Luyện thi TCF TP & TCF Canada (Trình độ A1 – B2)",
      items: [
        "Đối tượng: Người có nhu cầu du học, trao đổi hoặc đặc biệt là định cư tại Canada (diện Express Entry hoặc các tỉnh bang).",
        "Nội dung: Tập trung vào các dạng bài thi trắc nghiệm đặc thù của TCF và kỹ năng nói/viết dưới áp lực thời gian. Cập nhật liên tục các chủ đề thi mới nhất để tối ưu hóa điểm số.",
        "Đầu ra: Đạt mức điểm yêu cầu để hoàn thiện hồ sơ di trú hoặc nhập học, làm chủ các cách xử lý đề thi hiệu quả.",
      ],
    },
  ],
};

export const teachers = [
  { name: "Giáo viên Miora", role: "DELF / TCF", img: ASSETS.feedbackCard1 },
  { name: "Giáo viên Miora", role: "Giao tiếp", img: ASSETS.feedbackCard2 },
  { name: "Giáo viên Miora", role: "Phát âm", img: ASSETS.feedbackCard1 },
];

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readMinutes: number;
  paragraphs: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "5-loi-sai-pho-bien-khi-hoc-tcf",
    title: "5 lỗi sai phổ biến khi học TCF",
    excerpt: "Tránh các lỗi thường gặp để tiết kiệm thời gian và điểm số.",
    date: "2026-03-15",
    readMinutes: 6,
    paragraphs: [
      "Nhiều học viên ôn TCF chỉ tập trung làm đề mà không hệ thống lại lỗi sai. Dưới đây là năm nhóm lỗi Miora thường gặp nhất.",
      "Thứ nhất: đọc lưỡng lự trước phần nghe — bạn cố gắng dịch từng từ trong đầu thay vì nắm ý chính. Thứ hai: làm bài đọc quá chậm ở đoạn đầu rồi hết thời gian ở cuối.",
      "Thứ ba: viết dài nhưng lệch yêu cầu đề. Thứ tư: nói lạc đề hoặc thiếu cấu trúc mở — thân — kết. Thứ năm: không chấm lại bài theo rubric, chỉ \"cảm tính\" là đủ điểm.",
      "Cách khắc phục: lập sổ lỗi theo kỹ năng, ôn theo đợt 2 tuần, và luôn so sánh bài làm với tiêu chí chấm chính thức.",
    ],
  },
  {
    slug: "cach-luyen-noi-tieng-phap-tu-so-0",
    title: "Cách luyện nói tiếng Pháp từ số 0",
    excerpt: "Lộ trình thực hành ngắn gọn, dễ duy trì mỗi ngày.",
    date: "2026-03-22",
    readMinutes: 8,
    paragraphs: [
      "Luyện nói hiệu quả không đến từ việc \"nói nhiều\" mà từ vòng lặp ngắn: nghe mẫu → bắt chước → ghi âm → so sánh.",
      "Mỗi ngày chỉ cần 15–20 phút: chọn một câu hoặc một đoạn ngắn trong sách giáo trình, đọc to 3 lần, tự quay video không nhìn văn bản, nghe lại và sửa một âm hoặc một nhịp ngắt.",
      "Khi đã quen, thêm bước \"diễn đạt lại bằng từ của mình\" thay vì thuộc lòng nguyên câu. Điều này giúp não chuyển từ sao chép sang sản xuất ngôn ngữ.",
      "Nếu có giáo viên đồng hành, mỗi buổi nên kết thúc bằng 3 câu tự chấm: phát âm nào cần giữ, mẫu câu nào cần ôn, chủ đề tuần sau là gì.",
    ],
  },
  {
    slug: "lo-trinh-90-ngay-tu-tin-giao-tiep",
    title: "Lộ trình 90 ngày để tự tin giao tiếp",
    excerpt: "Chia nhỏ mục tiêu theo tuần để theo dõi tiến bộ rõ ràng.",
    date: "2026-04-01",
    readMinutes: 10,
    paragraphs: [
      "Ba tháng đủ để xây thói quen nếu bạn chia rõ từng tuần: tuần 1–2 củng cố phát âm và câu cốt lõi, tuần 3–6 mở rộng từ vựng theo 4–6 chủ đề đời sống, tuần 7–10 luyện hội thoại có tình huống, tuần 11–12 tổng ôn và nói tự do 3–5 phút.",
      "Mỗi tuần cần một chỉ số đo được: ví dụ số đoạn nghe đã nghe được 80% nội dung, số chủ đề đã nói được 2 phút không dừng, hoặc số từ mới đã dùng trong nói/viết.",
      "Đừng nhảy cóc giữa nhiều giáo trình. Chọn một đường chính, một đường phụ (Podcast hoặc video ngắn) là đủ.",
      "Cuối tuần 12, tự ghi âm một bài tự giới thiệu và một tình huống (đặt lịch, phàn nàn nhẹ, hỏi đường) — đây là bằng chứng tiến bộ rõ nhất.",
    ],
  },
  {
    slug: "on-thi-tcf-canada-diem-can-luu-y",
    title: "Ôn thi TCF Canada: điểm cần lưu ý",
    excerpt: "Tập trung vào các dạng bài và thời gian làm bài đặc thù.",
    date: "2026-04-08",
    readMinutes: 7,
    paragraphs: [
      "TCF Canada yêu cầu sự ổn định dưới áp lực thời gian, đặc biệt ở các phần trắc nghiệm và kỹ năng nói/viết có khung điểm riêng cho di trú.",
      "Bạn cần nắm rõ cấu trúc thời gian từng phần, tránh kẹt ở một câu khó ở phần đầu. Chiến lược \"đánh dấu và bỏ qua\" hợp lệ nếu bạn có kế hoạch quay lại.",
      "Phần nói và viết nên được chấm mẫu bởi người có kinh nghiệm TCF, vì rubric không hoàn toàn giống các kỳ thi quen thuộc khác.",
      "Miora khuyên: ôn theo block 3 tuần — tuần 1 kỹ năng đọc/nghe, tuần 2 nói/viết, tuần 3 full mock — để cơ thể quen nhịp thi thật.",
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return blogPosts.map((p) => p.slug);
}

export const navLeft = [
  { href: "#top", label: "Trang chủ" },
  { href: "#programs", label: "Lộ trình học" },
  { href: "#khai-giang", label: "Lịch khai giảng" },
];

export const navRight = [
  { href: "#teachers", label: "Về giáo viên" },
  { href: "/goc-hoc-vien", label: "Góc học viên" },
  { href: "#consult", label: "Liên hệ ngay" },
];
