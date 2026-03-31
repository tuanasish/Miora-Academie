const fs = require('fs');
const html = fs.readFileSync('orale_partie.html', 'utf8');

function extractPushBlocks(html) {
  const marker = 'self.__next_f.push([1,"';
  const blocks = [];
  let searchFrom = 0;
  while (true) {
    const start = html.indexOf(marker, searchFrom);
    if (start === -1) break;
    const contentStart = start + marker.length;
    let i = contentStart;
    while (i < html.length) {
      if (html[i] === '\\') { i += 2; continue; }
      if (html[i] === '"') {
        if (html.substring(i, i + 3) === '"])') {
          blocks.push(html.substring(contentStart, i));
          break;
        }
      }
      i++;
    }
    searchFrom = i + 3;
  }
  return blocks;
}

function parseRSCv10(html) {
  const rawBlocks = extractPushBlocks(html);
  const unescapedBlocks = [];
  for (const raw of rawBlocks) {
    try { unescapedBlocks.push(JSON.parse('"' + raw + '"')); }
    catch (e) { unescapedBlocks.push(raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')); }
  }

  const allChunks = {};
  const textBlocks = [];

  unescapedBlocks.forEach((text, blockIndex) => {
    let fixedText = text.replace(/([0-9a-f]{1,4}:T[0-9a-f]{1,4},)/gi, '\n$1');
    fixedText = fixedText.replace(/(\}|\]|"|\.)([0-9a-f]{1,4}:(?:\[|\{|"|I\[|HL\[))/gi, '$1\n$2');

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
      if (text.length > 20) {
        textBlocks.push({ blockIndex, text });
      }
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

  return { allChunks, textBlocks };
}

function extractPartiesV10(parsedRSC) {
  const { allChunks, textBlocks } = parsedRSC;

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
        if (c === '}' || c === ']') { depth--; if (depth === 0) { end = j + 1; break; } }
      }

      if (end > 0) {
        const parties = JSON.parse(content.substring(arrStart, end));
        let resolved = 0, unresolved = 0;

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
                
                const trefPrefix = chunkContent.match(/^T([0-9a-f]+),/i);
                if (trefPrefix) {
                  const expectedSize = parseInt(trefPrefix[1], 16);
                  const afterTref = chunkContent.substring(trefPrefix[0].length);
                  const cleanAfter = afterTref.replace(/\n/g, '').trim();
                  
                  if (cleanAfter.length > 50 && cleanAfter.length >= expectedSize * 0.1) {
                    sujet.correction.exemple = afterTref.trim();
                    resolved++;
                  } else {
                    let foundText = null;
                    for (const tb of textBlocks) {
                      if (tb.blockIndex > chunkObj.blockIndex) {
                        foundText = tb.text;
                        break;
                      }
                    }
                    if (foundText && foundText.length > 50) {
                      sujet.correction.exemple = foundText;
                      resolved++;
                    } else {
                      unresolved++;
                      console.log(`  MISS: ref=$${refId} tache=${sujet.tache} title="${(sujet.title||'').substring(0,60)}" afterTref=${cleanAfter.length} textBlock=${foundText ? foundText.length : 'null'}`);
                    }
                  }
                } else {
                  let cleaned = chunkContent;
                  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                    try { cleaned = JSON.parse(cleaned); } catch(e) {}
                  }
                  sujet.correction.exemple = cleaned;
                  if (cleaned.length > 50) resolved++; else unresolved++;
                }
              } else {
                unresolved++;
                console.log(`  MISS: ref=$${refId} NOT IN CHUNKS`);
              }
            }
          }
        }
        console.log(`\nParties: ${parties.length}, Resolved: ${resolved}, Unresolved: ${unresolved}`);
        const total = resolved + unresolved;
        console.log(`Rate: ${total > 0 ? Math.round(resolved/total*100) : 0}%`);
        return parties;
      }
    } catch (e) {
      console.warn('Parse error:', e.message);
    }
  }
  return null;
}

const parsed = parseRSCv10(html);
extractPartiesV10(parsed);
