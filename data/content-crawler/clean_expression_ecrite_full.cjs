const fs = require('fs');
const path = require('path');

function pickLatestFile(prefixes, fallbackName) {
  const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes];
  const files = fs.readdirSync(__dirname)
    .filter((file) => file.endsWith('.json') && prefixList.some((prefix) => file.startsWith(prefix)))
    .map((file) => ({
      file,
      mtimeMs: fs.statSync(path.join(__dirname, file)).mtimeMs,
    }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  if (files.length > 0) return files[0].file;
  if (fallbackName && fs.existsSync(path.join(__dirname, fallbackName))) return fallbackName;

  throw new Error(`No JSON file found for prefixes: ${prefixList.join(', ')}`);
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function trimTrailingArtifact(value, stats, itemId, fieldPath) {
  if (typeof value !== 'string') return value;

  const marker = /[0-9a-f]{1,8}:T[0-9a-f]{1,8},/i;
  const match = marker.exec(value);

  if (!match || match.index == null || match.index < 40) return value;

  const cleaned = value.slice(0, match.index).trimEnd();
  if (cleaned === value) return value;

  stats.artifactCuts += 1;
  if (stats.examples.length < 12) {
    stats.examples.push({
      id: itemId,
      field: fieldPath,
      removedChars: value.length - cleaned.length,
      snippet: value.slice(Math.max(0, match.index - 35), Math.min(value.length, match.index + 80)),
    });
  }

  return cleaned;
}

function walkAndClean(value, stats, itemId, fieldPath = '') {
  if (typeof value === 'string') {
    return trimTrailingArtifact(value, stats, itemId, fieldPath);
  }

  if (Array.isArray(value)) {
    return value.map((child, index) => walkAndClean(child, stats, itemId, `${fieldPath}[${index}]`));
  }

  if (isPlainObject(value)) {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      const nextPath = fieldPath ? `${fieldPath}.${key}` : key;
      out[key] = walkAndClean(child, stats, itemId, nextPath);
    }
    return out;
  }

  return value;
}

function normalizeTitle(item, stats) {
  if (!Number.isInteger(item.orderIndex) || item.orderIndex <= 0) return item;

  const expected = `Combinaison ${item.orderIndex}`;
  const current = typeof item.titre === 'string' ? item.titre.trim() : '';
  const isCombinaisonTitle = /^Combinaison\s+\d+$/i.test(current);

  if (!current || isCombinaisonTitle) {
    if (current !== expected) {
      item.titre = expected;
      stats.titleNormalizations += 1;
      if (stats.titleExamples.length < 12) {
        stats.titleExamples.push({
          id: item.id,
          month: item.monthName,
          from: current || null,
          to: expected,
        });
      }
    }
  }

  return item;
}

function countEmbeddedArtifacts(items) {
  const marker = /[0-9a-f]{1,8}:T[0-9a-f]{1,8},/i;
  let count = 0;

  const scan = (value) => {
    if (typeof value === 'string') {
      if (marker.test(value)) count += 1;
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(scan);
      return;
    }
    if (isPlainObject(value)) {
      Object.values(value).forEach(scan);
    }
  };

  items.forEach(scan);
  return count;
}

function countTitleMismatches(items) {
  let count = 0;
  for (const item of items) {
    if (!Number.isInteger(item.orderIndex)) continue;
    const match = typeof item.titre === 'string' && item.titre.match(/^Combinaison\s+(\d+)$/i);
    if (match && Number(match[1]) !== item.orderIndex) count += 1;
  }
  return count;
}

const explicitInput = process.argv[2];
const inputFile =
  explicitInput ||
  process.env.TCF_EE_FULL_FILE ||
  pickLatestFile(
    ['tcf_expression_ecrite_full_', 'tcf_expression_full_'],
    'tcf_expression_ecrite_full_2026-03-30 (1).json'
  );

const inputPath = path.isAbsolute(inputFile) ? inputFile : path.join(__dirname, inputFile);
const raw = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const items = raw.categories?.expression_ecrite?.items;

if (!Array.isArray(items)) {
  throw new Error('Input file does not contain categories.expression_ecrite.items');
}

const stats = {
  artifactCuts: 0,
  titleNormalizations: 0,
  examples: [],
  titleExamples: [],
};

const cleanedItems = items.map((item) => normalizeTitle(
  walkAndClean(item, stats, item.id),
  stats
));

const cleaned = {
  ...raw,
  categories: {
    ...raw.categories,
    expression_ecrite: {
      ...raw.categories.expression_ecrite,
      items: cleanedItems,
    },
  },
};

const dateMatch = path.basename(inputPath).match(/(\d{4}-\d{2}-\d{2})/);
const datePart = dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10);
const outputFile = `tcf_expression_ecrite_full_clean_${datePart}.json`;
const outputPath = path.join(__dirname, outputFile);

fs.writeFileSync(outputPath, JSON.stringify(cleaned, null, 2), 'utf8');

const remainingArtifacts = countEmbeddedArtifacts(cleanedItems);
const remainingTitleMismatches = countTitleMismatches(cleanedItems);

console.log(`Input: ${path.basename(inputPath)}`);
console.log(`Output: ${outputFile}`);
console.log(`Items: ${cleanedItems.length}`);
console.log(`Artifact cuts: ${stats.artifactCuts}`);
console.log(`Title normalizations: ${stats.titleNormalizations}`);
console.log(`Remaining embedded T-markers: ${remainingArtifacts}`);
console.log(`Remaining title/order mismatches: ${remainingTitleMismatches}`);

if (stats.examples.length > 0) {
  console.log('\nArtifact examples:');
  stats.examples.forEach((example) => {
    console.log(`- ID ${example.id} | ${example.field} | removed ${example.removedChars} chars`);
  });
}

if (stats.titleExamples.length > 0) {
  console.log('\nTitle examples:');
  stats.titleExamples.forEach((example) => {
    console.log(`- ID ${example.id} | ${example.month} | ${example.from} -> ${example.to}`);
  });
}
