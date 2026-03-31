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

// Create output folder
const outDir = path.join(__dirname, '..', 'tcf_final');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const comprehensionFile = process.env.TCF_FULL_FILE || pickLatestFile('tcf_canada_full_', 'tcf_canada_full_2026-03-30.json');
const expressionFile =
  process.env.TCF_EXPRESSION_FULL_FILE ||
  pickLatestFile(
    ['tcf_expression_ecrite_full_clean_', 'tcf_expression_ecrite_full_', 'tcf_expression_full_'],
    'tcf_expression_ecrite_full_clean_2026-03-30.json'
  );
const oraleFile =
  process.env.TCF_ORALE_FILE ||
  pickLatestFile(['tcf_expression_orale_v', 'tcf_expression_orale_'], 'tcf_expression_orale_v11_FINAL.json');

console.log('Using comprehension file:', comprehensionFile);
console.log('Using expression file:', expressionFile);
console.log('Using orale file:', oraleFile);

// 1. Compréhension Écrite - from tcf_canada_full
const full = JSON.parse(fs.readFileSync(path.join(__dirname, comprehensionFile), 'utf8'));
const ce = {
  crawledAt: full.crawledAt,
  type: 'comprehension_ecrite',
  source: full.source,
  data: full.categories.comprehension_ecrite
};
fs.writeFileSync(path.join(outDir, 'comprehension_ecrite.json'), JSON.stringify(ce, null, 2), 'utf8');
console.log('✅ comprehension_ecrite.json -', JSON.stringify(ce, null, 2).length, 'bytes');

// 2. Compréhension Orale - from tcf_canada_full
const co = {
  crawledAt: full.crawledAt,
  type: 'comprehension_orale',
  source: full.source,
  data: full.categories.comprehension_orale
};
fs.writeFileSync(path.join(outDir, 'comprehension_orale.json'), JSON.stringify(co, null, 2), 'utf8');
console.log('✅ comprehension_orale.json -', JSON.stringify(co, null, 2).length, 'bytes');

// 3. Expression Écrite - from tcf_expression_full
const exprFull = JSON.parse(fs.readFileSync(path.join(__dirname, expressionFile), 'utf8'));
const ee = {
  crawledAt: exprFull.crawledAt,
  type: 'expression_ecrite',
  source: exprFull.source,
  data: exprFull.categories.expression_ecrite
};
fs.writeFileSync(path.join(outDir, 'expression_ecrite.json'), JSON.stringify(ee, null, 2), 'utf8');
console.log('✅ expression_ecrite.json -', JSON.stringify(ee, null, 2).length, 'bytes');

// 4. Expression Orale - already a standalone file
const eo = JSON.parse(fs.readFileSync(path.join(__dirname, oraleFile), 'utf8'));
fs.writeFileSync(path.join(outDir, 'expression_orale.json'), JSON.stringify(eo, null, 2), 'utf8');
console.log('✅ expression_orale.json -', JSON.stringify(eo, null, 2).length, 'bytes');

console.log('\n📁 All files saved to:', outDir);
