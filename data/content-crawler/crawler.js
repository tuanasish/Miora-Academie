// =============================================================
// 🚀 TCF Canada Content Crawler - Console Script
// =============================================================
// CÁCH DÙNG:
// 1. Mở website https://app.formation-tcfcanada.com/ (đã đăng nhập)
// 2. Bấm F12 → Console
// 3. Nếu browser yêu cầu, gõ "allow pasting" rồi Enter
// 4. Copy TOÀN BỘ nội dung file này, paste vào Console, bấm Enter
// 5. Chờ script chạy xong → file JSON sẽ tự tải về
// =============================================================

(async function () {
  'use strict';

  // ── CẤU HÌNH ─────────────────────────────────────────────
  const CONFIG = {
    delay: 1500,           // ms giữa mỗi request (tránh bị chặn)
    maxTestsPerCategory: 60, // thử tối đa bao nhiêu test (sẽ dừng sớm nếu hết)
    categories: [
      { key: 'comprehension_ecrite', slug: 'comprehension-ecrite', label: '📖 Compréhension Écrite' },
      { key: 'comprehension_orale', slug: 'comprehension-orale', label: '🎧 Compréhension Orale' },
      { key: 'expression_ecrite', slug: 'expression-ecrite', label: '✍️ Expression Écrite' },
      { key: 'expression_orale', slug: 'expression-orale', label: '🗣️ Expression Orale' },
    ],
  };

  // ── HELPER FUNCTIONS ──────────────────────────────────────
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /**
   * Trích xuất dữ liệu quiz từ HTML page.
   * Data nằm trong self.__next_f.push([1, "..."]) dưới dạng RSC payload.
   */
  function extractQuizData(html) {
    // Tìm tất cả self.__next_f.push([1,"..."]) trong HTML
    // Cần tìm cái chứa "questions" hoặc "QuizPlayer"
    const pushPattern = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
    let match;

    while ((match = pushPattern.exec(html)) !== null) {
      const rawContent = match[1];

      // Kiểm tra nhanh: có chứa quiz data không?
      if (!rawContent.includes('\\"questions\\"')) continue;

      try {
        // Unescape JavaScript string: \" → " và \\ → \ và \\n → newline
        const unescaped = JSON.parse('"' + rawContent + '"');

        // RSC format: mỗi dòng là 1 entry, format "id:content"
        const lines = unescaped.split('\n').filter((l) => l.trim());

        for (const line of lines) {
          if (!line.includes('"questions":[')) continue;

          // Tìm vị trí bắt đầu "series":{ trong dòng RSC
          const seriesIdx = line.indexOf('"series":{');
          if (seriesIdx === -1) continue;

          // Tìm opening brace { trước "series"
          // Object chứa series bắt đầu từ { trước "series"
          let openBrace = seriesIdx;
          for (let i = seriesIdx - 1; i >= 0; i--) {
            if (line[i] === '{') {
              openBrace = i;
              break;
            }
          }

          // Track brackets để tìm matching closing brace
          let depth = 0;
          let inString = false;
          let end = -1;

          for (let j = openBrace; j < line.length; j++) {
            const c = line[j];

            if (inString) {
              if (c === '\\') {
                j++; // skip escaped char
                continue;
              }
              if (c === '"') inString = false;
              continue;
            }

            if (c === '"') {
              inString = true;
              continue;
            }
            if (c === '{' || c === '[') depth++;
            if (c === '}' || c === ']') {
              depth--;
              if (depth === 0) {
                end = j + 1;
                break;
              }
            }
          }

          if (end > 0) {
            const jsonStr = line.substring(openBrace, end);
            try {
              const data = JSON.parse(jsonStr);
              if (data.series && data.questions) {
                return data;
              }
            } catch (e) {
              // Try fallback: extract series and questions separately
              console.warn('⚠️ JSON parse failed, trying fallback...');
            }
          }
        }
      } catch (e) {
        // Skip invalid push content
      }
    }

    // Fallback: try regex on raw HTML (double-escaped format)
    return extractQuizDataFallback(html);
  }

  /**
   * Fallback parser: dùng regex trên raw HTML
   */
  function extractQuizDataFallback(html) {
    try {
      // Tìm series object (đơn giản, không nested)
      const seriesMatch = html.match(
        /\\"series\\":\{((?:[^{}]|\\\\")*?)\},\\"questions\\":/
      );
      if (!seriesMatch) return null;

      // Tìm questions array - từ "questions":[ đến ],"basePath"
      const qStart = html.indexOf('\\"questions\\":[', seriesMatch.index);
      if (qStart === -1) return null;

      const basePathMarker = '],\\"basePath\\"';
      const qEnd = html.indexOf(basePathMarker, qStart);
      if (qEnd === -1) return null;

      const questionsRaw = html.substring(
        qStart + '\\"questions\\":['.length,
        qEnd
      );

      // Unescape
      const seriesStr =
        '{' + seriesMatch[1].replace(/\\\\"/g, '"').replace(/\\\\\\\\/g, '\\') + '}';
      const questionsStr =
        '[' +
        questionsRaw.replace(/\\\\"/g, '"').replace(/\\\\\\\\/g, '\\') +
        ']';

      return {
        series: JSON.parse(seriesStr),
        questions: JSON.parse(questionsStr),
      };
    } catch (e) {
      return null;
    }
  }

  // ── MAIN CRAWLER ──────────────────────────────────────────
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   🚀 TCF Canada Content Crawler v1.0        ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  const allData = {
    crawledAt: new Date().toISOString(),
    source: 'https://app.formation-tcfcanada.com',
    categories: {},
  };

  let totalTests = 0;
  let totalQuestions = 0;

  for (const cat of CONFIG.categories) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`${cat.label} - Bắt đầu crawl...`);
    console.log(`${'─'.repeat(50)}`);

    const tests = [];
    let consecutiveFailures = 0;

    for (let i = 1; i <= CONFIG.maxTestsPerCategory; i++) {
      const url = `/epreuve/${cat.slug}/entrainement/${cat.slug}-test-${i}`;

      try {
        const resp = await fetch(url, { credentials: 'include' });

        if (resp.status === 404) {
          console.log(`   ⏹️ Test ${i}: 404 - Hết test cho ${cat.label}`);
          break;
        }

        if (!resp.ok) {
          console.warn(`   ⚠️ Test ${i}: HTTP ${resp.status}`);
          consecutiveFailures++;
          if (consecutiveFailures >= 3) {
            console.log(`   ⏹️ 3 lỗi liên tiếp - Dừng ${cat.label}`);
            break;
          }
          await wait(CONFIG.delay);
          continue;
        }

        const html = await resp.text();

        // Kiểm tra nếu bị redirect về trang login
        if (html.includes('/connexion') && !html.includes('"questions"')) {
          console.error('   🔒 Session hết hạn! Hãy refresh trang rồi chạy lại.');
          return;
        }

        const data = extractQuizData(html);

        if (data && data.questions && data.questions.length > 0) {
          tests.push({
            testNumber: i,
            series: data.series,
            questions: data.questions.map((q) => ({
              id: q.id,
              orderIndex: q.orderIndex,
              level: q.level,
              points: q.points,
              imageUrl: q.imageUrl,
              audioUrl: q.audioUrl,
              prompt: q.prompt,
              options: q.options,
              correctAnswerIndex: q.correctAnswerIndex,
              explanation: q.explanation,
            })),
          });

          totalQuestions += data.questions.length;
          consecutiveFailures = 0;

          console.log(
            `   ✅ Test ${i}: ${data.questions.length} câu hỏi ` +
              `(${data.questions[0]?.level} → ${data.questions[data.questions.length - 1]?.level})`
          );
        } else {
          console.warn(`   ⚠️ Test ${i}: Không tìm thấy quiz data`);
          consecutiveFailures++;
          if (consecutiveFailures >= 3) {
            console.log(`   ⏹️ 3 lần không có data - Dừng ${cat.label}`);
            break;
          }
        }
      } catch (e) {
        console.error(`   ❌ Test ${i}: ${e.message}`);
        consecutiveFailures++;
        if (consecutiveFailures >= 3) break;
      }

      await wait(CONFIG.delay);
    }

    allData.categories[cat.key] = {
      label: cat.label,
      totalTests: tests.length,
      totalQuestions: tests.reduce((sum, t) => sum + t.questions.length, 0),
      tests: tests,
    };

    totalTests += tests.length;
    console.log(`\n   📊 ${cat.label}: ${tests.length} tests crawled`);
  }

  // ── TẢI FILE JSON ─────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log(`📊 TỔNG KẾT:`);
  console.log(`   • Tests: ${totalTests}`);
  console.log(`   • Câu hỏi: ${totalQuestions}`);
  console.log('═'.repeat(50));

  // Download JSON
  const jsonStr = JSON.stringify(allData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = `tcf_canada_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(downloadUrl);

  console.log(`\n🎉 HOÀN TẤT! File JSON đã tải về: ${a.download}`);
  console.log(`   Dung lượng: ~${(jsonStr.length / 1024).toFixed(1)} KB`);

  // Cũng lưu vào biến global để truy cập
  window.__TCF_DATA = allData;
  console.log('💡 Data cũng được lưu tại: window.__TCF_DATA');
})();
