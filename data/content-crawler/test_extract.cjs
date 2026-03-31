const fs = require('fs');
const html = fs.readFileSync('orale_partie.html', 'utf8');

// OLD extractor
function extractOld(html) {
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

// NEW extractor
function extractNew(html) {
  const marker = 'self.__next_f.push([';
  const blocks = [];
  let searchFrom = 0;
  while (true) {
    const start = html.indexOf(marker, searchFrom);
    if (start === -1) break;
    const bracketStart = start + marker.length;
    const commaIdx = html.indexOf(',', bracketStart);
    if (commaIdx === -1) { searchFrom = bracketStart + 1; continue; }
    const typeStr = html.substring(bracketStart, commaIdx).trim();
    if (typeStr !== '1') { searchFrom = commaIdx + 1; continue; }
    let quoteStart = commaIdx + 1;
    while (quoteStart < html.length && html[quoteStart] !== '"') quoteStart++;
    if (quoteStart >= html.length) break;
    const contentStart = quoteStart + 1;
    let i = contentStart;
    while (i < html.length) {
      if (html[i] === '\\') { i += 2; continue; }
      if (html[i] === '"') {
        blocks.push(html.substring(contentStart, i));
        break;
      }
      i++;
    }
    searchFrom = i + 1;
  }
  return blocks;
}

const oldBlocks = extractOld(html);
const newBlocks = extractNew(html);
console.log(`OLD extractor: ${oldBlocks.length} blocks`);
console.log(`NEW extractor: ${newBlocks.length} blocks`);
console.log(`DIFFERENCE: ${newBlocks.length - oldBlocks.length} extra blocks found!`);
