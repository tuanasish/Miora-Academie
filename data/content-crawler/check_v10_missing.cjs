const v10 = require('./tcf_expression_orale_v10_2026-03-30.json');

const missing = [];
let totalR = 0, totalU = 0;

for (const month of v10.months) {
  for (const p of month.parties) {
    for (const s of (p.sujets || [])) {
      const ex = s.correction?.exemple || '';
      if (typeof ex === 'string' && ex.length > 50) {
        totalR++;
      } else {
        totalU++;
        missing.push({
          month: month.name,
          slug: month.slug,
          jour: p.jour || '?',
          partie: p.title || p.nom || '?',
          tache: s.tache,
          id: s.id,
          title: s.title || '',
          exemple_value: ex,
          url: `https://app.formation-tcfcanada.com/epreuve/expression-orale/sujets-actualites/${month.slug}`
        });
      }
    }
  }
}

console.log(`Total: ${totalR + totalU} | Resolved: ${totalR} | Missing: ${totalU}\n`);
console.log('='.repeat(80));
console.log('DANH SÁCH CÂU THIẾU ĐÁP ÁN (để kiểm tra thủ công trên web):');
console.log('='.repeat(80));

for (let i = 0; i < missing.length; i++) {
  const m = missing[i];
  console.log(`\n[${i+1}/${missing.length}] ${m.month} | Jour ${m.jour} | Tâche ${m.tache}`);
  console.log(`   ID: ${m.id}`);
  console.log(`   Đề bài: ${m.title}`);
  console.log(`   Giá trị hiện tại: "${m.exemple_value}"`);
  console.log(`   URL: ${m.url}`);
}
