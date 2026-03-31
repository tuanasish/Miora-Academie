const fs = require('fs');
let html = fs.readFileSync('orale_partie.html', 'utf8');

// Build the stream exactly like crawler v7
const blocks = [];
let i = 0;
while (i < html.length) {
    const startIdx = html.indexOf('self.__next_f.push(', i);
    if (startIdx === -1) break;
    const arrayStart = html.indexOf('[', startIdx);
    let openBrackets = 0;
    let endIdx = -1;
    let inString = false;
    let escape = false;

    for (let j = arrayStart; j < html.length; j++) {
        const char = html[j];
        if (escape) { escape = false; continue; }
        if (char === '\\') { escape = true; continue; }
        if (char === '"') { inString = !inString; continue; }
        if (!inString) {
            if (char === '[') openBrackets++;
            else if (char === ']') {
                openBrackets--;
                if (openBrackets === 0) { endIdx = j; break; }
            }
        }
    }
    if (endIdx !== -1) {
        let arrayStr = html.substring(arrayStart, endIdx + 1);
        try {
            const arr = JSON.parse(arrayStr);
            if (arr && arr[0] === 1 && typeof arr[1] === 'string') {
                blocks.push(arr[1]);
            }
        } catch (e) {}
        i = endIdx + 1;
    } else {
        break;
    }
}

let fullStream = '';
for (const b of blocks) fullStream += b;

// APPLY THE MAGICAL FIX
fullStream = fullStream.replace(/([0-9a-f]{1,4}:T[0-9a-f]{1,4},)/g, '\n$1');
// What about other glued chunks?
// The syntax for a chunk start is `[0-9a-f]+:` followed by a React structure type (T, I, HL, [, {, ")
// Typically minifiers don't glue `]1a:[`, they keep strings separate inside the JSON.
// But we discovered the `.4a:T4fd,` glue.

const streamLines = fullStream.split('\n');
const keys = new Set();
for (let line of streamLines) {
    const m = line.match(/^([0-9a-f]+):/);
    if(m) keys.add(m[1]);
}
console.log('Keys has 4a?', keys.has('4a'));
console.log('Keys has 4b?', keys.has('4b'));
console.log('Keys has 4c?', keys.has('4c'));
console.log('Keys has 4d?', keys.has('4d'));
