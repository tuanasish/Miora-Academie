const data = require('./tcf_expression_orale_v11_2026-03-30 (4).json');
let count = 0;
for (const month of data.months) {
  for (const partie of month.parties) {
    for (const sujet of (partie.sujets || [])) {
      const ex = sujet.correction?.exemple || '';
      if (ex.length > 50 && (ex.includes('$L') || ex.includes('className') || ex.includes('"div"') || ex.includes('I["$"'))) {
        count++;
        console.log(`\n#${count}: ${month.name} | P${partie.jour} | T${sujet.tache} | ID:${sujet.id}`);
        console.log(`  Length: ${ex.length}`);
        // Find the problematic pattern
        for (const pat of ['$L', 'className', '"div"', 'I["$"']) {
          const idx = ex.indexOf(pat);
          if (idx !== -1) {
            console.log(`  Pattern "${pat}" at pos ${idx}/${ex.length} (${Math.round(idx/ex.length*100)}%)`);
            console.log(`  Context: "...${ex.substring(Math.max(0, idx-30), idx)}<<<${pat}>>>${ex.substring(idx+pat.length, idx+pat.length+30)}..."`);
          }
        }
      }
    }
  }
}
console.log(`\nTotal: ${count}`);
