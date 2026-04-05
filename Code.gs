/**
 * CAPTAIN'S LOG - Google Apps Script Backend
 * Google Sheet ID: 1PjO6J3UX86W61bDTlot784UXWS0HUca6Gnoi0SYy-aM
 *
 * 배포 방법:
 * 1. Google Sheet 열기 → 확장 프로그램 → Apps Script
 * 2. 이 코드를 Code.gs에 붙여넣기
 * 3. 배포 → 새 배포 → 웹 앱 → 누구나 액세스 가능
 * 4. 배포 URL을 captains-log/app/lib/gasService.ts의 GAS_URL에 입력
 */

const SPREADSHEET_ID = '1PjO6J3UX86W61bDTlot784UXWS0HUca6Gnoi0SYy-aM';

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// 시트 생성 (쓰기 작업용)
function getOrCreateSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// 시트 조회 전용 (없으면 null 반환, 절대 생성 안 함)
function getSheetIfExists(name) {
  const ss = getSpreadsheet();
  return ss.getSheetByName(name);
}

// ==========================================
// TEAM SHEET STRUCTURE (34 columns)
// ==========================================
// A: teamId, B: teamName, C: members, D: roles, E: industryType
// F: currentMonth, G: totalScore, H: timeBonus, I: status, J: registeredAt
// K: r1Score, L: r1Time, M: r2Score, N: r2Time, O: r3Score, P: r3Time
// Q: r4Score, R: r4Time, S: r5Score, T: r5Time, U: r6Score, V: r6Time
// W: r7Score, X: r7Time, Y: r8Score, Z: r8Time, AA: r9Score, AB: r9Time
// AC: r10Score, AD: r10Time, AE: r11Score, AF: r11Time, AG: r12Score, AH: r12Time

// 쓰기용 (시트 없으면 생성)
function getTeamsSheet(roomId) {
  return getOrCreateSheet('Teams_' + roomId);
}

function getEventsSheet(roomId) {
  return getOrCreateSheet('Events_' + roomId);
}

function getGameStateSheet(roomId) {
  return getOrCreateSheet('GameState_' + roomId);
}

// 읽기용 (시트 없으면 null)
function getTeamsSheetReadOnly(roomId) {
  return getSheetIfExists('Teams_' + roomId);
}

function getEventsSheetReadOnly(roomId) {
  return getSheetIfExists('Events_' + roomId);
}

function getGameStateSheetReadOnly(roomId) {
  return getSheetIfExists('GameState_' + roomId);
}

function findTeamRow(sheet, teamId) {
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(teamId)) {
      return i + 1; // 1-based row
    }
  }
  return -1;
}

// ==========================================
// POST HANDLER
// ==========================================
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    switch (action) {
      case 'registerTeam':
        return registerTeam(payload);
      case 'updateScore':
        return updateScore(payload);
      case 'updateMonth':
        return updateMonth(payload);
      case 'updateTotal':
        return updateTotal(payload);
      case 'updateStatus':
        return updateStatus(payload);
      case 'createEvent':
        return createEvent(payload);
      case 'clearEvent':
        return clearEvent(payload);
      case 'startGame':
        return startGame(payload);
      case 'stopGame':
        return stopGame(payload);
      case 'deleteRoom':
        return deleteRoom(payload);
      default:
        return jsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: String(err) });
  }
}

// ==========================================
// GET HANDLER
// ==========================================
function doGet(e) {
  try {
    const action = e.parameter.action;

    switch (action) {
      case 'getEvent':
        return getEvent(e.parameter);
      case 'getGameState':
        return getGameState(e.parameter);
      case 'getAllTeams':
        return getAllTeams(e.parameter);
      case 'listRooms':
        return listRooms();
      default:
        return jsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: String(err) });
  }
}

// ==========================================
// TEAM OPERATIONS
// ==========================================
function registerTeam(payload) {
  const sheet = getTeamsSheet(payload.roomId);
  const row = findTeamRow(sheet, payload.teamId);

  const rowData = [
    payload.teamId, payload.teamName, payload.members, payload.roles,
    payload.industryType, 1, 0, 0, 'playing', new Date().toISOString(),
    '', '', '', '', '', '', '', '', '', '', '', '',
    '', '', '', '', '', '', '', '', '', '', '', ''
  ];

  if (row > 0) {
    sheet.getRange(row, 1, 1, 34).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return jsonResponse({ success: true });
}

function updateScore(payload) {
  const sheet = getTeamsSheet(payload.roomId);
  const row = findTeamRow(sheet, payload.teamId);
  if (row < 0) return jsonResponse({ success: false, error: 'Team not found' });

  const round = Number(payload.round);
  const scoreCol = 11 + (round - 1) * 2; // K=11 for r1Score
  const timeCol = scoreCol + 1;

  sheet.getRange(row, scoreCol).setValue(payload.score);
  sheet.getRange(row, timeCol).setValue(payload.timeSeconds);

  return jsonResponse({ success: true });
}

function updateMonth(payload) {
  const sheet = getTeamsSheet(payload.roomId);
  const row = findTeamRow(sheet, payload.teamId);
  if (row < 0) return jsonResponse({ success: false, error: 'Team not found' });

  sheet.getRange(row, 6).setValue(payload.currentMonth); // F column

  return jsonResponse({ success: true });
}

function updateTotal(payload) {
  const sheet = getTeamsSheet(payload.roomId);
  const row = findTeamRow(sheet, payload.teamId);
  if (row < 0) return jsonResponse({ success: false, error: 'Team not found' });

  sheet.getRange(row, 7).setValue(payload.totalScore);  // G column
  sheet.getRange(row, 8).setValue(payload.timeBonus);    // H column

  return jsonResponse({ success: true });
}

function updateStatus(payload) {
  const sheet = getTeamsSheet(payload.roomId);
  const row = findTeamRow(sheet, payload.teamId);
  if (row < 0) return jsonResponse({ success: false, error: 'Team not found' });

  sheet.getRange(row, 9).setValue(payload.status); // I column

  return jsonResponse({ success: true });
}

// ==========================================
// EVENT OPERATIONS
// ==========================================
function createEvent(payload) {
  const sheet = getEventsSheet(payload.roomId);
  sheet.clear();
  sheet.appendRow([
    payload.roomId, payload.eventType, true,
    new Date().toISOString(), payload.targetTeams || 'all',
    payload.instruction || ''
  ]);
  return jsonResponse({ success: true });
}

function clearEvent(payload) {
  const sheet = getEventsSheetReadOnly(payload.roomId);
  if (sheet) sheet.clear();
  return jsonResponse({ success: true });
}

function getEvent(params) {
  const sheet = getEventsSheetReadOnly(params.roomId);
  if (!sheet) return jsonResponse({ success: true, data: { isActive: false } });
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    return jsonResponse({ success: true, data: { isActive: false } });
  }
  const row = data[0];
  return jsonResponse({
    success: true,
    data: {
      roomId: row[0],
      eventType: row[1],
      isActive: row[2],
      startedAt: row[3],
      targetTeams: row[4] || 'all',
      instruction: row[5] || ''
    }
  });
}

// ==========================================
// GAME STATE OPERATIONS
// ==========================================
function startGame(payload) {
  const sheet = getGameStateSheet(payload.roomId);
  sheet.clear();
  sheet.appendRow([
    payload.roomId, true, payload.timerMinutes || 90,
    new Date().toISOString()
  ]);
  return jsonResponse({ success: true });
}

function stopGame(payload) {
  const sheet = getGameStateSheet(payload.roomId);
  sheet.clear();
  sheet.appendRow([payload.roomId, false, 0, '']);
  return jsonResponse({ success: true });
}

function getGameState(params) {
  const sheet = getGameStateSheetReadOnly(params.roomId);
  if (!sheet) {
    return jsonResponse({
      success: true,
      data: { roomId: params.roomId, gameStarted: false, missionTimerMinutes: 90, createdAt: '' }
    });
  }
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    return jsonResponse({
      success: true,
      data: { roomId: params.roomId, gameStarted: false, missionTimerMinutes: 90, createdAt: '' }
    });
  }
  const row = data[0];
  return jsonResponse({
    success: true,
    data: {
      roomId: row[0],
      gameStarted: row[1],
      missionTimerMinutes: row[2],
      createdAt: row[3]
    }
  });
}

// ==========================================
// GET ALL TEAMS
// ==========================================
function getAllTeams(params) {
  const sheet = getTeamsSheetReadOnly(params.roomId);
  if (!sheet) return jsonResponse({ success: true, data: [] });
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    return jsonResponse({ success: true, data: [] });
  }

  const teams = data.map(function(row) {
    return {
      teamId: row[0],
      teamName: row[1],
      members: row[2],
      roles: row[3],
      industryType: row[4],
      currentMonth: row[5],
      totalScore: row[6],
      timeBonus: row[7],
      status: row[8],
      registeredAt: row[9],
      r1Score: row[10], r1Time: row[11],
      r2Score: row[12], r2Time: row[13],
      r3Score: row[14], r3Time: row[15],
      r4Score: row[16], r4Time: row[17],
      r5Score: row[18], r5Time: row[19],
      r6Score: row[20], r6Time: row[21],
      r7Score: row[22], r7Time: row[23],
      r8Score: row[24], r8Time: row[25],
      r9Score: row[26], r9Time: row[27],
      r10Score: row[28], r10Time: row[29],
      r11Score: row[30], r11Time: row[31],
      r12Score: row[32], r12Time: row[33]
    };
  });

  return jsonResponse({ success: true, data: teams });
}

// ==========================================
// ROOM MANAGEMENT
// ==========================================
function listRooms() {
  const ss = getSpreadsheet();
  const sheets = ss.getSheets();
  const roomIds = [];

  sheets.forEach(function(sheet) {
    const name = sheet.getName();
    if (name.startsWith('Teams_')) {
      roomIds.push(name.replace('Teams_', ''));
    }
  });

  return jsonResponse({ success: true, data: roomIds });
}

function deleteRoom(payload) {
  const ss = getSpreadsheet();
  const suffixes = ['Teams_', 'Events_', 'GameState_'];

  suffixes.forEach(function(prefix) {
    const sheet = ss.getSheetByName(prefix + payload.roomId);
    if (sheet) {
      ss.deleteSheet(sheet);
    }
  });

  return jsonResponse({ success: true });
}

// ==========================================
// UTILITY
// ==========================================
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
