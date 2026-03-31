const fs = require('fs');

function parseRSCv7(html) {
    const marker = 'self.__next_f.push([1,"';
    const rawBlocks = [];
    let searchFrom = 0;
    while (true) {
        const start = html.indexOf(marker, searchFrom);
        if (start === -1) break;
        const contentStart = start + marker.length;
        let i = contentStart;
        while (i < html.length) {
            if (html[i] === '\\') { i += 2; continue; }
            if (html[i] === '"' && html.substring(i, i + 3) === '"])') {
                rawBlocks.push(html.substring(contentStart, i));
                break;
            }
            i++;
        }
        searchFrom = i + 3;
    }

    const unescapedBlocks = [];
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
        const colonIdx = text.indexOf(':');
        let isChunkBlock = false;
        if (colonIdx > 0 && colonIdx < 5) {
            const id = text.substring(0, colonIdx);
            if (/^[0-9a-f]+$/i.test(id)) {
                isChunkBlock = true;
            }
        }

        if (isChunkBlock) {
            const lines = text.split('\n');
            let currentId = null;
            for (const line of lines) {
                let isNewChunk = false;
                const ci = line.indexOf(':');
                if (ci > 0 && ci < 5) {
                    const potentialId = line.substring(0, ci);
                    if (/^[0-9a-f]+$/i.test(potentialId) && line.length > ci + 1 && line[ci + 1] !== ' ') {
                        isNewChunk = true;
                        currentId = potentialId;
                        allChunks[currentId] = { content: line.substring(ci + 1), blockIndex };
                    }
                }
                if (!isNewChunk && currentId !== null) {
                    allChunks[currentId].content += '\n' + line;
                }
            }
        } else {
            if (text.length > 20) {
                textBlocks.push({ blockIndex, text });
            }
        }
    });

    return { allChunks, textBlocks };
}

function testV7() {
    const html = fs.readFileSync('orale_partie.html', 'utf8');
    const { allChunks, textBlocks } = parseRSCv7(html);
    
    let chunkCount = Object.keys(allChunks).length;
    let textBlockCount = textBlocks.length;
    console.log(`Chunks: ${chunkCount}, TextBlocks: ${textBlockCount}`);
    
    // Test parties resolution
    for (const [id, c] of Object.entries(allChunks)) {
        if (c.content.includes('"parties":[')) {
            const pid = c.content.indexOf('"parties":[');
            let partiesJson = c.content.substring(pid + 10); // Rough skip just to valid existence
            console.log(`Found parties chunk: ${id}`);
        }
    }

    // Verify 2c and 2d
    console.log('2c content:', allChunks['2c']?.content);
    console.log('2d content:', allChunks['2d']?.content);
    console.log('24 content snippet:', allChunks['24']?.content.substring(0, 50));
}

testV7();
