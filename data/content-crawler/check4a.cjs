const fs = require('fs');
const html = fs.readFileSync('orale_partie.html', 'utf8');
const search = '4a:T4fd,';
const idx = html.indexOf(search);
if (idx !== -1) {
    fs.writeFileSync('check4a_out.txt', html.substring(Math.max(0, idx - 100), idx + 100));
}
