const fs = require('fs');

function parseRSCv9(html) {
  const marker = 'self.__next_f.push([1,"';
  const rawBlocks = [];
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
          rawBlocks.push(html.substring(contentStart, i));
          break;
        }
      }
      i++;
    }
    searchFrom = i + 3;
  }

  const unescapedBlocks = [];
  for (const raw of rawBlocks) {
    try {
      unescapedBlocks.push(JSON.parse('"' + raw + '"'));
    } catch (e) {
      unescapedBlocks.push(raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
    }
  }

  const allChunks = {};
  const textBlocks = [];

  unescapedBlocks.forEach((text, blockIndex) => {
    // 1. UNMINIFY GLUED CHUNKS inside each push payload!
    let fixedText = text.replace(/([0-9a-f]{1,4}:T[0-9a-f]{1,4},)/gi, '\n$1');
    fixedText = fixedText.replace(/(\}|\]|"|\.)([0-9a-f]{1,4}:(?:\[|\{|"|I\[|HL\[))/gi, '$1\n$2');

    // 2. Identify if this block starts with a chunk ID OR contains multiple lines
    const colonIdx = fixedText.indexOf(':');
    let isChunkBlock = false;
    if (colonIdx > 0 && colonIdx < 5) {
      const id = fixedText.substring(0, colonIdx);
      if (/^[0-9a-f]+$/i.test(id)) {
        isChunkBlock = true;
      }
    }

    // Notice we split here
    const lines = fixedText.split('\n');
    let currentId = null;

    if (isChunkBlock) {
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
        
        if (!isNewChunk && currentId === null && line.length > 20) {
           // It's possible the block started as text, then a chunk appeared midway
           textBlocks.push({ blockIndex, text: line });
        }
      }
    } else {
       // Only if NO chunkID starts block, but what if chunkID is midway and we fixed it with \n?
       // Let's iterate lines here as well!
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
        
        // This is where our ORPHAN text blocks get captured perfectly!
        if (!isNewChunk && currentId === null && line.length > 20) {
           textBlocks.push({ blockIndex, text: line });
        }
      }
    }
  });

  return { allChunks, textBlocks };
}

// Quick Test against Janvier 2026 missing chunk "4a"
let html = fs.readFileSync('orale_partie.html', 'utf8');
const p = parseRSCv9(html);
console.log('Total chunks:', Object.keys(p.allChunks).length);
console.log('Total textBlocks:', p.textBlocks.length);
console.log('Chunks has 2c?', !!p.allChunks['2c']);
console.log('Chunks has 4a?', !!p.allChunks['4a']);

if (p.allChunks['2c']) console.log('2c content:', p.allChunks['2c'].content);
if (p.allChunks['4a']) console.log('4a content:', p.allChunks['4a'].content);
