const fs = require('fs');
const html = fs.readFileSync('orale_partie.html', 'utf8');

const idx = html.indexOf('2c:');
const start = Math.max(0, idx - 100);
const end = Math.min(html.length, idx + 200);

const context = html.substring(start, end);
console.log('Context:\n', context.replace(/\r/g, '\\r').replace(/\n/g, '\\n'));
