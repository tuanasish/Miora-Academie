const fs = require('fs');
const data = require('./tcf_expression_orale_v11_2026-03-30 (4).json');

let fixed = 0;
for (const month of data.months) {
  for (const partie of month.parties) {
    for (const sujet of (partie.sujets || [])) {
      const ex = sujet.correction?.exemple || '';
      // Cut at "1a:["$" pattern (React DOM artifact at end)
      const reactIdx = ex.indexOf('1a:["$"');
      if (reactIdx !== -1 && reactIdx > ex.length * 0.8) {
        const cleaned = ex.substring(0, reactIdx).trim();
        console.log(`Fixed ID:${sujet.id} | ${month.name} | Cut ${ex.length - reactIdx} chars of React DOM`);
        console.log(`  Before end: "...${ex.substring(reactIdx - 30, reactIdx + 20)}"`);
        console.log(`  After end:  "...${cleaned.substring(cleaned.length - 40)}"`);
        sujet.correction.exemple = cleaned;
        fixed++;
      }
    }
  }
}

console.log(`\nFixed ${fixed} items. Saving...`);
const jsonStr = JSON.stringify(data, null, 2);
fs.writeFileSync('tcf_expression_orale_v11_FINAL.json', jsonStr, 'utf8');
console.log(`Saved to tcf_expression_orale_v11_FINAL.json (${(jsonStr.length/1024/1024).toFixed(2)} MB)`);
