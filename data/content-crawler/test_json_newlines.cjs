const raw = '1:\\"Hello\\\\nWorld\\"';
const unescaped = JSON.parse('"' + raw + '"');
console.log('Unescaped length:', unescaped.length);
console.log('Contains newline?', unescaped.includes('\n'));
console.log('Contains exact characters \\ and n?', unescaped.includes('\\n'));
