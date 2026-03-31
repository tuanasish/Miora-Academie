// =============================================================
// 🚀 TCF Canada Content Crawler v2.0 - FINAL
// =============================================================
// CÁCH DÙNG:
// 1. Mở https://app.formation-tcfcanada.com/ (đã đăng nhập)
// 2. F12 → Console → gõ "allow pasting" nếu cần
// 3. Paste TOÀN BỘ file này → Enter
// 4. Chờ → file JSON tự tải về
// =============================================================

(async function () {
  'use strict';

  const DELAY = 1500;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ── BƯỚC 1: TÌM TẤT CẢ SLUG CHÍNH XÁC ──────────────────
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🚀 TCF Canada Crawler v2.0 - FINAL        ║');
  console.log('╚══════════════════════════════════════════════╝');

  const categories = [
    { key: 'comprehension_ecrite', slug: 'comprehension-ecrite', label: '📖 Compréhension Écrite' },
    { key: 'comprehension_orale', slug: 'comprehension-orale', label: '🎧 Compréhension Orale' },
  ];

  // Tự động tìm slug từ trang series
  async function discoverSlugs(catSlug) {
    try {
      const resp = await fetch(`/epreuve/${catSlug}/series`, { credentials: 'include' });
      if (!resp.ok) return [];
      const html = await resp.text();
      const matches = [...html.matchAll(/entrainement\/([\w-]+)/g)].map((m) => m[1]);
      return [...new Set(matches)];
    } catch (e) {
      console.error(`❌ Không tìm được slugs cho ${catSlug}:`, e.message);
      return [];
    }
  }

  // ── BƯỚC 2: PARSER RSC DATA ───────────────────────────────
  function extractQuizData(html) {
    const pushPattern = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
    let match;

    while ((match = pushPattern.exec(html)) !== null) {
      const rawContent = match[1];
      if (!rawContent.includes('\\"questions\\"')) continue;

      try {
        const unescaped = JSON.parse('"' + rawContent + '"');
        const lines = unescaped.split('\n').filter((l) => l.trim());

        for (const line of lines) {
          if (!line.includes('"questions":[')) continue;

          const seriesIdx = line.indexOf('"series":{');
          if (seriesIdx === -1) continue;

          // Tìm opening brace trước "series"
          let openBrace = seriesIdx;
          for (let i = seriesIdx - 1; i >= 0; i--) {
            if (line[i] === '{') { openBrace = i; break; }
          }

          // Track brackets
          let depth = 0, inStr = false, end = -1;
          for (let j = openBrace; j < line.length; j++) {
            const c = line[j];
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
            try {
              const data = JSON.parse(line.substring(openBrace, end));
              if (data.series && data.questions) return data;
            } catch (e) { /* skip */ }
          }
        }
      } catch (e) { /* skip */ }
    }
    return null;
  }

  // ── BƯỚC 3: CRAWL ────────────────────────────────────────
  const allData = {
    crawledAt: new Date().toISOString(),
    source: 'https://app.formation-tcfcanada.com',
    categories: {},
  };

  let grandTotalTests = 0;
  let grandTotalQuestions = 0;

  for (const cat of categories) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`${cat.label} - Đang tìm danh sách tests...`);

    // Tìm tất cả slug
    const slugs = await discoverSlugs(cat.slug);
    console.log(`   📋 Tìm thấy ${slugs.length} tests`);

    if (slugs.length === 0) {
      allData.categories[cat.key] = { label: cat.label, totalTests: 0, totalQuestions: 0, tests: [] };
      continue;
    }

    console.log(`${cat.label} - Bắt đầu crawl ${slugs.length} tests...`);
    console.log(`${'─'.repeat(50)}`);

    const tests = [];

    for (let i = 0; i < slugs.length; i++) {
      const slug = slugs[i];
      const url = `/epreuve/${cat.slug}/entrainement/${slug}`;

      try {
        const resp = await fetch(url, { credentials: 'include' });

        if (!resp.ok) {
          console.warn(`   ⚠️ ${slug}: HTTP ${resp.status}`);
          await wait(DELAY);
          continue;
        }

        const html = await resp.text();

        // Check session expired
        if (html.includes('/connexion') && !html.includes('"questions"')) {
          console.error('   🔒 Session hết hạn! Refresh trang rồi chạy lại.');
          return;
        }

        const data = extractQuizData(html);

        if (data && data.questions && data.questions.length > 0) {
          tests.push({
            testNumber: i + 1,
            slug: slug,
            series: data.series,
            questions: data.questions,
          });
          console.log(
            `   ✅ [${i + 1}/${slugs.length}] ${slug}: ${data.questions.length} câu ` +
            `(${data.questions[0]?.level} → ${data.questions[data.questions.length - 1]?.level})`
          );
        } else {
          console.warn(`   ⚠️ [${i + 1}/${slugs.length}] ${slug}: Không tìm thấy data`);
        }
      } catch (e) {
        console.error(`   ❌ [${i + 1}/${slugs.length}] ${slug}: ${e.message}`);
      }

      await wait(DELAY);
    }

    const totalQ = tests.reduce((sum, t) => sum + t.questions.length, 0);
    allData.categories[cat.key] = {
      label: cat.label,
      totalTests: tests.length,
      totalQuestions: totalQ,
      tests: tests,
    };

    grandTotalTests += tests.length;
    grandTotalQuestions += totalQ;

    console.log(`\n   📊 ${cat.label}: ${tests.length}/${slugs.length} tests, ${totalQ} câu hỏi`);
  }

  // ── BƯỚC 4: TẢI FILE ─────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log('📊 TỔNG KẾT:');
  console.log(`   • Tests: ${grandTotalTests}`);
  console.log(`   • Câu hỏi: ${grandTotalQuestions}`);
  console.log('═'.repeat(50));

  // Lưu vào global trước (phòng download fail)
  window.__TCF_DATA = allData;
  console.log('💾 Data đã lưu tại window.__TCF_DATA');

  // Download JSON
  try {
    const jsonStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tcf_canada_full_${new Date().toISOString().slice(0, 10)}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Cleanup sau 5s
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 5000);

    console.log(`\n🎉 HOÀN TẤT! File đã tải: ${a.download}`);
    console.log(`   Dung lượng: ~${(jsonStr.length / 1024).toFixed(1)} KB`);
  } catch (e) {
    console.error('❌ Download thất bại:', e.message);
    console.log('💡 Chạy lệnh sau để tải lại:');
    console.log('   var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(window.__TCF_DATA,null,2)]));a.download="tcf_data.json";a.click();');
  }

  console.log('\n💡 Nếu file không tải được, chạy lệnh này trong Console:');
  console.log('   var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(window.__TCF_DATA,null,2)]));a.download="tcf_data.json";a.click();');
})();
