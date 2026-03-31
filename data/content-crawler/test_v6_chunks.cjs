const fs = require('fs');
const html = fs.readFileSync('orale_partie.html', 'utf8');

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
        if (html[i] === '"' && html.substring(i, i + 3) === '"])') {
            blocks.push(html.substring(contentStart, i));
            break;
        }
        i++;
    }
    searchFrom = i + 3;
}

const allChunks = {};
const orphanTexts = [];

blocks.forEach((raw, idx) => {
    let unescaped;
    try {
        unescaped = JSON.parse('"' + raw + '"');
    } catch (e) {
        unescaped = raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }

    const lines = unescaped.split('\n');
    let hasId = false;

    // Fix for inline text chunks being truncated by split('\n'):
    // If a pushBlock has an ID at the very start of the FIRST line, 
    // maybe we shouldn't split the REST of the block?
    // Wait, what if the block contains MULTIPLE chunks? (e.g. "1:HL...\n2:I...")
    // Next.js starts each new chunk on a newline.
    
    // Let's first just dump what chunks 2c, 2d look like
    for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0 && colonIdx < 5) {
            const id = line.substring(0, colonIdx);
            if (/^[0-9a-f]+$/i.test(id)) {
                allChunks[id] = { content: line.substring(colonIdx + 1), pushIdx: idx };
                hasId = true;
            }
        }
    }
});

console.log("Chunk 2c:", allChunks['2c'] ? allChunks['2c'].content.substring(0, 100) : "MISSING");
console.log("Chunk 2d:", allChunks['2d'] ? allChunks['2d'].content.substring(0, 100) : "MISSING");
