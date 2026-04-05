/**
 * CAPTAIN'S LOG - Google Apps Script Backend
 * Google Sheet ID: 1PjO6J3UX86W61bDTlot784UXWS0HUca6Gnoi0SYy-aM
 *
 * 방(Room)별 시트 구조:
 *   Teams_{roomId}     : 팀 등록/점수/상태
 *   Events_{roomId}    : 이벤트 관리
 *   GameState_{roomId} : 게임 상태
 *
 * 최대 25팀/방, 동시 10개 방 지원
 *
 * 배포 방법:
 * 1. Google Sheet → 확장 프로그램 → Apps Script
 * 2. 이 코드를 Code.gs에 붙여넣기
 * 3. 배포 → 새 배포 → 웹 앱 → 누구나 액세스 가능
 * 4. 배포 URL을 app/lib/gasService.ts의 GAS_URL에 입력
 */

var SPREADSHEET_ID = '1PjO6J3UX86W61bDTlot784UXWS0HUca6Gnoi0SYy-aM';

// ==========================================
// POST HANDLER
// ==========================================
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    switch (action) {
      case 'registerTeam':   return handleRegisterTeam(data);
      case 'updateScore':    return handleUpdateScore(data);
      case 'updateMonth':    return handleUpdateMonth(data);
      case 'updateTotal':    return handleUpdateTotal(data);
      case 'updateStatus':   return handleUpdateStatus(data);
      case 'createEvent':    return handleCreateEvent(data);
      case 'clearEvent':     return handleClearEvent(data);
      case 'startGame':      return handleStartGame(data);
      case 'stopGame':       return handleStopGame(data);
      case 'deleteRoom':     return handleDeleteRoom(data);
      default:
        return jsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// ==========================================
// GET HANDLER
// ==========================================
function doGet(e) {
  try {
    var action = e.parameter.action;
    var roomId = e.parameter.roomId || '';

    switch (action) {
      case 'getEvent':     return handleGetEvent(roomId);
      case 'getGameState': return handleGetGameState(roomId);
      case 'getAllTeams':   return handleGetAllTeams(roomId);
      case 'listRooms':    return handleListRooms();
      default:
        return jsonResponse({ success: false, error: 'Unknown action: ' + action });
    }
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

// ==========================================
// TEAM MANAGEMENT
// ==========================================
function handleRegisterTeam(data) {
  var roomId = data.roomId || 'room-default';
  var sheet = getOrCreateRoomSheet('Teams', roomId);
  var headers = getTeamHeaders();
  ensureHeaders(sheet, headers);

  var row = findTeamRow(sheet, data.teamId);
  var rowData = [
    new Date().toISOString(),
    data.teamId,
    data.teamName || '',
    data.members || '',
    data.roles || '',
    data.industryType || 12,
    0,  // Total Score
    1,  // Current Month
    0,  // Time Bonus
    '', '', '', '', '', '', '', '', '', '', '', '', // R1-R12 Score
    '', '', '', '', '', '', '', '', '', '', '', '', // R1-R12 Time
    'playing' // Status
  ];

  if (row > 0) {
    sheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return jsonResponse({ success: true });
}

function handleUpdateScore(data) {
  var roomId = data.roomId || 'room-default';
  var sheet = getRoomSheet('Teams', roomId);
  if (!sheet) return jsonResponse({ success: false, error: 'Room not found' });
  var row = findTeamRow(sheet, data.teamId);
  if (row <= 0) return jsonResponse({ success: false, error: 'Team not found' });

  var scoreCol = 9 + data.round; // R1 Score = col 10
  var timeCol = 9 + 12 + data.round; // R1 Time = col 22
  sheet.getRange(row, scoreCol).setValue(data.score);
  sheet.getRange(row, timeCol).setValue(data.timeSeconds);

  return jsonResponse({ success: true });
}

function handleUpdateMonth(data) {
  var roomId = data.roomId || 'room-default';
  var sheet = getRoomSheet('Teams', roomId);
  if (!sheet) return jsonResponse({ success: false, error: 'Room not found' });
  var row = findTeamRow(sheet, data.teamId);
  if (row <= 0) return jsonResponse({ success: false, error: 'Team not found' });

  sheet.getRange(row, 8).setValue(data.currentMonth);

  return jsonResponse({ success: true });
}

function handleUpdateTotal(data) {
  var roomId = data.roomId || 'room-default';
  var sheet = getRoomSheet('Teams', roomId);
  if (!sheet) return jsonResponse({ success: false, error: 'Room not found' });
  var row = findTeamRow(sheet, data.teamId);
  if (row <= 0) return jsonResponse({ success: false, error: 'Team not found' });

  sheet.getRange(row, 7).setValue(data.totalScore);
  sheet.getRange(row, 9).setValue(data.timeBonus);

  return jsonResponse({ success: true });
}

function handleUpdateStatus(data) {
  var roomId = data.roomId || 'room-default';
  var sheet = getRoomSheet('Teams', roomId);
  if (!sheet) return jsonResponse({ success: false, error: 'Room not found' });
  var row = findTeamRow(sheet, data.teamId);
  if (row <= 0) return jsonResponse({ success: false, error: 'Team not found' });

  var lastCol = 9 + 12 + 12 + 1; // Status col = 34
  sheet.getRange(row, lastCol).setValue(data.status);

  return jsonResponse({ success: true });
}

function handleGetAllTeams(roomId) {
  var sheet = getRoomSheet('Teams', roomId);
  if (!sheet) return jsonResponse({ success: true, data: [] });
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return jsonResponse({ success: true, data: [] });
  var data = sheet.getRange(1, 1, lastRow, 34).getValues();

  var teams = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[1] && !row[2]) continue; // skip empty rows
    teams.push({
      teamId: row[1],
      teamName: row[2],
      currentMonth: row[7],
      totalScore: row[6],
      timeBonus: row[8],
      r1Score: row[9], r2Score: row[10], r3Score: row[11], r4Score: row[12],
      r5Score: row[13], r6Score: row[14], r7Score: row[15], r8Score: row[16],
      r9Score: row[17], r10Score: row[18], r11Score: row[19], r12Score: row[20],
      r1Time: row[21], r2Time: row[22], r3Time: row[23], r4Time: row[24],
      r5Time: row[25], r6Time: row[26], r7Time: row[27], r8Time: row[28],
      r9Time: row[29], r10Time: row[30], r11Time: row[31], r12Time: row[32],
      status: row[33] || 'playing'
    });
  }

  return jsonResponse({ success: true, data: teams });
}

// ==========================================
// EVENT MANAGEMENT
// ==========================================
function handleCreateEvent(data) {
  var roomId = data.roomId || 'room-default';
  var sheet = getOrCreateRoomSheet('Events', roomId);
  ensureHeaders(sheet, ['Event Type', 'Is Active', 'Started At', 'Target Teams', 'Instruction']);

  // Deactivate previous active events
  var existing = sheet.getDataRange().getValues();
  for (var i = 1; i < existing.length; i++) {
    if (existing[i][1] === true) {
      sheet.getRange(i + 1, 2).setValue(false);
    }
  }

  sheet.appendRow([
    data.eventType,
    true,
    new Date().toISOString(),
    data.targetTeams || 'all',
    data.instruction || ''
  ]);

  return jsonResponse({ success: true });
}

function handleClearEvent(data) {
  var roomId = data.roomId || 'room-default';
  var sheet = getRoomSheet('Events', roomId);
  if (!sheet) return jsonResponse({ success: true });
  var existing = sheet.getDataRange().getValues();
  for (var i = 1; i < existing.length; i++) {
    if (existing[i][1] === true) {
      sheet.getRange(i + 1, 2).setValue(false);
    }
  }
  return jsonResponse({ success: true });
}

function handleGetEvent(roomId) {
  var sheet = getRoomSheet('Events', roomId);
  if (!sheet) return jsonResponse({ success: true, data: { isActive: false } });
  var data = sheet.getDataRange().getValues();

  // Find last active event
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === true) {
      return jsonResponse({
        success: true,
        data: {
          roomId: roomId,
          eventType: data[i][0],
          isActive: true,
          startedAt: data[i][2],
          targetTeams: data[i][3],
          instruction: data[i][4]
        }
      });
    }
  }

  return jsonResponse({ success: true, data: { isActive: false } });
}

// ==========================================
// GAME STATE
// ==========================================
function handleStartGame(data) {
  var roomId = data.roomId || 'room-default';
  var sheet = getOrCreateRoomSheet('GameState', roomId);
  ensureHeaders(sheet, ['Game Started', 'Mission Timer Minutes', 'Created At', 'Industry Type']);

  var rowData = [true, data.timerMinutes || 90, new Date().toISOString(), data.industryType || 12];
  if (sheet.getLastRow() >= 2) {
    sheet.getRange(2, 1, 1, 4).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return jsonResponse({ success: true });
}

function handleStopGame(data) {
  var roomId = data.roomId || 'room-default';
  var sheet = getRoomSheet('GameState', roomId);
  if (!sheet) return jsonResponse({ success: true });
  if (sheet.getLastRow() >= 2) {
    sheet.getRange(2, 1).setValue(false);
  }
  return jsonResponse({ success: true });
}

function handleGetGameState(roomId) {
  var sheet = getRoomSheet('GameState', roomId);
  if (!sheet) return jsonResponse({ success: true, data: { gameStarted: false } });

  if (sheet.getLastRow() < 2) {
    return jsonResponse({ success: true, data: { gameStarted: false } });
  }

  var cols = sheet.getLastColumn();
  var data = sheet.getRange(2, 1, 1, Math.max(cols, 4)).getValues()[0];
  return jsonResponse({
    success: true,
    data: {
      roomId: roomId,
      gameStarted: data[0] === true,
      missionTimerMinutes: data[1],
      createdAt: data[2],
      industryType: data[3] || 12
    }
  });
}

// ==========================================
// ROOM MANAGEMENT
// ==========================================
function handleListRooms() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheets = ss.getSheets();
  var roomSet = {};

  for (var i = 0; i < sheets.length; i++) {
    var name = sheets[i].getName();
    var match = name.match(/^(Teams|Events|GameState)_(.+)$/);
    if (match) {
      roomSet[match[2]] = true;
    }
  }

  var roomList = Object.keys(roomSet);
  return jsonResponse({ success: true, data: roomList });
}

function handleDeleteRoom(data) {
  var roomId = data.roomId;
  if (!roomId) return jsonResponse({ success: false, error: 'roomId required' });

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var prefixes = ['Teams_', 'Events_', 'GameState_'];
  var deleted = 0;

  for (var p = 0; p < prefixes.length; p++) {
    var sheetName = prefixes[p] + roomId;
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      ss.deleteSheet(sheet);
      deleted++;
    }
  }

  return jsonResponse({ success: true, deleted: deleted });
}

// ==========================================
// HELPERS
// ==========================================

/** Write: creates sheet if not exists */
function getOrCreateRoomSheet(type, roomId) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheetName = type + '_' + roomId;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/** Read-only: returns existing sheet or null (NEVER auto-creates) */
function getRoomSheet(type, roomId) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheetName = type + '_' + roomId;
  return ss.getSheetByName(sheetName);
}

function ensureHeaders(sheet, headers) {
  var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (firstRow[0] === '' || firstRow[0] === null) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function getTeamHeaders() {
  return [
    'Timestamp', 'Team ID', 'Team Name', 'Members', 'Roles', 'Industry Type',
    'Total Score', 'Current Month', 'Time Bonus',
    'R1 Score', 'R2 Score', 'R3 Score', 'R4 Score', 'R5 Score', 'R6 Score',
    'R7 Score', 'R8 Score', 'R9 Score', 'R10 Score', 'R11 Score', 'R12 Score',
    'R1 Time', 'R2 Time', 'R3 Time', 'R4 Time', 'R5 Time', 'R6 Time',
    'R7 Time', 'R8 Time', 'R9 Time', 'R10 Time', 'R11 Time', 'R12 Time',
    'Status'
  ];
}

function findTeamRow(sheet, teamId) {
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] == teamId) {
      return i + 1;
    }
  }
  return -1;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
