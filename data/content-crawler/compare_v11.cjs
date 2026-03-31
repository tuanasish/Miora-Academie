const v11old = require('./tcf_expression_orale_v11_2026-03-30 (1).json');
const v11new = require('./tcf_expression_orale_v11_2026-03-30 (2).json');

// Compare: find items that HAD corrections in old but LOST in new
let lost = 0;
for (const month of v11old.months) {
  const newMonth = v11new.months.find(m => m.slug === month.slug);
  if (!newMonth) continue;
  
  for (const partie of month.parties) {
    const newPartie = newMonth.parties.find(p => p.jour === partie.jour && p.title === partie.title);
    if (!newPartie) continue;
    
    for (const sujet of (partie.sujets || [])) {
      const newSujet = (newPartie.sujets || []).find(s => s.id === sujet.id);
      if (!newSujet) continue;
      
      const oldEx = sujet.correction?.exemple || '';
      const newEx = newSujet.correction?.exemple || '';
      
      const oldOK = oldEx.length > 50 && !oldEx.startsWith('$');
      const newOK = newEx.length > 50 && !newEx.startsWith('$');
      
      if (oldOK && !newOK) {
        lost++;
        console.log(`\n❌ LOST: ${month.name} | Partie ${partie.jour} | T${sujet.tache} | ID:${sujet.id}`);
        console.log(`   OLD (${oldEx.length} chars): "${oldEx.substring(0, 80)}..."`);
        console.log(`   OLD END: "...${oldEx.substring(oldEx.length - 60)}"`);
        console.log(`   NEW (${newEx.length} chars): "${newEx.substring(0, 80)}"`);
      }
    }
  }
}

console.log(`\nTotal lost: ${lost}`);
