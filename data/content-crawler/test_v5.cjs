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
            const ch = html[i];
            if (ch === '\\') {
                i += 2; 
                continue;
            }
            if (ch === '"') {
                if (html.substring(i, i + 3) === '"])') {
                    const rawContent = html.substring(contentStart, i);
                    blocks.push(rawContent);
                    break;
                }
            }
            i++;
        }

        searchFrom = i + 3;
    }

    return blocks;
}

const rawBlocks = extractPushBlocks(html);
const pushBlocks = [];

for (const raw of rawBlocks) {
    try {
        const unescaped = JSON.parse('"' + raw + '"');
        pushBlocks.push(unescaped);
    } catch (e) {
        console.log("JSON parse failed");
    }
}

const fullStream = pushBlocks.join('');
const lines = fullStream.split('\n');
const allChunks = {};

for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // THIS is where the bug might be: 
    // Is "1a:["$","div",...]" on its own line?
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx > 0 && colonIdx < 5) {
        const id = trimmed.substring(0, colonIdx);
        if (/^[0-9a-f]+$/i.test(id)) {
            allChunks[id] = trimmed.substring(colonIdx + 1);
        }
    }
}

console.log("Found chunks:", Object.keys(allChunks).length);
// Check for parties
let partiesFound = false;
for (const [id, content] of Object.entries(allChunks)) {
    if (content.includes('"parties":[')) {
        console.log("Parties found in chunk:", id);
        partiesFound = true;
    }
}

if (!partiesFound) {
    console.log("Parties missing!");
}
