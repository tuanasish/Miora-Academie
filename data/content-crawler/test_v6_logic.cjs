const fs = require('fs');
const html = fs.readFileSync('orale_partie.html', 'utf8');

// V5 String Scanner
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

    if (!hasId && unescaped.length > 20) {
        orphanTexts.push({ text: unescaped, pushIdx: idx });
    }
});

console.log("Chunks found:", Object.keys(allChunks).length);
console.log("Orphans found:", orphanTexts.length);

let partiesFound = false;
for (const [id, c] of Object.entries(allChunks)) {
    if (c.content.includes('"parties":[')) {
        console.log("Found parties in chunk", id);
        partiesFound = true;
    }
}
if (!partiesFound) console.log("Parties missing!");
