const fs = require('fs');
const path = require('path');

const finalDir = path.join(__dirname, '..', 'tcf_final');

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(finalDir, name), 'utf8'));
}

function isEmpty(value) {
  return value == null || (typeof value === 'string' && value.trim() === '');
}

function get(obj, keyPath) {
  return keyPath.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function formatList(items) {
  if (!items || items.length === 0) return 'không có';
  return items.join(', ');
}

function countBy(items, predicate) {
  let count = 0;
  for (const item of items) {
    if (predicate(item)) count += 1;
  }
  return count;
}

const ce = readJson('comprehension_ecrite.json');
const co = readJson('comprehension_orale.json');
const ee = readJson('expression_ecrite.json');
const eo = readJson('expression_orale.json');

const ceTests = ce.data.tests || [];
const ceQuestions = ceTests.flatMap((test) => test.questions || []);
const ceSummary = {
  tests: ceTests.length,
  questions: ceQuestions.length,
  imageAll: countBy(ceQuestions, (q) => !isEmpty(q.imageUrl)),
  options4: countBy(ceQuestions, (q) => Array.isArray(q.options) && q.options.length === 4),
  optionsNonEmpty: countBy(
    ceQuestions,
    (q) => Array.isArray(q.options) && q.options.length === 4 && q.options.every((opt) => typeof opt === 'string' && opt.trim() !== '')
  ),
  correctValid: countBy(
    ceQuestions,
    (q) => Number.isInteger(q.correctAnswerIndex) && q.correctAnswerIndex >= 0 && q.correctAnswerIndex < 4
  ),
  promptNull: countBy(ceQuestions, (q) => q.prompt == null),
  promptEmpty: countBy(ceQuestions, (q) => typeof q.prompt === 'string' && q.prompt.trim() === ''),
  placeholderSeriesDescription: countBy(ceTests, (test) => test.series?.description === 'AAZZAAZZ'),
  explanationPlaceholder: countBy(ceQuestions, (q) => q.explanation === '$20'),
};

const coTests = co.data.tests || [];
const coQuestions = coTests.flatMap((test) => test.questions || []);
const coSummary = {
  tests: coTests.length,
  questions: coQuestions.length,
  audioAll: countBy(coQuestions, (q) => !isEmpty(q.audioUrl)),
  imageCount: countBy(coQuestions, (q) => !isEmpty(q.imageUrl)),
  options4: countBy(coQuestions, (q) => Array.isArray(q.options) && q.options.length === 4),
  emptyOptionSets: countBy(
    coQuestions,
    (q) => Array.isArray(q.options) && q.options.length === 4 && q.options.every((opt) => typeof opt === 'string' && opt.trim() === '')
  ),
  correctValid: countBy(
    coQuestions,
    (q) => Number.isInteger(q.correctAnswerIndex) && q.correctAnswerIndex >= 0 && q.correctAnswerIndex < 4
  ),
  promptNull: countBy(coQuestions, (q) => q.prompt == null),
  placeholderSeriesDescription: countBy(coTests, (test) => test.series?.description === 'AAZZAAZZ'),
};

const eeItems = ee.data.items || [];
const eeRequiredFields = [
  'tache1Sujet',
  'tache1Correction',
  'tache2Sujet',
  'tache2Correction',
  'tache3Titre',
  'tache3Correction',
  'tache3Document1.contenu',
  'tache3Document2.contenu',
];
const eeSummary = {
  items: eeItems.length,
  complete: countBy(eeItems, (item) => eeRequiredFields.every((field) => !isEmpty(get(item, field)))),
  missingAnyRequired: countBy(eeItems, (item) => eeRequiredFields.some((field) => isEmpty(get(item, field)))),
  missingAnyCorrection: countBy(
    eeItems,
    (item) => isEmpty(item.tache1Correction) || isEmpty(item.tache2Correction) || isEmpty(item.tache3Correction)
  ),
  sameOpinion: countBy(
    eeItems,
    (item) => item.tache3Document1?.opinion && item.tache3Document1?.opinion === item.tache3Document2?.opinion
  ),
  emptyDoc: countBy(
    eeItems,
    (item) => isEmpty(item.tache3Document1?.contenu) || isEmpty(item.tache3Document2?.contenu)
  ),
  artifactCount: 0,
  titleMismatch: countBy(eeItems, (item) => {
    const match = typeof item.titre === 'string' && item.titre.match(/^Combinaison\s+(\d+)$/i);
    return Boolean(match && Number(match[1]) !== item.orderIndex);
  }),
};

const eeArtifactPattern = /[0-9a-f]{1,8}:T[0-9a-f]{1,8},/i;
for (const item of eeItems) {
  const walk = (value) => {
    if (typeof value === 'string') {
      if (eeArtifactPattern.test(value)) eeSummary.artifactCount += 1;
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === 'object') {
      Object.values(value).forEach(walk);
    }
  };
  walk(item);
}

const eoMonths = eo.months || [];
let eoParties = 0;
let eoSujets = 0;
const eoTaskCounts = {};
let eoDescriptionNull = 0;
let eoQuestionNull = 0;
let eoUndefinedCorrection = 0;
const eoMonthsMissingTask2 = [];
const eoMonthsMissingTask3 = [];
const eoSlugIssues = [];

for (const month of eoMonths) {
  eoParties += (month.parties || []).length;
  const tasks = new Set();

  if (typeof month.slug === 'string' && (month.slug.includes('httpsstaging') || month.slug === 'fvrier-2026')) {
    eoSlugIssues.push(`${month.name} -> ${month.slug}`);
  }

  for (const partie of month.parties || []) {
    for (const sujet of partie.sujets || []) {
      eoSujets += 1;
      eoTaskCounts[sujet.tache] = (eoTaskCounts[sujet.tache] || 0) + 1;
      tasks.add(sujet.tache);

      if (sujet.description == null) eoDescriptionNull += 1;
      if (sujet.question == null) eoQuestionNull += 1;
      if (sujet.correction === '$undefined') eoUndefinedCorrection += 1;
    }
  }

  if (!tasks.has(2)) eoMonthsMissingTask2.push(month.name);
  if (!tasks.has(3)) eoMonthsMissingTask3.push(month.name);
}

const eoSummary = {
  months: eoMonths.length,
  parties: eoParties,
  sujets: eoSujets,
  taskCounts: eoTaskCounts,
  descriptionNull: eoDescriptionNull,
  questionNull: eoQuestionNull,
  undefinedCorrection: eoUndefinedCorrection,
  monthsMissingTask2: eoMonthsMissingTask2,
  monthsMissingTask3: eoMonthsMissingTask3,
  slugIssues: eoSlugIssues,
};

const report = `# TCF Final Build Notes

Generated at: ${new Date().toISOString()}

## Overall

- Folder này đủ để bắt đầu build website.
- Data chưa sạch tuyệt đối 100%, nên frontend/backend nên có fallback ở vài chỗ.
- File nào sạch hơn: \`comprehension_ecrite\`, \`comprehension_orale\`, \`expression_orale\`.
- File cần lưu ý nhất: \`expression_ecrite\`.

## comprehension_ecrite.json

- Trạng thái: dùng ổn cho website.
- Tổng: ${ceSummary.tests} tests, ${ceSummary.questions} questions.
- Ảnh câu hỏi: ${ceSummary.imageAll}/${ceSummary.questions}.
- Bộ đáp án 4 lựa chọn: ${ceSummary.options4}/${ceSummary.questions}.
- 4 đáp án đều có text: ${ceSummary.optionsNonEmpty}/${ceSummary.questions}.
- \`correctAnswerIndex\` hợp lệ: ${ceSummary.correctValid}/${ceSummary.questions}.
- Placeholder series description \`AAZZAAZZ\`: ${ceSummary.placeholderSeriesDescription}/${ceSummary.tests}.
- Placeholder explanation \`$20\`: ${ceSummary.explanationPlaceholder}.
- Lưu ý khi build:
  - Không nên dùng \`series.description\` để hiển thị nội dung thật.
  - \`prompt\` hầu như không có giá trị sử dụng riêng: null ${ceSummary.promptNull}, empty ${ceSummary.promptEmpty}.

## comprehension_orale.json

- Trạng thái: dùng ổn nếu UI hỗ trợ mode chọn \`A/B/C/D\`.
- Tổng: ${coSummary.tests} tests, ${coSummary.questions} questions.
- Audio: ${coSummary.audioAll}/${coSummary.questions}.
- Có ảnh: ${coSummary.imageCount}/${coSummary.questions}.
- Bộ đáp án 4 lựa chọn: ${coSummary.options4}/${coSummary.questions}.
- Bộ đáp án rỗng hoàn toàn: ${coSummary.emptyOptionSets}/${coSummary.questions}.
- \`correctAnswerIndex\` hợp lệ: ${coSummary.correctValid}/${coSummary.questions}.
- Placeholder series description \`AAZZAAZZ\`: ${coSummary.placeholderSeriesDescription}/${coSummary.tests}.
- \`prompt = null\`: ${coSummary.promptNull}.
- Lưu ý khi build:
  - Với ${coSummary.emptyOptionSets} câu, nên cho user bấm \`A/B/C/D\` thay vì cố hiển thị text đáp án.
  - Không nên giả định mọi câu đều có ảnh.

## expression_ecrite.json

- Trạng thái: đây là bản clean tốt nhất hiện có và có thể dùng để build, nhưng vẫn còn lỗi dữ liệu gốc.
- Tổng: ${eeSummary.items} items.
- Item đầy đủ các field chính: ${eeSummary.complete}/${eeSummary.items}.
- Item thiếu ít nhất 1 field chính: ${eeSummary.missingAnyRequired}/${eeSummary.items}.
- Item thiếu ít nhất 1 correction: ${eeSummary.missingAnyCorrection}/${eeSummary.items}.
- Item có 2 document cùng opinion: ${eeSummary.sameOpinion}/${eeSummary.items}.
- Item có doc task 3 rỗng: ${eeSummary.emptyDoc}/${eeSummary.items}.
- Parser artifact còn sót: ${eeSummary.artifactCount}.
- \`titre\` lệch \`orderIndex\`: ${eeSummary.titleMismatch}.
- Lưu ý khi build:
  - Phải có fallback \`chưa có correction\` cho item thiếu correction.
  - Với item doc rỗng, nên ẩn task 3 hoặc đánh dấu \`dữ liệu chưa hoàn chỉnh\`.
  - Không nên tin tuyệt đối field \`opinion\`; nếu app có logic màu xanh/đỏ theo \`pour/contre\`, nên cho phép override sau.

## expression_orale.json

- Trạng thái: dùng được cho source hiện tại.
- Tổng: ${eoSummary.months} months, ${eoSummary.parties} parties, ${eoSummary.sujets} sujets.
- Task counts: ${Object.entries(eoSummary.taskCounts).map(([task, count]) => `task ${task} = ${count}`).join(', ')}.
- \`description = null\`: ${eoSummary.descriptionNull}/${eoSummary.sujets}.
- \`question = null\`: ${eoSummary.questionNull}/${eoSummary.sujets}.
- \`correction = $undefined\`: ${eoSummary.undefinedCorrection}.
- Tháng thiếu task 2: ${formatList(eoSummary.monthsMissingTask2)}.
- Tháng thiếu task 3: ${formatList(eoSummary.monthsMissingTask3)}.
- Slug cần lưu ý: ${formatList(eoSummary.slugIssues)}.
- Lưu ý khi build:
  - Source hiện tại chỉ cung cấp task 2/3, không nên build UI theo giả định luôn có task 1.
  - Nên render prompt chính từ \`title\`, không phụ thuộc \`description\` hoặc \`question\`.
  - Với 4 sujet correction undefined, nên hiển thị \`chưa có bài mẫu\`.

## Web Checklist

- expression_ecrite: thêm fallback khi correction thiếu hoặc doc rỗng.
- comprehension_orale: hỗ trợ mode \`A/B/C/D\` không cần text option.
- expression_orale: build theo \`title + correction.exemple\`, không chờ \`task 1\`.
- Nếu làm trang admin/review, nên đọc thêm file issue report ở \`content-crawler/expression_ecrite_issues_2026-03-30.json\`.
`;

const outPath = path.join(finalDir, 'DATA_QUALITY_BUILD_NOTES.md');
fs.writeFileSync(outPath, report, 'utf8');
console.log(`Saved report to ${outPath}`);
