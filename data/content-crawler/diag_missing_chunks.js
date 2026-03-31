// 🔍 DIAGNOSTIC: Paste into browser console on a page with missing corrections
// This will find WHY specific chunk IDs are missing from the parser output

(function() {
  const html = document.documentElement.outerHTML;
  
  // Collect ALL push blocks (try multiple formats)
  const allPushBlocks = [];
  
  // Format 1: [1,"..."]
  const r1 = /self\.__next_f\.push\(\[(\d+),\s*"((?:[^"\\]|\\.)*)"\]\)/gs;
  let m;
  while ((m = r1.exec(html)) !== null) {
    allPushBlocks.push({ type: parseInt(m[1]), raw: m[2] });
  }
  
  console.log(`Found ${allPushBlocks.length} push blocks`);
  console.log(`Types: ${[...new Set(allPushBlocks.map(b => b.type))].join(', ')}`);
  
  // Unescape all type-1 blocks
  const unescaped = [];
  for (const block of allPushBlocks) {
    if (block.type !== 1) continue;
    try {
      unescaped.push(JSON.parse('"' + block.raw + '"'));
    } catch(e) {
      unescaped.push(block.raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
    }
  }
  
  // Build the full stream
  const fullStream = unescaped.join('');
  
  // Find the parties JSON to get all $refs
  const partiesMatch = fullStream.match(/"parties":\[/);
  if (!partiesMatch) {
    console.error('No parties found in stream!');
    return;
  }
  
  // Collect all $-refs from sujets
  const refPattern = /\"exemple\":\"(\$[0-9a-f]+)\"/gi;
  const refs = [];
  let rm;
  while ((rm = refPattern.exec(fullStream)) !== null) {
    refs.push(rm[1].substring(1)); // remove $
  }
  console.log(`\nFound ${refs.length} $-refs in corrections`);
  
  // For each ref, check if the chunk exists
  const missing = [];
  for (const refId of refs) {
    // Try to find `<refId>:` at the start of a line in the stream
    const pattern = new RegExp(`(^|\\n)${refId}:`, 'm');
    const found = pattern.test(fullStream);
    
    if (!found) {
      missing.push(refId);
      
      // Search more broadly - anywhere in the raw HTML
      const rawSearch = new RegExp(`${refId}:`);
      const inRaw = rawSearch.test(html);
      
      // Try to find it as a glued chunk
      const gluedSearch = new RegExp(`[^\\n]${refId}:`, 'm');
      const isGlued = gluedSearch.test(fullStream);
      
      console.log(`❌ Chunk "${refId}" NOT found as line start. inRawHTML=${inRaw}, isGlued=${isGlued}`);
      
      if (isGlued) {
        const gm = fullStream.match(new RegExp(`.{0,30}${refId}:.{0,50}`));
        if (gm) console.log(`   Glued context: "${gm[0]}"`);
      }
      if (inRaw && !isGlued) {
        // It's in the raw HTML but not in the unescaped stream - maybe in a non-type-1 block?
        for (const block of allPushBlocks) {
          if (block.type !== 1 && block.raw.includes(refId + ':')) {
            console.log(`   Found in type-${block.type} push block!`);
          }
        }
      }
    }
  }
  
  if (missing.length === 0) {
    console.log('✅ All chunk refs found in stream!');
  } else {
    console.log(`\n🔍 ${missing.length} chunks missing: ${missing.join(', ')}`);
  }
  
  // Also check: maybe there are push blocks we're NOT capturing
  const altMarkers = [
    'self.__next_f.push([1, "',  // with space
    "self.__next_f.push([1,'",   // single quote
  ];
  for (const marker of altMarkers) {
    if (html.includes(marker)) {
      console.log(`⚠️ Found ALTERNATE push format: "${marker}"`);
    }
  }
  
  // Check for push blocks with array format [type, content] where content is not a string
  const nonStringPush = /self\.__next_f\.push\(\[1,\s*(?!")/g;
  let nsm;
  while ((nsm = nonStringPush.exec(html)) !== null) {
    console.log(`⚠️ Non-string push block at pos ${nsm.index}: "${html.substring(nsm.index, nsm.index + 80)}"`);
  }
})();
