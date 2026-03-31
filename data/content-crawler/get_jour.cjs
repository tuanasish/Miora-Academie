const fs = require('fs');
const v7 = require('./tcf_expression_orale_v7_2026-03-30.json');

const examples = [];
for (const month of v7.months) {
    if (month.name === 'Mai 2023' || month.name === 'Janvier 2026') {
        for (const p of month.parties) {
            for (const s of (p.sujets || [])) {
                const ex = s.correction?.exemple || '';
                if (ex.length <= 50 && examples.length < 5) {
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
}
fs.writeFileSync('missing_examples_jour.json', JSON.stringify(examples, null, 2));
