// teacher_results.js - Dedicated Teacher Results Hub for VSTEP Writing Mock Tests (PTMN Only)
(function (global) {
    'use strict';

    const RTDB_BASE = 'https://vstep6868-default-rtdb.firebaseio.com';
    const state = {
        active: false,
        rows: [],
        filteredRows: [],
        loading: false,
        error: '',
        lastUpdated: ''
    };

    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function isTeacherLoggedIn() {
        try {
            const name = (localStorage.getItem('vstep_student_name') || sessionStorage.getItem('vstep_student_name') || '').trim();
            const cls = (localStorage.getItem('vstep_student_class') || sessionStorage.getItem('vstep_student_class') || '').trim();
            if (!name && !cls) return false;
            const n = name.toUpperCase();
            const c = cls.toUpperCase();
            return c === 'GV' || n === 'PTMN' || n.includes('PTMN') || n.includes('CÔ NGUYỆT') || n.includes('CO NGUYET');
        } catch (e) {
            return false;
        }
    }

    function formatDurationShort(sec) {
        const s = Math.max(0, parseInt(sec, 10) || 0);
        if (!s) return '';
        const m = Math.floor(s / 60);
        const r = s % 60;
        return `${m}p ${String(r).padStart(2, '0')}s`;
    }

    function normalizeRecord(rec, meta = {}) {
        if (!rec || typeof rec !== 'object') return null;
        const testId = parseInt(rec.testId || meta.testId, 10) || 0;
        if (testId <= 0) return null;

        const name = rec.name || meta.name || meta.studentKey || 'Học viên';
        const className = rec.className || meta.className || '';
        const details = String(rec.details || '');

        let task1Words = typeof rec.task1Words === 'number' ? rec.task1Words : null;
        let task2Words = typeof rec.task2Words === 'number' ? rec.task2Words : null;
        if (task1Words == null && details) {
            const m1 = details.match(/Task\s*1:\s*(\d+)\s*từ/i);
            if (m1) task1Words = parseInt(m1[1], 10);
        }
        if (task2Words == null && details) {
            const m2 = details.match(/Task\s*2:\s*(\d+)\s*từ/i);
            if (m2) task2Words = parseInt(m2[1], 10);
        }

        let scoreT1 = typeof rec.scoreT1 === 'number' ? rec.scoreT1 : null;
        let scoreT2 = typeof rec.scoreT2 === 'number' ? rec.scoreT2 : null;
        let overallScore = typeof rec.overallScore === 'number' ? rec.overallScore : null;
        if (overallScore == null && details) {
            const mOv = details.match(/Tổng:\s*([\d.]+)\s*\/\s*10/i);
            if (mOv) overallScore = parseFloat(mOv[1]);
        }

        const totalWords = typeof rec.totalWords === 'number'
            ? rec.totalWords
            : ((task1Words || 0) + (task2Words || 0));
        const updatedAt = Number(rec.updatedAt || 0);
        const isTeacherRow = String(className).toUpperCase() === 'GV' || String(name).toUpperCase().includes('PTMN') || String(name).toUpperCase().includes('CÔ NGUYỆT');

        return {
            uid: meta.uid || `${meta.source}_${meta.studentKey || ''}_${testId}_${updatedAt}`,
            source: meta.source,
            attemptId: rec.attemptId || meta.attemptId || null,
            studentKey: rec.studentKey || meta.studentKey || null,
            name,
            className,
            isTeacherRow,
            testId,
            task1Words,
            task2Words,
            totalWords,
            task1Text: typeof rec.task1Text === 'string' ? rec.task1Text : '',
            task2Text: typeof rec.task2Text === 'string' ? rec.task2Text : '',
            scoreT1,
            scoreT2,
            overallScore,
            aiSynced: Boolean(rec.aiSynced),
            elapsedSeconds: typeof rec.elapsedSeconds === 'number' ? rec.elapsedSeconds : 0,
            durationText: rec.durationText || (rec.elapsedSeconds ? formatDurationShort(rec.elapsedSeconds) : ''),
            tabSwitches: typeof rec.tabSwitches === 'number' ? rec.tabSwitches : 0,
            pasteAttempts: typeof rec.pasteAttempts === 'number' ? rec.pasteAttempts : 0,
            details,
            submittedAt: rec.submittedAt || (updatedAt ? new Date(updatedAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : ''),
            updatedAt
        };
    }

    function ensureShellRendered() {
        const container = document.getElementById('teacher-writing-results-view');
        if (!container || container.dataset.initialized === '1') return;
        container.dataset.initialized = '1';
        container.innerHTML = `
            <div class="tw-hub-wrap">
                <div class="tw-hub-header">
                    <div>
                        <div style="font-size: 11.5px; font-weight: 800; letter-spacing: 0.08em; opacity: 0.88; text-transform: uppercase; margin-bottom: 4px;">
                            <i class="fa-solid fa-crown" style="color: #fbbf24; margin-right: 6px;"></i>
                            CỔNG QUẢN LÝ GIÁO VIÊN (PTMN) • ĐỒNG BỘ TRỰC TIẾP FIREBASE
                        </div>
                        <h2 style="margin: 0; font-size: 22px; font-weight: 900; color: #ffffff;">
                            📊 Bảng Kết Quả &amp; Bài Viết Writing Của Học Viên
                        </h2>
                        <div id="tw-updated-text" style="font-size: 13px; opacity: 0.9; margin-top: 4px;">
                            Đang đồng bộ dữ liệu trực tuyến...
                        </div>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        <button type="button" class="tw-hub-btn" onclick="VstepWritingTeacherHub.load()">
                            <i id="tw-refresh-icon" class="fa-solid fa-rotate"></i> Làm mới
                        </button>
                        <button type="button" class="tw-hub-btn green" onclick="VstepWritingTeacherHub.exportCSV()">
                            <i class="fa-solid fa-file-excel"></i> Xuất Excel (.CSV)
                        </button>
                        <button type="button" class="tw-hub-btn light" onclick="VstepWritingTeacherHub.close()">
                            <i class="fa-solid fa-arrow-left"></i> Về Trang Chủ
                        </button>
                    </div>
                </div>

                <div class="tw-kpi-grid">
                    <div class="tw-kpi-card">
                        <span class="tw-kpi-label"><i class="fa-solid fa-clipboard-check" style="color: #4f46e5;"></i> Tổng lượt nộp bài</span>
                        <span class="tw-kpi-val" id="tw-kpi-total">0</span>
                        <span class="tw-kpi-sub" id="tw-kpi-total-sub">Đang tải...</span>
                    </div>
                    <div class="tw-kpi-card">
                        <span class="tw-kpi-label"><i class="fa-solid fa-user-graduate" style="color: #0891b2;"></i> Học viên đã nộp</span>
                        <span class="tw-kpi-val" id="tw-kpi-students">0</span>
                        <span class="tw-kpi-sub" id="tw-kpi-classes-sub">0 lớp có dữ liệu</span>
                    </div>
                    <div class="tw-kpi-card">
                        <span class="tw-kpi-label"><i class="fa-solid fa-award" style="color: #059669;"></i> Điểm TB / Số từ TB</span>
                        <span class="tw-kpi-val" id="tw-kpi-avg">—</span>
                        <span class="tw-kpi-sub" id="tw-kpi-words-sub">Trung bình 0 từ/bài</span>
                    </div>
                    <div class="tw-kpi-card">
                        <span class="tw-kpi-label"><i class="fa-solid fa-shield-halved" style="color: #dc2626;"></i> Cảnh báo trung thực</span>
                        <span class="tw-kpi-val" id="tw-kpi-warn" style="color: #059669;">0</span>
                        <span class="tw-kpi-sub">Rời tab hoặc thử Dán văn bản</span>
                    </div>
                </div>

                <div class="tw-filter-bar">
                    <input type="text" id="tw-filter-search" class="tw-filter-input" placeholder="🔍 Tìm theo tên học viên, lớp hoặc số đề..." oninput="VstepWritingTeacherHub.render()">
                    <select id="tw-filter-class" class="tw-filter-select" onchange="VstepWritingTeacherHub.render()">
                        <option value="ALL">Tất cả các lớp (0)</option>
                    </select>
                    <select id="tw-filter-test" class="tw-filter-select" onchange="VstepWritingTeacherHub.render()">
                        <option value="ALL">Tất cả 12 đề thi</option>
                    </select>
                    <select id="tw-filter-level" class="tw-filter-select" onchange="VstepWritingTeacherHub.render()">
                        <option value="ALL">Tất cả kết quả</option>
                        <option value="C1">Đạt C1 (≥ 8.5)</option>
                        <option value="B2">Đạt B2 (6.0 – 8.0)</option>
                        <option value="B1">Đạt B1 (4.0 – 5.5)</option>
                        <option value="LOW">Chưa đạt (&lt; 4.0)</option>
                        <option value="HAS_TEXT">📝 Có toàn văn bài viết</option>
                        <option value="WARN">⚠️ Có cảnh báo trung thực</option>
                    </select>
                    <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; cursor: pointer; color: #0f172a; padding: 0 4px;">
                        <input type="checkbox" id="tw-filter-hide-gv" onchange="VstepWritingTeacherHub.render()">
                        Ẩn lượt test của GV (PTMN)
                    </label>
                </div>

                <div class="tw-table-card">
                    <div id="tw-error-box" style="display: none; padding: 14px 20px; color: #b91c1c; background: #fef2f2; font-weight: 700;"></div>
                    <div class="tw-table-scroll">
                        <table class="tw-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Học viên &amp; Lớp</th>
                                    <th>Đề thi</th>
                                    <th>Điểm VSTEP</th>
                                    <th>Dung lượng (Số từ)</th>
                                    <th>Thời gian</th>
                                    <th>Trung thực</th>
                                    <th>Nộp lúc</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody id="tw-tbody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    function syncVisibility() {
        const isT = isTeacherLoggedIn();

        // 1. Welcome header button
        const homeWrap = document.getElementById('teacher-writing-home-btn-wrap');
        if (homeWrap) {
            homeWrap.innerHTML = isT
                ? `<button type="button" class="teacher-home-open-btn" onclick="VstepWritingTeacherHub.open()"><i class="fa-solid fa-chart-column"></i> KẾT QUẢ &amp; BÀI VIẾT HỌC VIÊN (GV)</button>`
                : '';
            homeWrap.style.display = isT ? 'flex' : 'none';
        }

        // 2. Sidebar item (inserted right at top of #sidebar-test-list)
        const sidebarList = document.getElementById('sidebar-test-list');
        if (sidebarList) {
            const existing = document.getElementById('sidebar-teacher-results-li');
            if (isT) {
                if (!existing) {
                    const li = document.createElement('li');
                    li.id = 'sidebar-teacher-results-li';
                    li.className = 'test-item' + (state.active ? ' active' : '');
                    li.innerHTML = `
                        <a href="javascript:void(0)" class="teacher-writing-nav-link" onclick="VstepWritingTeacherHub.open()">
                            <span class="test-icon"><i class="fa-solid fa-chart-column"></i></span>
                            <span class="test-name">KẾT QUẢ HỌC VIÊN (GV)</span>
                        </a>
                    `;
                    sidebarList.prepend(li);
                } else {
                    existing.classList.toggle('active', state.active);
                }
            } else if (existing) {
                existing.remove();
            }
        }

        // 3. If logged out / switched to student while open -> close immediately
        if (!isT && state.active) {
            close();
        }
    }

    function open() {
        if (!isTeacherLoggedIn()) return;
        state.active = true;
        ensureShellRendered();

        const viewEl = document.getElementById('teacher-writing-results-view');
        const dashGrid = document.querySelector('.dashboard-grid');
        if (viewEl) viewEl.style.display = 'block';
        if (dashGrid) dashGrid.style.display = 'none';

        // Update sidebar active state
        document.querySelectorAll('#sidebar-test-list .test-item').forEach(li => li.classList.remove('active'));
        const teacherLi = document.getElementById('sidebar-teacher-results-li');
        if (teacherLi) teacherLi.classList.add('active');

        // Close mobile sidebar if open
        const sb = document.querySelector('.test-sidebar');
        const ov = document.getElementById('mobile-sidebar-overlay');
        if (sb) sb.classList.remove('open');
        if (ov) ov.classList.remove('active');

        load();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function close() {
        state.active = false;
        const viewEl = document.getElementById('teacher-writing-results-view');
        const dashGrid = document.querySelector('.dashboard-grid');
        if (viewEl) viewEl.style.display = 'none';
        if (dashGrid) dashGrid.style.display = '';

        document.querySelectorAll('#sidebar-test-list .test-item').forEach(li => li.classList.remove('active'));
        const homeLink = document.querySelector('#sidebar-test-list a[href="index.html"]');
        if (homeLink && homeLink.parentElement) homeLink.parentElement.classList.add('active');
    }

    async function load() {
        if (!isTeacherLoggedIn()) return;
        ensureShellRendered();
        state.loading = true;
        state.error = '';

        const icon = document.getElementById('tw-refresh-icon');
        if (icon) icon.classList.add('fa-spin');
        const tbody = document.getElementById('tw-tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 36px; color: #64748b; font-weight: 700;">
                        <i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i>
                        Đang tải bảng kết quả Writing từ Firebase...
                    </td>
                </tr>
            `;
        }

        try {
            const [subRes, progRes] = await Promise.all([
                fetch(`${RTDB_BASE}/writing_submissions.json`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).catch(() => null),
                fetch(`${RTDB_BASE}/student_progress.json`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null)
            ]);

            const merged = [];
            const seenKeys = new Set();

            if (subRes && typeof subRes === 'object') {
                Object.entries(subRes).forEach(([attemptId, rec]) => {
                    const row = normalizeRecord(rec, { source: 'writing_submissions', attemptId, uid: `sub_${attemptId}` });
                    if (row) {
                        merged.push(row);
                        seenKeys.add(`${row.studentKey || row.name}__${row.testId}__${Math.floor(row.updatedAt / 60000)}`);
                    }
                });
            }

            if (progRes && typeof progRes === 'object') {
                Object.entries(progRes).forEach(([studentKey, node]) => {
                    if (!node || typeof node !== 'object' || !node.writing) return;
                    Object.entries(node.writing).forEach(([tidStr, rec]) => {
                        const row = normalizeRecord(rec, {
                            source: 'student_progress',
                            studentKey,
                            testId: tidStr,
                            name: node.name,
                            className: node.className,
                            uid: `prog_${studentKey}_${tidStr}`
                        });
                        if (row) {
                            const dk = `${row.studentKey || row.name}__${row.testId}__${Math.floor(row.updatedAt / 60000)}`;
                            if (!seenKeys.has(dk)) {
                                seenKeys.add(dk);
                                merged.push(row);
                            }
                        }
                    });
                });
            }

            merged.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            state.rows = merged;
            state.lastUpdated = new Date().toLocaleTimeString('vi-VN');
            populateDropdowns();
        } catch (err) {
            state.error = 'Không thể tải dữ liệu từ Firebase (' + (err && err.message ? err.message : 'Lỗi kết nối') + ').';
        } finally {
            state.loading = false;
            if (icon) icon.classList.remove('fa-spin');
            render();
        }
    }

    function populateDropdowns() {
        const classSel = document.getElementById('tw-filter-class');
        const testSel = document.getElementById('tw-filter-test');
        if (classSel) {
            const prev = classSel.value || 'ALL';
            const classes = Array.from(new Set(state.rows.map(r => r.className).filter(Boolean))).sort();
            classSel.innerHTML = `<option value="ALL">Tất cả các lớp (${classes.length})</option>` +
                classes.map(c => `<option value="${esc(c)}">Lớp ${esc(c)}</option>`).join('');
            if (classes.includes(prev)) classSel.value = prev;
        }
        if (testSel) {
            const prevT = testSel.value || 'ALL';
            const ids = Array.from(new Set([...Array.from({ length: 12 }, (_, i) => i + 1), ...state.rows.map(r => r.testId)])).sort((a, b) => a - b);
            testSel.innerHTML = `<option value="ALL">Tất cả ${ids.length} đề thi</option>` +
                ids.map(id => `<option value="${id}">Writing Test ${String(id).padStart(2, '0')}</option>`).join('');
            if (ids.map(String).includes(String(prevT))) testSel.value = prevT;
        }
    }

    function render() {
        const errBox = document.getElementById('tw-error-box');
        if (errBox) {
            if (state.error) {
                errBox.style.display = 'block';
                errBox.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${esc(state.error)}`;
            } else {
                errBox.style.display = 'none';
            }
        }

        const q = (document.getElementById('tw-filter-search')?.value || '').trim().toLowerCase();
        const cls = document.getElementById('tw-filter-class')?.value || 'ALL';
        const tst = document.getElementById('tw-filter-test')?.value || 'ALL';
        const lvl = document.getElementById('tw-filter-level')?.value || 'ALL';
        const hideGv = !!document.getElementById('tw-filter-hide-gv')?.checked;

        const filtered = state.rows.filter(r => {
            if (hideGv && r.isTeacherRow) return false;
            if (cls !== 'ALL' && r.className !== cls) return false;
            if (tst !== 'ALL' && String(r.testId) !== String(tst)) return false;
            if (q) {
                const hay = `${r.name} ${r.className} test ${r.testId} de ${r.testId}`.toLowerCase();
                if (!hay.includes(q)) return false;
            }
            const hasWarn = (r.tabSwitches > 0) || (r.pasteAttempts > 0);
            const hasText = Boolean((r.task1Text && r.task1Text.trim()) || (r.task2Text && r.task2Text.trim()));
            if (lvl === 'C1' && !(r.overallScore != null && r.overallScore >= 8.5)) return false;
            if (lvl === 'B2' && !(r.overallScore != null && r.overallScore >= 6.0 && r.overallScore < 8.5)) return false;
            if (lvl === 'B1' && !(r.overallScore != null && r.overallScore >= 4.0 && r.overallScore < 6.0)) return false;
            if (lvl === 'LOW' && !(r.overallScore != null && r.overallScore < 4.0)) return false;
            if (lvl === 'HAS_TEXT' && !hasText) return false;
            if (lvl === 'WARN' && !hasWarn) return false;
            return true;
        });

        state.filteredRows = filtered;

        const upd = document.getElementById('tw-updated-text');
        if (upd) {
            upd.textContent = state.lastUpdated
                ? `Cập nhật lúc ${state.lastUpdated} • Hiển thị ${filtered.length}/${state.rows.length} lượt nộp bài`
                : 'Chưa có dữ liệu đồng bộ.';
        }

        const uniqueStudents = new Set(filtered.map(r => `${r.name.toLowerCase()}__${r.className.toLowerCase()}`)).size;
        const uniqueClasses = new Set(filtered.map(r => r.className).filter(Boolean)).size;
        const scoredRows = filtered.filter(r => r.overallScore != null && r.overallScore > 0);
        const avgScore = scoredRows.length > 0
            ? (scoredRows.reduce((s, r) => s + r.overallScore, 0) / scoredRows.length).toFixed(1)
            : null;
        const avgWords = filtered.length > 0
            ? Math.round(filtered.reduce((s, r) => s + (r.totalWords || 0), 0) / filtered.length)
            : 0;
        const warnCount = filtered.filter(r => (r.tabSwitches > 0) || (r.pasteAttempts > 0)).length;

        const elT = document.getElementById('tw-kpi-total');
        const elTS = document.getElementById('tw-kpi-total-sub');
        const elS = document.getElementById('tw-kpi-students');
        const elC = document.getElementById('tw-kpi-classes-sub');
        const elA = document.getElementById('tw-kpi-avg');
        const elW = document.getElementById('tw-kpi-words-sub');
        const elWrn = document.getElementById('tw-kpi-warn');

        if (elT) elT.textContent = String(filtered.length);
        if (elTS) elTS.textContent = `Trên tổng ${state.rows.length} lượt đã lưu`;
        if (elS) elS.textContent = String(uniqueStudents);
        if (elC) elC.textContent = `${uniqueClasses} lớp có dữ liệu`;
        if (elA) elA.innerHTML = avgScore != null
            ? `${avgScore} <span style="font-size: 13px; font-weight: 700; color: #64748b;">/10</span>`
            : `${avgWords} <span style="font-size: 13px; font-weight: 700; color: #64748b;">từ/bài</span>`;
        if (elW) elW.textContent = `Dung lượng TB: ${avgWords} từ • ${scoredRows.length} lượt có điểm`;
        if (elWrn) {
            elWrn.textContent = String(warnCount);
            elWrn.style.color = warnCount > 0 ? '#dc2626' : '#059669';
        }

        const tbody = document.getElementById('tw-tbody');
        if (!tbody) return;
        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 36px; color: #64748b; font-weight: 600;">
                        Chưa có lượt nộp bài Writing nào phù hợp với bộ lọc hiện tại.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map((r, idx) => {
            let scoreHtml = `<span class="tw-pill neutral">Chưa lưu điểm cũ</span>`;
            if (r.overallScore != null) {
                const scCls = r.overallScore >= 8.5 ? 'c1' : r.overallScore >= 6.0 ? 'b2' : r.overallScore >= 4.0 ? 'b1' : 'low';
                const band = r.overallScore >= 8.5 ? 'C1' : r.overallScore >= 6.0 ? 'B2' : r.overallScore >= 4.0 ? 'B1' : '< B1';
                const tSub = (r.scoreT1 != null && r.scoreT2 != null)
                    ? `<div style="font-size: 11.5px; color: #64748b; margin-top: 3px; font-weight: 700;">T1: ${r.scoreT1.toFixed(1)} • T2: ${r.scoreT2.toFixed(1)} ${r.aiSynced ? '• AI' : ''}</div>`
                    : '';
                scoreHtml = `<span class="tw-pill ${scCls}">${r.overallScore.toFixed(1)}/10 • ${band}</span>${tSub}`;
            }

            const t1Ok = (r.task1Words || 0) >= 120;
            const t2Ok = (r.task2Words || 0) >= 250;
            const wordsHtml = `
                <div style="font-weight: 800; color: #0f172a;">Tổng: ${r.totalWords || 0} từ</div>
                <div style="font-size: 11.5px; margin-top: 2px; font-weight: 700;">
                    <span style="color: ${t1Ok ? '#059669' : '#d97706'};">T1: ${r.task1Words != null ? r.task1Words : '—'}</span>
                    •
                    <span style="color: ${t2Ok ? '#059669' : '#d97706'};">T2: ${r.task2Words != null ? r.task2Words : '—'}</span>
                </div>
            `;

            const hasWarn = (r.tabSwitches > 0) || (r.pasteAttempts > 0);
            const integHtml = hasWarn
                ? `<span class="tw-pill warn"><i class="fa-solid fa-triangle-exclamation"></i> Tab ${r.tabSwitches} • Dán ${r.pasteAttempts}</span>`
                : `<span class="tw-pill ok"><i class="fa-solid fa-circle-check"></i> Trung thực</span>`;

            const hasText = Boolean((r.task1Text && r.task1Text.trim()) || (r.task2Text && r.task2Text.trim()));
            const safeUid = encodeURIComponent(r.uid);

            return `
                <tr>
                    <td style="font-weight: 700; color: #94a3b8;">${idx + 1}</td>
                    <td>
                        <div style="font-weight: 800; color: #0f172a;">${esc(r.name)}</div>
                        <span style="font-size: 12px; font-weight: 700; color: ${r.isTeacherRow ? '#b45309' : '#4f46e5'};">
                            ${r.className ? `Lớp ${esc(r.className)}` : 'Chưa rõ lớp'}
                        </span>
                    </td>
                    <td>
                        <span style="font-weight: 800; color: #4338ca;">TEST ${String(r.testId).padStart(2, '0')}</span>
                    </td>
                    <td>${scoreHtml}</td>
                    <td style="white-space: nowrap;">${wordsHtml}</td>
                    <td style="font-size: 12.5px; font-weight: 700; white-space: nowrap;">
                        ${r.durationText ? `⏱️ ${esc(r.durationText)}` : '<span style="color:#94a3b8;">—</span>'}
                    </td>
                    <td>${integHtml}</td>
                    <td style="font-size: 12px; color: #64748b; white-space: nowrap;">${esc(r.submittedAt || '—')}</td>
                    <td>
                        <div style="display: flex; gap: 6px; flex-wrap: nowrap;">
                            <button type="button" class="tw-action-btn" onclick="VstepWritingTeacherHub.openReport(decodeURIComponent('${safeUid}'))" title="Xem Phiếu Báo Cáo Kết Quả">
                                <i class="fa-solid fa-file-invoice"></i> Phiếu
                            </button>
                            ${hasText ? `
                                <button type="button" class="tw-action-btn primary" onclick="VstepWritingTeacherHub.openEssayModal(decodeURIComponent('${safeUid}'))" title="Đọc toàn văn bài viết Task 1 & Task 2 của học viên">
                                    <i class="fa-solid fa-book-open"></i> Đọc bài
                                </button>
                            ` : ''}
                            <button type="button" class="tw-action-btn danger" onclick="VstepWritingTeacherHub.deleteRow(decodeURIComponent('${safeUid}'))" title="Xóa lượt thi này khỏi bảng">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function openReport(uid) {
        const row = state.rows.find(r => r.uid === uid);
        if (!row) return;
        if (typeof global.VstepResultReport !== 'undefined' && typeof global.VstepResultReport.open === 'function') {
            global.VstepResultReport.open({
                testId: row.testId,
                studentName: row.name,
                studentClass: row.className,
                elapsedSeconds: row.elapsedSeconds || 0,
                submittedAt: row.submittedAt,
                task1Words: row.task1Words || 0,
                task2Words: row.task2Words || 0,
                task1Text: row.task1Text || '',
                task2Text: row.task2Text || '',
                tabSwitches: row.tabSwitches || 0,
                pasteAttempts: row.pasteAttempts || 0,
                scoreT1: row.scoreT1 || 0,
                scoreT2: row.scoreT2 || 0,
                overallScore: row.overallScore || 0,
                aiSynced: row.aiSynced,
                aiPending: false,
                skipSync: true,
                attemptId: row.attemptId
            });
        }
    }

    function openEssayModal(uid) {
        const row = state.rows.find(r => r.uid === uid);
        if (!row) return;
        const old = document.getElementById('tw-essay-modal-overlay');
        if (old) old.remove();

        const testPad = String(row.testId).padStart(2, '0');
        const safeUid = encodeURIComponent(row.uid);
        const testData = (typeof WRITING_TESTS_DATA !== 'undefined' && WRITING_TESTS_DATA[row.testId]) ? WRITING_TESTS_DATA[row.testId] : null;
        const p1Title = testData && testData.task1 ? (testData.task1.title || 'Task 1 — Viết thư / Email') : 'Task 1 — Viết thư / Email';
        const p2Title = testData && testData.task2 ? (testData.task2.title || 'Task 2 — Bài luận') : 'Task 2 — Bài luận';

        const overlay = document.createElement('div');
        overlay.id = 'tw-essay-modal-overlay';
        overlay.className = 'tw-essay-modal-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="tw-essay-modal-card">
                <div style="background: linear-gradient(135deg, #1e1b4b, #4f46e5); color: #fff; padding: 18px 24px; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
                    <div>
                        <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; opacity: 0.85; text-transform: uppercase;">
                            BÀI LÀM CHI TIẾT HỌC VIÊN • WRITING MOCK TEST ${testPad}
                        </div>
                        <h3 style="margin: 4px 0 0; font-size: 19px; font-weight: 900;">
                            ${esc(row.name)} ${row.className ? `— Lớp ${esc(row.className)}` : ''}
                        </h3>
                        <div style="font-size: 12.5px; opacity: 0.9; margin-top: 4px;">
                            Nộp lúc ${esc(row.submittedAt || '—')} • Tổng: ${row.totalWords || 0} từ (T1: ${row.task1Words || 0}, T2: ${row.task2Words || 0})
                            ${row.overallScore != null ? ` • Điểm: ${row.overallScore.toFixed(1)}/10` : ''}
                            • ${row.tabSwitches || 0} rời tab • ${row.pasteAttempts || 0} dán văn bản
                        </div>
                    </div>
                    <button type="button" onclick="document.getElementById('tw-essay-modal-overlay')?.remove()" style="background: rgba(255,255,255,0.18); border: none; color: #fff; width: 34px; height: 34px; border-radius: 10px; cursor: pointer; font-size: 20px;">&times;</button>
                </div>
                <div class="tw-essay-modal-body">
                    <div class="tw-essay-grid">
                        <div class="tw-essay-panel">
                            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                                <strong style="color: #1e3a8a; font-size: 14px;"><i class="fa-solid fa-envelope-open-text"></i> ${esc(p1Title)}</strong>
                                <span class="tw-pill ${(row.task1Words || 0) >= 120 ? 'ok' : 'b1'}">${row.task1Words || 0} từ${row.scoreT1 != null ? ` • ${row.scoreT1.toFixed(1)}/10` : ''}</span>
                            </div>
                            <div class="tw-essay-text">${row.task1Text ? esc(row.task1Text) : '<em style="color:#94a3b8;">(Học viên không nộp nội dung Task 1)</em>'}</div>
                        </div>
                        <div class="tw-essay-panel">
                            <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                                <strong style="color: #4338ca; font-size: 14px;"><i class="fa-solid fa-file-lines"></i> ${esc(p2Title)}</strong>
                                <span class="tw-pill ${(row.task2Words || 0) >= 250 ? 'ok' : 'b1'}">${row.task2Words || 0} từ${row.scoreT2 != null ? ` • ${row.scoreT2.toFixed(1)}/10` : ''}</span>
                            </div>
                            <div class="tw-essay-text">${row.task2Text ? esc(row.task2Text) : '<em style="color:#94a3b8;">(Học viên không nộp nội dung Task 2)</em>'}</div>
                        </div>
                    </div>
                    <div id="tw-ai-grade-mount" style="margin-top: 16px;"></div>
                </div>
                <div style="padding: 14px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        <button type="button" class="tw-action-btn" onclick="VstepWritingTeacherHub.copyEssays(decodeURIComponent('${safeUid}'), this)">
                            <i class="fa-regular fa-copy"></i> Sao chép cả 2 bài viết
                        </button>
                        ${typeof global.VstepAIGrader !== 'undefined' ? `
                            <button type="button" class="tw-action-btn primary" onclick="VstepWritingTeacherHub.runAiGradeInModal(decodeURIComponent('${safeUid}'))">
                                <i class="fa-solid fa-wand-magic-sparkles"></i> Chấm chi tiết bằng Trợ lý Miss Nguyệt
                            </button>
                        ` : ''}
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button type="button" class="tw-action-btn" onclick="VstepWritingTeacherHub.openReport(decodeURIComponent('${safeUid}'))">
                            <i class="fa-solid fa-file-invoice"></i> Mở Phiếu Điểm
                        </button>
                        <button type="button" class="tw-action-btn" onclick="document.getElementById('tw-essay-modal-overlay')?.remove()">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    function copyEssays(uid, btnEl) {
        const row = state.rows.find(r => r.uid === uid);
        if (!row) return;
        const text = `=== WRITING MOCK TEST ${String(row.testId).padStart(2, '0')} ===\nHọc viên: ${row.name} (${row.className})\nNộp lúc: ${row.submittedAt}\n\n--- TASK 1 (${row.task1Words || 0} từ) ---\n${row.task1Text || '(Trống)'}\n\n--- TASK 2 (${row.task2Words || 0} từ) ---\n${row.task2Text || '(Trống)'}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                if (btnEl) {
                    const o = btnEl.innerHTML;
                    btnEl.innerHTML = '<i class="fa-solid fa-check"></i> Đã sao chép!';
                    setTimeout(() => { btnEl.innerHTML = o; }, 2000);
                }
            }).catch(() => alert('Không thể sao chép tự động.'));
        }
    }

    function runAiGradeInModal(uid) {
        const row = state.rows.find(r => r.uid === uid);
        const mount = document.getElementById('tw-ai-grade-mount');
        if (!row || !mount || typeof global.VstepAIGrader === 'undefined') return;
        mount.innerHTML = '';
        const testData = (typeof WRITING_TESTS_DATA !== 'undefined' && WRITING_TESTS_DATA[row.testId]) ? WRITING_TESTS_DATA[row.testId] : null;
        const stripTags = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const p1 = testData && testData.task1 ? stripTags(testData.task1.promptHtml || testData.task1.prompt || testData.task1.title) : `VSTEP Writing Test ${row.testId} Task 1`;
        const p2 = testData && testData.task2 ? stripTags(testData.task2.promptHtml || testData.task2.prompt || testData.task2.title) : `VSTEP Writing Test ${row.testId} Task 2`;

        global.VstepAIGrader.mountFullMock(mount, {
            prompt1: p1,
            essay1: row.task1Text || '',
            prompt2: p2,
            essay2: row.task2Text || ''
        });
        mount.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    async function deleteRow(uid) {
        const row = state.rows.find(r => r.uid === uid);
        if (!row) return;
        if (!confirm(`Xóa lượt thi Writing Test ${String(row.testId).padStart(2, '0')} của "${row.name} (${row.className})" khỏi bảng kết quả Firebase?`)) return;

        try {
            const reqs = [];
            if (row.attemptId) {
                reqs.push(fetch(`${RTDB_BASE}/writing_submissions/${encodeURIComponent(row.attemptId)}.json`, { method: 'DELETE' }));
            }
            if (row.source === 'student_progress' && row.studentKey) {
                reqs.push(fetch(`${RTDB_BASE}/student_progress/${encodeURIComponent(row.studentKey)}/writing/${row.testId}.json`, { method: 'DELETE' }));
            }
            await Promise.all(reqs);
            state.rows = state.rows.filter(r => r.uid !== uid);
            render();
        } catch (e) {
            alert('Không thể xóa dữ liệu lúc này. Vui lòng thử lại.');
        }
    }

    function exportCSV() {
        const list = state.filteredRows || [];
        if (!list.length) {
            alert('Không có dữ liệu nào để xuất Excel.');
            return;
        }
        const headers = ['STT', 'Họ và tên', 'Lớp', 'Đề thi', 'Điểm Tổng (/10)', 'Điểm Task 1', 'Điểm Task 2', 'Nguồn chấm', 'Từ Task 1', 'Từ Task 2', 'Tổng số từ', 'Thời gian làm', 'Rời tab', 'Dán văn bản', 'Thời điểm nộp', 'Nội dung Task 1', 'Nội dung Task 2'];
        const lines = [headers.join(',')];
        list.forEach((r, i) => {
            const cols = [
                i + 1,
                r.name,
                r.className,
                `Test ${String(r.testId).padStart(2, '0')}`,
                r.overallScore != null ? r.overallScore.toFixed(1) : '',
                r.scoreT1 != null ? r.scoreT1.toFixed(1) : '',
                r.scoreT2 != null ? r.scoreT2.toFixed(1) : '',
                r.overallScore != null ? (r.aiSynced ? 'AI chuẩn 729' : 'Hệ thống') : '',
                r.task1Words != null ? r.task1Words : '',
                r.task2Words != null ? r.task2Words : '',
                r.totalWords || '',
                r.durationText || '',
                r.tabSwitches,
                r.pasteAttempts,
                r.submittedAt,
                r.task1Text || '',
                r.task2Text || ''
            ].map(v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`);
            lines.push(cols.join(','));
        });
        const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ket_Qua_Writing_Miss_Nguyet_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    global.VstepWritingTeacherHub = {
        syncVisibility,
        open,
        close,
        load,
        render,
        openReport,
        openEssayModal,
        copyEssays,
        runAiGradeInModal,
        deleteRow,
        exportCSV
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(syncVisibility, 120));
    } else {
        setTimeout(syncVisibility, 120);
    }
})(window);
