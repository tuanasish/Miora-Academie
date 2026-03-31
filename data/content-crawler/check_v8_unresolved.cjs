const fs = require('fs');
const v8 = require('./tcf_expression_orale_v7_2026-03-30 (2).json');

const examples = [];
let totalResolved = 0;
let totalUnresolved = 0;

for (const month of v8.months) {
    let resolved = 0;
    let unresolved = 0;
    for (const p of month.parties) {
        for (const s of (p.sujets || [])) {
            const ex = s.correction?.exemple || '';
            if (ex.length > 50) {
                resolved++;
                totalResolved++;
            } else {
                unresolved++;
                totalUnresolved++;
                if (examples.length < 20) {
                    examples.push({
                         month: month.name,
                         jour: p.jour || 'Không rõ',
                         tache: s.tache,
                         title: s.title
                    });
                }
            }
        }
    }
    if (unresolved > 0) {
        console.log(`${month.name}: ${resolved} resolved, ${unresolved} unresolved`);
    }
}
console.log(`\nTotal resolved: ${totalResolved}, Total unresolved: ${totalUnresolved}`);
console.log('\nSample unresolved (first 20):');
console.dir(examples, { depth: null });
