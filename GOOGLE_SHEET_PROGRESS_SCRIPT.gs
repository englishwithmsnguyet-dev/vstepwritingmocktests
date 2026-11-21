/**
 * GOOGLE APPS SCRIPT - LƯU & ĐỒNG BỘ TIẾN ĐỘ LÀM BÀI VSTEP (WRITING & SPEAKING)
 * Hướng dẫn cài đặt (chỉ mất 1 phút):
 * 1. Tạo 1 file Google Sheet mới (ví dụ đặt tên: "TIẾN ĐỘ LÀM BÀI VSTEP - CÔ NGUYỆT").
 * 2. Trên thanh menu chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa hết code mẫu, dán toàn bộ đoạn code này vào rồi nhấn Lưu (Ctrl+S / Cmd+S).
 * 4. Bấm nút "Triển khai" (Deploy) -> "Tùy chọn triển khai mới" (New deployment):
 *    - Loại: Ứng dụng web (Web app)
 *    - Thực thi dưới tư cách: Tôi (Me)
 *    - Người có quyền truy cập: Bất kỳ ai (Anyone)
 * 5. Bấm Triển khai -> Cấp quyền -> Copy đường link Web App (kết thúc bằng /exec).
 * 6. Dán đường link đó vào nút "📊 Gắn Sheet" trên thanh điều khiển của Cô Nguyệt (hoặc gửi cho kỹ thuật gắn cố định).
 */

const SHEET_NAME = "TienDoHocVien";

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "Thời gian",
      "Mã học viên",
      "Họ và tên",
      "Lớp",
      "Kỹ năng",
      "Đề đã hoàn thành",
      "Chi tiết bài nộp"
    ]);
    sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#e0e7ff");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function normalizeStr(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// GET: Lấy danh sách các đề học viên đã hoàn thành để đồng bộ đa thiết bị
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const action = params.action || "getProgress";

    if (action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "Connected" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getOrCreateSheet();
    const rows = sheet.getDataRange().getValues();

    const targetKey = params.studentKey ? normalizeStr(params.studentKey) : "";
    const targetName = normalizeStr(params.name || "");
    const targetClass = normalizeStr(params.className || "");
    const targetSkill = String(params.skill || "").trim().toLowerCase();

    const completedSet = {};

    for (let i = 1; i < rows.length; i++) {
      const rowKey = normalizeStr(rows[i][1]);
      const rowName = normalizeStr(rows[i][2]);
      const rowClass = normalizeStr(rows[i][3]);
      const rowSkill = String(rows[i][4] || "").trim().toLowerCase();
      const rowTestId = parseInt(rows[i][5], 10);

      if (isNaN(rowTestId) || rowTestId <= 0) continue;
      if (targetSkill && rowSkill !== targetSkill) continue;

      const keyMatch = targetKey && rowKey === targetKey;
      const nameClassMatch = targetName && rowName === targetName && (!targetClass || rowClass === targetClass);

      if (keyMatch || nameClassMatch) {
        completedSet[rowTestId] = true;
      }
    }

    const completedTests = Object.keys(completedSet).map(Number).sort((a, b) => a - b);

    return ContentService.createTextOutput(JSON.stringify({
      ok: true,
      completedTests: completedTests
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: String(err)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// POST: Lưu tiến độ khi học viên hoàn thành và nộp bài đầy đủ 1 đề
function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    const payload = JSON.parse(raw);

    const sheet = getOrCreateSheet();
    const studentKey = payload.studentKey || "";
    const name = payload.name || "Học viên";
    const className = payload.className || "";
    const skill = String(payload.skill || "").toLowerCase();
    const testId = parseInt(payload.testId, 10);
    const details = payload.details || "";
    const timestamp = payload.timestamp || Utilities.formatDate(new Date(), "Asia/Ho_Chi_Minh", "HH:mm dd/MM/yyyy");

    if (!isNaN(testId) && testId > 0) {
      sheet.appendRow([
        timestamp,
        studentKey,
        name,
        className,
        skill,
        testId,
        details
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: String(err)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
