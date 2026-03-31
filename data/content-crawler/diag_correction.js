// 🔬 Diagnostic v2: Analyze a problematic page's RSC structure
// Run on the formation-tcfcanada.com website console
// Tests Mai 2023 (worst performing month: only 43% resolved)

(async function() {
  const url = '/epreuve/expression-orale/sujets-actualites/mai-2023';
  console.log('Fetching:', url);
  const resp = await fetch(url, { credentials: 'include' });
  const html = await resp.text();
  console.log('HTML size:', html.length);

  // Get ALL push blocks IN ORDER
  const pushPattern = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
  let match;
  const pushBlocks = [];

  while ((match = pushPattern.exec(html)) !== null) {
    try {
      const unescaped = JSON.parse('"' + match[1] + '"');
      pushBlocks.push({ unescaped, pos: match.index, rawLen: match[1].length });
    } catch (e) {}
  }

  console.log('Total push([1,"..."]) blocks:', pushBlocks.length);

  // Parse into chunks
  const chunks = {};
  const orphanTexts = [];

  pushBlocks.forEach((block, idx) => {
    const text = block.unescaped;
    const lines = text.split('\n').filter(l => l.trim());
    let hasId = false;

    for (const line of lines) {
      const ci = line.indexOf(':');
      if (ci > 0 && ci < 5 && /^[0-9a-f]+$/i.test(line.substring(0, ci))) {
        hasId = true;
        const id = line.substring(0, ci);
        const content = line.substring(ci + 1);
        chunks[id] = { content, pushIdx: idx, len: content.length };
      }
    }

    if (!hasId) {
      orphanTexts.push({ pushIdx: idx, text, len: text.length });
    }
  });

  console.log('\nChunks (with ID):', Object.keys(chunks).length);
  console.log('Orphan text blocks:', orphanTexts.length);

  // Show ALL chunks with their values
  console.log('\n=== ALL CHUNKS ===');
  const sortedIds = Object.keys(chunks).sort((a, b) => parseInt(a, 16) - parseInt(b, 16));
  for (const id of sortedIds) {
    const c = chunks[id];
    const preview = c.content.substring(0, 80).replace(/\n/g, '\\n');
    const isRef = /^T[0-9a-f]+,$/i.test(c.content);
    const isJson = c.content.startsWith('[') || c.content.startsWith('{') || c.content.startsWith('"');
    const type = isRef ? '📄T-ref' : isJson ? '📦JSON' : '📝text';
    console.log(`  ${id}: [${c.len}c] ${type} pushIdx=${c.pushIdx} | ${preview}`);
  }

  // Show orphan texts
  console.log('\n=== ORPHAN TEXT BLOCKS ===');
  orphanTexts.forEach((t, i) => {
    const preview = t.text.substring(0, 120).replace(/\n/g, '\\n');
    console.log(`  [${i}] pushIdx=${t.pushIdx} len=${t.len}c | ${preview}`);
  });

  // Check the T-ref → orphan text mapping
  console.log('\n=== T-REF → ORPHAN MAPPING ===');
  for (const id of sortedIds) {
    const c = chunks[id];
    if (/^T[0-9a-f]+,$/i.test(c.content)) {
      const tRefPushIdx = c.pushIdx;
      // Find orphan text right after this push
      const nextOrphan = orphanTexts.find(t => t.pushIdx === tRefPushIdx + 1);
      if (nextOrphan) {
        console.log(`  ✅ ${id} (pushIdx ${tRefPushIdx}) → orphan at pushIdx ${nextOrphan.pushIdx} (${nextOrphan.len}c)`);
      } else {
        // Check: is the next push also a chunk? Maybe text is concatenated
        const nextChunk = pushBlocks[tRefPushIdx + 1];
        if (nextChunk) {
          console.log(`  ❌ ${id} (pushIdx ${tRefPushIdx}) → next push [${tRefPushIdx+1}] is: ${nextChunk.unescaped.substring(0, 60)}`);
        } else {
          console.log(`  ❌ ${id} (pushIdx ${tRefPushIdx}) → no next push!`);
        }
      }
    }
  }

  // Check which $ref values (used in parties) map to which chunks
  console.log('\n=== PARTIES $REF RESOLUTION ===');
  for (const id of sortedIds) {
    const c = chunks[id];
    if (c.content.includes('"parties":[')) {
      // Find all $ref values used
      const refs = [...c.content.matchAll(/"\$([0-9a-f]+)"/g)].map(m => m[1]);
      const uniqueRefs = [...new Set(refs)].sort((a, b) => parseInt(a, 16) - parseInt(b, 16));
      console.log(`  Parties in chunk ${id} use ${uniqueRefs.length} $refs: ${uniqueRefs.join(', ')}`);
      
      for (const ref of uniqueRefs) {
        if (chunks[ref]) {
          const refContent = chunks[ref].content;
          const isResolved = refContent.length > 50 || /^T[0-9a-f]+,$/i.test(refContent);
          console.log(`    $${ref} → chunk exists [${refContent.length}c] ${isResolved ? '✅' : '⚠️'}: ${refContent.substring(0, 50)}`);
        } else {
          console.log(`    $${ref} → ❌ CHUNK NOT FOUND!`);
        }
      }
      break;
    }
  }
})();
