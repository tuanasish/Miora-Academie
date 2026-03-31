const fs = require('fs');

const unescaped = '2c:"This is line 1\nThis is line 2"\n2d:T90c,';
const lines = unescaped.split('\n');
const parsedChunks = {};
let currentId = null;

for (const line of lines) {
    const colonIdx = line.indexOf(':');
    let isNewChunk = false;
    
    // Check if it's a valid ID line
    if (colonIdx > 0 && colonIdx < 5) {
        const potentialId = line.substring(0, colonIdx);
        if (/^[0-9a-f]+$/i.test(potentialId)) {
            isNewChunk = true;
            currentId = potentialId;
            parsedChunks[currentId] = line.substring(colonIdx + 1);
        }
    }
    
    if (!isNewChunk) {
        if (currentId !== null) {
            parsedChunks[currentId] += '\n' + line;
        } else {
            console.log("Orphan text line:", line);
        }
    }
}

console.log('Parsed chunks:');
console.log(parsedChunks);
