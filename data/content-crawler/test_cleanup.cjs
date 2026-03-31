// Quick test: verify chunk boundary cleanup works
const text = 'La question de l\'interdiction des voitures dans les centres-villes est un sujet important.4b:T51c,Le salaire est un';
const boundary = text.match(/[0-9a-f]{1,4}:(?:T[0-9a-f]+,|\[|\{|"|\$|I\[)/i);
if (boundary) {
  const cleaned = text.substring(0, boundary.index).trim();
  console.log('Original:', text.length, 'chars');
  console.log('Cleaned:', cleaned.length, 'chars');  
  console.log('Cut at:', boundary[0]);
  console.log('Result:', cleaned.substring(0, 80) + '...');
  console.log('✅ Chunk boundary cleanup works!');
} else {
  console.log('❌ No boundary found');
}
