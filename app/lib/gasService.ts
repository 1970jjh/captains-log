// TODO: 새 Google Apps Script 배포 후 URL 교체
const GAS_URL = 'https://script.google.com/macros/s/AKfycbz7CV0qXsNtFk986RpkFF9YjS33XQNBfz3owxudGPFlrh13MdkqZdkNts2tyiEXPB8G/exec';

interface GasResponse {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

async function postToGas(payload: Record<string, unknown>): Promise<GasResponse> {
  if (!GAS_URL) {
    return { success: false, error: 'GAS_URL not configured' };
  }
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    return await response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function getFromGas(params: Record<string, string>): Promise<GasResponse> {
  if (!GAS_URL) {
    return { success: false, error: 'GAS_URL not configured' };
  }
  try {
    const url = new URL(GAS_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const response = await fetch(url.toString());
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    return await response.json();
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export const gasService = {
  registerTeam: (roomId: string, teamId: number, teamName: string, members: string, roles: string, industryType: number) =>
    postToGas({ action: 'registerTeam', roomId, teamId, teamName, members, roles, industryType }),

  updateMissionScore: (roomId: string, teamId: number, round: number, score: number, timeSeconds: number) =>
    postToGas({ action: 'updateScore', roomId, teamId, round, score, timeSeconds }),

  updateCurrentMonth: (roomId: string, teamId: number, currentMonth: number) =>
    postToGas({ action: 'updateMonth', roomId, teamId, currentMonth }),

  updateTotalScore: (roomId: string, teamId: number, totalScore: number, timeBonus: number) =>
    postToGas({ action: 'updateTotal', roomId, teamId, totalScore, timeBonus }),

  updateStatus: (roomId: string, teamId: number, status: string) =>
    postToGas({ action: 'updateStatus', roomId, teamId, status }),

  createEvent: (roomId: string, eventType: string, instruction: string, targetTeams: string) =>
    postToGas({ action: 'createEvent', roomId, eventType, instruction, targetTeams }),

  clearEvent: (roomId: string) =>
    postToGas({ action: 'clearEvent', roomId }),

  getActiveEvent: (roomId: string) =>
    getFromGas({ action: 'getEvent', roomId }),

  startGame: (roomId: string, timerMinutes: number) =>
    postToGas({ action: 'startGame', roomId, timerMinutes }),

  stopGame: (roomId: string) =>
    postToGas({ action: 'stopGame', roomId }),

  getGameState: (roomId: string) =>
    getFromGas({ action: 'getGameState', roomId }),

  getAllTeams: (roomId: string) =>
    getFromGas({ action: 'getAllTeams', roomId }),

  listRooms: () =>
    getFromGas({ action: 'listRooms' }),

  deleteRoom: (roomId: string) =>
    postToGas({ action: 'deleteRoom', roomId }),

  // Mission Data (1,3,5,7,12월 상세 데이터)
  saveMissionData: (roomId: string, teamId: number, month: number, dataJson: string) =>
    postToGas({ action: 'saveMissionData', roomId, teamId, month, dataJson }),

  getMissionData: (roomId: string, teamId?: number, month?: number) => {
    const params: Record<string, string> = { action: 'getMissionData', roomId };
    if (teamId) params.teamId = String(teamId);
    if (month) params.month = String(month);
    return getFromGas(params);
  },

  // Drive file upload (5월 사진, 12월 인포그래픽)
  uploadTeamFile: (roomId: string, teamId: number, fileType: 'photo' | 'infographic', base64Data: string, mimeType: string) =>
    postToGas({ action: 'uploadTeamFile', roomId, teamId, fileType, base64Data, mimeType }),

  // Assets
  getTeamAssets: (roomId: string, teamId: number) =>
    getFromGas({ action: 'getTeamAssets', roomId, teamId: String(teamId) }),

  getAllAssets: (roomId: string) =>
    getFromGas({ action: 'getAllAssets', roomId }),
};
