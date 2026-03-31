const fs = require('fs');
const html = fs.readFileSync('orale_partie.html', 'utf8');

// Copy extractPushBlocks from v11
function extractPushBlocks(html) {
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
      if (html[i] === '"') { blocks.push(html.substring(contentStart, i)); break; }
      i++;
    }
    searchFrom = i + 1;
  }
  return blocks;
}

const rawBlocks = extractPushBlocks(html);
const unescapedBlocks = [];
for (const raw of rawBlocks) {
  try { unescapedBlocks.push(JSON.parse('"' + raw + '"')); }
  catch (e) { unescapedBlocks.push(raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')); }
}

const fullStream = unescapedBlocks.join('');
console.log('fullStream length:', fullStream.length);

// Test: find T-ref 4a in fullStream
const testIds = ['2c', '4a', '4b', '4c', '4d'];
for (const id of testIds) {
  const pattern = new RegExp(id + ':T([0-9a-f]+),', 'i');
  const match = fullStream.match(pattern);
  if (match) {
    const sz = parseInt(match[1], 16);
    const pos = fullStream.indexOf(match[0]);
    const textStart = pos + match[0].length;
    const extracted = fullStream.substring(textStart, textStart + sz);
    console.log(`\n${id}: size=${sz}, extracted=${extracted.length} chars`);
    console.log(`  Start: "${extracted.substring(0, 80)}..."`);
    console.log(`  End:   "...${extracted.substring(extracted.length - 40)}"`);
  } else {
    console.log(`\n${id}: NOT FOUND in fullStream`);
  }
}
