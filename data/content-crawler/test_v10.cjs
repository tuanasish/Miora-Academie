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
      // V10 FIX: scan for hidden chunk IDs
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

const parsed = parseRSCv10(html);
console.log('Total chunks:', Object.keys(parsed.allChunks).length);
console.log('Total textBlocks:', parsed.textBlocks.length);

// Check the specific chunks that were missing
for (const key of ['2c', '4a', '4b', '4c', '4d']) {
  const chunk = parsed.allChunks[key];
  if (chunk) {
    const trefPrefix = chunk.content.match(/^T([0-9a-f]+),/i);
    if (trefPrefix) {
      const expectedSize = parseInt(trefPrefix[1], 16);
      const afterTref = chunk.content.substring(trefPrefix[0].length);
      const cleanAfter = afterTref.replace(/\n/g, '').trim();
      const passesGlue = cleanAfter.length > 50 && cleanAfter.length >= expectedSize * 0.5;
      console.log(`\n${key}: T-ref size=${expectedSize}, afterTref=${cleanAfter.length} chars, passesGlue=${passesGlue}`);
      console.log(`  Preview: "${cleanAfter.substring(0, 80)}..."`);
    } else {
      console.log(`\n${key}: NOT a T-ref, content="${chunk.content.substring(0, 80)}"`);
    }
  } else {
    console.log(`\n${key}: NOT FOUND`);
  }
}
