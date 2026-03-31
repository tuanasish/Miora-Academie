// 🗣️ TCF Expression Orale Crawler v11 - FULLSTREAM PARSER
// Copy and paste entirely into DevTools Console on formation-tcfcanada.com

(async function () {
  'use strict';
  const DELAY = 1200;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   🗣️ TCF Expression Orale Crawler v7            ║');
  console.log('║   ULTIMATE PARSER: Next.js RSC Chunk Boundaries  ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const monthSlugs = [
    { name: 'Mars 2026', slug: 'mars-2026', year: 2026 },
    { name: 'Février 2026', slug: 'fvrier-2026', year: 2026 },
    { name: 'Janvier 2026', slug: 'httpsstaging-tcf-canada-nextbendevaiepreuveexpression-oralesujets-actualitesjanvier-2026', year: 2026 },
    { name: 'Janvier 2025', slug: 'janvier-2025', year: 2025 },
    { name: 'Février 2025', slug: 'fevrier-2025', year: 2025 },
    { name: 'Mars 2025', slug: 'mars-2025', year: 2025 },
    { name: 'Avril 2025', slug: 'avril-2025', year: 2025 },
    { name: 'Mai 2025', slug: 'mai-2025', year: 2025 },
    { name: 'Juin 2025', slug: 'juin-2025', year: 2025 },
    { name: 'Juillet 2025', slug: 'juillet-2025', year: 2025 },
    { name: 'Août 2025', slug: 'aout-2025', year: 2025 },
    { name: 'Septembre 2025', slug: 'septembre-2025', year: 2025 },
    { name: 'Octobre 2025', slug: 'octobre-2025', year: 2025 },
    { name: 'Novembre 2025', slug: 'novembre-2025', year: 2025 },
    { name: 'Décembre 2025', slug: 'decembre-2025', year: 2025 },
    { name: 'Janvier 2024', slug: 'janvier-2024', year: 2024 },
    { name: 'Février 2024', slug: 'fevrier-2024', year: 2024 },
    { name: 'Mars 2024', slug: 'mars-2024', year: 2024 },
    { name: 'Avril 2024', slug: 'avril-2024', year: 2024 },
    { name: 'Mai 2024', slug: 'mai-2024', year: 2024 },
    { name: 'Juin 2024', slug: 'juin-2024', year: 2024 },
    { name: 'Juillet 2024', slug: 'juillet-2024', year: 2024 },
    { name: 'Août 2024', slug: 'aout-2024', year: 2024 },
    { name: 'Septembre 2024', slug: 'septembre-2024', year: 2024 },
    { name: 'Octobre 2024', slug: 'octobre-2024', year: 2024 },
    { name: 'Novembre 2024', slug: 'novembre-2024', year: 2024 },
    { name: 'Décembre 2024', slug: 'decembre-2024', year: 2024 },
    { name: 'Janvier 2023', slug: 'janvier-2023', year: 2023 },
    { name: 'Février 2023', slug: 'fevrier-2023', year: 2023 },
    { name: 'Mars 2023', slug: 'mars-2023', year: 2023 },
    { name: 'Avril 2023', slug: 'avril-2023', year: 2023 },
    { name: 'Mai 2023', slug: 'mai-2023', year: 2023 },
    { name: 'Juin 2023', slug: 'juin-2023', year: 2023 },
    { name: 'Juillet 2023', slug: 'juillet-2023', year: 2023 },
    { name: 'Août 2023', slug: 'aout-2023', year: 2023 },
    { name: 'Octobre 2023', slug: 'octobre-2023', year: 2023 },
    { name: 'Novembre 2023', slug: 'novembre-2023', year: 2023 },
    { name: 'Décembre 2023', slug: 'decembre-2023', year: 2023 },
  ];

  // Safely extract self.__next_f.push([1,"..."]) blocks without regex catastrophic backtracking
  function extractPushBlocks(html) {
    const marker = 'self.__next_f.push([';
    const blocks = [];
    let searchFrom = 0;
    while (true) {
      const start = html.indexOf(marker, searchFrom);
      if (start === -1) break;
      const bracketStart = start + marker.length;
      
      // Parse the array: [type, "content", ...]
      // Find the type number and comma
      const commaIdx = html.indexOf(',', bracketStart);
      if (commaIdx === -1) { searchFrom = bracketStart + 1; continue; }
      
      const typeStr = html.substring(bracketStart, commaIdx).trim();
      if (typeStr !== '1') { searchFrom = commaIdx + 1; continue; }
      
      // Find the opening quote of the string content
      let quoteStart = commaIdx + 1;
      while (quoteStart < html.length && html[quoteStart] !== '"') quoteStart++;
      if (quoteStart >= html.length) break;
      
      const contentStart = quoteStart + 1;
      let i = contentStart;
      while (i < html.length) {
        if (html[i] === '\\') { i += 2; continue; } // skip escaped chars
        if (html[i] === '"') {
          // First unescaped quote = end of JS string (handles any format after it)
          blocks.push(html.substring(contentStart, i));
          break;
        }
        i++;
      }
      searchFrom = i + 1;
    }
    return blocks;
  }

  function parseRSCv10(html) {
    const rawBlocks = extractPushBlocks(html);
    const unescapedBlocks = [];

    for (const raw of rawBlocks) {
      try {
        unescapedBlocks.push(JSON.parse('"' + raw + '"'));
      } catch (e) {
        unescapedBlocks.push(raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
      }
    }

    // V11: Build full concatenated stream for byte-offset T-ref extraction
    const fullStream = unescapedBlocks.join('');

    const allChunks = {};
    const textBlocks = [];

    unescapedBlocks.forEach((text, blockIndex) => {
      // V10 FIX: Unminify glued chunks BEFORE classification
      let fixedText = text.replace(/([0-9a-f]{1,4}:T[0-9a-f]{1,4},)/gi, '\n$1');
      fixedText = fixedText.replace(/(\}|\]|"|\.)([0-9a-f]{1,4}:(?:\[|\{|"|I\[|HL\[))/gi, '$1\n$2');

      // V7 Logic: Block starts with chunk ID → chunk block
      const colonIdx = fixedText.indexOf(':');
      let isChunkBlock = false;
      if (colonIdx > 0 && colonIdx < 5) {
        const id = fixedText.substring(0, colonIdx);
        if (/^[0-9a-f]+$/i.test(id)) isChunkBlock = true;
      }

      if (isChunkBlock) {
        const lines = fixedText.split('\n');
        let currentId = null;
        for (const line of lines) {
          let isNewChunk = false;
          const ci = line.indexOf(':');
          if (ci > 0 && ci < 5) {
            const potentialId = line.substring(0, ci);
            if (/^[0-9a-f]+$/i.test(potentialId) && line.length > ci + 1 && line[ci + 1] !== ' ') {
              isNewChunk = true;
              currentId = potentialId;
              allChunks[currentId] = { content: line.substring(ci + 1), blockIndex };
            }
          }
          if (!isNewChunk && currentId !== null) {
            allChunks[currentId].content += '\n' + line;
          }
        }
      } else {
        // V7: Entire block is orphan text (essay content)
        if (text.length > 20) {
          textBlocks.push({ blockIndex, text });
        }
        // V10 FIX: Also check if unminifier revealed hidden chunk IDs inside this text block
        const lines = fixedText.split('\n');
        for (const line of lines) {
          const ci = line.indexOf(':');
          if (ci > 0 && ci < 5) {
            const potentialId = line.substring(0, ci);
            if (/^[0-9a-f]+$/i.test(potentialId) && line.length > ci + 1 && line[ci + 1] !== ' ') {
              allChunks[potentialId] = { content: line.substring(ci + 1), blockIndex };
            }
          }
        }
      }
    });

    return { allChunks, textBlocks, fullStream };
  }

  function extractPartiesV10(parsedRSC) {
    const { allChunks, textBlocks, fullStream } = parsedRSC;

    for (const [id, chunkData] of Object.entries(allChunks)) {
      const content = chunkData.content;
      if (!content.includes('"parties":[') || !content.includes('"sujets":[')) continue;

      try {
        const partiesIdx = content.indexOf('"parties":[');
        if (partiesIdx === -1) continue;

        const arrStart = partiesIdx + '"parties":'.length;
        let depth = 0, inStr = false, escNext = false, end = -1;
        
        for (let j = arrStart; j < content.length; j++) {
          const c = content[j];
          if (escNext) { escNext = false; continue; }
          if (c === '\\') { escNext = true; continue; }
          if (inStr) { if (c === '"') inStr = false; continue; }
          if (c === '"') { inStr = true; continue; }
          if (c === '{' || c === '[') depth++;
          if (c === '}' || c === ']') { 
            depth--; 
            if (depth === 0) { end = j + 1; break; } 
          }
        }

        if (end > 0) {
          const partiesJson = content.substring(arrStart, end);
          const parties = JSON.parse(partiesJson);

          for (const partie of parties) {
            if (!partie.sujets) continue;
            for (const sujet of partie.sujets) {
              if (sujet.question === '$undefined') sujet.question = null;
              if (sujet.description === '$undefined') sujet.description = null;

              if (!sujet.correction || !sujet.correction.exemple) continue;
              const val = sujet.correction.exemple;

              if (typeof val === 'string' && val.startsWith('$')) {
                const refId = val.substring(1);
                
                if (allChunks[refId]) {
                  const chunkObj = allChunks[refId];
                  const chunkContent = chunkObj.content;
                  
                  // Check if it's a T-ref (T<hexSize>,)
                  const trefPrefix = chunkContent.match(/^T([0-9a-f]+),/i);
                  if (trefPrefix) {
                    const expectedSize = parseInt(trefPrefix[1], 16);
                    const afterTref = chunkContent.substring(trefPrefix[0].length);
                    const cleanAfter = afterTref.replace(/\n/g, '').trim();
                    
                    if (cleanAfter.length > 50 && cleanAfter.length >= expectedSize * 0.1) {
                      let cleanedText = afterTref.trim();
                      cleanedText = cleanedText.replace(/[0-9a-f]{1,4}:(?:T[0-9a-f]+,|\$)/gi, '\n\n');
                      sujet.correction.exemple = cleanedText.trim();
                    } else {
                      // Strategy 1: Look for next orphan text block
                      let foundText = null;
                      for (const tb of textBlocks) {
                        if (tb.blockIndex > chunkObj.blockIndex) {
                          foundText = tb.text;
                          break;
                        }
                      }
                      if (foundText && foundText.length > 50) {
                        // Strip chunk markers from textBlock
                        foundText = foundText.replace(/[0-9a-f]{1,4}:(?:T[0-9a-f]+,|\$)/gi, '\n\n').trim();
                        if (foundText.length > 50) sujet.correction.exemple = foundText;
                      } else {
                        // V11 Strategy 2: Extract from fullStream using byte offset
                        const trefMarker = refId + ':' + trefPrefix[0];
                        const streamPos = fullStream.indexOf(trefMarker);
                        if (streamPos !== -1) {
                          const textStart = streamPos + trefMarker.length;
                          let extracted = fullStream.substring(textStart, textStart + expectedSize);
                          // Strip chunk markers
                          extracted = extracted.replace(/[0-9a-f]{1,4}:(?:T[0-9a-f]+,|\$)/gi, '\n\n').trim();
                          if (extracted.length > 50) {
                            sujet.correction.exemple = extracted;
                          }
                        }
                      }
                    }
                  } 
                  // Scenario B: Tache 2 inline JSON strings
                  else {
                    let cleaned = chunkContent;
                    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                      try { cleaned = JSON.parse(cleaned); } catch(e) {}
                    }
                    sujet.correction.exemple = cleaned;
                  }
                } else {
                  // V11 Strategy 3: Search fullStream directly for the chunk
                  const streamSearch = new RegExp(refId + ':T([0-9a-f]+),', 'i');
                  const streamMatch = fullStream.match(streamSearch);
                  if (streamMatch) {
                    const sz = parseInt(streamMatch[1], 16);
                    const pos = fullStream.indexOf(streamMatch[0]);
                    const textStart = pos + streamMatch[0].length;
                    let extracted = fullStream.substring(textStart, textStart + sz);
                                        extracted = extracted.replace(/[0-9a-f]{1,4}:(?:T[0-9a-f]+,|\$)/gi, '\n\n').trim();
                    if (extracted.length > 50) {
                      sujet.correction.exemple = extracted;
                    }
                  }
                }
              }
            }
          }
          return parties;
        }
      } catch (e) {
        console.warn('Parse error:', e.message);
      }
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════
  //  MAIN CRAWLER RUNNER
  // ═══════════════════════════════════════════════════════════
  const allData = {
    crawledAt: new Date().toISOString(),
    type: 'expression_orale',
    source: 'https://app.formation-tcfcanada.com',
    months: [],
    stats: { totalMonths: 0, totalParties: 0, totalSujets: 0, resolvedCorrections: 0, unresolvedCorrections: 0 },
  };

  console.log(`\n📅 Crawling ${monthSlugs.length} months...\n`);

  for (let i = 0; i < monthSlugs.length; i++) {
    const monthInfo = monthSlugs[i];
    const url = `/epreuve/expression-orale/sujets-actualites/${monthInfo.slug}`;

    try {
      const resp = await fetch(url, { credentials: 'include' });
      if (!resp.ok) {
        console.warn(`⚠️ [${i + 1}/${monthSlugs.length}] ${monthInfo.name}: HTTP ${resp.status}`);
        continue;
      }
      const html = await resp.text();

      if (html.includes('/connexion') && !html.includes('"parties"')) {
        console.error('🔒 Session expired! Please login, refresh page, and re-run script!');
        break;
      }

      const parsedRSC = parseRSCv10(html);
      console.log(`  📦 Parsed: ${Object.keys(parsedRSC.allChunks).length} chunks, ${parsedRSC.textBlocks.length} textBlocks`);
      const parties = extractPartiesV10(parsedRSC);

      if (!parties || parties.length === 0) {
        console.warn(`⚠️ [${i + 1}/${monthSlugs.length}] ${monthInfo.name}: No parties data found`);
        continue;
      }

      let resolved = 0, unresolved = 0;
      for (const p of parties) {
        if (!p.sujets) continue;
        for (const s of p.sujets) {
          const ex = s.correction?.exemple;
          if (ex && typeof ex === 'string' && ex.length > 50) resolved++;
          else unresolved++;
        }
      }

      const sujetCount = parties.reduce((sum, p) => sum + (p.sujets ? p.sujets.length : 0), 0);

      allData.months.push({
        name: monthInfo.name,
        slug: monthInfo.slug,
        year: monthInfo.year,
        totalParties: parties.length,
        totalSujets: sujetCount,
        parties: parties,
      });
      allData.stats.totalMonths++;
      allData.stats.totalParties += parties.length;
      allData.stats.totalSujets += sujetCount;
      allData.stats.resolvedCorrections += resolved;
      allData.stats.unresolvedCorrections += unresolved;

      const pct = (resolved + unresolved) > 0 ? Math.round((resolved / (resolved + unresolved)) * 100) : 0;
      console.log(`✅ [${i + 1}/${monthSlugs.length}] ${monthInfo.name}: ${sujetCount} sujets | ${resolved}✅ ${unresolved}❌ (${pct}%)`);
    } catch (e) {
      console.error(`❌ [${i + 1}/${monthSlugs.length}] ${monthInfo.name}: ${e.message}`);
    }

    await wait(DELAY);
  }

  const totalCorr = allData.stats.resolvedCorrections + allData.stats.unresolvedCorrections;
  const totalPct = totalCorr > 0 ? Math.round((allData.stats.resolvedCorrections / totalCorr) * 100) : 0;

  console.log('\n' + '═'.repeat(60));
  console.log('📊 TỔNG KẾT Expression Orale v11:');
  console.log(`   Tổng Số Tháng: ${allData.stats.totalMonths}`);
  console.log(`   Tổng Parties: ${allData.stats.totalParties}`);
  console.log(`   Tổng Sujets: ${allData.stats.totalSujets}`);
  console.log(`   Corrections OK: ${allData.stats.resolvedCorrections}✅ / ${totalCorr} (${totalPct}%)`);
  console.log(`   Lỗi (Unresolved): ${allData.stats.unresolvedCorrections}❌`);
  console.log('═'.repeat(60));

  window.__TCF_ORALE = allData;

  try {
    const jsonStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tcf_expression_orale_v11_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 5000);
    console.log(`\n🎉 Downloaded: ${a.download} (~${(jsonStr.length / 1024).toFixed(0)} KB)`);
  } catch (e) {
    console.error('Download failed! Execute: copy(JSON.stringify(__TCF_ORALE))');
  }
})();
