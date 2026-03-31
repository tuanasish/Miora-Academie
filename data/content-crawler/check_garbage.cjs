const data = require('./tcf_expression_orale_v11_2026-03-30 (3).json');
let count = 0;
for (const month of data.months) {
  for (const partie of month.parties) {
    for (const sujet of (partie.sujets || [])) {
      const ex = sujet.correction?.exemple || '';
      if (ex.length > 50 && /[0-9a-f]{2}:T[0-9a-f]+,/i.test(ex)) {
        count++;
        if (count <= 5) {
          console.log(`\n${month.name} | P${partie.jour} | T${sujet.tache} | ID:${sujet.id}`);
          // Find the garbage pattern position
          const match = ex.match(/[0-9a-f]{1,4}:T[0-9a-f]+,/i);
          console.log(`  Length: ${ex.length}, Pattern "${match[0]}" at position ${match.index} (${Math.round(match.index/ex.length*100)}%)`);
          console.log(`  Before: "...${ex.substring(Math.max(0, match.index - 40), match.index)}"`);
          console.log(`  After:  "${ex.substring(match.index, match.index + 40)}..."`);
        }
      }
    }
  }
}
console.log(`\nTotal GARBAGE: ${count}`);
