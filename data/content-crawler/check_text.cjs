const fs = require('fs');
const html = fs.readFileSync('orale_partie.html', 'utf8');
const search = 'interdiction des voitures dans les centres-villes';
const idx = html.indexOf(search);
console.log('Exists in HTML?', idx !== -1);
if (idx !== -1) {
    console.log('Context:', html.substring(Math.max(0, idx - 100), idx + 200));
}
