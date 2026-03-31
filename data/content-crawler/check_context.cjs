const fs = require('fs');
const html = fs.readFileSync('orale_partie.html', 'utf8');
const search = 'interdiction des voitures dans les centres-villes';
const idx = html.indexOf(search);
if (idx !== -1) {
    // Look backwards up to 300 characters to find the chunk ID definition `"xxx":["yyy",...` or `push([1,"..."])`
    console.log(html.substring(Math.max(0, idx - 400), idx + 100));
}
