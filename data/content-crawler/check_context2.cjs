const fs = require('fs');
const html = fs.readFileSync('orale_partie.html', 'utf8');
const search = 'interdiction des voitures dans les centres-villes';
const idx = html.indexOf(search);
if (idx !== -1) {
    fs.writeFileSync('context_out.txt', html.substring(Math.max(0, idx - 800), idx + 200));
}
