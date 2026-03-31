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
const text = pushBlocks[74];
console.log('Block 74 length:', text.length);
console.log('Block 74 has newline?', text.includes('\n'));
if (text.includes('\n')) {
    console.log('Line 0:', text.split('\n')[0].substring(0, 50));
    console.log('Line 1:', text.split('\n')[1].substring(0, 50));
}
