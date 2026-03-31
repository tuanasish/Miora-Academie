const v9 = require('./tcf_expression_orale_v9_2026-03-30.json');

let totalResolved = 0;
let totalUnresolved = 0;
const missing = [];

for (const month of v9.months) {
  let resolved = 0, unresolved = 0;
  for (const p of month.parties) {
    for (const s of (p.sujets || [])) {
      const ex = s.correction?.exemple || '';
      if (typeof ex === 'string' && ex.length > 50) {
        resolved++;
        totalResolved++;
        // Check for garbage T-ref prefix
        if (/^T[0-9a-f]+,/i.test(ex)) {
          console.log(`⚠️ GARBAGE PREFIX: ${month.name} jour=${p.jour} tache=${s.tache} -> "${ex.substring(0, 80)}..."`);
        }
      } else {
        unresolved++;
        totalUnresolved++;
        missing.push({ month: month.name, jour: p.jour, tache: s.tache, title: (s.title || '').substring(0, 80), exemple: ex });
      }
    }
  }
  if (unresolved > 0) {
    console.log(`❌ ${month.name}: ${resolved}✅ ${unresolved}❌`);
  }
}

const total = totalResolved + totalUnresolved;
const pct = total > 0 ? ((totalResolved / total) * 100).toFixed(1) : 0;
console.log(`\n${'═'.repeat(50)}`);
console.log(`📊 V9 RESULTS: ${totalResolved}✅ / ${total} (${pct}%)`);
console.log(`   Missing: ${totalUnresolved}`);
console.log(`${'═'.repeat(50)}`);

if (missing.length > 0) {
  console.log('\nMissing details:');
  for (const m of missing) {
    console.log(`  - ${m.month} | jour ${m.jour} | tache ${m.tache} | exemple="${m.exemple}" | "${m.title}"`);
  }
}
