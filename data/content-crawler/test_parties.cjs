const v7 = require('./tcf_expression_orale_v7_2026-03-30.json');
const mai2023 = v7.months.find(m => m.name === 'Mai 2023');
console.log('Total parties in Mai 2023:', mai2023.parties.length);
for (let i = 0; i < mai2023.parties.length; i++) {
    if (mai2023.parties[i]) {
        console.log('Partie ' + (i+1) + ' has ' + mai2023.parties[i].sujets.length + ' sujets.');
    }
}
