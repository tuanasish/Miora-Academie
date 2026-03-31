// 🔍 UNIVERSAL DIAGNOSTIC - Paste on ANY expression orale page
// Auto-detects missing chunks and explains WHY

(function() {
  const html = document.documentElement.outerHTML;
  
  // 1. Check push block formats  
  const f1 = (html.match(/self\.__next_f\.push\(\[1,"/g) || []).length;
  const f2 = (html.match(/self\.__next_f\.push\(\[1, "/g) || []).length;
  console.log('=== PUSH FORMATS ===');
  console.log('  [1,"  :', f1, 'blocks');
  console.log('  [1, " :', f2, 'blocks (crawler MISSES these!)');
  
  // 2. Find all "exemple":"$XX" refs
  const refRegex = /"exemple":"\$([0-9a-f]+)"/gi;
  let m;
  const allRefs = [];
  while ((m = refRegex.exec(html)) !== null) {
    allRefs.push(m[1]);
  }
  console.log('\n=== ALL $-REFS IN CORRECTIONS ===');
  console.log('  Total refs:', allRefs.length);
  
  // 3. For each ref, check if chunk exists in HTML as a proper line start
  const missing = [];
  for (const ref of allRefs) {
    // Search for "<ref>:" followed by chunk content type
    const chunkPattern = new RegExp('(?:^|\\\\n|")' + ref + ':[T\\[\\{"I]', 'm');
    if (!chunkPattern.test(html)) {
      // Not found as line start - check if glued
      const gluedPattern = new RegExp('[^\\n"\\\\]' + ref + ':[T\\[\\{"I]');
      const isGlued = gluedPattern.test(html);
      
      if (!missing.find(x => x.id === ref)) {
        missing.push({ id: ref, glued: isGlued });
      }
    }
  }
  
  console.log('\n=== MISSING CHUNKS ===');
  if (missing.length === 0) {
    console.log('  ✅ All chunks found!');
  } else {
    for (const m of missing) {
      // Find context
      const idx = html.indexOf(m.id + ':');
      let context = 'NOT IN HTML';
      if (idx > -1) {
        const raw = html.substring(Math.max(0, idx - 30), idx + 60);
        context = raw.replace(/\n/g, '\\n');
      }
      console.log(`  ❌ $${m.id} | glued=${m.glued} | ${context}`);
    }
  }
  
  console.log('\n=== DONE ===');
})();
