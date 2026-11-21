/* ============================================================================
 * VSTEP WRITING AI GRADER (MOET Decision 729/QD-BGDDT)
 * Shared drop-in module for English with Miss Nguyet (7 VSTEP Writing Apps)
 * ============================================================================ */
(function (global) {
  'use strict';

  const VSTEP_AI_ENDPOINT =
    'https://script.google.com/macros/s/AKfycbwUNnMInGfNlI4QqWVqqrhOXEYpwRVJ8FFFCdeBtQl8cA4AmoftBDdWnO13DxCnwgjWvg/exec';

  const CACHE_PREFIX = 'vstep_ai_cache_v3_';

  function escHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function simpleHash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  }

  function readCache(key) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function writeCache(key, data) {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
    } catch (e) {
      // Ignore quota errors
    }
  }

  function injectStyles() {
    if (document.getElementById('vstep-ai-grader-styles')) return;
    const style = document.createElement('style');
    style.id = 'vstep-ai-grader-styles';
    style.textContent = `
      .vai-card {
        margin: 18px 0 22px 0;
        border-radius: 16px;
        border: 1.5px solid #cbd5e1;
        background: #ffffff;
        color: #0f172a;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        text-align: left;
      }
      .vai-header {
        background: linear-gradient(135deg, #1e3a8a 0%, #312e81 60%, #4338ca 100%);
        color: #ffffff;
        padding: 18px 22px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .vai-header-title {
        font-size: 1.08rem;
        font-weight: 800;
        letter-spacing: 0.2px;
        margin: 0;
        color: #ffffff;
      }
      .vai-header-sub {
        font-size: 0.84rem;
        opacity: 0.9;
        margin: 3px 0 0 0;
        color: #e0e7ff;
      }
      .vai-btn-retry {
        background: rgba(255, 255, 255, 0.16);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.35);
        border-radius: 999px;
        padding: 7px 14px;
        font-size: 0.83rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
      }
      .vai-btn-retry:hover {
        background: rgba(255, 255, 255, 0.28);
      }
      .vai-body {
        padding: 20px 22px;
      }
      .vai-loading {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px 20px;
        background: #eff6ff;
        border-radius: 12px;
        border: 1px solid #bfdbfe;
        color: #1e3a8a;
      }
      .vai-spinner {
        width: 26px;
        height: 26px;
        border: 3px solid #bfdbfe;
        border-top-color: #1d4ed8;
        border-radius: 50%;
        animation: vaiSpin 0.85s linear infinite;
        flex-shrink: 0;
      }
      @keyframes vaiSpin { to { transform: rotate(360deg); } }
      .vai-error {
        padding: 14px 16px;
        border-radius: 12px;
        background: #fff7ed;
        border: 1px solid #fed7aa;
        color: #9a3412;
        font-size: 0.92rem;
        line-height: 1.5;
      }
      .vai-summary-strip {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin-bottom: 18px;
      }
      .vai-metric {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px 14px;
      }
      .vai-metric-label {
        font-size: 0.76rem;
        font-weight: 700;
        text-transform: uppercase;
        color: #64748b;
        margin-bottom: 4px;
      }
      .vai-metric-val {
        font-size: 1.35rem;
        font-weight: 800;
        color: #0f172a;
      }
      .vai-metric-sub {
        font-size: 0.8rem;
        color: #475569;
        margin-top: 2px;
      }
      .vai-badge-level {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.86rem;
        font-weight: 800;
      }
      .vai-offtopic {
        margin-bottom: 16px;
        padding: 12px 15px;
        border-radius: 10px;
        background: #fef2f2;
        border: 1.5px solid #fca5a5;
        color: #991b1b;
        font-weight: 700;
        font-size: 0.92rem;
      }
      .vai-sec-title {
        font-size: 1.0rem;
        font-weight: 800;
        color: #1e3a8a;
        margin: 20px 0 10px 0;
        padding-bottom: 6px;
        border-bottom: 2px solid #e2e8f0;
      }
      .vai-criteria-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 12px;
      }
      .vai-crit-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 14px;
      }
      .vai-crit-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      .vai-crit-name {
        font-weight: 800;
        font-size: 0.92rem;
        color: #0f172a;
      }
      .vai-crit-score {
        font-weight: 800;
        font-size: 0.95rem;
        padding: 2px 9px;
        border-radius: 999px;
        background: #dbeafe;
        color: #1e40af;
      }
      .vai-bar-bg {
        height: 7px;
        border-radius: 999px;
        background: #e2e8f0;
        overflow: hidden;
        margin-bottom: 8px;
      }
      .vai-bar-fill {
        height: 100%;
        border-radius: 999px;
      }
      .vai-crit-text {
        font-size: 0.87rem;
        line-height: 1.5;
        color: #334155;
        margin: 0 0 6px 0;
      }
      .vai-list-mini {
        margin: 4px 0 0 0;
        padding-left: 16px;
        font-size: 0.84rem;
        line-height: 1.48;
        color: #334155;
      }
      .vai-list-mini li { margin-bottom: 3px; }
      .vai-corr-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .vai-corr-item {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px 14px;
        background: #ffffff;
      }
      .vai-corr-top {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }
      .vai-corr-tag {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 2px 9px;
        border-radius: 999px;
        background: #fee2e2;
        color: #991b1b;
      }
      .vai-corr-orig {
        background: #fef2f2;
        border-left: 3px solid #ef4444;
        padding: 7px 10px;
        border-radius: 6px;
        font-size: 0.89rem;
        color: #7f1d1d;
        margin-bottom: 6px;
        line-height: 1.5;
      }
      .vai-corr-fix {
        background: #f0fdf4;
        border-left: 3px solid #16a34a;
        padding: 7px 10px;
        border-radius: 6px;
        font-size: 0.89rem;
        color: #14532d;
        margin-bottom: 6px;
        line-height: 1.5;
      }
      .vai-corr-exp {
        font-size: 0.86rem;
        color: #334155;
        line-height: 1.5;
      }
      .vai-diag-box {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 12px;
        padding: 14px 16px;
        font-size: 0.91rem;
        line-height: 1.6;
        color: #0c4a6e;
        margin-bottom: 12px;
      }
      .vai-two-col {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 12px;
        margin-bottom: 12px;
      }
      .vai-panel-green {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 12px;
        padding: 12px 14px;
      }
      .vai-panel-amber {
        background: #fffbeb;
        border: 1px solid #fde68a;
        border-radius: 12px;
        padding: 12px 14px;
      }
      .vai-panel-indigo {
        background: #eef2ff;
        border: 1px solid #c7d2fe;
        border-radius: 12px;
        padding: 12px 14px;
        margin-bottom: 12px;
      }
      .vai-panel-title {
        font-weight: 800;
        font-size: 0.88rem;
        margin: 0 0 6px 0;
        color: #0f172a;
      }
      .vai-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.86rem;
        margin-top: 6px;
        background: #ffffff;
        border-radius: 8px;
        overflow: hidden;
      }
      .vai-table th, .vai-table td {
        border: 1px solid #e2e8f0;
        padding: 8px 10px;
        text-align: left;
        vertical-align: top;
        color: #1e293b;
      }
      .vai-table th {
        background: #f1f5f9;
        font-weight: 700;
        color: #0f172a;
      }
      .vai-tabs {
        display: flex;
        gap: 8px;
        margin: 14px 0;
        flex-wrap: wrap;
      }
      .vai-tab-btn {
        padding: 9px 16px;
        border-radius: 10px;
        border: 1.5px solid #cbd5e1;
        background: #f8fafc;
        color: #334155;
        font-weight: 700;
        font-size: 0.88rem;
        cursor: pointer;
      }
      .vai-tab-btn.active {
        background: #1e3a8a;
        color: #ffffff;
        border-color: #1e3a8a;
      }
    `;
    document.head.appendChild(style);
  }

  function levelBadgeStyle(score) {
    if (score >= 8.5) return 'background:#dcfce7;color:#166534;';
    if (score >= 6.0) return 'background:#dbeafe;color:#1e40af;';
    if (score >= 4.0) return 'background:#fef9c3;color:#854d0e;';
    return 'background:#fee2e2;color:#991b1b;';
  }

  function barColor(score) {
    if (score >= 8.0) return '#16a34a';
    if (score >= 6.0) return '#2563eb';
    if (score >= 4.0) return '#d97706';
    return '#dc2626';
  }

  async function callGraderApi(payload) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch(VSTEP_AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const text = await res.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        throw new Error('Phản hồi máy chủ không đúng định dạng JSON.');
      }
      if (!json || !json.ok || !json.data) {
        throw new Error((json && json.error) || 'Không nhận được kết quả chấm từ AI.');
      }
      return json.data;
    } catch (err) {
      if (err && (err.name === 'AbortError' || /aborted/i.test(err.message))) {
        throw new Error('Hệ thống AI phản hồi chậm hơn thường lệ do mạng. Bạn vui lòng bấm nút "Thử chấm AI lại" nhé.');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  function renderTaskBodyHtml(data) {
    const s = data.scores || { tf: 0, org: 0, voc: 0, gram: 0 };
    const c = data.criteria || {};
    const diag = data.diagnosis || {};
    const corrections = Array.isArray(data.sentenceCorrections) ? data.sentenceCorrections : [];
    const wordOk = data.wordCount >= data.minWords;
    const weightLabel = data.taskType === 'task2' ? 'Tỷ trọng Task 2 (2/3)' : 'Tỷ trọng Task 1 (1/3)';

    const critList = [
      { key: 'tf', title: '1. Task Fulfillment (Hoàn thành đề)', score: s.tf, info: c.tf || {} },
      { key: 'org', title: '2. Organization (Tổ chức & Liên kết)', score: s.org, info: c.org || {} },
      { key: 'voc', title: '3. Vocabulary (Từ vựng)', score: s.voc, info: c.voc || {} },
      { key: 'gram', title: '4. Grammar (Ngữ pháp)', score: s.gram, info: c.gram || {} }
    ];

    const critHtml = critList.map(item => {
      const pct = Math.max(0, Math.min(100, item.score * 10));
      const strList = Array.isArray(item.info.strengths) ? item.info.strengths : [];
      const wkList = Array.isArray(item.info.weaknesses) ? item.info.weaknesses : [];
      return `
        <div class="vai-crit-card">
          <div class="vai-crit-head">
            <span class="vai-crit-name">${escHtml(item.title)}</span>
            <span class="vai-crit-score">${item.score}/10</span>
          </div>
          <div class="vai-bar-bg"><div class="vai-bar-fill" style="width:${pct}%;background:${barColor(item.score)};"></div></div>
          ${item.info.summary ? `<p class="vai-crit-text">${escHtml(item.info.summary)}</p>` : ''}
          ${strList.length ? `<ul class="vai-list-mini">${strList.map(x => `<li>✅ ${escHtml(x)}</li>`).join('')}</ul>` : ''}
          ${wkList.length ? `<ul class="vai-list-mini">${wkList.map(x => `<li>⚠️ ${escHtml(x)}</li>`).join('')}</ul>` : ''}
        </div>
      `;
    }).join('');

    const corrHtml = corrections.length
      ? `<div class="vai-corr-list">${corrections.map((item, idx) => `
          <div class="vai-corr-item">
            <div class="vai-corr-top">
              <strong>Câu #${item.sentenceIndex || (idx + 1)}</strong>
              <span class="vai-corr-tag">${escHtml(item.errorType || 'Cần sửa')}</span>
            </div>
            <div class="vai-corr-orig"><strong>❌ Câu gốc:</strong> ${escHtml(item.original)}</div>
            <div class="vai-corr-fix"><strong>✅ Sửa chuẩn:</strong> ${escHtml(item.corrected)}</div>
            <div class="vai-corr-exp"><strong>💡 Giải thích:</strong> ${escHtml(item.explanation)}</div>
          </div>
        `).join('')}</div>`
      : `<div class="vai-panel-green">✅ Không phát hiện lỗi câu nghiêm trọng nào trong bài viết này!</div>`;

    const strengths = Array.isArray(diag.keyStrengths) ? diag.keyStrengths : [];
    const weaknesses = Array.isArray(diag.rootWeaknesses) ? diag.rootWeaknesses : [];
    const advice = Array.isArray(diag.actionableAdvice) ? diag.actionableAdvice : [];
    const vocabUp = Array.isArray(diag.upgradedVocab) ? diag.upgradedVocab : [];
    const sentUp = Array.isArray(diag.upgradedSentences) ? diag.upgradedSentences : [];

    return `
      ${data.isOffTopic ? `<div class="vai-offtopic">🚨 CẢNH BÁO LẠC ĐỀ: Bài viết chưa bám sát yêu cầu cốt lõi của đề bài. Điểm Task Fulfillment bị giới hạn theo quy chế chấm VSTEP.</div>` : ''}

      <div class="vai-summary-strip">
        <div class="vai-metric">
          <div class="vai-metric-label">Điểm chuẩn VSTEP</div>
          <div class="vai-metric-val">${Number(data.overallScore).toFixed(1)} <span style="font-size:0.9rem;color:#64748b;">/ 10</span></div>
          <div class="vai-metric-sub"><span class="vai-badge-level" style="${levelBadgeStyle(data.overallScore)}">${escHtml(data.vstepLevel)}</span></div>
        </div>
        <div class="vai-metric">
          <div class="vai-metric-label">${escHtml(weightLabel)}</div>
          <div class="vai-metric-val">${Number(data.contribution).toFixed(2)} <span style="font-size:0.9rem;color:#64748b;">/ ${data.contributionMax}</span></div>
          <div class="vai-metric-sub">Quy đổi theo QĐ 729/QĐ-BGDĐT</div>
        </div>
        <div class="vai-metric">
          <div class="vai-metric-label">Độ dài bài viết</div>
          <div class="vai-metric-val" style="color:${wordOk ? '#15803d' : '#b91c1c'};">${data.wordCount} từ</div>
          <div class="vai-metric-sub">${wordOk ? `✓ Đạt chuẩn (≥${data.minWords} từ)` : `⚠️ Thiếu ${data.minWords - data.wordCount} từ (yêu cầu ≥${data.minWords})`}</div>
        </div>
      </div>

      ${data.wordPenaltyNote ? `<div style="margin:10px 0 14px 0;background:#fff1f2;border:1.5px solid #fecdd3;border-radius:10px;padding:10px 14px;color:#9f1239;font-size:0.86rem;line-height:1.5;"><strong>⚠️ Quy chế khống chế trần điểm:</strong> ${escHtml(data.wordPenaltyNote)}</div>` : ""}

      <div class="vai-sec-title">📊 1. Phân tích chi tiết 4 tiêu chí VSTEP (Analytic Scoring)</div>
      <div class="vai-criteria-grid">${critHtml}</div>

      <div class="vai-sec-title">✏️ 2. Sửa lỗi & Giải thích chi tiết từng câu (${corrections.length} điểm cần lưu ý)</div>
      ${corrHtml}

      <div class="vai-sec-title">🩺 3. Bản Chẩn đoán & Lời khuyên nâng Band</div>
      ${diag.overallDiagnosis ? `<div class="vai-diag-box"><strong>Chẩn đoán tổng quan:</strong> ${escHtml(diag.overallDiagnosis)}</div>` : ''}

      <div class="vai-two-col">
        <div class="vai-panel-green">
          <div class="vai-panel-title">🌟 Điểm mạnh nổi bật</div>
          <ul class="vai-list-mini">${(strengths.length ? strengths : ['Có nỗ lực hoàn thành cấu trúc bài viết.']).map(x => `<li>${escHtml(x)}</li>`).join('')}</ul>
        </div>
        <div class="vai-panel-amber">
          <div class="vai-panel-title">🎯 Lỗ hổng gốc rễ cần ưu tiên sửa</div>
          <ul class="vai-list-mini">${(weaknesses.length ? weaknesses : ['Cần mở rộng thêm vốn từ học thuật và cấu trúc câu phức.']).map(x => `<li>${escHtml(x)}</li>`).join('')}</ul>
        </div>
      </div>

      ${advice.length ? `
        <div class="vai-panel-indigo">
          <div class="vai-panel-title">🚀 Lời khuyên hành động để nâng +1.0 đến +1.5 Band</div>
          <ol class="vai-list-mini" style="padding-left:18px;">${advice.map(x => `<li>${escHtml(x)}</li>`).join('')}</ol>
        </div>
      ` : ''}

      ${vocabUp.length ? `
        <div style="margin-top:10px;">
          <div class="vai-panel-title">${String(data.targetLevel || '').toUpperCase() === 'B1' ? '💎 Từ vựng & Cụm từ chuẩn B1 nên dùng cho bài viết này' : '💎 Gợi ý nâng cấp từ vựng từ mức B1 lên chuẩn B2'}</div>
          <table class="vai-table">
            <thead><tr>
              <th>${String(data.targetLevel || '').toUpperCase() === 'B1' ? 'Cách diễn đạt cơ bản / vụng' : 'Cụm từ mức B1 học viên dùng'}</th>
              <th>${String(data.targetLevel || '').toUpperCase() === 'B1' ? 'Cụm từ chuẩn B1 tự nhiên' : 'Nâng cấp chuẩn B2'}</th>
              <th>Nghĩa tiếng Việt</th>
            </tr></thead>
            <tbody>${vocabUp.map(v => `<tr><td>${escHtml(v.basic)}</td><td><strong>${escHtml(v.upgraded)}</strong></td><td>${escHtml(v.meaning)}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      ` : ''}

      ${sentUp.length ? `
        <div style="margin-top:14px;">
          <div class="vai-panel-title">${String(data.targetLevel || '').toUpperCase() === 'B1' ? '✨ Câu viết lại chuẩn B1 rõ ràng, chuẩn ngữ pháp' : '✨ Câu viết lại nâng Band B2 (giữ nguyên ý của bạn)'}</div>
          <div class="vai-corr-list">${sentUp.map(u => `
            <div class="vai-corr-item">
              <div class="vai-corr-orig" style="background:#f8fafc;border-left-color:#64748b;color:#334155;"><strong>Câu gốc:</strong> ${escHtml(u.original)}</div>
              <div class="vai-corr-fix"><strong>✨ Phiên bản hoàn thiện:</strong> ${escHtml(u.upgraded)}</div>
              ${u.note ? `<div class="vai-corr-exp"><strong>Ghi chú:</strong> ${escHtml(u.note)}</div>` : ''}
            </div>
          `).join('')}</div>
        </div>
      ` : ''}
    `;
  }

  function mountSingle(hostEl, options) {
    if (!hostEl) return;
    injectStyles();

    const taskType = options.taskType === 'task2' ? 'task2' : 'task1';
    const targetLevel = options.targetLevel || 'B1-C1';
    const prompt = String(options.prompt || '').trim();
    const essay = String(options.essay || '').trim();
    const wordCount = essay ? essay.split(/\s+/).filter(Boolean).length : 0;

    let slot = hostEl.querySelector('.vai-mount-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.className = 'vai-mount-slot';
      const header = hostEl.querySelector('div[style*="justify-content: space-between"]');
      if (header && header.nextSibling) {
        hostEl.insertBefore(slot, header.nextSibling);
      } else {
        hostEl.prepend(slot);
      }
    }

    const titleLabel = taskType === 'task2'
      ? '🎓 GIÁM KHẢO AI CHẤM BÀI CHUẨN VSTEP — TASK 2 (ESSAY)'
      : '🎓 GIÁM KHẢO AI CHẤM BÀI CHUẨN VSTEP — TASK 1 (LETTER / EMAIL)';

    if (wordCount < 10) {
      slot.innerHTML = `
        <div class="vai-card" style="margin-bottom:20px;">
          <div class="vai-header">
            <div>
              <div class="vai-header-title">${titleLabel}</div>
              <div class="vai-header-sub">Chuẩn QĐ 729/QĐ-BGDĐT • 4 tiêu chí độc lập • Sửa lỗi từng câu & Chẩn đoán</div>
            </div>
          </div>
          <div class="vai-body" style="padding:18px 22px;">
            <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:14px 18px;color:#92400e;line-height:1.6;">
              <strong style="font-size:0.95rem;">⚠️ Bài viết của bạn chưa có nội dung (dưới 10 từ).</strong><br>
              <span style="font-size:0.88rem;color:#b45309;">Giám khảo AI đã sẵn sàng hoạt động! Để nhận điểm chuẩn VSTEP, sửa lỗi chi tiết từng câu và bản chẩn đoán nâng Band, bạn vui lòng viết bài (tối thiểu ${taskType === 'task2' ? '250' : '120'} từ) trước khi nộp bài nhé.</span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const cacheKey = simpleHash(taskType + '|' + targetLevel + '|' + prompt.slice(0, 200) + '|' + essay);

    async function run(forceRefresh) {
      if (!forceRefresh) {
        const cached = readCache(cacheKey);
        if (cached) {
          cached.targetLevel = cached.targetLevel || targetLevel;
          renderResult(cached);
          return;
        }
      }

      slot.innerHTML = `
        <div class="vai-card">
          <div class="vai-header">
            <div>
              <div class="vai-header-title">${titleLabel}</div>
              <div class="vai-header-sub">Chấm theo chuẩn QĐ 729/QĐ-BGDĐT • Sửa chi tiết từng câu • Chẩn đoán & Lời khuyên</div>
            </div>
          </div>
          <div class="vai-body">
            <div class="vai-loading">
              <div class="vai-spinner"></div>
              <div>
                <strong>Đang phân tích & chấm bài bằng Giám khảo AI VSTEP...</strong><br>
                <span style="font-size:0.85rem;color:#3b82f6;">Vui lòng chờ khoảng 4–8 giây để nhận điểm chuẩn, sửa từng câu và bản Chẩn đoán & Lời khuyên.</span>
              </div>
            </div>
          </div>
        </div>
      `;

      try {
        const data = await callGraderApi({ taskType, targetLevel, prompt, essay });
        data.targetLevel = data.targetLevel || targetLevel;
        writeCache(cacheKey, data);
        renderResult(data);
        if (typeof options.onGraded === 'function') options.onGraded(data);
      } catch (err) {
        slot.innerHTML = `
          <div class="vai-card">
            <div class="vai-header">
              <div>
                <div class="vai-header-title">${titleLabel}</div>
                <div class="vai-header-sub">Đang hiển thị kết quả chấm nhanh offline bên dưới</div>
              </div>
              <button type="button" class="vai-btn-retry">🔄 Thử chấm AI lại</button>
            </div>
            <div class="vai-body">
              <div class="vai-error">
                <strong>Không thể kết nối Giám khảo AI lúc này:</strong> ${escHtml(err.message || err)}<br>
                Hệ thống đã tự động giữ kết quả chấm nhanh chuẩn VSTEP bên dưới. Bạn có thể bấm <strong>Thử chấm AI lại</strong> sau vài giây.
              </div>
            </div>
          </div>
        `;
        const btn = slot.querySelector('.vai-btn-retry');
        if (btn) btn.onclick = () => run(true);
      }
    }

    function renderResult(data) {
      slot.innerHTML = `
        <div class="vai-card">
          <div class="vai-header">
            <div>
              <div class="vai-header-title">${titleLabel}</div>
              <div class="vai-header-sub">Thang điểm 0–10 (làm tròn 0.5) • 4 tiêu chí độc lập • Sửa lỗi từng câu & Chẩn đoán</div>
            </div>
            <button type="button" class="vai-btn-retry">🔄 Chấm lại bằng AI</button>
          </div>
          <div class="vai-body">${renderTaskBodyHtml(data)}</div>
        </div>
      `;
      const btn = slot.querySelector('.vai-btn-retry');
      if (btn) btn.onclick = () => run(true);
    }

    run(false);
  }

  function mountFullMock(hostEl, options) {
    if (!hostEl) return;
    injectStyles();

    const prompt1 = String(options.prompt1 || '').trim();
    const essay1 = String(options.essay1 || '').trim();
    const prompt2 = String(options.prompt2 || '').trim();
    const essay2 = String(options.essay2 || '').trim();
    const w1 = essay1 ? essay1.split(/\s+/).filter(Boolean).length : 0;
    const w2 = essay2 ? essay2.split(/\s+/).filter(Boolean).length : 0;

    let slot = hostEl.querySelector('.vai-mount-slot');
    if (!slot) {
      slot = document.createElement('div');
      slot.className = 'vai-mount-slot';
      const header = hostEl.querySelector('div[style*="justify-content: space-between"]');
      if (header && header.nextSibling) {
        hostEl.insertBefore(slot, header.nextSibling);
      } else {
        hostEl.prepend(slot);
      }
    }

    if (w1 < 10 && w2 < 10) {
      slot.innerHTML = `
        <div class="vai-card" style="margin-bottom:20px;">
          <div class="vai-header">
            <div>
              <div class="vai-header-title">🎓 GIÁM KHẢO AI CHẤM ĐỀ THI THỬ VSTEP WRITING (FULL MOCK TEST)</div>
              <div class="vai-header-sub">Công thức chuẩn: (Task 1 + 2 × Task 2) / 3 • QĐ 729/QĐ-BGDĐT</div>
            </div>
          </div>
          <div class="vai-body" style="padding:18px 22px;">
            <div style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;padding:14px 18px;color:#92400e;line-height:1.6;">
              <strong style="font-size:0.95rem;">⚠️ Bài thi của bạn chưa có nội dung (dưới 10 từ).</strong><br>
              <span style="font-size:0.88rem;color:#b45309;">Giám khảo AI đã sẵn sàng hoạt động! Để nhận bảng điểm tổng quy đổi chuẩn VSTEP và phân tích chi tiết, bạn chỉ cần nhập bài viết cho Task 1 (tối thiểu 120 từ) hoặc Task 2 (tối thiểu 250 từ) trước khi nộp bài nhé.</span>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const cacheKey = simpleHash('FULLMOCK|' + prompt1.slice(0, 120) + '|' + essay1 + '|' + prompt2.slice(0, 120) + '|' + essay2);

    async function run(forceRefresh) {
      if (!forceRefresh) {
        const cached = readCache(cacheKey);
        if (cached) {
          renderFullResult(cached);
          return;
        }
      }

      slot.innerHTML = `
        <div class="vai-card">
          <div class="vai-header">
            <div>
              <div class="vai-header-title">🎓 GIÁM KHẢO AI CHẤM ĐỀ THI THỬ VSTEP WRITING (FULL TEST)</div>
              <div class="vai-header-sub">Chấm đồng thời Task 1 (1/3) & Task 2 (2/3) theo QĐ 729/QĐ-BGDĐT</div>
            </div>
          </div>
          <div class="vai-body">
            <div class="vai-loading">
              <div class="vai-spinner"></div>
              <div>
                <strong>Đang chấm chuyên sâu cả 2 bài (Task 1 & Task 2) bằng Giám khảo AI VSTEP...</strong><br>
                <span style="font-size:0.85rem;color:#3b82f6;">Vui lòng chờ khoảng 6–10 giây để nhận điểm tổng chuẩn, sửa lỗi từng câu và bản Chẩn đoán & Lời khuyên.</span>
              </div>
            </div>
          </div>
        </div>
      `;

      try {
        const [d1, d2] = await Promise.all([
          w1 >= 10
            ? callGraderApi({ taskType: 'task1', targetLevel: 'B1-C1', prompt: prompt1, essay: essay1 })
            : Promise.resolve(null),
          w2 >= 10
            ? callGraderApi({ taskType: 'task2', targetLevel: 'B1-C1', prompt: prompt2, essay: essay2 })
            : Promise.resolve(null)
        ]);
        const s1 = d1 ? d1.overallScore : 0;
        const s2 = d2 ? d2.overallScore : 0;
        const finalScore = Math.round(((s1 + s2 * 2) / 3) * 2) / 2;
        let finalLevel = 'Dưới B1 (Chưa đạt Bậc 3)';
        if (finalScore >= 8.5) finalLevel = 'Bậc 5 (C1)';
        else if (finalScore >= 6.0) finalLevel = 'Bậc 4 (B2)';
        else if (finalScore >= 4.0) finalLevel = 'Bậc 3 (B1)';

        const bundle = { d1, d2, s1, s2, finalScore, finalLevel };
        writeCache(cacheKey, bundle);
        renderFullResult(bundle);
      } catch (err) {
        slot.innerHTML = `
          <div class="vai-card">
            <div class="vai-header">
              <div>
                <div class="vai-header-title">🎓 GIÁM KHẢO AI CHẤM ĐỀ THI THỬ VSTEP WRITING</div>
                <div class="vai-header-sub">Đang hiển thị kết quả chấm nhanh offline bên dưới</div>
              </div>
              <button type="button" class="vai-btn-retry">🔄 Thử chấm AI lại</button>
            </div>
            <div class="vai-body">
              <div class="vai-error">
                <strong>Chưa kết nối được Giám khảo AI:</strong> ${escHtml(err.message || err)}
              </div>
            </div>
          </div>
        `;
        const btn = slot.querySelector('.vai-btn-retry');
        if (btn) btn.onclick = () => run(true);
      }
    }

    function renderFullResult(b) {
      let activeTab = b.d1 ? 't1' : 't2';
      function paint() {
        const activeHtml = activeTab === 't1'
          ? (b.d1 ? renderTaskBodyHtml(b.d1) : '<div class="vai-error">Thí sinh chưa hoàn thành Task 1 (dưới 10 từ) — 0.0 điểm.</div>')
          : (b.d2 ? renderTaskBodyHtml(b.d2) : '<div class="vai-error">Thí sinh chưa hoàn thành Task 2 (dưới 10 từ) — 0.0 điểm.</div>');

        slot.innerHTML = `
          <div class="vai-card">
            <div class="vai-header">
              <div>
                <div class="vai-header-title">🎓 KẾT QUẢ CHẤM AI CHUẨN VSTEP WRITING (FULL MOCK TEST)</div>
                <div class="vai-header-sub">Công thức chính thức: (Task 1 + 2 × Task 2) / 3 • Làm tròn 0.5 • QĐ 729/QĐ-BGDĐT</div>
              </div>
              <button type="button" class="vai-btn-retry">🔄 Chấm lại bằng AI</button>
            </div>
            <div class="vai-body">
              <div class="vai-summary-strip">
                <div class="vai-metric" style="background:#eff6ff;border-color:#93c5fd;">
                  <div class="vai-metric-label">Điểm tổng Writing (Thang 10)</div>
                  <div class="vai-metric-val" style="color:#1e3a8a;">${b.finalScore.toFixed(1)} <span style="font-size:0.9rem;">/ 10</span></div>
                  <div class="vai-metric-sub"><span class="vai-badge-level" style="${levelBadgeStyle(b.finalScore)}">${escHtml(b.finalLevel)}</span></div>
                </div>
                <div class="vai-metric">
                  <div class="vai-metric-label">Task 1 — Thư/Email (1/3)</div>
                  <div class="vai-metric-val">${b.s1.toFixed(1)} / 10</div>
                  <div class="vai-metric-sub">Quy đổi: ${(b.s1 / 3).toFixed(2)} / 3.33</div>
                </div>
                <div class="vai-metric">
                  <div class="vai-metric-label">Task 2 — Bài luận (2/3)</div>
                  <div class="vai-metric-val">${b.s2.toFixed(1)} / 10</div>
                  <div class="vai-metric-sub">Quy đổi: ${((b.s2 * 2) / 3).toFixed(2)} / 6.67</div>
                </div>
              </div>

              <div class="vai-tabs">
                <button type="button" class="vai-tab-btn ${activeTab === 't1' ? 'active' : ''}" data-tab="t1">📝 Chi tiết Task 1 (${b.s1.toFixed(1)}/10)</button>
                <button type="button" class="vai-tab-btn ${activeTab === 't2' ? 'active' : ''}" data-tab="t2">📄 Chi tiết Task 2 (${b.s2.toFixed(1)}/10)</button>
              </div>
              <div class="vai-tab-content">${activeHtml}</div>
            </div>
          </div>
        `;
        slot.querySelectorAll('.vai-tab-btn').forEach(btn => {
          btn.onclick = () => { activeTab = btn.getAttribute('data-tab'); paint(); };
        });
        const retryBtn = slot.querySelector('.vai-btn-retry');
        if (retryBtn) retryBtn.onclick = () => run(true);
      }
      paint();
      if (typeof options.onResult === 'function') {
        try { options.onResult(b); } catch (e) { console.error('VstepAIGrader onResult error:', e); }
      }
      try {
        window.dispatchEvent(new CustomEvent('vstep-ai-graded', { detail: b }));
      } catch (e) {}
    }

    run(false);
  }

  global.VstepAIGrader = {
    endpoint: VSTEP_AI_ENDPOINT,
    grade: callGraderApi,
    mountSingle: mountSingle,
    mountFullMock: mountFullMock
  };
})(window);
