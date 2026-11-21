// result_report.js - Official VSTEP Writing Result Report Card & Persistent Integrity Tracker
(function (global) {
    'use strict';

    const VIOLATION_STORAGE_KEY = 'vstep_writing_report_violations_v1';
    let currentReportState = null;

    function escHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeKey(str) {
        return String(str || '')
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '');
    }

    function getLoggedInStudent() {
        const name = (localStorage.getItem('vstep_student_name') || sessionStorage.getItem('vstep_student_name') || '').trim();
        const className = (localStorage.getItem('vstep_student_class') || sessionStorage.getItem('vstep_student_class') || '').trim();
        return {
            name: name || 'Học viên',
            className: className || 'Chưa cập nhật'
        };
    }

    function getViolationKey(testId) {
        const st = getLoggedInStudent();
        const nk = normalizeKey(st.name) || 'guest';
        const ck = normalizeKey(st.className) || 'noclass';
        return `${ck}__${nk}__test_${parseInt(testId, 10) || 0}`;
    }

    function readViolationMap() {
        try {
            const raw = localStorage.getItem(VIOLATION_STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function writeViolationMap(map) {
        try {
            localStorage.setItem(VIOLATION_STORAGE_KEY, JSON.stringify(map));
        } catch (e) {}
    }

    function getViolations(testId) {
        const key = getViolationKey(testId);
        const map = readViolationMap();
        const rec = map[key] || {};
        return {
            tabSwitches: parseInt(rec.tabSwitches || 0, 10) || 0,
            pasteAttempts: parseInt(rec.pasteAttempts || 0, 10) || 0
        };
    }

    function recordViolation(testId, type) {
        const key = getViolationKey(testId);
        const map = readViolationMap();
        if (!map[key]) {
            map[key] = { tabSwitches: 0, pasteAttempts: 0, updatedAt: Date.now() };
        }
        if (type === 'tab') {
            map[key].tabSwitches = (parseInt(map[key].tabSwitches || 0, 10) || 0) + 1;
        } else if (type === 'paste') {
            map[key].pasteAttempts = (parseInt(map[key].pasteAttempts || 0, 10) || 0) + 1;
        }
        map[key].updatedAt = Date.now();
        writeViolationMap(map);
        return {
            tabSwitches: map[key].tabSwitches,
            pasteAttempts: map[key].pasteAttempts
        };
    }

    function formatDuration(totalSeconds) {
        const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
        const mins = Math.floor(sec / 60);
        const remSec = sec % 60;
        const secStr = remSec < 10 ? '0' + remSec : String(remSec);
        return {
            text: `${mins} phút ${secStr} giây`,
            isOver40Min: sec > 40 * 60
        };
    }

    function getCertificationStatus(overallScore, totalWords) {
        if (!totalWords || totalWords <= 0) {
            return {
                label: 'CHƯA CÓ BÀI LÀM',
                sub: 'Chưa ghi nhận nội dung bài viết để đánh giá chuẩn B1 - B2',
                bg: '#f1f5f9',
                border: '#cbd5e1',
                color: '#475569',
                icon: 'fa-circle-minus'
            };
        }
        if (overallScore >= 8.5) {
            return {
                label: '🏅 ĐẠT CHUẨN C1 (VƯỢT CHUẨN B1 - B2)',
                sub: 'Xuất sắc! Vượt xa yêu cầu chuẩn đầu ra B1 (≥ 4.0) và B2 (≥ 6.0)',
                bg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '#3b82f6',
                color: '#1e3a8a',
                icon: 'fa-award'
            };
        }
        if (overallScore >= 6.0) {
            return {
                label: '🏅 ĐẠT CHUẨN B2 (ĐẠT CẢ B1 & B2)',
                sub: 'Chúc mừng! Bài viết đạt chuẩn B2 (≥ 6.0/10) theo khung năng lực VSTEP',
                bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
                border: '#06b6d4',
                color: '#0e7490',
                icon: 'fa-medal'
            };
        }
        if (overallScore >= 4.0) {
            return {
                label: '🏅 ĐẠT CHUẨN B1 (CHƯA ĐẠT CHUẨN B2)',
                sub: 'Bài viết đã đạt chuẩn B1 (≥ 4.0/10). Cần đạt từ 6.0/10 trở lên để đạt chuẩn B2',
                bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '#22c55e',
                color: '#15803d',
                icon: 'fa-circle-check'
            };
        }
        return {
            label: '❌ CHƯA ĐẠT CHUẨN B1 - B2',
            sub: 'Cần đạt tối thiểu 4.0/10 để đạt chuẩn B1 và 6.0/10 để đạt chuẩn B2',
            bg: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
            border: '#f43f5e',
            color: '#be123c',
            icon: 'fa-circle-xmark'
        };
    }

    function injectStyles() {
        if (document.getElementById('vstep-result-report-styles')) return;
        const style = document.createElement('style');
        style.id = 'vstep-result-report-styles';
        style.textContent = `
            .vrr-overlay {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.72);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 18px;
                overflow-y: auto;
                animation: vrrFadeIn 0.25s ease;
            }
            @keyframes vrrFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .vrr-modal {
                width: 100%;
                max-width: 680px;
                background: #ffffff;
                border-radius: 20px;
                box-shadow: 0 25px 60px rgba(15, 23, 42, 0.35);
                overflow: hidden;
                font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
                color: #0f172a;
                margin: auto;
                border: 1.5px solid #e2e8f0;
                animation: vrrSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes vrrSlideUp {
                from { transform: translateY(18px) scale(0.98); opacity: 0; }
                to { transform: translateY(0) scale(1); opacity: 1; }
            }
            .vrr-header {
                background: linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4f46e5 100%);
                color: #ffffff;
                padding: 20px 24px;
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
            }
            .vrr-brand {
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 1px;
                text-transform: uppercase;
                color: #c7d2fe;
                margin-bottom: 4px;
            }
            .vrr-title {
                margin: 0;
                font-size: 20px;
                font-weight: 800;
                letter-spacing: -0.2px;
                color: #ffffff;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .vrr-sync-pill {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                margin-top: 8px;
                font-size: 12px;
                font-weight: 700;
                padding: 4px 12px;
                border-radius: 999px;
            }
            .vrr-sync-pill.synced {
                background: rgba(16, 185, 129, 0.22);
                color: #a7f3d0;
                border: 1px solid rgba(52, 211, 153, 0.5);
            }
            .vrr-sync-pill.pending {
                background: rgba(251, 191, 36, 0.2);
                color: #fde68a;
                border: 1px solid rgba(251, 191, 36, 0.45);
            }
            .vrr-close-btn {
                background: rgba(255, 255, 255, 0.14);
                border: 1px solid rgba(255, 255, 255, 0.25);
                color: #ffffff;
                width: 34px;
                height: 34px;
                border-radius: 10px;
                font-size: 18px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                transition: background 0.2s;
            }
            .vrr-close-btn:hover { background: rgba(255, 255, 255, 0.28); }
            .vrr-body {
                padding: 20px 24px;
                display: flex;
                flex-direction: column;
                gap: 14px;
                max-height: 75vh;
                overflow-y: auto;
            }
            .vrr-info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            @media (max-width: 540px) {
                .vrr-info-grid { grid-template-columns: 1fr; }
            }
            .vrr-info-cell {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 12px 14px;
            }
            .vrr-cell-label {
                font-size: 11.5px;
                font-weight: 700;
                text-transform: uppercase;
                color: #64748b;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .vrr-cell-val {
                font-size: 15px;
                font-weight: 800;
                color: #0f172a;
                line-height: 1.4;
            }
            .vrr-cell-sub {
                font-size: 12.5px;
                color: #475569;
                margin-top: 3px;
                line-height: 1.45;
            }
            .vrr-overtime-tag {
                display: inline-block;
                margin-left: 6px;
                padding: 2px 8px;
                border-radius: 6px;
                background: #fee2e2;
                color: #b91c1c;
                border: 1px solid #fca5a5;
                font-size: 11.5px;
                font-weight: 800;
                vertical-align: middle;
            }
            .vrr-integrity-box {
                border-radius: 12px;
                padding: 13px 16px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .vrr-integrity-box.clean {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border: 1.5px solid #86efac;
                color: #14532d;
            }
            .vrr-integrity-box.warn {
                background: linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%);
                border: 1.5px solid #fca5a5;
                color: #991b1b;
            }
            .vrr-score-card {
                background: linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%);
                border: 1.5px solid #c7d2fe;
                border-radius: 14px;
                padding: 16px 18px;
            }
            .vrr-score-main-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 12px;
                padding-bottom: 12px;
                border-bottom: 1.5px dashed #c7d2fe;
                margin-bottom: 12px;
            }
            .vrr-big-score {
                font-size: 36px;
                font-weight: 900;
                color: #1e1b4b;
                line-height: 1;
                letter-spacing: -1px;
            }
            .vrr-big-score span {
                font-size: 16px;
                font-weight: 700;
                color: #6366f1;
            }
            .vrr-score-breakdown {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }
            @media (max-width: 540px) {
                .vrr-score-breakdown { grid-template-columns: 1fr; }
            }
            .vrr-task-score-box {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                padding: 10px 13px;
            }
            .vrr-cert-box {
                border-radius: 12px;
                padding: 14px 16px;
                border: 1.5px solid;
                text-align: center;
            }
            .vrr-footer {
                padding: 14px 24px 18px;
                background: #f8fafc;
                border-top: 1px solid #e2e8f0;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                flex-wrap: wrap;
            }
            .vrr-btn {
                border: none;
                border-radius: 10px;
                padding: 10px 18px;
                font-size: 13.5px;
                font-weight: 700;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 7px;
                transition: transform 0.15s, opacity 0.15s;
            }
            .vrr-btn:hover { opacity: 0.92; transform: translateY(-1px); }
            .vrr-btn-print {
                background: linear-gradient(135deg, #4f46e5, #6366f1);
                color: #ffffff;
                box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
            }
            .vrr-btn-close {
                background: #e2e8f0;
                color: #334155;
            }
        `;
        document.head.appendChild(style);
    }

    function buildModalInnerHtml(data) {
        const testPad = (parseInt(data.testId, 10) || 1).toString().padStart(2, '0');
        const dur = formatDuration(data.elapsedSeconds);
        const t1w = parseInt(data.task1Words || 0, 10) || 0;
        const t2w = parseInt(data.task2Words || 0, 10) || 0;
        const totalWords = t1w + t2w;

        const tabCount = parseInt(data.tabSwitches || 0, 10) || 0;
        const pasteCount = parseInt(data.pasteAttempts || 0, 10) || 0;
        const hasViolation = tabCount > 0 || pasteCount > 0;

        const s1 = Number(data.scoreT1 || 0);
        const s2 = Number(data.scoreT2 || 0);
        const overall = Number(data.overallScore || 0);
        const t2Scale7 = (s2 * 0.7).toFixed(2);
        const t2WeightVal = ((s2 * 2) / 3).toFixed(2);
        const t1WeightVal = (s1 / 3).toFixed(2);

        const cert = getCertificationStatus(overall, totalWords);

        const syncHtml = data.aiSynced
            ? `<div class="vrr-sync-pill synced"><i class="fa-solid fa-circle-check"></i> Đã đồng bộ 100% điểm chính thức từ Giám khảo AI VSTEP</div>`
            : (data.aiPending
                ? `<div class="vrr-sync-pill pending"><i class="fa-solid fa-spinner fa-spin"></i> Đang chấm AI... Phiếu sẽ tự cập nhật khi Giám khảo AI chấm xong</div>`
                : `<div class="vrr-sync-pill pending"><i class="fa-solid fa-calculator"></i> Điểm ước tính hệ thống (tự đồng bộ khi Giám khảo AI chấm xong)</div>`);

        let integrityHtml = '';
        if (!hasViolation) {
            integrityHtml = `
                <div class="vrr-integrity-box clean">
                    <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.4px;color:#15803d;">🛡️ Cảnh báo gian lận</div>
                    <div style="font-size:15px;font-weight:800;display:flex;align-items:center;gap:8px;">
                        <span>✅ Làm bài trung thực (0 lần chuyển tab)</span>
                    </div>
                </div>`;
        } else {
            const pasteLine = pasteCount > 0
                ? `<div style="font-size:14px;font-weight:700;color:#b91c1c;margin-top:2px;">📋 Phát hiện cố dán văn bản (Paste): <strong>${pasteCount} lần</strong></div>`
                : '';
            integrityHtml = `
                <div class="vrr-integrity-box warn">
                    <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.4px;color:#b91c1c;">🛡️ Cảnh báo gian lận</div>
                    <div style="font-size:15px;font-weight:800;">
                        ⚠️ Phát hiện chuyển tab / rời phòng thi: <strong>${tabCount} lần</strong>
                    </div>
                    ${pasteLine}
                    <div style="font-size:12px;color:#7f1d1d;opacity:0.9;">
                        (Số lần vi phạm được lưu cố định theo bài thi, không bị xóa khi bấm Viết lại bài)
                    </div>
                </div>`;
        }

        return `
            <div class="vrr-header">
                <div>
                    <div class="vrr-brand">ENGLISH WITH MISS NGUYET • VSTEP WRITING</div>
                    <h2 class="vrr-title"><i class="fa-solid fa-file-invoice"></i> PHIẾU BÁO CÁO KẾT QUẢ</h2>
                    ${syncHtml}
                </div>
                <button type="button" class="vrr-close-btn" onclick="VstepResultReport.close()" title="Đóng">&times;</button>
            </div>
            <div class="vrr-body">
                <div class="vrr-info-grid">
                    <div class="vrr-info-cell">
                        <div class="vrr-cell-label">👤 Tên học viên</div>
                        <div class="vrr-cell-val">${escHtml(data.studentName)}</div>
                    </div>
                    <div class="vrr-info-cell">
                        <div class="vrr-cell-label">🏫 Lớp</div>
                        <div class="vrr-cell-val">${escHtml(data.studentClass)}</div>
                    </div>
                    <div class="vrr-info-cell">
                        <div class="vrr-cell-label">📝 Bài thi</div>
                        <div class="vrr-cell-val" style="color:#4338ca;">WRITING MOCK TEST ${testPad}</div>
                        <div class="vrr-cell-sub">📅 Nộp lúc: <strong>${escHtml(data.submittedAt)}</strong></div>
                    </div>
                    <div class="vrr-info-cell">
                        <div class="vrr-cell-label">⏱️ Thời gian viết &amp; Số từ</div>
                        <div class="vrr-cell-val">
                            ${escHtml(dur.text)}
                            ${dur.isOver40Min ? '<span class="vrr-overtime-tag">Quá 40 phút</span>' : ''}
                        </div>
                        <div class="vrr-cell-sub">✍️ Tổng số từ: <strong>${totalWords} từ</strong> (T1: ${t1w} • T2: ${t2w})</div>
                    </div>
                </div>

                ${integrityHtml}

                <div class="vrr-score-card">
                    <div class="vrr-score-main-row">
                        <div>
                            <div style="font-size:12px;font-weight:800;text-transform:uppercase;color:#4338ca;letter-spacing:0.4px;">🎯 ĐIỂM SỐ CHÍNH THỨC (THANG 10)</div>
                            <div style="font-size:12.5px;color:#475569;margin-top:2px;">Công thức chuẩn VSTEP: (Task 1 + 2 × Task 2) / 3 • Làm tròn 0.5</div>
                        </div>
                        <div class="vrr-big-score">${overall.toFixed(1)} <span>/ 10</span></div>
                    </div>
                    <div class="vrr-score-breakdown">
                        <div class="vrr-task-score-box">
                            <div style="font-size:11.5px;font-weight:800;color:#64748b;text-transform:uppercase;">Task 1 — Thư / Email (Tỷ trọng 1/3)</div>
                            <div style="font-size:19px;font-weight:800;color:#0f172a;margin-top:3px;">${s1.toFixed(1)} <span style="font-size:13px;color:#64748b;">/ 10</span></div>
                            <div style="font-size:12px;color:#475569;margin-top:2px;">Đóng góp: <strong>${t1WeightVal} / 3.33</strong></div>
                        </div>
                        <div class="vrr-task-score-box" style="border-color:#a5b4fc;background:#fafaff;">
                            <div style="font-size:11.5px;font-weight:800;color:#4338ca;text-transform:uppercase;">Task 2 — Bài luận (Tỷ trọng 2/3 bài thi)</div>
                            <div style="font-size:19px;font-weight:800;color:#1e1b4b;margin-top:3px;">${s2.toFixed(1)} <span style="font-size:13px;color:#64748b;">/ 10</span></div>
                            <div style="font-size:12px;color:#312e81;margin-top:2px;">Quy đổi Thang 7.0: <strong>${t2Scale7} / 7.0</strong> • Tỷ trọng 2/3: <strong>${t2WeightVal}/6.67</strong></div>
                        </div>
                    </div>
                </div>

                <div class="vrr-cert-box" style="background:${cert.bg};border-color:${cert.border};color:${cert.color};">
                    <div style="font-size:16.5px;font-weight:900;letter-spacing:-0.1px;">${cert.label}</div>
                    <div style="font-size:13px;font-weight:600;margin-top:4px;opacity:0.92;">${cert.sub}</div>
                </div>
            </div>
            <div class="vrr-footer">
                <button type="button" class="vrr-btn vrr-btn-print" onclick="VstepResultReport.printReport()">
                    <i class="fa-solid fa-print"></i> In / Lưu PDF Phiếu Báo Cáo
                </button>
                <button type="button" class="vrr-btn vrr-btn-close" onclick="VstepResultReport.close()">
                    Đóng
                </button>
            </div>
        `;
    }

    function setReportData(data) {
        const st = getLoggedInStudent();
        const viol = getViolations(data.testId);
        currentReportState = {
            testId: parseInt(data.testId, 10) || 1,
            studentName: (data.studentName && data.studentName !== 'Học viên') ? data.studentName : st.name,
            studentClass: data.studentClass || st.className,
            elapsedSeconds: Number(data.elapsedSeconds || 0),
            submittedAt: data.submittedAt || new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }),
            task1Words: parseInt(data.task1Words || 0, 10) || 0,
            task2Words: parseInt(data.task2Words || 0, 10) || 0,
            tabSwitches: typeof data.tabSwitches === 'number' ? data.tabSwitches : viol.tabSwitches,
            pasteAttempts: typeof data.pasteAttempts === 'number' ? data.pasteAttempts : viol.pasteAttempts,
            scoreT1: Number(data.scoreT1 || 0),
            scoreT2: Number(data.scoreT2 || 0),
            overallScore: Number(data.overallScore || 0),
            aiSynced: Boolean(data.aiSynced),
            aiPending: Boolean(data.aiPending)
        };
        rerenderIfOpen();
        return currentReportState;
    }

    function updateFromAI(bundle) {
        if (!bundle || !currentReportState) return;
        currentReportState.scoreT1 = Number(bundle.s1 || 0);
        currentReportState.scoreT2 = Number(bundle.s2 || 0);
        currentReportState.overallScore = Number(bundle.finalScore || 0);
        currentReportState.aiSynced = true;
        currentReportState.aiPending = false;
        rerenderIfOpen();
    }

    function rerenderIfOpen() {
        const modal = document.getElementById('vstep-result-report-modal');
        if (modal && currentReportState) {
            modal.innerHTML = buildModalInnerHtml(currentReportState);
        }
    }

    function open(optionalData) {
        injectStyles();
        if (optionalData) {
            setReportData(optionalData);
        }
        if (!currentReportState) {
            alert('Chưa có dữ liệu bài làm để xuất Phiếu Báo Cáo Kết Quả.');
            return;
        }
        let overlay = document.getElementById('vstep-result-report-overlay');
        if (overlay) overlay.remove();

        overlay = document.createElement('div');
        overlay.id = 'vstep-result-report-overlay';
        overlay.className = 'vrr-overlay';
        overlay.onclick = (e) => {
            if (e.target === overlay) close();
        };

        const modal = document.createElement('div');
        modal.id = 'vstep-result-report-modal';
        modal.className = 'vrr-modal';
        modal.innerHTML = buildModalInnerHtml(currentReportState);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    function close() {
        const overlay = document.getElementById('vstep-result-report-overlay');
        if (overlay) overlay.remove();
    }

    function printReport() {
        if (!currentReportState) return;
        const w = window.open('', '_blank', 'width=820,height=900');
        if (!w) {
            window.print();
            return;
        }
        const styleEl = document.getElementById('vstep-result-report-styles');
        const css = styleEl ? styleEl.textContent : '';
        w.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Phiếu Báo Cáo Kết Quả - WRITING MOCK TEST ${String(currentReportState.testId).padStart(2, '0')}</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<style>
${css}
body { margin: 24px; background: #ffffff; display: flex; justify-content: center; }
.vrr-modal { box-shadow: none; max-width: 720px; border: 2px solid #cbd5e1; }
.vrr-body { max-height: none; overflow: visible; }
.vrr-close-btn, .vrr-footer { display: none !important; }
@media print { body { margin: 0; } }
</style>
</head>
<body>
<div class="vrr-modal">${buildModalInnerHtml(currentReportState)}</div>
<script>setTimeout(function(){ window.print(); }, 450);<\/script>
</body>
</html>`);
        w.document.close();
    }

    // Auto-sync whenever VstepAIGrader fires 'vstep-ai-graded'
    window.addEventListener('vstep-ai-graded', function (e) {
        if (e && e.detail) {
            updateFromAI(e.detail);
        }
    });

    global.VstepResultReport = {
        getLoggedInStudent,
        getViolations,
        recordViolation,
        formatDuration,
        setReportData,
        updateFromAI,
        getCurrentState: () => currentReportState,
        open,
        close,
        printReport
    };
})(window);
