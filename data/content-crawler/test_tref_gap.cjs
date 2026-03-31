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

const unescapedBlocks = [];
for (const raw of blocks) {
    try {
        unescapedBlocks.push(JSON.parse('"' + raw + '"'));
    } catch (e) {
        unescapedBlocks.push(raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
    }
}

unescapedBlocks.forEach((text, blockIndex) => {
    if (text.includes('Tcac,')) {
        console.log('2c:Tcac, found at block index:', blockIndex);
    }
    if (text.includes('Les parents doivent-ils laisser')) {
        console.log('Essay text found at block index:', blockIndex);
    }
});
