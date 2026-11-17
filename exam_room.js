// exam_room.js - Realtime Room Control & Proctoring for VSTEP Mock Tests
// Powered by Firebase Realtime Database
(function () {
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyD6DtRnCJ-jaFjYcyztdSE1JxatUXAIO2M",
        authDomain: "vstep6868.firebaseapp.com",
        databaseURL: "https://vstep6868-default-rtdb.firebaseio.com",
        projectId: "vstep6868",
        storageBucket: "vstep6868.firebasestorage.app",
        messagingSenderId: "232760826079",
        appId: "1:232760826079:web:2318f85e69bf8b582a316a",
        measurementId: "G-8DVJNZ7DBZ"
    };

    const RTDB_ENDPOINT = "https://vstep6868-default-rtdb.firebaseio.com/room_control.json";

    // Default room state
    let roomState = {
        isOpen: true,
        allowedTest: "all",
        message: "Phòng thi đang mở",
        updatedBy: "Cô Nguyệt (PTMN)",
        updatedAt: Date.now()
    };

    let fbApp = null;
    let rtdb = null;
    let roomRef = null;
    let isInitialized = false;

    // Helper: Identify teacher account
    function isTeacherUser(name, className) {
        const n = String(name || "").trim().toLowerCase();
        const c = String(className || "").trim().toUpperCase();
        if (c === "GV") return true;
        if (/^(ptmn|gv|cô nguyệt|co nguyet|phạm thị minh nguyệt|pham thi minh nguyet|giáo viên|giao vien|teacher|miss nguyet)$/i.test(n)) return true;
        if (n.includes("ptmn") || n.includes("cô nguyệt") || n.includes("co nguyet") || n.includes("giáo viên") || n.includes("giao vien") || n.includes("teacher")) return true;
        return false;
    }

    function getCurrentUserInfo() {
        const name = localStorage.getItem("vstep_student_name") || sessionStorage.getItem("vstep_student_name") || "";
        const className = localStorage.getItem("vstep_student_class") || sessionStorage.getItem("vstep_student_class") || "";
        return {
            name,
            className,
            isTeacher: isTeacherUser(name, className)
        };
    }

    function getCurrentTestNumber() {
        const path = window.location.pathname;
        const match = path.match(/test\s*(\d+)|test0?(\d+)/i);
        if (match) {
            return parseInt(match[1] || match[2], 10);
        }
        if (typeof window.TEST_NUMBER !== "undefined") {
            return parseInt(window.TEST_NUMBER, 10);
        }
        return 0; // Homepage or unknown
    }

    // --- Inject Styles ---
    function injectStyles() {
        if (document.getElementById("vstep-exam-room-styles")) return;
        const style = document.createElement("style");
        style.id = "vstep-exam-room-styles";
        style.innerHTML = `
            /* Teacher Floating Control Bar */
            .vstep-teacher-bar-wrapper {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 999999;
                background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
                color: #ffffff;
                box-shadow: 0 4px 25px rgba(0, 0, 0, 0.35);
                border-bottom: 2px solid rgba(234, 179, 8, 0.6);
                font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
                animation: slideDownBar 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            }
            @keyframes slideDownBar {
                from { transform: translateY(-100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .vstep-teacher-bar-content {
                max-width: 1300px;
                margin: 0 auto;
                padding: 10px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 12px;
            }
            .teacher-bar-brand {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .teacher-bar-badge {
                background: linear-gradient(135deg, #f59e0b, #d97706);
                color: #ffffff;
                padding: 4px 10px;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 0.5px;
                display: flex;
                align-items: center;
                gap: 5px;
                box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
            }
            .teacher-room-status-pill {
                display: flex;
                align-items: center;
                gap: 7px;
                padding: 5px 14px;
                border-radius: 999px;
                font-size: 12px;
                font-weight: 700;
                transition: all 0.25s ease;
            }
            .teacher-room-status-pill.open {
                background: rgba(34, 197, 94, 0.2);
                border: 1px solid #22c55e;
                color: #4ade80;
            }
            .teacher-room-status-pill.closed {
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid #ef4444;
                color: #f87171;
            }
            .teacher-status-dot {
                width: 9px;
                height: 9px;
                border-radius: 50%;
                display: inline-block;
            }
            .teacher-room-status-pill.open .teacher-status-dot {
                background: #22c55e;
                box-shadow: 0 0 10px #22c55e;
                animation: pulseDot 1.8s infinite;
            }
            .teacher-room-status-pill.closed .teacher-status-dot {
                background: #ef4444;
                box-shadow: 0 0 10px #ef4444;
            }
            @keyframes pulseDot {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.3); }
            }
            .teacher-bar-controls {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
            }
            .teacher-select-label {
                font-size: 13px;
                font-weight: 600;
                color: #cbd5e1;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .teacher-test-select {
                background: rgba(15, 23, 42, 0.8);
                color: #ffffff;
                border: 1px solid rgba(148, 163, 184, 0.4);
                padding: 7px 14px;
                border-radius: 8px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                outline: none;
                transition: all 0.2s ease;
            }
            .teacher-test-select:focus {
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
            }
            .teacher-btn-action {
                border: none;
                border-radius: 8px;
                padding: 7px 16px;
                font-size: 13px;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .teacher-btn-action:hover {
                transform: translateY(-1px);
            }
            .teacher-btn-action:active {
                transform: translateY(0);
            }
            .btn-toggle-room.open {
                background: linear-gradient(135deg, #dc2626, #b91c1c);
                color: #ffffff;
                box-shadow: 0 2px 10px rgba(220, 38, 38, 0.35);
            }
            .btn-toggle-room.closed {
                background: linear-gradient(135deg, #16a34a, #15803d);
                color: #ffffff;
                box-shadow: 0 2px 10px rgba(22, 163, 74, 0.35);
            }
            .btn-emergency-collect {
                background: linear-gradient(135deg, #e11d48, #be123c);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.25);
                box-shadow: 0 2px 10px rgba(225, 29, 72, 0.4);
            }

            /* Room Closed Warning Alert on Welcome Screen */
            .vstep-room-closed-box {
                max-width: 550px;
                margin: 22px auto 8px;
                padding: 16px 22px;
                border-radius: 14px;
                background: linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%);
                border: 1.5px solid #fca5a5;
                color: #991b1b;
                text-align: center;
                box-shadow: 0 8px 24px rgba(239, 68, 68, 0.12);
                animation: shakeAlert 0.4s ease;
            }
            @keyframes shakeAlert {
                0%, 100% { transform: translateX(0); }
                20%, 60% { transform: translateX(-4px); }
                40%, 80% { transform: translateX(4px); }
            }
            .room-closed-icon {
                font-size: 28px;
                color: #ef4444;
                margin-bottom: 6px;
            }
            .room-closed-title {
                font-size: 16px;
                font-weight: 800;
                margin: 0 0 6px;
                color: #991b1b;
                letter-spacing: 0.3px;
            }
            .room-closed-desc {
                font-size: 13px;
                line-height: 1.5;
                margin: 0;
                color: #7f1d1d;
                font-weight: 500;
            }

            /* Start button disabled state */
            .btn-start-test.room-locked {
                background: linear-gradient(135deg, #94a3b8, #64748b) !important;
                border-color: #64748b !important;
                color: #f1f5f9 !important;
                cursor: not-allowed !important;
                box-shadow: none !important;
                transform: none !important;
                opacity: 0.85 !important;
            }

            /* Emergency Modal when Teacher closes room during active test */
            .vstep-emergency-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(15, 23, 42, 0.85);
                backdrop-filter: blur(12px);
                z-index: 9999999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: fadeInModal 0.3s ease;
            }
            @keyframes fadeInModal {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .vstep-emergency-card {
                background: #ffffff;
                border-radius: 20px;
                padding: 32px 28px;
                max-width: 480px;
                width: 100%;
                text-align: center;
                box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
                border: 2px solid #ef4444;
            }
            .emergency-icon {
                width: 70px;
                height: 70px;
                background: #fee2e2;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 16px;
                color: #ef4444;
                font-size: 32px;
            }
            .emergency-title {
                font-size: 20px;
                font-weight: 800;
                color: #991b1b;
                margin: 0 0 10px;
            }
            .emergency-desc {
                font-size: 14px;
                color: #475569;
                line-height: 1.6;
                margin: 0 0 22px;
            }
            .btn-view-solution {
                background: linear-gradient(135deg, #6366f1, #4f46e5);
                color: #ffffff;
                border: none;
                border-radius: 10px;
                padding: 12px 28px;
                font-size: 14px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .btn-view-solution:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
            }

            /* Homepage test cards indicator */
            .homepage-room-badge {
                display: inline-flex;
                align-items: center;
                gap: 5px;
                font-size: 11px;
                font-weight: 700;
                padding: 3px 8px;
                border-radius: 6px;
                margin-top: 6px;
            }
            .homepage-room-badge.open {
                background: #dcfce7;
                color: #166534;
            }
            .homepage-room-badge.closed {
                background: #fee2e2;
                color: #991b1b;
            }

            /* Adjust body top padding when teacher bar is visible */
            body.has-teacher-bar {
                padding-top: 54px !important;
            }
        `;
        document.head.appendChild(style);
    }

    // --- Render Teacher Control Panel ---
    function renderTeacherBar() {
        const userInfo = getCurrentUserInfo();
        if (!userInfo.isTeacher) {
            const existing = document.getElementById("vstep-teacher-room-bar");
            if (existing) existing.remove();
            document.body.classList.remove("has-teacher-bar");
            return;
        }

        let bar = document.getElementById("vstep-teacher-room-bar");
        if (!bar) {
            bar = document.createElement("div");
            bar.id = "vstep-teacher-room-bar";
            bar.className = "vstep-teacher-bar-wrapper";
            document.body.prepend(bar);
            document.body.classList.add("has-teacher-bar");
        }

        const isOpen = roomState.isOpen !== false;
        const allowed = roomState.allowedTest || "all";

        bar.innerHTML = `
            <div class="vstep-teacher-bar-content">
                <div class="teacher-bar-brand">
                    <span class="teacher-bar-badge"><i class="fa-solid fa-graduation-cap"></i> GIÁO VIÊN PTMN</span>
                    <div class="teacher-room-status-pill ${isOpen ? 'open' : 'closed'}">
                        <span class="teacher-status-dot"></span>
                        <span>${isOpen ? 'PHÒNG THI ĐANG MỞ' : 'PHÒNG THI ĐANG KHÓA'}</span>
                    </div>
                </div>

                <div class="teacher-bar-controls">
                    <label class="teacher-select-label" for="teacher-select-test">
                        <i class="fa-solid fa-layer-group"></i> Đề cho phép:
                    </label>
                    <select id="teacher-select-test" class="teacher-test-select" onchange="VstepExamRoom.onTeacherChangeTest(this.value)">
                        <option value="all" ${allowed === 'all' ? 'selected' : ''}>Mở tất cả 10 đề thi</option>
                        ${[1,2,3,4,5,6,7,8,9,10].map(n => `
                            <option value="${n}" ${String(allowed) === String(n) ? 'selected' : ''}>Chỉ mở Đề ${n < 10 ? '0' + n : n}</option>
                        `).join('')}
                    </select>

                    <button type="button" class="teacher-btn-action btn-toggle-room ${isOpen ? 'open' : 'closed'}" onclick="VstepExamRoom.toggleRoom()">
                        <i class="fa-solid ${isOpen ? 'fa-lock' : 'fa-lock-open'}"></i>
                        <span>${isOpen ? 'Đóng Phòng Thi' : 'Mở Phòng Thi'}</span>
                    </button>

                    <button type="button" class="teacher-btn-action btn-emergency-collect" onclick="VstepExamRoom.emergencyCollect()" title="Thu bài thi và khóa toàn bộ máy học viên ngay lập tức">
                        <i class="fa-solid fa-bell"></i>
                        <span>Thu Bài & Khóa</span>
                    </button>
                </div>
            </div>
        `;
    }

    // --- Apply Room State to Test Pages & Homepage ---
    function applyRoomState(state) {
        if (state) {
            roomState = state;
        }

        const userInfo = getCurrentUserInfo();
        
        // Always refresh teacher control bar if logged in as Teacher
        if (userInfo.isTeacher) {
            renderTeacherBar();
            // Teacher has full access anytime!
            restoreStudentAccess();
            return;
        }

        // Student mode: check access restrictions
        const currentTest = getCurrentTestNumber();
        const isOpen = roomState.isOpen !== false;
        const allowed = roomState.allowedTest || "all";

        let isThisTestAllowed = true;
        let blockedReason = "";

        if (!isOpen) {
            isThisTestAllowed = false;
            blockedReason = "Phòng thi hiện đang ĐÓNG. Vui lòng chờ Giáo viên (Cô Nguyệt) mở phòng thi để bắt đầu làm bài!";
        } else if (allowed !== "all") {
            if (currentTest > 0 && String(currentTest) !== String(allowed)) {
                isThisTestAllowed = false;
                const paddedAllowed = parseInt(allowed, 10) < 10 ? '0' + allowed : allowed;
                blockedReason = `Hôm nay lớp chỉ thi ĐỀ ${paddedAllowed}. Đề thi này hiện chưa được mở!`;
            }
        }

        // 1. If currently inside a Test Page
        if (currentTest > 0) {
            if (!isThisTestAllowed) {
                enforceStudentBlock(blockedReason);
            } else {
                restoreStudentAccess();
            }
        }

        // 2. If on Homepage, update test cards
        updateHomepageBadges();
    }

    // Block student from starting or doing test
    function enforceStudentBlock(reasonText) {
        // A. If student is currently actively taking the test (isExamRunning is true)
        if (typeof isExamRunning !== "undefined" && isExamRunning) {
            // STOP EXAM AND COLLECT CURRENT WORK
            if (typeof submitTest === "function") {
                submitTest(true);
            } else {
                isExamRunning = false;
                if (typeof timerInterval !== "undefined" && timerInterval) clearInterval(timerInterval);
                const t1 = document.getElementById("task1-text");
                const t2 = document.getElementById("task2-text");
                if (t1) t1.readOnly = true;
                if (t2) t2.readOnly = true;
            }
            showEmergencyClosedModal(reasonText);
            return;
        }

        // B. If student is on Welcome/Preparation Screen
        const startBtn = document.getElementById("btn-start-test");
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.classList.add("room-locked");
            startBtn.innerHTML = `<i class="fa-solid fa-lock"></i> PHÒNG THI ĐANG ĐÓNG`;
            startBtn.title = reasonText;
        }

        // Show room closed notice box
        let noticeBox = document.getElementById("vstep-room-closed-alert");
        if (!noticeBox && startBtn && startBtn.parentElement) {
            noticeBox = document.createElement("div");
            noticeBox.id = "vstep-room-closed-alert";
            noticeBox.className = "vstep-room-closed-box";
            startBtn.parentElement.parentElement.insertBefore(noticeBox, startBtn.parentElement);
        }
        if (noticeBox) {
            noticeBox.style.display = "block";
            noticeBox.innerHTML = `
                <div class="room-closed-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <h4 class="room-closed-title">PHÒNG THI TẠM THỜI ĐÓNG</h4>
                <p class="room-closed-desc">${reasonText}</p>
            `;
        }
    }

    // Restore student access when room is open
    function restoreStudentAccess() {
        const startBtn = document.getElementById("btn-start-test");
        if (startBtn && startBtn.classList.contains("room-locked")) {
            startBtn.disabled = false;
            startBtn.classList.remove("room-locked");
            startBtn.innerHTML = `BẮT ĐẦU LÀM BÀI <i class="fa-solid fa-play"></i>`;
            startBtn.title = "Bắt đầu tính giờ làm bài";
        }

        const noticeBox = document.getElementById("vstep-room-closed-alert");
        if (noticeBox) {
            noticeBox.style.display = "none";
        }
    }

    function showEmergencyClosedModal(reasonText) {
        if (document.getElementById("vstep-emergency-modal")) return;
        const modal = document.createElement("div");
        modal.id = "vstep-emergency-modal";
        modal.className = "vstep-emergency-overlay";
        modal.innerHTML = `
            <div class="vstep-emergency-card">
                <div class="emergency-icon"><i class="fa-solid fa-bell"></i></div>
                <h3 class="emergency-title">GIÁO VIÊN ĐÃ THU BÀI & KHÓA PHÒNG</h3>
                <p class="emergency-desc">${reasonText || 'Thời gian làm bài đã kết thúc hoặc Giáo viên đã đóng phòng thi. Toàn bộ nội dung bài làm của bạn đã được hệ thống lưu lại an toàn.'}</p>
                <button type="button" class="btn-view-solution" onclick="document.getElementById('vstep-emergency-modal').remove()">
                    <i class="fa-solid fa-eye"></i> Xem Lại Bài Làm & Lời Giải
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function updateHomepageBadges() {
        const isOpen = roomState.isOpen !== false;
        const allowed = roomState.allowedTest || "all";

        document.querySelectorAll(".test-card").forEach((card, idx) => {
            const testNum = idx + 1;
            let badge = card.querySelector(".homepage-room-badge");
            if (!badge) {
                badge = document.createElement("span");
                badge.className = "homepage-room-badge";
                const header = card.querySelector(".test-header") || card;
                header.appendChild(badge);
            }

            if (!isOpen) {
                badge.className = "homepage-room-badge closed";
                badge.innerHTML = `<i class="fa-solid fa-lock"></i> Đang đóng`;
            } else if (allowed !== "all") {
                if (String(testNum) === String(allowed)) {
                    badge.className = "homepage-room-badge open";
                    badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Đang mở thi`;
                } else {
                    badge.className = "homepage-room-badge closed";
                    badge.innerHTML = `<i class="fa-solid fa-lock"></i> Chưa mở`;
                }
            } else {
                badge.className = "homepage-room-badge open";
                badge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Sẵn sàng`;
            }
        });
    }

    // --- Firebase Sync & Network Fallback ---
    function initFirebase() {
        if (isInitialized) return;
        isInitialized = true;

        injectStyles();

        // 1. If Firebase Compat SDK is loaded on page
        if (typeof firebase !== "undefined" && firebase.initializeApp) {
            try {
                if (!firebase.apps.length) {
                    fbApp = firebase.initializeApp(FIREBASE_CONFIG);
                } else {
                    fbApp = firebase.app();
                }
                rtdb = firebase.database();
                roomRef = rtdb.ref("room_control");

                // Realtime Listener
                roomRef.on("value", snapshot => {
                    const data = snapshot.val();
                    if (data) {
                        applyRoomState(data);
                    }
                }, error => {
                    console.log("Firebase RTDB listener note, using REST fallback:", error);
                    fetchRoomStateViaREST();
                });
            } catch (e) {
                console.log("Firebase init notice:", e);
                fetchRoomStateViaREST();
            }
        } else {
            // 2. Fallback to direct REST API
            fetchRoomStateViaREST();
        }

        // Periodic REST Polling every 8 seconds as resilient backup
        setInterval(fetchRoomStateViaREST, 8000);

        // Check and render initial Teacher Panel if applicable
        renderTeacherBar();
    }

    function fetchRoomStateViaREST() {
        fetch(RTDB_ENDPOINT, { cache: "no-store" })
            .then(res => res.json())
            .then(data => {
                if (data) {
                    applyRoomState(data);
                }
            })
            .catch(err => {
                // Silently fallback to current state
            });
    }

    // --- Teacher Actions ---
    function updateRoomInFirebase(patchData) {
        patchData.updatedAt = Date.now();
        patchData.updatedBy = "Cô Nguyệt (PTMN)";

        // Optimistic UI update
        roomState = { ...roomState, ...patchData };
        applyRoomState(roomState);

        // Update via Firebase SDK if available
        if (roomRef) {
            roomRef.update(patchData).catch(err => console.log("RTDB SDK write note:", err));
        }

        // Also update via direct REST PATCH for 100% guarantee
        fetch(RTDB_ENDPOINT, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patchData)
        }).catch(err => console.log("REST PATCH note:", err));
    }

    // --- Public API for Window ---
    window.VstepExamRoom = {
        init: initFirebase,

        getRoomState() {
            return roomState;
        },

        canStudentStartExam() {
            const userInfo = getCurrentUserInfo();
            if (userInfo.isTeacher) return true; // GV không bị giới hạn

            const isOpen = roomState.isOpen !== false;
            const allowed = roomState.allowedTest || "all";
            const currentTest = getCurrentTestNumber();

            if (!isOpen) return false;
            if (allowed !== "all" && currentTest > 0 && String(currentTest) !== String(allowed)) return false;
            return true;
        },

        toggleRoom() {
            const nextIsOpen = !(roomState.isOpen !== false);
            updateRoomInFirebase({
                isOpen: nextIsOpen,
                message: nextIsOpen ? "Phòng thi đang mở" : "Phòng thi hiện đang đóng bởi Giáo viên"
            });
            alert(nextIsOpen 
                ? "🟢 ĐÃ MỞ PHÒNG THI! Tất cả học viên đã được cấp quyền làm bài." 
                : "🔴 ĐÃ KHÓA PHÒNG THI! Các máy học viên sẽ bị tạm dừng quyền làm bài.");
        },

        onTeacherChangeTest(val) {
            updateRoomInFirebase({
                allowedTest: val,
                message: val === "all" ? "Mở tất cả 10 đề thi" : `Chỉ mở Đề ${val}`
            });
        },

        emergencyCollect() {
            const confirmAction = confirm("⚠️ CẢNH BÁO QUẢN LÝ PHÒNG THI:\n\nCô có chắc chắn muốn KHÓA PHÒNG THI & THU BÀI của tất cả học viên ngay bây giờ không?\n\n• Tất cả bài làm của học viên đang mở sẽ tự động nộp ngay lập tức.\n• Quyền gõ bài sẽ bị khóa toàn bộ.");
            if (!confirmAction) return;

            updateRoomInFirebase({
                isOpen: false,
                message: "Giáo viên đã thu bài và đóng phòng thi!"
            });
            alert("🚨 ĐÃ THU BÀI TOÀN BỘ! Lệnh thu bài và khóa phòng đã được truyền tới tất cả học viên.");
        },

        refreshUI() {
            renderTeacherBar();
            applyRoomState(roomState);
        }
    };

    // Auto-init on DOM Ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initFirebase);
    } else {
        initFirebase();
    }
})();
