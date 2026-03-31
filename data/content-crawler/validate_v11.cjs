const data = require('./tcf_expression_orale_v11_FINAL.json');

let totalSujets = 0, totalCorrections = 0, totalEmpty = 0;
let shortCorrections = 0, garbageCorrections = 0;
const issues = [];

for (const month of data.months) {
  for (const partie of month.parties) {
    const tachesFound = new Set();
    
    for (const sujet of (partie.sujets || [])) {
      totalSujets++;
      tachesFound.add(sujet.tache);
      
      const ex = sujet.correction?.exemple || '';
      
      // Check 1: Has correction?
      if (!ex || ex.length < 10) {
        if (ex.startsWith('$')) {
          totalEmpty++;
          // Already known - skip
        } else if (ex === '' || ex === null) {
          totalEmpty++;
        }
        continue;
      }
      
      totalCorrections++;
      
      // Check 2: Garbage detection - correction contains chunk IDs or RSC artifacts
      if (ex.includes(':T') && /[0-9a-f]{2}:T[0-9a-f]+,/i.test(ex)) {
        garbageCorrections++;
        issues.push({
          type: 'GARBAGE',
          month: month.name,
          partie: partie.jour || partie.title,
          tache: sujet.tache,
          id: sujet.id,
          preview: ex.substring(0, 100),
          endPreview: ex.substring(ex.length - 80)
        });
      }
      
      // Check 3: Contains React/JSON artifacts
      if (ex.includes('$L') || ex.includes('className') || ex.includes('"div"') || ex.includes('I["$"')) {
        garbageCorrections++;
        issues.push({
          type: 'REACT_ARTIFACT',
          month: month.name,
          partie: partie.jour || partie.title,
          tache: sujet.tache,
          id: sujet.id,
          preview: ex.substring(0, 100)
        });
      }
      
      // Check 4: Too short (< 50 chars likely garbage)
      if (ex.length < 50) {
        shortCorrections++;
        issues.push({
          type: 'SHORT',
          month: month.name,
          partie: partie.jour || partie.title,
          tache: sujet.tache,
          id: sujet.id,
          length: ex.length,
          preview: ex
        });
      }
    }
    
    // Check 5: Partie tâche distribution
    const tacheCount = tachesFound.size;
    if (tacheCount < 2) {
      issues.push({
        type: 'FEW_TACHES',
        month: month.name,
        partie: partie.jour || partie.title,
        taches: [...tachesFound].sort().join(','),
        sujetCount: (partie.sujets || []).length
      });
    }
  }
}

console.log('═'.repeat(60));
console.log('📊 DATA QUALITY REPORT - V11');
console.log('═'.repeat(60));
console.log(`Total Sujets: ${totalSujets}`);
console.log(`Corrections OK: ${totalCorrections}`);
console.log(`Empty/Missing: ${totalEmpty}`);
console.log(`Short (<50 chars): ${shortCorrections}`);
console.log(`Garbage (RSC artifacts): ${garbageCorrections}`);
console.log(`Quality Rate: ${Math.round((totalCorrections - garbageCorrections) / totalSujets * 100)}%`);

if (issues.length > 0) {
  console.log(`\n⚠️  ISSUES FOUND: ${issues.length}`);
  
  const byType = {};
  for (const issue of issues) {
    byType[issue.type] = (byType[issue.type] || 0) + 1;
  }
  console.log('By type:', JSON.stringify(byType));
  
  // Show first 10 issues
  console.log('\nFirst 15 issues:');
  for (const issue of issues.slice(0, 15)) {
    if (issue.type === 'GARBAGE' || issue.type === 'REACT_ARTIFACT') {
      console.log(`  ❌ [${issue.type}] ${issue.month} | Partie ${issue.partie} | T${issue.tache} | ID:${issue.id}`);
      console.log(`     Start: "${issue.preview}"`);
      if (issue.endPreview) console.log(`     End:   "${issue.endPreview}"`);
    } else if (issue.type === 'SHORT') {
      console.log(`  ⚠️ [SHORT] ${issue.month} | Partie ${issue.partie} | T${issue.tache} | ${issue.length}chars: "${issue.preview}"`);
    } else if (issue.type === 'FEW_TACHES') {
      console.log(`  ℹ️ [FEW_TACHES] ${issue.month} | Partie ${issue.partie} | taches=[${issue.taches}] | ${issue.sujetCount} sujets`);
    }
  }
} else {
  console.log('\n✅ No quality issues found!');
}

// Check tâche distribution across all parties
const tacheDist = {};
for (const month of data.months) {
  for (const partie of month.parties) {
    const taches = new Set((partie.sujets || []).map(s => s.tache));
    const key = [...taches].sort().join(',');
    tacheDist[key] = (tacheDist[key] || 0) + 1;
  }
}
console.log('\n📊 Tâche distribution across parties:');
for (const [taches, count] of Object.entries(tacheDist).sort((a, b) => b[1] - a[1])) {
  console.log(`  Tâches [${taches}]: ${count} parties`);
}
