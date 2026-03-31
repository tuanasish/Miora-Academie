const fs = require('fs');
const path = require('path');

function pickLatestFile(prefixes, fallbackName) {
  const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes];
  const files = fs.readdirSync(__dirname)
    .filter((file) => file.endsWith('.json') && prefixList.some((prefix) => file.startsWith(prefix)))
    .map((file) => ({
      file,
      mtimeMs: fs.statSync(path.join(__dirname, file)).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (files.length > 0) return files[0].file;
  if (fallbackName && fs.existsSync(path.join(__dirname, fallbackName))) return fallbackName;

  throw new Error(`No JSON file found for prefixes: ${prefixList.join(', ')}`);
}

function isEmpty(value) {
  return value == null || (typeof value === 'string' && value.trim() === '');
}

function get(obj, keyPath) {
  return keyPath.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function toCsvValue(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const inputFile =
  process.argv[2] ||
  process.env.TCF_EE_CLEAN_FILE ||
  pickLatestFile(
    ['tcf_expression_ecrite_full_clean_', 'tcf_expression_ecrite_full_', 'tcf_expression_full_'],
    'tcf_expression_ecrite_full_clean_2026-03-30.json'
  );

const inputPath = path.isAbsolute(inputFile) ? inputFile : path.join(__dirname, inputFile);
const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const items = raw.categories?.expression_ecrite?.items;

if (!Array.isArray(items)) {
  throw new Error('Input file does not contain categories.expression_ecrite.items');
}

const requiredFields = [
  'tache1Sujet',
  'tache1Correction',
  'tache2Sujet',
  'tache2Correction',
  'tache3Titre',
  'tache3Correction',
  'tache3Document1.contenu',
  'tache3Document2.contenu',
];

const itemReports = items.map((item) => {
  const missingRequiredFields = requiredFields.filter((field) => isEmpty(get(item, field)));
  const missingCorrectionFields = ['tache1Correction', 'tache2Correction', 'tache3Correction']
    .filter((field) => isEmpty(item[field]));

  const opinion1 = item.tache3Document1?.opinion ?? null;
  const opinion2 = item.tache3Document2?.opinion ?? null;
  const sameOpinion = Boolean(opinion1 && opinion2 && opinion1 === opinion2);

  const emptyDocFields = [
    isEmpty(item.tache3Document1?.contenu) ? 'tache3Document1.contenu' : null,
    isEmpty(item.tache3Document2?.contenu) ? 'tache3Document2.contenu' : null,
  ].filter(Boolean);

  return {
    id: item.id,
    monthId: item.monthId ?? null,
    monthName: item.monthName ?? null,
    monthYear: item.monthYear ?? null,
    orderIndex: item.orderIndex ?? null,
    titre: item.titre ?? null,
    missingCorrection: missingCorrectionFields.length > 0,
    missingCorrectionFields,
    sameOpinion,
    opinion1,
    opinion2,
    emptyDoc: emptyDocFields.length > 0,
    emptyDocFields,
    missingRequiredField: missingRequiredFields.length > 0,
    missingRequiredFields,
  };
});

const report = {
  generatedAt: new Date().toISOString(),
  sourceFile: path.basename(inputPath),
  totalItems: items.length,
  counts: {
    missingCorrection: itemReports.filter((item) => item.missingCorrection).length,
    sameOpinion: itemReports.filter((item) => item.sameOpinion).length,
    emptyDoc: itemReports.filter((item) => item.emptyDoc).length,
    missingRequiredField: itemReports.filter((item) => item.missingRequiredField).length,
    anyIssue: itemReports.filter((item) =>
      item.missingCorrection || item.sameOpinion || item.emptyDoc || item.missingRequiredField
    ).length,
  },
  issues: {
    missingCorrection: itemReports.filter((item) => item.missingCorrection),
    sameOpinion: itemReports.filter((item) => item.sameOpinion),
    emptyDoc: itemReports.filter((item) => item.emptyDoc),
    missingRequiredField: itemReports.filter((item) => item.missingRequiredField),
  },
  items: itemReports.filter((item) =>
    item.missingCorrection || item.sameOpinion || item.emptyDoc || item.missingRequiredField
  ),
};

const dateMatch = path.basename(inputPath).match(/(\d{4}-\d{2}-\d{2})/);
const datePart = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);
const jsonName = `expression_ecrite_issues_${datePart}.json`;
const csvName = `expression_ecrite_issues_${datePart}.csv`;
const jsonPath = path.join(__dirname, jsonName);
const csvPath = path.join(__dirname, csvName);

fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

const csvHeaders = [
  'id',
  'monthName',
  'monthYear',
  'orderIndex',
  'titre',
  'missingCorrection',
  'missingCorrectionFields',
  'sameOpinion',
  'opinion1',
  'opinion2',
  'emptyDoc',
  'emptyDocFields',
  'missingRequiredField',
  'missingRequiredFields',
];

const csvRows = [
  csvHeaders.join(','),
  ...report.items.map((item) => [
    item.id,
    item.monthName,
    item.monthYear,
    item.orderIndex,
    item.titre,
    item.missingCorrection,
    item.missingCorrectionFields.join('|'),
    item.sameOpinion,
    item.opinion1,
    item.opinion2,
    item.emptyDoc,
    item.emptyDocFields.join('|'),
    item.missingRequiredField,
    item.missingRequiredFields.join('|'),
  ].map(toCsvValue).join(',')),
];

fs.writeFileSync(csvPath, csvRows.join('\n'), 'utf8');

console.log(`Input: ${path.basename(inputPath)}`);
console.log(`JSON report: ${jsonName}`);
console.log(`CSV report: ${csvName}`);
console.log(`Total items: ${report.totalItems}`);
console.log(`Items with any issue: ${report.counts.anyIssue}`);
console.log(`Missing correction: ${report.counts.missingCorrection}`);
console.log(`Same opinion: ${report.counts.sameOpinion}`);
console.log(`Empty doc: ${report.counts.emptyDoc}`);
console.log(`Missing required field: ${report.counts.missingRequiredField}`);
