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
    let found = false;
    while (i < html.length) {
        if (html[i] === '\\') { i += 2; continue; }
        if (html[i] === '"' && html.substring(i, i + 3) === '"])') {
            blocks.push(html.substring(contentStart, i));
            found = true;
            break;
        }
        i++;
    }
    if (!found) {
        console.log("Error parsing block at", start);
        break;
    }
    searchFrom = i + 3;
}
const pushBlocks = blocks.map(r => JSON.parse('"' + r + '"'));
console.log('Got ' + pushBlocks.length + ' blocks');
let pIndex = -1;
let pBlock = -1;
for (let i = 0; i < pushBlocks.length; i++) {
    if (pushBlocks[i].includes('"parties":[')) {
        pIndex = pushBlocks[i].indexOf('"parties":[');
        pBlock = i;
        break;
    }
}
console.log('Block with parties: ' + pBlock + ' at index ' + pIndex);
if (pBlock !== -1) {
    console.log('Start of this block: ' + pushBlocks[pBlock].substring(0, 50).replace(/\n/g, '\\n'));
    if (pBlock > 0) {
        console.log('End of previous block: ' + pushBlocks[pBlock-1].slice(-50).replace(/\n/g, '\\n'));
    }
} else {
    console.log('parties NOT FOUND in any individual push block!');
}
