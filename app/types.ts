export enum EventType {
  BREAK = 'BREAK',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SPORTS = 'SPORTS',
  ALL_HANDS = 'ALL_HANDS',
  BIRTHDAY = 'BIRTHDAY',
  WORKSHOP = 'WORKSHOP',
  HEALTH_CHECK = 'HEALTH_CHECK',
  VOLUNTEER = 'VOLUNTEER',
  TOWN_HALL = 'TOWN_HALL',
  NONE = 'NONE',
}

export enum IndustryType {
  IT_SOLUTION = 1,
  MANUFACTURING = 2,
  RETAIL = 3,
  CONSTRUCTION = 4,
  FINANCE = 5,
  ADVERTISING = 6,
  CHEMICAL_ENERGY = 7,
  MEDICAL = 8,
  LOGISTICS = 9,
  FNB = 10,
  SERVICE = 11,
  LEADERSHIP = 12,
  MIDDLE_MANAGER = 13,
  FOLLOWERSHIP = 14,
  SELF_LEADERSHIP = 15,
  COMMUNICATION = 16,
  CORE_COMPETENCY = 17,
}

export const IndustryTypeLabels: Record<number, string> = {
  1: 'IT/솔루션',
  2: '제조/원자재',
  3: '유통/리테일',
  4: '건설/인프라',
  5: '금융/보험',
  6: '광고/마케팅',
  7: '화학/에너지',
  8: '의료/제약',
  9: '물류/운송',
  10: '식음료(F&B)',
  11: '서비스',
  12: '리더십',
  13: '중간관리자',
  14: '팔로워십',
  15: '셀프리더십',
  16: '커뮤니케이션',
  17: '핵심역량',
};

export interface TeamMember {
  role: string;
  name: string;
}

export interface RoundScore {
  score: number;
  timeSeconds: number;
  completedAt: number;
}

export interface TeamReport {
  oneLine: string;
  bestMission: string;
  regret: string;
  futureHelp: string;
  imageData?: string;
  submittedAt?: number;
}

export interface R11Feedback {
  finalScore: number;
  overallGrade: string;
  summary: string;
  goodPoints: string[];
  improvementPoints: string[];
  practicalTips: string;
  scoreComment: string;
  conversationHistory: Array<{ role: string; content: string }>;
  completionTime: string;
  submittedAt?: number;
}

export interface TeamData {
  teamId: number;
  teamName: string;
  members: TeamMember[];
  industryType: IndustryType;
  currentMonth: number;
  totalScore: number;
  timeBonus: number;
  roundScores: Record<number, RoundScore>;
  teamReport?: TeamReport;
  r11Feedback?: R11Feedback;
  status: 'playing' | 'completed';
  registeredAt: number;
}

export interface GameEvent {
  roomId: string;
  eventType: EventType;
  isActive: boolean;
  startedAt: number;
  targetTeams: string;
  instruction: string;
}

export interface GameState {
  roomId: string;
  gameStarted: boolean;
  missionTimerMinutes: number;
  createdAt: number;
}

export interface AppState {
  phase: 'landing' | 'roadmap' | 'admin';
  teamData: TeamData | null;
  gameStarted: boolean;
  activeEvent: GameEvent | null;
  roomId?: string;
}

export interface MissionConfig {
  id: number;
  month: string;
  title: string;
  score: number;
  timeLimit: number;
  timeBonus: number;
  story: string;
}

export interface CustomerScenario {
  title: string;
  scenario: string;
  customerName: string;
}
