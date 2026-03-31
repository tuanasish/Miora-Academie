// =============================================================
// 🚀 TCF Canada Expression Écrite Crawler
// =============================================================
// Crawl only Expression Écrite
// Paste vào Console khi đang ở trang formation-tcfcanada.com
// =============================================================

(async function () {
  'use strict';

  const DELAY = 1500;
  const FETCH_TIMEOUT = 15000;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const MONTH_SLUGS = [
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
  ];

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🚀 TCF Expression Écrite Crawler         ║');
  console.log('╚══════════════════════════════════════════════╝');

  async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  // ── BƯỚC 1: TÌM TẤT CẢ SIMULATEUR IDs ────────────────────
  async function discoverSimulateurIds(catSlug) {
    const simulateurIds = new Set();
    const sujets = [...MONTH_SLUGS];

    console.log(`   🔎 Discovery ${sujets.length} tháng...`);

    for (let i = 0; i < sujets.length; i++) {
      const sujet = sujets[i];
      console.log(`   ⏳ [${i + 1}/${sujets.length}] ${sujet}`);
      try {
        const before = simulateurIds.size;
        const resp = await fetchWithTimeout(
          `/epreuve/${catSlug}/sujets-actualites/${sujet}`,
          { credentials: 'include' }
        );
        if (!resp.ok) {
          console.warn(`   ⚠️ Sujet ${sujet}: HTTP ${resp.status}`);
          continue;
        }

        const html = await resp.text();
        [...html.matchAll(/simulateur\/(\d+)/g)]
          .map((m) => parseInt(m[1], 10))
          .forEach((id) => simulateurIds.add(id));

        const added = simulateurIds.size - before;
        console.log(`   ✅ ${sujet}: +${added} simulateurs (total ${simulateurIds.size})`);
      } catch (e) {
        const message = e.name === 'AbortError'
          ? `Timeout sau ${FETCH_TIMEOUT / 1000}s`
          : e.message;
        console.warn(`   ⚠️ Discovery ${sujet}: ${message}`);
      }

      await wait(300);
    }

    return {
      simulateurIds: [...simulateurIds].sort((a, b) => a - b),
      sujets,
    };
  }

  // ── BƯỚC 2: PARSER RSC EXPRESSION DATA ─────────────────────
  function extractExpressionData(html) {
    const pushPattern = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
    let match;
    let allChunks = {};

    // First pass: collect all RSC chunks
    while ((match = pushPattern.exec(html)) !== null) {
      try {
        const unescaped = JSON.parse('"' + match[1] + '"');
        const lines = unescaped.split('\n').filter((l) => l.trim());

        for (const line of lines) {
          // Parse RSC line format: "id:content"
          const colonIdx = line.indexOf(':');
          if (colonIdx > 0 && colonIdx < 5) {
            const id = line.substring(0, colonIdx);
            const content = line.substring(colonIdx + 1);
            allChunks[id] = content;
          }
        }
      } catch (e) { /* skip */ }
    }

    // Second pass: find the chunk with "combinaison"
    for (const [id, content] of Object.entries(allChunks)) {
      if (!content.includes('"combinaison"')) continue;

      try {
        // Find the combinaison object
        const combIdx = content.indexOf('"combinaison":{');
        if (combIdx === -1) continue;

        // Find the opening brace of the parent object
        let openBrace = combIdx;
        for (let i = combIdx - 1; i >= 0; i--) {
          if (content[i] === '{') { openBrace = i; break; }
        }

        // Track brackets to find matching close
        let depth = 0, inStr = false, end = -1;
        for (let j = openBrace; j < content.length; j++) {
          const c = content[j];
          if (inStr) {
            if (c === '\\') { j++; continue; }
            if (c === '"') inStr = false;
            continue;
          }
          if (c === '"') { inStr = true; continue; }
          if (c === '{' || c === '[') depth++;
          if (c === '}' || c === ']') {
            depth--;
            if (depth === 0) { end = j + 1; break; }
          }
        }

        if (end > 0) {
          const jsonStr = content.substring(openBrace, end);
          const data = JSON.parse(jsonStr);

          if (data.combinaison) {
            // Resolve $-references for tache3Correction
            const comb = data.combinaison;
            if (typeof comb.tache3Correction === 'string' && comb.tache3Correction.startsWith('$')) {
              const refId = comb.tache3Correction.substring(1);
              if (allChunks[refId]) {
                try {
                  comb.tache3Correction = JSON.parse(allChunks[refId]);
                } catch (e) {
                  comb.tache3Correction = allChunks[refId];
                }
              }
            }
            return data;
          }
        }
      } catch (e) { /* skip */ }
    }

    return null;
  }

  // ── BƯỚC 3: CRAWL ─────────────────────────────────────────
  const allData = {
    crawledAt: new Date().toISOString(),
    source: 'https://app.formation-tcfcanada.com',
    categories: {},
  };

  const categories = [
    { key: 'expression_ecrite', slug: 'expression-ecrite', label: '✍️ Expression Écrite' },
  ];

  let grandTotal = 0;

  for (const cat of categories) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`${cat.label} - Đang tìm simulateurs...`);

    const { simulateurIds, sujets } = await discoverSimulateurIds(cat.slug);
    console.log(`   📋 Tìm thấy ${simulateurIds.length} simulateurs`);
    if (sujets.length > 0) console.log(`   📋 Tìm thấy ${sujets.length} sujets-actualites`);

    const items = [];

    // Crawl simulateurs
    if (simulateurIds.length > 0) {
      console.log(`\n${cat.label} - Crawl ${simulateurIds.length} simulateurs...`);

      for (let i = 0; i < simulateurIds.length; i++) {
        const simId = simulateurIds[i];
        const url = `/epreuve/${cat.slug}/simulateur/${simId}`;

        try {
          console.log(`   ⏳ [${i + 1}/${simulateurIds.length}] Simulateur ${simId}`);
          const resp = await fetchWithTimeout(url, { credentials: 'include' });
          if (!resp.ok) {
            console.warn(`   ⚠️ Simulateur ${simId}: HTTP ${resp.status}`);
            continue;
          }

          const html = await resp.text();
          if (html.includes('/connexion') && !html.includes('"combinaison"')) {
            console.error('   🔒 Session hết hạn!');
            return;
          }

          const data = extractExpressionData(html);
          if (data && data.combinaison) {
            items.push(data.combinaison);
            console.log(
              `   ✅ [${i + 1}/${simulateurIds.length}] ID ${simId}: ${data.combinaison.titre} (${data.combinaison.monthName})`
            );
          } else {
            console.warn(`   ⚠️ [${i + 1}/${simulateurIds.length}] ID ${simId}: Không có data`);
          }
        } catch (e) {
          console.error(`   ❌ ID ${simId}: ${e.message}`);
        }

        await wait(DELAY);
      }
    }

    // Crawl sujets-actualites
    if (sujets.length > 0) {
      console.log(`\n${cat.label} - Crawl ${sujets.length} sujets-actualites...`);

      for (let i = 0; i < sujets.length; i++) {
        const sujet = sujets[i];
        const url = `/epreuve/${cat.slug}/sujets-actualites/${sujet}`;

        try {
          console.log(`   ⏳ [${i + 1}/${sujets.length}] Sujet ${sujet}`);
          const resp = await fetchWithTimeout(url, { credentials: 'include' });
          if (!resp.ok) continue;

          const html = await resp.text();
          const data = extractExpressionData(html);
          if (data && data.combinaison) {
            // Avoid duplicates
            if (!items.find((it) => it.id === data.combinaison.id)) {
              items.push(data.combinaison);
              console.log(`   ✅ [${i + 1}/${sujets.length}] ${sujet}: ${data.combinaison.titre || sujet}`);
            }
          }
        } catch (e) { /* skip */ }

        await wait(DELAY);
      }
    }

    allData.categories[cat.key] = {
      label: cat.label,
      totalItems: items.length,
      items: items,
    };

    grandTotal += items.length;
    console.log(`\n   📊 ${cat.label}: ${items.length} combinaisons crawled`);
  }

  // ── BƯỚC 4: TẢI FILE ──────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log(`📊 TỔNG KẾT: ${grandTotal} combinaisons`);
  console.log('═'.repeat(50));

  window.__TCF_EXPRESSION_ECRITE = allData;
  console.log('💾 Data lưu tại window.__TCF_EXPRESSION_ECRITE');

  try {
    const jsonStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tcf_expression_ecrite_${new Date().toISOString().slice(0, 10)}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { a.remove(); }, 5000);
    console.log(`\n🎉 File đã tải: ${a.download} (~${(jsonStr.length / 1024).toFixed(1)} KB)`);
  } catch (e) {
    console.error('❌ Download fail. Gõ lệnh sau:');
    console.log('var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(window.__TCF_EXPRESSION_ECRITE,null,2)]));a.download="expression_ecrite.json";a.click();');
  }
})();
