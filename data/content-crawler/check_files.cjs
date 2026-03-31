const fs = require('fs');
const files = [
  'tcf_canada_full_2026-03-30.json',
  'tcf_canada_2026-03-30.json', 
  'comprehension_orale.json',
  'tcf_expression_orale_v11_FINAL.json',
  'tcf_expression_full_2026-03-30 (1).json',
  'tcf_expression_2026-03-30.json'
];
for (const f of files) {
  if (!fs.existsSync(f)) { console.log(`❌ ${f} — NOT FOUND`); continue; }
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  const keys = Object.keys(d);
  console.log(`\n📄 ${f}`);
  console.log(`  Top keys: ${keys.join(', ')}`);
  if (d.categories) {
    const catKeys = typeof d.categories === 'object' && !Array.isArray(d.categories) 
      ? Object.keys(d.categories) : 'array';
    console.log(`  Categories: ${catKeys}`);
  }
  if (d.months) console.log(`  Months: ${d.months.length}`);
  if (d.tests) console.log(`  Tests: ${d.tests.length}`);
  if (d.combinaisons) console.log(`  Combinaisons: ${d.combinaisons.length}`);
}
