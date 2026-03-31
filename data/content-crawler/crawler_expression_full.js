// =============================================================
// 🚀 TCF Expression Écrite FULL Crawler v3
// =============================================================
// Crawl TẤT CẢ combinaisons từ sujets-actualites + simulateurs
// chỉ cho Expression Écrite.
//
// Bản v3 dùng parser RSC kiểu "full stream" giống crawler_orale.js:
// - bắt đủ self.__next_f.push(...)
// - tách chunk + orphan text blocks
// - resolve $refs / T-refs đệ quy
// - merge dữ liệu từ page tháng và page simulateur
// - in quality report cuối để kiểm nhanh dữ liệu còn lỗi hay không
// =============================================================

(async function () {
  'use strict';

  const DELAY = 1200;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   🚀 TCF Expression Écrite FULL Crawler v3      ║');
  console.log('║   Full-stream parser + recursive ref resolver   ║');
  console.log('╚══════════════════════════════════════════════════╝');

  const categories = [
    { key: 'expression_ecrite', slug: 'expression-ecrite', label: '✍️ Expression Écrite' },
  ];

  const MONTH_SLUGS_BY_CATEGORY = {
    'expression-ecrite': [
      'httpsstaging-tcf-canada-nextbendevaiepreuveexpression-ecritesujets-actualitesjanvier-2026',
      'fvrier-2026',
      'mars-2026',
      'janvier-2025',
      'mars-2025',
      'avril-2025',
      'mai-2025',
      'juin-2025',
      'juillet-2025',
      'aout-2025',
      'septembre-2025',
      'octobre-2025',
      'novembre-2025',
      'decembre-2025',
      'juillet-2024',
      'aout-2024',
      'septembre-2024',
      'octobre-2024',
      'novembre-2024',
      'decembre-2024',
    ],
  };

  function buildMonthSlugs(catSlug) {
    return [...(MONTH_SLUGS_BY_CATEGORY[catSlug] || [])];
  }

  function extractPushBlocks(html) {
    const marker = 'self.__next_f.push([';
    const blocks = [];
    let searchFrom = 0;

    while (true) {
      const start = html.indexOf(marker, searchFrom);
      if (start === -1) break;

      const bracketStart = start + marker.length;
      const commaIdx = html.indexOf(',', bracketStart);
      if (commaIdx === -1) {
        searchFrom = bracketStart + 1;
        continue;
      }

      const typeStr = html.substring(bracketStart, commaIdx).trim();
      if (typeStr !== '1') {
        searchFrom = commaIdx + 1;
        continue;
      }

      let quoteStart = commaIdx + 1;
      while (quoteStart < html.length && html[quoteStart] !== '"') quoteStart++;
      if (quoteStart >= html.length) break;

      const contentStart = quoteStart + 1;
      let i = contentStart;
      while (i < html.length) {
        if (html[i] === '\\') {
          i += 2;
          continue;
        }
        if (html[i] === '"') {
          blocks.push(html.substring(contentStart, i));
          break;
        }
        i++;
      }

      searchFrom = i + 1;
    }

    return blocks;
  }

  function tryUnescape(raw) {
    try {
      return JSON.parse('"' + raw + '"');
    } catch (e) {
      return raw.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
  }

  function detectChunkHeader(line) {
    const colonIdx = line.indexOf(':');
    if (colonIdx <= 0 || colonIdx > 12) return null;
    const id = line.substring(0, colonIdx);
    if (!/^[0-9a-f]+$/i.test(id)) return null;
    if (line.length <= colonIdx + 1 || line[colonIdx + 1] === ' ') return null;
    return { id, content: line.substring(colonIdx + 1) };
  }

  function buildRscState(html) {
    const rawBlocks = extractPushBlocks(html);
    const unescapedBlocks = rawBlocks.map(tryUnescape);
    const fullStream = unescapedBlocks.join('');
    const allChunks = {};
    const textBlocks = [];

    unescapedBlocks.forEach((text, blockIndex) => {
      let fixedText = text.replace(/([0-9a-f]{1,8}:T[0-9a-f]{1,8},)/gi, '\n$1');
      fixedText = fixedText.replace(
        /(\}|\]|"|\.)([0-9a-f]{1,8}:(?:\[|\{|"|I\[|HL\[|\$|T[0-9a-f]+,))/gi,
        '$1\n$2'
      );

      const lines = fixedText.split('\n');
      let currentId = null;
      let chunkLines = 0;

      for (const line of lines) {
        const header = detectChunkHeader(line);
        if (header) {
          currentId = header.id;
          allChunks[currentId] = { content: header.content, blockIndex };
          chunkLines++;
          continue;
        }

        if (currentId !== null) {
          allChunks[currentId].content += '\n' + line;
          chunkLines++;
        }
      }

      if (chunkLines === 0 && text.trim().length > 20) {
        textBlocks.push({ blockIndex, text });
      }
    });

    return { rawBlocks, unescapedBlocks, fullStream, allChunks, textBlocks };
  }

  function findBalancedJsonEnd(text, startIndex) {
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = startIndex; i < text.length; i++) {
      const ch = text[i];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === '\\') {
        escaped = true;
        continue;
      }

      if (inString) {
        if (ch === '"') inString = false;
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }

      if (ch === '{' || ch === '[') depth++;
      if (ch === '}' || ch === ']') {
        depth--;
        if (depth === 0) return i + 1;
      }
    }

    return -1;
  }

  function extractCombinaisonEntries(rscState) {
    const entries = [];
    const seen = new Set();

    for (const [chunkId, chunkData] of Object.entries(rscState.allChunks)) {
      const content = chunkData.content;
      let searchFrom = 0;

      while (true) {
        const combIdx = content.indexOf('"combinaison":{', searchFrom);
        if (combIdx === -1) break;

        let openBrace = combIdx;
        for (let i = combIdx - 1; i >= 0; i--) {
          if (content[i] === '{') {
            openBrace = i;
            break;
          }
        }

        const end = findBalancedJsonEnd(content, openBrace);
        if (end === -1) break;

        try {
          const parsed = JSON.parse(content.substring(openBrace, end));
          if (parsed && parsed.combinaison) {
            const comb = parsed.combinaison;
            const signature = [
              comb.id ?? '',
              comb.monthName ?? '',
              comb.orderIndex ?? '',
              comb.titre ?? '',
              chunkId,
            ].join('::');

            if (!seen.has(signature)) {
              seen.add(signature);
              entries.push({
                combination: comb,
                chunkId,
                blockIndex: chunkData.blockIndex,
              });
            }
          }
        } catch (e) {
          // Skip malformed candidate and continue.
        }

        searchFrom = combIdx + 13;
      }
    }

    return entries;
  }

  function extractMonthDataEntries(rscState) {
    const entries = [];
    const seen = new Set();

    for (const [chunkId, chunkData] of Object.entries(rscState.allChunks)) {
      const content = chunkData.content;
      let searchFrom = 0;

      while (true) {
        const monthIdx = content.indexOf('"monthData":{', searchFrom);
        if (monthIdx === -1) break;

        let openBrace = monthIdx;
        for (let i = monthIdx - 1; i >= 0; i--) {
          if (content[i] === '{') {
            openBrace = i;
            break;
          }
        }

        const end = findBalancedJsonEnd(content, openBrace);
        if (end === -1) break;

        try {
          const parsed = JSON.parse(content.substring(openBrace, end));
          const monthData = parsed?.monthData;

          if (monthData && Array.isArray(monthData.combinaisons)) {
            const signature = [
              monthData.name ?? '',
              monthData.year ?? '',
              monthData.combinaisons.length,
              chunkId,
            ].join('::');

            if (!seen.has(signature)) {
              seen.add(signature);
              entries.push({
                monthData,
                chunkId,
                blockIndex: chunkData.blockIndex,
              });
            }
          }
        } catch (e) {
          // Skip malformed candidate and continue.
        }

        searchFrom = monthIdx + 11;
      }
    }

    return entries;
  }

  function isPlainObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value);
  }

  function normalizeText(value) {
    if (typeof value !== 'string') return value;
    return value
      .replace(/\r/g, '')
      .replace(/\t+/g, ' ')
      .replace(/[ \u00A0]+\n/g, '\n')
      .replace(/\n[ \u00A0]+/g, '\n')
      .trim();
  }

  function cleanExtractedText(value) {
    if (typeof value !== 'string') return value;
    return normalizeText(
      value
        .replace(/(?:^|\n)[0-9a-f]{1,8}:(?=(?:T[0-9a-f]{1,8},|\$|"|\{|\[|I\[|HL\[))/gi, '\n')
        .replace(/\n{3,}/g, '\n\n')
    );
  }

  function looksLikeRscRef(value, rscState) {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (trimmed === '$undefined') return true;
    if (!/^\$[0-9a-f]+$/i.test(trimmed)) return false;
    const refId = trimmed.substring(1);
    return Boolean(rscState.allChunks[refId] || rscState.fullStream.includes(`${refId}:`));
  }

  function extractTextFromFullStream(refId, sizeHex, rscState) {
    const marker = `${refId}:T${sizeHex},`;
    const pos = rscState.fullStream.indexOf(marker);
    if (pos === -1) return null;

    const expectedSize = parseInt(sizeHex, 16);
    if (!Number.isFinite(expectedSize) || expectedSize <= 0) return null;

    return rscState.fullStream.substring(pos + marker.length, pos + marker.length + expectedSize);
  }

  function nearestTextBlock(blockIndex, rscState) {
    for (let offset = 1; offset <= 3; offset++) {
      const found = rscState.textBlocks.find((tb) => tb.blockIndex === blockIndex + offset);
      if (found && found.text.trim().length > 20) return found.text;
    }
    return null;
  }

  function resolveTRefChunk(refId, chunkData, rscState) {
    const raw = chunkData.content.trim();
    const match = raw.match(/^T([0-9a-f]+),(.*)$/is);
    if (!match) return raw;

    const sizeHex = match[1];
    const inlineText = normalizeText(match[2] || '');
    const expectedSize = parseInt(sizeHex, 16);

    if (inlineText && inlineText.length >= Math.max(80, Math.min(expectedSize * 0.4, 300))) {
      return cleanExtractedText(inlineText);
    }

    let body = nearestTextBlock(chunkData.blockIndex, rscState);
    if (!body) body = extractTextFromFullStream(refId, sizeHex, rscState);
    body = cleanExtractedText(body || '');

    if (body) {
      if (inlineText && inlineText.length < 140) {
        const startsWithTitle = body.toLowerCase().startsWith(inlineText.toLowerCase());
        return startsWithTitle ? body : `${inlineText}\n\n${body}`.trim();
      }
      return body;
    }

    return inlineText || raw.replace(/^T[0-9a-f]+,/i, '').trim();
  }

  function resolveChunkById(refId, rscState, stack) {
    if (stack.has(refId)) return `$${refId}`;
    stack.add(refId);

    const chunkData = rscState.allChunks[refId];
    if (!chunkData) {
      const tref = rscState.fullStream.match(new RegExp(`${refId}:T([0-9a-f]+),`, 'i'));
      stack.delete(refId);
      if (tref) {
        const body = cleanExtractedText(extractTextFromFullStream(refId, tref[1], rscState) || '');
        return body || `$${refId}`;
      }
      return `$${refId}`;
    }

    const raw = chunkData.content;
    const trimmed = raw.trim();
    let resolved;

    if (trimmed === '$undefined') {
      resolved = null;
    } else if (looksLikeRscRef(trimmed, rscState)) {
      resolved = resolveChunkById(trimmed.substring(1), rscState, stack);
    } else if (/^T[0-9a-f]+,/i.test(trimmed)) {
      resolved = resolveTRefChunk(refId, chunkData, rscState);
    } else if (trimmed.startsWith('{') || trimmed.startsWith('[') || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
      try {
        resolved = resolveValue(JSON.parse(trimmed), rscState, stack);
      } catch (e) {
        resolved = raw;
      }
    } else {
      resolved = raw;
    }

    stack.delete(refId);
    return resolved;
  }

  function resolveValue(value, rscState, stack = new Set()) {
    if (value === '$undefined') return null;

    if (Array.isArray(value)) {
      return value.map((item) => resolveValue(item, rscState, stack));
    }

    if (isPlainObject(value)) {
      const out = {};
      for (const [key, child] of Object.entries(value)) {
        out[key] = resolveValue(child, rscState, stack);
      }
      return out;
    }

    if (typeof value !== 'string') return value;

    if (looksLikeRscRef(value, rscState)) {
      return resolveChunkById(value.trim().substring(1), rscState, stack);
    }

    if (/^T[0-9a-f]+,/i.test(value.trim())) {
      const fakeChunk = { content: value.trim(), blockIndex: -1 };
      return resolveTRefChunk('inline', fakeChunk, rscState);
    }

    return value;
  }

  function normalizeTree(value) {
    if (Array.isArray(value)) return value.map(normalizeTree);
    if (isPlainObject(value)) {
      const out = {};
      for (const [key, child] of Object.entries(value)) out[key] = normalizeTree(child);
      return out;
    }
    if (typeof value === 'string') return normalizeText(value);
    return value;
  }

  function isPlaceholderString(value) {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    return (
      trimmed === '' ||
      trimmed === '$undefined' ||
      trimmed === 'Correction Tâche 3' ||
      /^\$[0-9a-f]+$/i.test(trimmed) ||
      /^T[0-9a-f]+,/i.test(trimmed)
    );
  }

  function scoreValue(value, path = '') {
    if (value == null) return 0;

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return 0;
      if (trimmed === '$undefined') return 0;
      if (trimmed === 'Correction Tâche 3') return 2;
      if (/^\$[0-9a-f]+$/i.test(trimmed)) return 1;
      if (/^T[0-9a-f]+,/i.test(trimmed)) return 3;
      if (trimmed === 'pour' || trimmed === 'contre') return 15;

      let score = 10 + Math.min(trimmed.length, 2000) / 10;
      if (/correction|contenu/i.test(path)) score += 20;
      if (trimmed.length > 80) score += 10;
      if (trimmed.length > 200) score += 10;
      return score;
    }

    if (Array.isArray(value)) {
      return value.reduce((sum, child, idx) => sum + scoreValue(child, `${path}[${idx}]`), 0);
    }

    if (isPlainObject(value)) {
      return Object.entries(value).reduce(
        (sum, [key, child]) => sum + scoreValue(child, path ? `${path}.${key}` : key),
        0
      );
    }

    return 5;
  }

  function mergeBetter(existing, incoming, path = '') {
    if (existing == null) return incoming;
    if (incoming == null) return existing;

    if (isPlainObject(existing) && isPlainObject(incoming)) {
      const out = { ...existing };
      for (const [key, value] of Object.entries(incoming)) {
        out[key] = mergeBetter(existing[key], value, path ? `${path}.${key}` : key);
      }
      return out;
    }

    if (Array.isArray(existing) && Array.isArray(incoming)) {
      return incoming.length > existing.length ? incoming : existing;
    }

    if (typeof existing === 'string' && typeof incoming === 'string') {
      const existingScore = scoreValue(existing, path);
      const incomingScore = scoreValue(incoming, path);
      if (incomingScore > existingScore) return incoming;
      if (incomingScore < existingScore) return existing;
      return incoming.length > existing.length ? incoming : existing;
    }

    return scoreValue(incoming, path) > scoreValue(existing, path) ? incoming : existing;
  }

  function combinaisonKey(comb) {
    if (comb && comb.id != null) return `id:${comb.id}`;
    return [
      comb?.monthName ?? '',
      comb?.orderIndex ?? '',
      comb?.titre ?? '',
      comb?.monthId ?? '',
    ].join('::');
  }

  function upsertCombination(store, metaStore, comb, sourceTag) {
    const key = combinaisonKey(comb);
    const current = store.get(key);

    if (!current) {
      store.set(key, comb);
      metaStore.set(key, { sources: new Set([sourceTag]), mergeCount: 0 });
      return { inserted: true, merged: false };
    }

    const merged = mergeBetter(current, comb);
    store.set(key, merged);

    const meta = metaStore.get(key) || { sources: new Set(), mergeCount: 0 };
    meta.sources.add(sourceTag);
    meta.mergeCount += 1;
    metaStore.set(key, meta);

    return { inserted: false, merged: true };
  }

  function resolveCombinationEntry(entry, rscState) {
    const resolved = resolveValue(entry.combination, rscState, new Set());
    return normalizeTree(resolved);
  }

  function flattenMonthCombinaison(combination, monthData, index) {
    return normalizeTree({
      id: combination?.id,
      titre: combination?.titre,
      monthId: combination?.monthId,
      monthName: combination?.monthName ?? monthData?.name ?? null,
      monthYear: combination?.monthYear ?? monthData?.year ?? null,
      orderIndex: combination?.orderIndex ?? index + 1,
      tache1Sujet: combination?.tache1?.sujet ?? combination?.tache1Sujet ?? null,
      tache1Correction: combination?.tache1?.correction ?? combination?.tache1Correction ?? null,
      tache2Sujet: combination?.tache2?.sujet ?? combination?.tache2Sujet ?? null,
      tache2Correction: combination?.tache2?.correction ?? combination?.tache2Correction ?? null,
      tache3Titre: combination?.tache3?.titre ?? combination?.tache3Titre ?? null,
      tache3Document1: combination?.tache3?.document1 ?? combination?.tache3Document1 ?? null,
      tache3Document2: combination?.tache3?.document2 ?? combination?.tache3Document2 ?? null,
      tache3Correction: combination?.tache3?.correction ?? combination?.tache3Correction ?? null,
    });
  }

  function resolveMonthDataEntry(entry, rscState) {
    const resolved = normalizeTree(resolveValue(entry.monthData, rscState, new Set()));
    const combinaisons = Array.isArray(resolved?.combinaisons) ? resolved.combinaisons : [];

    return combinaisons
      .map((combination, index) => flattenMonthCombinaison(combination, resolved, index))
      .filter((item) => item && (item.id != null || item.titre || item.tache1Sujet || item.tache2Sujet || item.tache3Titre));
  }

  function qualityReport(items) {
    let missingAnyCorrection = 0;
    let unresolvedDollar = 0;
    let unresolvedT = 0;
    let emptyDocContent = 0;

    for (const item of items) {
      if (
        item.tache1Correction == null ||
        item.tache2Correction == null ||
        item.tache3Correction == null ||
        item.tache1Correction === '' ||
        item.tache2Correction === '' ||
        item.tache3Correction === ''
      ) {
        missingAnyCorrection++;
      }

      const strings = [];
      const walk = (value) => {
        if (typeof value === 'string') strings.push(value);
        else if (Array.isArray(value)) value.forEach(walk);
        else if (isPlainObject(value)) Object.values(value).forEach(walk);
      };
      walk(item);

      if (strings.some((s) => /^\$[0-9a-f]+$/i.test(s.trim()))) unresolvedDollar++;
      if (strings.some((s) => /^T[0-9a-f]+,/i.test(s.trim()))) unresolvedT++;

      if (
        !normalizeText(item?.tache3Document1?.contenu || '') ||
        !normalizeText(item?.tache3Document2?.contenu || '')
      ) {
        emptyDocContent++;
      }
    }

    return { missingAnyCorrection, unresolvedDollar, unresolvedT, emptyDocContent };
  }

  async function fetchHtml(url) {
    const resp = await fetch(url, { credentials: 'include' });
    return { resp, html: await resp.text() };
  }

  const allData = {
    crawledAt: new Date().toISOString(),
    source: 'https://app.formation-tcfcanada.com',
    categories: {},
  };

  let grandTotal = 0;

  for (const cat of categories) {
    console.log(`\n${'═'.repeat(54)}`);
    console.log(`${cat.label} - Discovery + merge crawl`);
    console.log(`${'═'.repeat(54)}`);

    const itemStore = new Map();
    const metaStore = new Map();
    const simulateurIds = new Set();

    let monthPageCount = 0;
    let monthCombCount = 0;
    let simulateurMergeCount = 0;

    const monthSlugs = buildMonthSlugs(cat.slug);
    console.log(`   📅 Scan ${monthSlugs.length} month slugs...`);

    for (let i = 0; i < monthSlugs.length; i++) {
      const monthSlug = monthSlugs[i];
      const url = `/epreuve/${cat.slug}/sujets-actualites/${monthSlug}`;

      try {
        const { resp, html } = await fetchHtml(url);
        if (!resp.ok) {
          await wait(250);
          continue;
        }

        if (html.includes('/connexion') && !html.includes('"combinaison"') && !html.includes('simulateur/')) {
          console.error('   🔒 Session hết hạn! Refresh trang rồi chạy lại.');
          break;
        }

        monthPageCount++;

        const idsBefore = simulateurIds.size;
        [...html.matchAll(/simulateur\/(\d+)/g)].forEach((m) => simulateurIds.add(parseInt(m[1], 10)));
        const newIds = simulateurIds.size - idsBefore;

        const rscState = buildRscState(html);
        const entries = extractCombinaisonEntries(rscState);
        const monthEntries = extractMonthDataEntries(rscState);
        let mergedHere = 0;

        for (const entry of entries) {
          const resolved = resolveCombinationEntry(entry, rscState);
          const result = upsertCombination(itemStore, metaStore, resolved, `month:${monthSlug}`);
          if (result.inserted || result.merged) mergedHere++;
        }

        for (const entry of monthEntries) {
          const resolvedItems = resolveMonthDataEntry(entry, rscState);
          for (const resolved of resolvedItems) {
            const result = upsertCombination(itemStore, metaStore, resolved, `month-data:${monthSlug}`);
            if (result.inserted || result.merged) mergedHere++;
          }
        }

        monthCombCount += mergedHere;

        if (newIds > 0 || mergedHere > 0) {
          console.log(
            `   📅 [${i + 1}/${monthSlugs.length}] ${monthSlug}: +${newIds} simulateurs, ${mergedHere} combinaisons`
          );
        }
      } catch (e) {
        console.warn(`   ⚠️ Month ${monthSlug}: ${e.message}`);
      }

      await wait(250);
    }

    try {
      const mainUrl = `/epreuve/${cat.slug}`;
      const { resp, html } = await fetchHtml(mainUrl);
      if (resp.ok) {
        const idsBefore = simulateurIds.size;
        [...html.matchAll(/simulateur\/(\d+)/g)].forEach((m) => simulateurIds.add(parseInt(m[1], 10)));
        const newIds = simulateurIds.size - idsBefore;

        const rscState = buildRscState(html);
        const entries = extractCombinaisonEntries(rscState);
        const monthEntries = extractMonthDataEntries(rscState);
        let mergedHere = 0;
        for (const entry of entries) {
          const resolved = resolveCombinationEntry(entry, rscState);
          const result = upsertCombination(itemStore, metaStore, resolved, 'main-page');
          if (result.inserted || result.merged) mergedHere++;
        }

        for (const entry of monthEntries) {
          const resolvedItems = resolveMonthDataEntry(entry, rscState);
          for (const resolved of resolvedItems) {
            const result = upsertCombination(itemStore, metaStore, resolved, 'main-page:month-data');
            if (result.inserted || result.merged) mergedHere++;
          }
        }

        if (newIds > 0 || mergedHere > 0) {
          console.log(`   🏠 Main page: +${newIds} simulateurs, ${mergedHere} combinaisons`);
        }
      }
    } catch (e) {
      console.warn(`   ⚠️ Main page discovery failed: ${e.message}`);
    }

    const sortedIds = [...simulateurIds].sort((a, b) => a - b);
    console.log(`\n   📋 Tổng simulateurs tìm thấy: ${sortedIds.length}`);
    console.log(`   📦 Combinaisons có sẵn sau month merge: ${itemStore.size}`);

    for (let i = 0; i < sortedIds.length; i++) {
      const simId = sortedIds[i];
      const url = `/epreuve/${cat.slug}/simulateur/${simId}`;

      try {
        const { resp, html } = await fetchHtml(url);
        if (!resp.ok) {
          console.warn(`   ⚠️ [${i + 1}/${sortedIds.length}] ID ${simId}: HTTP ${resp.status}`);
          await wait(DELAY);
          continue;
        }

        if (html.includes('/connexion') && !html.includes('"combinaison"')) {
          console.error('   🔒 Session hết hạn! Refresh trang rồi chạy lại.');
          break;
        }

        const rscState = buildRscState(html);
        const entries = extractCombinaisonEntries(rscState);

        if (entries.length === 0) {
          console.warn(`   ⚠️ [${i + 1}/${sortedIds.length}] ID ${simId}: No combinaison found`);
          await wait(DELAY);
          continue;
        }

        let mergedHere = 0;
        let sampleTitle = '';

        for (const entry of entries) {
          const resolved = resolveCombinationEntry(entry, rscState);
          sampleTitle = sampleTitle || resolved.titre || `ID ${simId}`;
          const result = upsertCombination(itemStore, metaStore, resolved, `simulateur:${simId}`);
          if (result.inserted || result.merged) mergedHere++;
        }

        simulateurMergeCount += mergedHere;

        if ((i + 1) % 10 === 0 || i === 0 || i === sortedIds.length - 1) {
          console.log(
            `   ✅ [${i + 1}/${sortedIds.length}] ID ${simId}: ${sampleTitle} (${mergedHere} merge/update)`
          );
        }
      } catch (e) {
        console.warn(`   ⚠️ [${i + 1}/${sortedIds.length}] ID ${simId}: ${e.message}`);
      }

      await wait(DELAY);
    }

    const items = [...itemStore.values()].sort((a, b) => {
      if (a.id != null && b.id != null) return a.id - b.id;
      if (a.monthId != null && b.monthId != null && a.monthId !== b.monthId) return a.monthId - b.monthId;
      if (a.orderIndex != null && b.orderIndex != null && a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
      return String(a.titre || '').localeCompare(String(b.titre || ''));
    });

    const quality = qualityReport(items);
    const multiSourceCount = [...metaStore.values()].filter((meta) => meta.sources.size > 1).length;

    allData.categories[cat.key] = {
      label: cat.label,
      totalItems: items.length,
      items,
    };

    grandTotal += items.length;

    console.log(`\n   📊 ${cat.label}: ${items.length} items`);
    console.log(`   • Month pages parsed: ${monthPageCount}`);
    console.log(`   • Month-derived merges: ${monthCombCount}`);
    console.log(`   • Simulateur-derived merges: ${simulateurMergeCount}`);
    console.log(`   • Multi-source items: ${multiSourceCount}`);
    console.log(`   • Missing any correction: ${quality.missingAnyCorrection}`);
    console.log(`   • Unresolved $refs left: ${quality.unresolvedDollar}`);
    console.log(`   • Unresolved T-refs left: ${quality.unresolvedT}`);
    console.log(`   • Empty doc contents left: ${quality.emptyDocContent}`);
  }

  console.log('\n' + '═'.repeat(54));
  console.log(`📊 TỔNG KẾT: ${grandTotal} combinaisons/items`);
  console.log('═'.repeat(54));

  window.__TCF_EXPRESSION_ECRITE_FULL = allData;
  console.log('💾 Data lưu tại window.__TCF_EXPRESSION_ECRITE_FULL');

  try {
    const jsonStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tcf_expression_ecrite_full_${new Date().toISOString().slice(0, 10)}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 5000);
    console.log(`\n🎉 File đã tải: ${a.download} (~${(jsonStr.length / 1024).toFixed(1)} KB)`);
  } catch (e) {
    console.error('❌ Download fail. Dùng lệnh backup:');
    console.log('var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(window.__TCF_EXPRESSION_ECRITE_FULL,null,2)]));a.download="expression_ecrite_full.json";a.click();');
  }
})();
