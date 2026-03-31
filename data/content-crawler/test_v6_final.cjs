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
    return blocks;
}

function parseRSCv6(html) {
    const rawBlocks = extractPushBlocks(html);
    const unescapedBlocks = [];

    // Parse blocks as JSON strings
    for (const raw of rawBlocks) {
        try {
            unescapedBlocks.push(JSON.parse('"' + raw + '"'));
        } catch (e) {
            unescapedBlocks.push(raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\'));
        }
    }

    const allChunks = {};
    const textBlocks = [];

    unescapedBlocks.forEach((text, blockIndex) => {
        const lines = text.split('\n');
        let hasId = false;

        for (const line of lines) {
            const colonIdx = line.indexOf(':');
            if (colonIdx > 0 && colonIdx < 5) {
                const id = line.substring(0, colonIdx);
                if (/^[0-9a-f]+$/i.test(id)) {
                    hasId = true;
                    allChunks[id] = { content: line.substring(colonIdx + 1), blockIndex };
                }
            }
        }

        if (!hasId && text.length > 20) {
            textBlocks.push({ blockIndex, text });
        }
    });

    return { allChunks, textBlocks };
}

function extractPartiesV6(parsedRSC) {
    const { allChunks, textBlocks } = parsedRSC;

    for (const [id, chunkData] of Object.entries(allChunks)) {
        const content = chunkData.content;
        if (!content.includes('"parties":[') || !content.includes('"sujets":[')) continue;

        const partiesIdx = content.indexOf('"parties":[');
        if (partiesIdx === -1) continue;

        const arrStart = partiesIdx + '"parties":'.length;
        let depth = 0, inStr = false, escNext = false, end = -1;
        
        for (let j = arrStart; j < content.length; j++) {
            const c = content[j];
            if (escNext) { escNext = false; continue; }
            if (c === '\\') { escNext = true; continue; }
            if (inStr) { if (c === '"') inStr = false; continue; }
            if (c === '"') { inStr = true; continue; }
            if (c === '{' || c === '[') depth++;
            if (c === '}' || c === ']') { depth--; if (depth === 0) { end = j + 1; break; } }
        }

        if (end > 0) {
            const partiesJson = content.substring(arrStart, end);
            const parties = JSON.parse(partiesJson);

            let res = 0, unres = 0;
            // Phase 2: Resolve corrections over all parties -> sujets
            for (const partie of parties) {
                if (!partie.sujets) continue;
                for (const sujet of partie.sujets) {
                    if (!sujet.correction || !sujet.correction.exemple) continue;
                    const val = sujet.correction.exemple;

                    if (typeof val === 'string' && val.startsWith('$')) {
                        const refId = val.substring(1);
                        
                        // If chunk exists
                        if (allChunks[refId]) {
                            const chunkObj = allChunks[refId];
                            const chunkContent = chunkObj.content;
                            
                            // Scenario A: It's a T-ref! Need to fetch the text blob
                            // e.g., Tcac, -> Look for the text blob strictly AFTER this push block
                            if (/^T[0-9a-f]+,$/i.test(chunkContent)) {
                                const blockIdx = chunkObj.blockIndex;
                                // The text block should be exactly the next block (or within +2)
                                let foundText = null;
                                for (const tb of textBlocks) {
                                    if (tb.blockIndex > blockIdx && tb.blockIndex <= blockIdx + 3) {
                                        foundText = tb.text;
                                        break;
                                    }
                                }
                                if (foundText) {
                                    sujet.correction.exemple = foundText;
                                    res++;
                                } else {
                                    unres++;
                                    console.log('Missed Text blob for T-ref', refId);
                                }
                            } 
                            // Scenario B: It's an inline JSON string directly
                            else {
                                let cleaned = chunkContent;
                                if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                                    try { cleaned = JSON.parse(cleaned); } catch(e) {}
                                }
                                if (cleaned.length > 50) res++; else unres++;
                                sujet.correction.exemple = cleaned;
                            }
                        } else {
                            unres++;
                            console.log('Chunk missing completely:', refId);
                        }
                    } else if (val.length > 50) {
                        res++;
                    } else {
                        unres++;
                    }
                }
            }
            console.log(`Resolved: ${res}, Unresolved: ${unres}`);
            return parties;
        }
    }
    return null;
}

const parsedRSC = parseRSCv6(html);
const p = extractPartiesV6(parsedRSC);
