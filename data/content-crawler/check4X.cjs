const fs = require('fs');
const html = fs.readFileSync('orale_partie.html', 'utf8');

const regex = /.{0,40}4[a-d]:T[a-f0-9]+,.{0,20}/g;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log(match[0]);
}
