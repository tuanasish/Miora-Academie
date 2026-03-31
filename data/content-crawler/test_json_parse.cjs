const raw = '2c:"This is line 1\\nThis is line 2"';
const parsed = JSON.parse('"' + raw + '"');
console.log('Result:', parsed);
console.log('Includes real newline character?', parsed.includes('\n'));
