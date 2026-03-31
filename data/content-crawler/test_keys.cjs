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
const pushBlocks = blocks.map(r => JSON.parse('"' + r + '"'));
const chunks = {};
pushBlocks.forEach(b => {
    const lines = b.split('\n');
    for (const line of lines) {
        const ci = line.indexOf(':');
        if (ci > 0 && ci < 5) {
            const id = line.substring(0, ci);
            if (/^[0-9a-f]+$/i.test(id)) {
                chunks[id] = line.substring(ci+1);
            }
        }
    }
});
console.log('Chunk IDs keys:', Object.keys(chunks).sort().join(','));
