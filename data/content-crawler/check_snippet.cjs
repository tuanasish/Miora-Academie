const fs = require('fs');
const html = fs.readFileSync('orale_partie.html', 'utf8');
const search = 'nombre de consommateurs.';
const idx = html.indexOf(search);
const snippet = html.substring(Math.max(0, idx - 10), idx + 100);
fs.writeFileSync('snippet.json', JSON.stringify(snippet));
