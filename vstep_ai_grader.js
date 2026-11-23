/* ============================================================================
 * VSTEP WRITING AI GRADER (MOET Decision 729/QD-BGDDT)
 * Shared drop-in module for English with Miss Nguyet (7 VSTEP Writing Apps)
 * ============================================================================ */
(function (global) {
  'use strict';

  const VSTEP_AI_ENDPOINT =
    'https://script.google.com/macros/s/AKfycbwUNnMInGfNlI4QqWVqqrhOXEYpwRVJ8FFFCdeBtQl8cA4AmoftBDdWnO13DxCnwgjWvg/exec';

  const CACHE_PREFIX = 'vstep_ai_cache_v5_';

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

      .vai-annotated-box {
        background: #ffffff;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 18px 20px;
        font-size: 0.96rem;
        line-height: 1.9;
        color: #1e293b;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
      }
      .vai-annotated-box p {
        margin: 0 0 12px 0;
      }
      .vai-annotated-box p:last-child {
        margin-bottom: 0;
      }
      .vai-inline-mark {
        background: #fef9c3;
        padding: 2px 6px;
        border-radius: 6px;
        display: inline;
        cursor: pointer;
        transition: background 0.15s ease;
        box-decoration-break: clone;
        -webkit-box-decoration-break: clone;
      }
      .vai-inline-mark:hover {
        background: #fde047;
      }
      .vai-inline-del {
        color: #b91c1c;
        text-decoration: line-through;
        text-decoration-thickness: 1.5px;
        font-weight: 500;
        margin-right: 3px;
      }
      .vai-inline-ins {
        color: #15803d;
        text-decoration: none;
        font-weight: 700;
      }
      .vai-inline-num {
        color: #475569;
        font-size: 0.72em;
        font-weight: 700;
        margin-left: 2px;
        vertical-align: super;
      }
      .vai-err-table-wrap {
        overflow-x: auto;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        background: #ffffff;
        margin-bottom: 16px;
      }
      .vai-err-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.88rem;
      }
      .vai-err-table th {
        background: #f8fafc;
        color: #334155;
        font-weight: 700;
        text-align: left;
        padding: 11px 13px;
        border-bottom: 1.5px solid #e2e8f0;
        white-space: nowrap;
      }
      .vai-err-table td {
        padding: 11px 13px;
        border-bottom: 1px solid #f1f5f9;
        vertical-align: top;
        line-height: 1.55;
        color: #1e293b;
      }
      .vai-err-table tr:last-child td {
        border-bottom: none;
      }
      .vai-err-table tr.vai-row-flash {
        background: #fef9c3 !important;
        transition: background 0.4s ease;
      }
      .vai-err-idx {
        font-weight: 700;
        color: #475569;
        width: 34px;
      }
      .vai-err-wrong {
        color: #b91c1c;
        text-decoration: line-through;
        font-weight: 500;
        display: block;
      }
      .vai-err-fixed {
        color: #15803d;
        font-weight: 700;
        display: block;
        margin-top: 2px;
      }
      .vai-err-badge {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 8px;
        font-size: 0.78rem;
        font-weight: 700;
        white-space: nowrap;
      }
      .vai-badge-spell { background: #ffedd5; color: #c2410c; }
      .vai-badge-gram { background: #fee2e2; color: #be123c; }
      .vai-badge-vocab { background: #e0e7ff; color: #3730a3; }
      .vai-badge-style { background: #f3e8ff; color: #7e22ce; }
      .vai-idea-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 16px;
      }
      .vai-idea-card {
        background: #fffbeb;
        border: 1.5px solid #fde68a;
        border-radius: 12px;
        padding: 14px 16px;
      }
      .vai-idea-loc {
        font-size: 0.88rem;
        font-weight: 800;
        color: #b45309;
        margin-bottom: 6px;
      }
      .vai-idea-reason {
        font-size: 0.88rem;
        color: #334155;
        line-height: 1.55;
        margin-bottom: 10px;
      }
      .vai-idea-quote {
        background: #ffffff;
        border-left: 4px solid #f59e0b;
        border-radius: 0 8px 8px 0;
        padding: 10px 14px;
        font-size: 0.93rem;
        font-weight: 600;
        color: #0f172a;
        line-height: 1.6;
        margin-bottom: 8px;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
      }
      .vai-idea-vi {
        font-size: 0.85rem;
        color: #475569;
        line-height: 1.5;
      }
      .vai-revised-details {
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        background: #ffffff;
        margin-bottom: 18px;
        overflow: hidden;
      }
      .vai-revised-details[open] {
        border-color: #cbd5e1;
      }
      .vai-revised-summary {
        list-style: none;
        cursor: pointer;
        padding: 12px 16px;
        font-size: 0.93rem;
        font-weight: 800;
        color: #0f172a;
        background: #f8fafc;
        border: 1.5px solid #2563eb;
        border-radius: 10px;
        margin: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        user-select: none;
      }
      .vai-revised-summary::-webkit-details-marker {
        display: none;
      }
      .vai-revised-summary-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .vai-revised-caret {
        display: inline-block;
        font-size: 0.78rem;
        transition: transform 0.2s ease;
      }
      .vai-revised-details[open] .vai-revised-caret {
        transform: rotate(90deg);
      }
      .vai-revised-body {
        padding: 12px 20px 18px 20px;
        font-size: 0.95rem;
        line-height: 1.85;
        color: #1e293b;
      }
      .vai-revised-body p {
        margin: 0 0 14px 0;
      }
      .vai-revised-body p:last-child {
        margin-bottom: 0;
      }
      .vai-copy-btn {
        background: #eff6ff;
        color: #1d4ed8;
        border: 1px solid #bfdbfe;
        border-radius: 8px;
        padding: 4px 10px;
        font-size: 0.78rem;
        font-weight: 700;
        cursor: pointer;
      }
      .vai-copy-btn:hover {
        background: #dbeafe;
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

  
  function enforceMoetCaps(data) {
    if (!data || typeof data.overallScore === 'undefined') return data;
    const taskType = data.taskType === 'task2' ? 'task2' : 'task1';
    const words = Number(data.wordCount || 0);
    const minWords = taskType === 'task2' ? 250 : 120;
    data.minWords = minWords;

    let tf = Math.max(0, Math.min(10, Math.round(Number(data.scores && data.scores.tf) || 0)));
    let org = Math.max(0, Math.min(10, Math.round(Number(data.scores && data.scores.org) || 0)));
    let voc = Math.max(0, Math.min(10, Math.round(Number(data.scores && data.scores.voc) || 0)));
    let gram = Math.max(0, Math.min(10, Math.round(Number(data.scores && data.scores.gram) || 0)));
    let rawScore = Number(data.overallScore);

    if (taskType === 'task2') {
      if (words < 150) {
        tf = Math.min(tf, 2);
        rawScore = Math.min(rawScore, 2.5);
        data.wordPenaltyNote = `Bài viết chỉ có ${words} từ (quá ngắn so với chuẩn tối thiểu 250 từ của VSTEP Task 2). Điểm số tổng thể bị giới hạn tối đa ở mức 2.5 (Dưới B1 / Không đạt).`;
      } else if (words < 200) {
        tf = Math.min(tf, 3);
        rawScore = Math.min(rawScore, 3.5);
        data.wordPenaltyNote = `Bài viết chỉ có ${words} từ (thiếu ${250 - words} từ so với chuẩn tối thiểu 250 từ). Theo quy chế khảo thí VSTEP Task 2, bài viết dưới 200 từ bị trừ nặng điểm Task Fulfillment và bị giới hạn trần điểm tối đa ở mức 3.5 (Dưới B1 / Chưa đạt chuẩn).`;
      } else if (words < 230) {
        tf = Math.min(tf, 4);
        rawScore = Math.min(rawScore, 4.5);
        data.wordPenaltyNote = `Bài viết có ${words} từ (chưa đạt chuẩn tối thiểu 250 từ). Dung lượng 200-229 từ bị giới hạn trần tối đa ở mức 4.5 (Chớm B1 / Cần bổ sung ý).`;
      } else if (words < 250) {
        tf = Math.min(tf, 5);
        rawScore = Math.min(rawScore, 5.0);
        data.wordPenaltyNote = `Bài viết có ${words} từ (thiếu ${250 - words} từ so với chuẩn 250 từ). Trần điểm tổng thể được giới hạn tối đa 5.0 (B1 cơ bản).`;
      }
    } else {
      if (words < 60) {
        tf = Math.min(tf, 2);
        rawScore = Math.min(rawScore, 2.5);
        data.wordPenaltyNote = `Thư/Email chỉ có ${words} từ (quá ngắn so với chuẩn tối thiểu 120 từ). Giới hạn tối đa 2.5 (Dưới B1).`;
      } else if (words < 90) {
        tf = Math.min(tf, 3);
        rawScore = Math.min(rawScore, 3.5);
        data.wordPenaltyNote = `Thư/Email chỉ có ${words} từ (thiếu ${120 - words} từ so với chuẩn 120 từ). Giới hạn tối đa 3.5 (Dưới B1 / Chưa đạt chuẩn).`;
      } else if (words < 120) {
        tf = Math.min(tf, 5);
        rawScore = Math.min(rawScore, 4.5);
        data.wordPenaltyNote = `Thư/Email có ${words} từ (chưa đủ 120 từ). Giới hạn trần điểm tối đa 4.5 (B1 yếu).`;
      }
    }

    if (data.isOffTopic) {
      tf = Math.min(tf, 2);
      rawScore = Math.min(rawScore, 3.0);
    }

    data.scores = { tf, org, voc, gram };
    data.overallScore = Math.round(rawScore * 2) / 2;
    data.contributionMax = taskType === 'task2' ? 6.67 : 3.33;
    data.contribution = Number(((data.overallScore * (taskType === 'task2' ? 2 : 1)) / 3).toFixed(2));

    if (data.overallScore >= 8.5) data.vstepLevel = 'Bậc 5 (C1)';
    else if (data.overallScore >= 6.0) data.vstepLevel = 'Bậc 4 (B2)';
    else if (data.overallScore >= 4.0) data.vstepLevel = 'Bậc 3 (B1)';
    else data.vstepLevel = 'Dưới B1 (Chưa đạt Bậc 3)';

    return data;
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
      return enforceMoetCaps(json.data);
    } catch (err) {
      if (err && (err.name === 'AbortError' || /aborted/i.test(err.message))) {
        throw new Error('Hệ thống AI phản hồi chậm hơn thường lệ do mạng. Bạn vui lòng bấm nút "Thử chấm AI lại" nhé.');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  function errorTypeBadgeClass(typeStr) {
    const t = String(typeStr || '').toLowerCase();
    if (t.includes('chính tả') || t.includes('spell')) return 'vai-badge-spell';
    if (t.includes('ngữ pháp') || t.includes('gram')) return 'vai-badge-gram';
    if (t.includes('từ vựng') || t.includes('vocab') || t.includes('colloc')) return 'vai-badge-vocab';
    return 'vai-badge-style';
  }

  function findSpanInText(text, needle, startCursor, usedSpans) {
    if (!needle) return -1;
    const isShortWord = /^[a-zA-Z]{1,4}$/.test(needle);
    const overlaps = (s, e) => usedSpans.some(u => !(e <= u.start || s >= u.end));

    function trySearch(haystack, target, fromIdx, requireWordBoundary) {
      let idx = haystack.indexOf(target, fromIdx);
      while (idx !== -1) {
        const end = idx + target.length;
        let boundaryOk = true;
        if (requireWordBoundary) {
          const prev = idx > 0 ? haystack[idx - 1] : ' ';
          const next = end < haystack.length ? haystack[end] : ' ';
          if (/[a-zA-Z0-9]/.test(prev) || /[a-zA-Z0-9]/.test(next)) {
            boundaryOk = false;
          }
        }
        if (boundaryOk && !overlaps(idx, end)) return idx;
        idx = haystack.indexOf(target, idx + 1);
      }
      return -1;
    }

    const lowerText = text.toLowerCase();
    const lowerNeedle = needle.toLowerCase();

    // 1. Exact from cursor (with word boundary for short words)
    let pos = trySearch(text, needle, startCursor, isShortWord);
    if (pos !== -1) return pos;
    // 2. Case-insensitive from cursor
    pos = trySearch(lowerText, lowerNeedle, startCursor, isShortWord);
    if (pos !== -1) return pos;
    // 3. Exact from start (in case LLM listed slightly out of order)
    pos = trySearch(text, needle, 0, isShortWord);
    if (pos !== -1) return pos;
    // 4. Case-insensitive from start
    pos = trySearch(lowerText, lowerNeedle, 0, isShortWord);
    if (pos !== -1) return pos;
    // 5. Fallback without strict word boundary
    if (isShortWord) {
      pos = trySearch(lowerText, lowerNeedle, startCursor, false);
      if (pos !== -1) return pos;
      pos = trySearch(lowerText, lowerNeedle, 0, false);
    }
    return pos;
  }

  function buildAnnotatedEssayHtml(essayText, inlineErrors, uidPrefix) {
    const normalized = String(essayText || '').replace(/\r\n/g, '\n').trim();
    if (!normalized) return '';

    const usedSpans = [];
    let cursor = 0;

    inlineErrors.forEach((err, idx) => {
      const needle = String(err && err.wrong ? err.wrong : '').trim();
      if (!needle) return;
      const pos = findSpanInText(normalized, needle, cursor, usedSpans);
      if (pos !== -1) {
        const end = pos + needle.length;
        usedSpans.push({ start: pos, end: end, num: idx + 1, err: err });
        if (end >= cursor) cursor = end;
      }
    });

    usedSpans.sort((a, b) => a.start - b.start);

    // Build HTML with inline highlights while preserving paragraphs
    let out = '';
    let pos = 0;

    function appendPlain(str) {
      if (!str) return;
      // Preserve paragraph breaks (\n\n) and line breaks (\n)
      const escaped = escHtml(str)
        .replace(/\n{2,}/g, '</p><p>')
        .replace(/\n/g, '<br>');
      out += escaped;
    }

    for (let i = 0; i < usedSpans.length; i++) {
      const sp = usedSpans[i];
      if (sp.start > pos) {
        appendPlain(normalized.slice(pos, sp.start));
      }
      const origSlice = normalized.slice(sp.start, sp.end);
      const fixedText = String(sp.err.fixed || '');
      const tip = `Lỗi #${sp.num} (${sp.err.type || 'Cần sửa'}): ${sp.err.explanation || ''}`;
      out += `<span class="vai-inline-mark" data-vai-jump="${uidPrefix}-${sp.num}" title="${escHtml(tip)}">` +
        `<del class="vai-inline-del">${escHtml(origSlice)}</del> ` +
        `<ins class="vai-inline-ins">${escHtml(fixedText)}</ins>` +
        `<sup class="vai-inline-num">[${sp.num}]</sup>` +
        `</span>`;
      pos = sp.end;
    }

    if (pos < normalized.length) {
      appendPlain(normalized.slice(pos));
    }

    return `<div class="vai-annotated-box"><p>${out}</p></div>`;
  }

  function formatEssayParagraphsHtml(text) {
    const clean = String(text || '').replace(/\r\n/g, '\n').trim();
    if (!clean) return '';
    return clean
      .split(/\n{2,}/)
      .map(para => `<p>${escHtml(para.trim()).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  function wireInteractiveAnnotations(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll('[data-vai-jump]').forEach(el => {
      el.addEventListener('click', () => {
        const targetId = el.getAttribute('data-vai-jump');
        const row = rootEl.querySelector('#vai-row-' + targetId);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.classList.add('vai-row-flash');
          setTimeout(() => row.classList.remove('vai-row-flash'), 1600);
        }
      });
    });
    rootEl.querySelectorAll('.vai-copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const details = btn.closest('.vai-revised-details');
        const body = details ? details.querySelector('.vai-revised-body') : null;
        if (!body) return;
        const txt = body.innerText || body.textContent || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(() => {
            const old = btn.textContent;
            btn.textContent = '✓ Đã sao chép!';
            setTimeout(() => { btn.textContent = old; }, 1800);
          }).catch(() => {});
        }
      });
    });
  }

  function renderTaskBodyHtml(data, originalEssay) {
    const s = data.scores || { tf: 0, org: 0, voc: 0, gram: 0 };
    const c = data.criteria || {};
    const diag = data.diagnosis || {};
    const inlineErrors = Array.isArray(data.inlineErrors) ? data.inlineErrors : [];
    const corrections = Array.isArray(data.sentenceCorrections) ? data.sentenceCorrections : [];
    const ideaSuggestions = Array.isArray(data.ideaSuggestions) ? data.ideaSuggestions : [];
    const revisedEssay = String(data.revisedEssay || '').trim();
    const studentText = String(originalEssay || data.studentEssay || '').trim();
    const wordOk = data.wordCount >= data.minWords;
    const weightLabel = data.taskType === 'task2' ? 'Tỷ trọng Task 2 (2/3)' : 'Tỷ trọng Task 1 (1/3)';
    const uidPrefix = (data.taskType || 't') + '-' + Math.floor(Math.random() * 100000);

    const lvlUpper = String(data.targetLevel || '').toUpperCase();
    const levelLabel = lvlUpper === 'B1' ? 'Level B1' : (lvlUpper === 'B2' ? 'Level B2' : 'chuẩn VSTEP');

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

    // Build Inline Annotated Essay + Structured Error Table (or fallback to legacy sentenceCorrections)
    let correctionSectionsHtml = '';
    if (inlineErrors.length > 0) {
      const annotatedHtml = studentText
        ? `
          <div class="vai-sec-title">1. Bài viết đã đánh dấu lỗi trực tiếp</div>
          ${buildAnnotatedEssayHtml(studentText, inlineErrors, uidPrefix)}
        `
        : '';

      const tableRowsHtml = inlineErrors.map((err, idx) => {
        const n = idx + 1;
        const badgeCls = errorTypeBadgeClass(err.type);
        return `
          <tr id="vai-row-${uidPrefix}-${n}">
            <td class="vai-err-idx">${n}</td>
            <td>
              <span class="vai-err-wrong">${escHtml(err.wrong || '')}</span>
              <span class="vai-err-fixed">→ ${escHtml(err.fixed || '')}</span>
            </td>
            <td><span class="vai-err-badge ${badgeCls}">${escHtml(err.type || 'Ngữ pháp')}</span></td>
            <td>${escHtml(err.explanation || '')}</td>
          </tr>
        `;
      }).join('');

      correctionSectionsHtml = `
        ${annotatedHtml}
        <div class="vai-sec-title">2. Chi tiết các lỗi cần sửa (${inlineErrors.length} mục)</div>
        <div class="vai-err-table-wrap">
          <table class="vai-err-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Chỗ sai → Sửa thành</th>
                <th>Loại lỗi</th>
                <th>Giải thích tại sao sai</th>
              </tr>
            </thead>
            <tbody>${tableRowsHtml}</tbody>
          </table>
        </div>
      `;
    } else if (corrections.length > 0) {
      const legacyCorrHtml = `<div class="vai-corr-list">${corrections.map((item, idx) => `
          <div class="vai-corr-item">
            <div class="vai-corr-top">
              <strong>Câu #${item.sentenceIndex || (idx + 1)}</strong>
              <span class="vai-corr-tag">${escHtml(item.errorType || 'Cần sửa')}</span>
            </div>
            <div class="vai-corr-orig"><strong>❌ Câu gốc:</strong> ${escHtml(item.original)}</div>
            <div class="vai-corr-fix"><strong>✅ Sửa chuẩn:</strong> ${escHtml(item.corrected)}</div>
            <div class="vai-corr-exp"><strong>💡 Giải thích:</strong> ${escHtml(item.explanation)}</div>
          </div>
        `).join('')}</div>`;
      correctionSectionsHtml = `
        <div class="vai-sec-title">✏️ Sửa lỗi & Giải thích chi tiết từng câu (${corrections.length} điểm cần lưu ý)</div>
        ${legacyCorrHtml}
      `;
    } else {
      correctionSectionsHtml = `
        <div class="vai-sec-title">1. Đánh dấu & Sửa lỗi chi tiết</div>
        <div class="vai-panel-green">✅ Không phát hiện lỗi chính tả hay ngữ pháp nghiêm trọng nào trong bài viết này!</div>
      `;
    }

    // Build Idea Expansion Suggestions (Section 3)
    const ideaSuggestionsHtml = ideaSuggestions.length > 0
      ? `
        <div class="vai-sec-title">3. Gợi ý bổ sung ý cho đầy đủ hơn (chuẩn ${escHtml(levelLabel)})</div>
        <div class="vai-idea-list">
          ${ideaSuggestions.map(item => `
            <div class="vai-idea-card">
              ${item.location ? `<div class="vai-idea-loc">${escHtml(item.location)}</div>` : ''}
              ${item.reason ? `<div class="vai-idea-reason">${escHtml(item.reason)}</div>` : ''}
              ${item.suggestionEn ? `<div class="vai-idea-quote">“${escHtml(item.suggestionEn)}”</div>` : ''}
              ${item.translationVi ? `<div class="vai-idea-vi">${escHtml(item.translationVi)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      `
      : '';

    // Build Collapsible Complete Revised Essay
    const revisedEssayHtml = revisedEssay
      ? `
        <details class="vai-revised-details" open>
          <summary class="vai-revised-summary">
            <span class="vai-revised-summary-left">
              <span class="vai-revised-caret">▶</span>
              <span>Xem bài viết hoàn chỉnh sau khi sửa (giữ nguyên ý của bạn)</span>
            </span>
            <button type="button" class="vai-copy-btn">📋 Sao chép</button>
          </summary>
          <div class="vai-revised-body">
            ${formatEssayParagraphsHtml(revisedEssay)}
          </div>
        </details>
      `
      : '';

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

      <div class="vai-sec-title">📊 Phân tích chi tiết 4 tiêu chí VSTEP (Analytic Scoring)</div>
      <div class="vai-criteria-grid">${critHtml}</div>

      ${correctionSectionsHtml}

      ${ideaSuggestionsHtml}

      ${revisedEssayHtml}

      <div class="vai-sec-title">🩺 Chẩn đoán tổng quan & Nâng cấp Từ vựng</div>
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
          <div class="vai-panel-title">${lvlUpper === 'B1' ? '💎 Từ vựng & Cụm từ chuẩn B1 nên dùng cho bài viết này' : '💎 Gợi ý nâng cấp từ vựng từ mức B1 lên chuẩn B2'}</div>
          <table class="vai-table">
            <thead><tr>
              <th>${lvlUpper === 'B1' ? 'Cách diễn đạt cơ bản / vụng' : 'Cụm từ mức B1 học viên dùng'}</th>
              <th>${lvlUpper === 'B1' ? 'Cụm từ chuẩn B1 tự nhiên' : 'Nâng cấp chuẩn B2'}</th>
              <th>Nghĩa tiếng Việt</th>
            </tr></thead>
            <tbody>${vocabUp.map(v => `<tr><td>${escHtml(v.basic)}</td><td><strong>${escHtml(v.upgraded)}</strong></td><td>${escHtml(v.meaning)}</td></tr>`).join('')}</tbody>
          </table>
        </div>
      ` : ''}

      ${sentUp.length ? `
        <div style="margin-top:14px;">
          <div class="vai-panel-title">${lvlUpper === 'B1' ? '✨ Câu viết lại chuẩn B1 rõ ràng, chuẩn ngữ pháp' : '✨ Câu viết lại nâng Band B2 (giữ nguyên ý của bạn)'}</div>
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
          renderResult(enforceMoetCaps(cached));
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
        data.studentEssay = essay;
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
              <div class="vai-header-sub">Thang điểm 0–10 (làm tròn 0.5) • Đánh dấu lỗi trực tiếp • Gợi ý bổ sung ý & Chẩn đoán</div>
            </div>
            <button type="button" class="vai-btn-retry">🔄 Chấm lại bằng AI</button>
          </div>
          <div class="vai-body">${renderTaskBodyHtml(data, essay)}</div>
        </div>
      `;
      wireInteractiveAnnotations(slot);
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

        if (d1) d1.studentEssay = essay1;
        if (d2) d2.studentEssay = essay2;
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
          ? (b.d1 ? renderTaskBodyHtml(b.d1, essay1) : '<div class="vai-error">Thí sinh chưa hoàn thành Task 1 (dưới 10 từ) — 0.0 điểm.</div>')
          : (b.d2 ? renderTaskBodyHtml(b.d2, essay2) : '<div class="vai-error">Thí sinh chưa hoàn thành Task 2 (dưới 10 từ) — 0.0 điểm.</div>');

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
        wireInteractiveAnnotations(slot);
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
