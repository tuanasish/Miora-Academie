const fs = require('fs');
const html = fs.readFileSync('orale_partie.html', 'utf8');

const regex = /.{0,40}4[a-d]:T[a-f0-9]+,.{0,20}/g;
let match;
const lines = [];
while ((match = regex.exec(html)) !== null) {
  lines.push(match[0]);
}
fs.writeFileSync('missing_proof.txt', lines.join('\n'));
