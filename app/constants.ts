import { EventType, IndustryType, MissionConfig, CustomerScenario } from './types';

export const ADMIN_PASSWORD = '6749467';

export const ROLES = [
  { id: 'captain', label: '팀장 (Captain)' },
  { id: 'strategist', label: '전략가' },
  { id: 'communicator', label: '소통가' },
  { id: 'executor', label: '실행가' },
  { id: 'recorder', label: '기록자' },
  { id: 'supporter', label: '서포터' },
];

export const MISSIONS: MissionConfig[] = [
  { id: 1, month: '1월', title: '취임사 작성', score: 60, timeLimit: 5, timeBonus: 10, story: '팀원들의 마음을 사로잡을 첫 마디를 완성하라' },
  { id: 2, month: '2월', title: '팀 진단 보고서', score: 60, timeLimit: 5, timeBonus: 10, story: '전임 팀장이 남긴 암호화된 보고서를 해독하라' },
  { id: 3, month: '3월', title: '팀원 1:1 면담', score: 65, timeLimit: 5, timeBonus: 10, story: '흩어진 팀원들의 연락처를 추적하라' },
  { id: 4, month: '4월', title: '업무 배분 회의', score: 75, timeLimit: 7, timeBonus: 15, story: '업무 분장표의 오류를 찾아 수정하라' },
  { id: 5, month: '5월', title: '팀빌딩 워크숍', score: 80, timeLimit: 10, timeBonus: 15, story: '자연 속 원팀 인증샷을 찍어라!' },
  { id: 6, month: '6월', title: '핵심 인재 리텐션', score: 70, timeLimit: 7, timeBonus: 15, story: '이직 고민 중인 핵심 인재의 진심을 파악하라' },
  { id: 7, month: '7월', title: '성과 면담', score: 90, timeLimit: 7, timeBonus: 15, story: '팀원의 말 속 숨겨진 진짜 메시지를 읽어내라' },
  { id: 8, month: '8월', title: '숨은 역량 발견', score: 70, timeLimit: 7, timeBonus: 15, story: '조용한 팀원의 특별한 재능을 밝혀내라' },
  { id: 9, month: '9월', title: '돌발 위기 대응', score: 110, timeLimit: 10, timeBonus: 20, story: '골든타임 4분! 동료의 생명을 구하라' },
  { id: 10, month: '10월', title: '조직 재편', score: 100, timeLimit: 12, timeBonus: 20, story: '뒤엉킨 R&R을 재배치해 팀을 정상화하라' },
  { id: 11, month: '11월', title: 'AI 코칭 대화', score: 130, timeLimit: 15, timeBonus: 25, story: 'AI와 함께 코칭 리더십을 증명하라' },
  { id: 12, month: '12월', title: '연말 성과보고 + 팀워크', score: 90, timeLimit: 10, timeBonus: 30, story: '12개월의 리더십 여정을 마무리하라' },
];

// ==========================================
// MISSION DATA
// ==========================================

export const R1_STORY = `"축하합니다, 팀장님!" 인사팀장의 악수가 어색하기만 하다.
어제까지 편한 실무자였건만, 오늘부터 '신규 프로젝트팀 팀장'이란다.
첫 출근, 낯선 회의실에 모인 5명의 팀원들이 의심 가득한 눈으로 당신을 올려다본다.
"새 팀장님이 어떤 분인지..." 이 서먹한 공기를 깨려면, 팀원들의 마음을 사로잡을 취임 인사가 필요하다.
진정한 리더의 첫 마디는 무엇이어야 하는가? 올바른 리더십 키워드를 골라 감동적인 취임사를 완성하라!`;

export const R1_PROFILES = [
  { id: 1, name: '지원자 A', image: 'https://i.ibb.co/ZzGbJ95W/1.jpg' },
  { id: 2, name: '지원자 B', image: 'https://i.ibb.co/jkhyckN9/2.jpg' },
  { id: 3, name: '지원자 C', image: 'https://i.ibb.co/xq1pdjFB/3.jpg' },
];
export const R1_CORRECT_ANSWER = '박낙하';

export const R2_STORY = `취임 인사를 마친 다음 날 아침. 내 책상 위에는 전임 팀장이 남긴 외장하드 하나가 놓여있었다.
폴더 안에는 비밀번호가 걸린 팀_진단_최종보고서.pdf 파일, 그리고 'readme.txt'라는 메모장이 있었다.

"신임 팀장님께. 겉으로 보이는 게 다가 아닙니다.
5명의 팀원, 그들의 겉모습(업무 스타일)과 제가 1년간 관찰하며 알아낸 진짜 속마음(설명)을 올바르게 연결하세요.
모두 정확히 매칭되면 파일의 암호가 풀릴 겁니다. 행운을 빕니다."

당신은 팀원들의 이력서와 전임자의 찢겨진 메모 조각들을 책상 위에 늘어놓았다.
왼쪽에는 팀원 5명의 이름과 그들을 수식하는 '단 하나의 키워드'가 있다.
오른쪽에는 그들의 태도 이면에 숨겨진 '진짜 원인'이 적힌 문장들이 뒤섞여 있다.

이제 흩어진 단서를 조립해, 우리 팀이 앓고 있는 진짜 병을 진단해야 한다.`;
export const R2_IMAGE = '/images/mission2.jpg';

export const R3_STORY = `진단 보고서를 열어보니 충격적이다. 팀원 간 소통 단절, 낮은 신뢰도, 역할 갈등...
이대로는 안 된다. 당장 팀원 전원과 1:1 면담을 잡아야 한다.
하지만 팀원들은 각자 현장, 재택, 출장으로 흩어져 있고, 연락처마저 제대로 정리되어 있지 않다.
아래 이미지를 터치하여 단서를 추적하고, 모든 팀원의 연락처를 확보해 면담 일정을 잡아라!`;
export const R3_QUIZ_IMAGE = 'https://i.ibb.co/995Fmy4d/R3.jpg';
export const R3_PADLET_LINK = 'https://padlet.com/ksajhjeon/kim-s-back-idnyc8suzfsy502s';
export const R3_CORRECT_ANSWERS = [
  '010-4454-2252', '010-2319-4323', '010-3228-3143', '010-9476-7825', '010-8448-2354',
];

export const R4_STORY = `1:1 면담을 통해 팀원들의 속마음을 들어보니, 가장 큰 불만은 '불합리한 업무 배분'이었다.
전임 팀장이 급하게 만들어놓은 업무 분장표를 살펴보니, 역할 중복, 누락된 업무, 역량과 맞지 않는 배치가 곳곳에 숨어 있다.
팀장으로서 팀의 R&R을 정확하게 재정비하려면, 먼저 이 문제들을 하나도 빠짐없이 찾아내야 한다.
엘리트 팀장의 눈썰미를 증명하라!`;
export const R4_GAME_DATA = [
  {
    img: 'https://i.imgur.com/suTemUXl.png',
    answers: [
      { x: 55.1, y: 16.7, r: 7 },
      { x: 71.3, y: 50.3, r: 7 },
      { x: 85.7, y: 54.1, r: 7 },
    ],
  },
  {
    img: 'https://i.imgur.com/o5HD18zl.png',
    answers: [
      { x: 82.5, y: 10.1, r: 7 },
      { x: 74.4, y: 63.9, r: 7 },
      { x: 53.7, y: 71.2, r: 7 },
    ],
  },
  {
    img: 'https://i.imgur.com/sV8YkaBl.png',
    answers: [
      { x: 84.6, y: 43.3, r: 7 },
      { x: 67.6, y: 30.5, r: 7 },
      { x: 57.9, y: 22.4, r: 7 },
    ],
  },
];

export const R5_STORY = `업무 배분을 바로잡으니 팀 분위기가 한결 나아졌다. 이 기세를 몰아 5월, 팀빌딩 워크숍을 기획했다!
"함께 밖으로 나가자!" 삭막한 사무실을 벗어나 자연 속에서 팀원들과 함께 '원팀' 인증샷을 찍어 팀 채널에 공유하라!
AI가 사진 속 자연 배경과 팀워크를 검증할 것이다.`;
export const R5_SAMPLE_IMAGE = 'https://i.ibb.co/BHNttT6M/R5.png';

export const R6_STORY = `팀빌딩 워크숍의 훈훈함도 잠시, 충격적인 소식이 들려온다.
팀 내 핵심 인재가 헤드헌터의 연락을 받고 이직을 심각하게 고민 중이라는 것!
그가 떠나면 프로젝트는 좌초된다. 하지만 직접 물어봐선 역효과.
강의장 곳곳에 숨겨진 6장의 단서 카드를 찾아 사진으로 기록하고,
그가 진짜로 원하는 것(보상? 성장? 인정? 워라밸?)을 파악해 리텐션 전략의 핵심 키워드를 밝혀내라!`;
export const R6_CORRECT_ANSWER = 'BERLIN';
export const R6_MISSION_IMAGE = 'https://i.ibb.co/GfD5Qy0r/6mission.jpg';

export const R7_STORY = `핵심 인재 리텐션에 성공하며 위기를 넘긴 7월, 상반기 성과 면담 시즌이 돌아왔다.
하지만 단순히 "수고했다"는 말로는 부족하다.
팀원의 면담 영상을 집중해서 시청하라. 말 속에 숨겨진 진짜 불만, 기대, 성장 욕구를 읽어내야 한다.
'맥락적 경청'과 '날카로운 통찰력'으로 이면의 메시지를 해독하고,
정확한 피드백 포인트를 짚어내라! 팀장이 진짜 파악해야 할 것은 무엇인가? (When/What)`;
export const R7_VIDEO_URL = 'https://1970jjh.github.io/kim-is-back/7R.mp4';

export const R8_STORY = `성과 면담을 통해 팀원들을 더 깊이 이해하게 된 당신.
그런데 평소 조용하기만 했던 팀원에게 숨겨진 특별한 역량이 있다는 소문이 돈다.
겉으로는 드러나지 않는 잠재력을 발견하는 것이야말로 진정한 리더의 능력!
당신의 관찰력과 유려한 대화술로 그 팀원이 자발적으로 역량을 드러내게 만들어라!`;
export const R8_CORRECT_ANSWER = 'STAR';
export const R8_MISSION_IMAGE = 'https://i.ibb.co/N2B8HLbw/8R.png';

export const R9_STORY = `팀이 안정궤도에 오르던 찰나, 중요 프레젠테이션을 코앞에 두고
"쿵!" 하는 소리와 함께 다급한 비명이 터진다.
"팀원이 쓰러졌습니다!" 골든타임은 단 4분.
리더는 위기의 순간에 가장 먼저, 가장 정확하게 움직여야 한다.
흐트러짐 없는 박자와 정확한 속도로 심폐소생술을 실시해, 동료의 생명을 구하라!`;

export const R10_STORY = `팀원은 다행히 무사했지만, 위기는 끝나지 않았다.
본부장의 갑작스러운 조직개편 지시! "프로젝트 방향을 바꿔라."
뒤엉킨 업무와 역할을 한정된 시간 안에 재배치해야 한다.
마치 칠교 퍼즐처럼, 조각난 R&R을 정확한 자리에 맞춰 팀을 정상화하라!
팀원 전원이 릴레이로 참여하는 조직 재편 미션, 변화관리 능력을 증명하라!`;
export const R10_MISSION_IMAGE = 'https://i.ibb.co/rKFBJVhZ/Infographic-89.png';

export const R11_STORIES: Record<number, string> = {
  0: `프로젝트 마감이 한 달 앞으로 다가왔다. 팀의 사기는 바닥, 야근은 끝이 없고, 번아웃 직전의 팀원이 조용히 면담을 요청해 온다. "팀장님, 솔직히 더 이상은 못 버티겠습니다..." AI가 실시간으로 분석하는 코칭 점수계가 '위험'을 가리키고 있다. 진심 어린 공감과 현실적인 지원책으로 팀원의 마음을 열고, 코칭 점수 80점을 돌파해 당신의 리더십을 증명하라!`,
  11: `프로젝트 마감을 앞두고 팽팽한 긴장감이 감도는 사무실, 묵묵히 일하던 핵심 인재가 굳은 표정으로 다가와 면담을 요청한다. 무거운 침묵을 깨고 들려오는 건 '더 이상은 못 버티겠다'는 충격적인 번아웃 선언! 하지만 위기는 곧 기회, 팀원의 무너진 멘탈을 일으켜 세우고 숨통을 틔워주는 자가 진정한 '코칭의 신(神)'이다. AI가 실시간으로 분석하는 팀원의 심리적 안전감 지수가 '위험'을 가리키고 있다. 굳게 닫혀버린 팀원의 마음을 진심 어린 공감과 든든한 지원 사격으로 열어, 코칭 점수 80점을 돌파하고 당신의 흔들림 없는 리더십을 증명하라!`,
  12: `이번 주 업무 세팅을 겨우 마쳤건만, 청천벽력처럼 본부장의 무리한 업무 개편안이 하달된다! 소식을 듣자마자 달려온 실무 팀원의 입에선 '탁상공론이다', '다 퇴사하겠다'는 거친 항의가 폭포수처럼 쏟아진다. 위기는 곧 기회, 위아래의 치명적인 충돌을 막고 돌파구를 찾는 자가 진정한 '조율의 신(神)'이다. AI가 실시간으로 분석하는 조직 신뢰도 온도계가 '폭발 직전'을 가리키고 있다. 맹렬한 팀원의 불만을 흡수하고 불필요한 관행을 과감히 잘라내어, 중재 점수 80점을 돌파하고 당신의 탁월한 변화 관리 능력을 증명하라!`,
  13: `타 부서의 데이터 지연으로 발을 동동 구르던 찰나, 등골을 서늘하게 울리는 사내 메신저 알림음! 화면 너머로 들려오는 건 오후 임원 회의를 앞두고 초조해진 상사의 불호령이다. 위기는 곧 기회, 상사의 불안감을 잠재우고 완벽한 해결책을 쥐여주는 자가 진정한 '매니지업(Manage-up)의 신(神)'이다. AI가 실시간으로 분석하는 리더의 신뢰 온도계가 '경고'를 가리키고 있다. 당황한 상사께 팩트 기반의 두괄식 브리핑과 즉각적인 대안(Plan B)을 제시하여, 팔로워십 점수 80점을 돌파하고 당신의 독보적인 존재감을 증명하라!`,
};

export const CUSTOMER_SCENARIOS: Record<number, CustomerScenario> = {
  [IndustryType.IT_SOLUTION]: { title: '시스템 장애 클레임', scenario: 'ERP 시스템이 갑자기 멈춰서 우리 회사 전체가 마비됐습니다! 어제 업데이트 이후로 계속 이러는데 어떻게 하실 건가요?', customerName: '박 과장' },
  [IndustryType.MANUFACTURING]: { title: '납품 품질 불량', scenario: '어제 입고된 원자재 중 30%가 규격 미달입니다! 생산라인이 멈출 판인데 이게 말이 됩니까?', customerName: '김 공장장' },
  [IndustryType.RETAIL]: { title: '배송 지연 불만', scenario: '일주일 전에 주문한 상품이 아직도 안 왔어요! 추적 번호는 업데이트도 안 되고... 선물용이었는데 기념일 다 지났잖아요!', customerName: '이 고객님' },
  [IndustryType.CONSTRUCTION]: { title: '시공 하자 민원', scenario: '입주한 지 3개월밖에 안 됐는데 벽에 금이 가고 화장실에서 물이 새요! 이게 신축 아파트 맞습니까?', customerName: '최 입주민' },
  [IndustryType.FINANCE]: { title: '금융 상품 손실', scenario: '추천하신 펀드가 3개월 만에 20% 손실입니다! 원금 보장에 가깝다고 하셨잖아요? 이게 어떻게 된 겁니까?', customerName: '정 고객님' },
  [IndustryType.ADVERTISING]: { title: '광고 성과 미달', scenario: '한 달 광고비 5천만원 썼는데 전환율이 0.1%예요! 예상치의 10분의 1도 안 나왔는데 책임지실 거예요?', customerName: '강 마케팅팀장' },
  [IndustryType.CHEMICAL_ENERGY]: { title: '연료 품질 클레임', scenario: '납품받은 연료로 가동했더니 보일러 효율이 급격히 떨어졌어요! 성분 분석 결과 규격에 미달이던데 어떻게 보상받죠?', customerName: '윤 시설관리자' },
  [IndustryType.MEDICAL]: { title: '의료기기 오작동', scenario: '새로 도입한 진단 장비가 계속 오류를 일으켜요! 환자 검사 일정이 다 밀리고 있는데 긴급 A/S가 안 된다니요?', customerName: '한 원장님' },
  [IndustryType.LOGISTICS]: { title: '화물 파손 사고', scenario: '보낸 물품이 박살나서 도착했어요! 분명 \'취급주의\' 표시했는데... 이 손해는 누가 배상하는 겁니까?', customerName: '송 수출담당' },
  [IndustryType.FNB]: { title: '식품 이물질 발견', scenario: '케이터링 음식에서 이물질이 나왔어요! 중요한 행사였는데 손님들 앞에서 얼마나 창피했는지... 책임자 나오세요!', customerName: '임 행사담당' },
  [IndustryType.LEADERSHIP]: { title: '번아웃 팀원 코칭', scenario: '팀장님, 죄송하지만 이번 프로젝트 일정을 맞추기 어려울 것 같습니다. 계속 야근을 하고 있는데도 타 부서 협조가 안 돼서 진도가 전혀 안 나가네요. 솔직히 너무 지칩니다.', customerName: '팀원' },
  [IndustryType.MIDDLE_MANAGER]: { title: '위/아래 갈등 중재', scenario: '팀장님, 본부장님이 지시하신 이번 개편안은 현장 상황을 전혀 모르는 탁상공론 아닌가요? 일정은 반으로 줄고 일은 두 배인데, 이러다 저희 파트 다 퇴사합니다.', customerName: '팀원' },
  [IndustryType.FOLLOWERSHIP]: { title: '리더에게 보고 & 대안 제시', scenario: '팀장, 오늘 오전까지 주기로 한 보고서 초안 어떻게 되어가고 있어요? 오후 회의에 써야 하는데 아직 중간보고가 없어서 당황스럽네요. 어디까지 된 겁니까?', customerName: '본부장님' },
};

export const R12_STORY = `12개월의 대장정, 마지막 미션이다!
프로젝트 최종 발표를 앞두고, 이제 남은 건 '원팀'의 팀워크를 온몸으로 증명하는 것.
팀원 전원이 하나 되어 제기를 손 또는 발로 차올리며
1년간의 리더십 여정을 유쾌한 라스트 댄스로 마무리하고,
12개월의 리더십 스토리를 담은 최종 성과보고서를 제출하라!`;

// ==========================================
// EVENTS
// ==========================================

export const EVENTS = [
  { type: EventType.BREAK, label: '휴게시간', image: 'https://i.ibb.co/VYgjPNH9/event1.jpg', instruction: '' },
  { type: EventType.LUNCH, label: '점심시간', image: 'https://i.ibb.co/B2PhHKbp/event2.jpg', instruction: '지금은 점심시간! 조금만 늦어도 국물도 없다. 강사(본부장)가 \'밥 먹자!\'를 크게 외치면, 이와 동시에 각 팀의 팀장(Captain)은 앞쪽에 비치된 다과를 챙겨와서 팀원들을 먹여살려야 한다!' },
  { type: EventType.ALL_HANDS, label: '전사회의', image: 'https://i.ibb.co/XZw6kzm2/event.jpg', instruction: '' },
  { type: EventType.BIRTHDAY, label: '생일파티', image: 'https://i.ibb.co/KxzMHjg7/event4.jpg', instruction: '오늘은 이번 달 생일자 이벤트가 있는 날! 각 팀에서 오늘 기준으로 다가오는 생일이 가장 가까운 한 사람은 앞으로 나오세요!' },
  { type: EventType.DINNER, label: '회식타임', image: 'https://i.ibb.co/kgQhCHm4/event5.jpg', instruction: '오늘은 즐거운 회식 날! 팀원 모두는 잔(종이컵)을 들고 일어서서, 팀장(Captain)의 선창에 따라 다 함께 건배사를 외쳐야 한다. 건배사는 10자 이상, 팀원 모두 참여!' },
  { type: EventType.SPORTS, label: '체육대회', image: 'https://i.ibb.co/G4XszvLV/new.jpg', instruction: '오늘은 단합을 위한 체육대회가 있는 날! 각 팀의 서포터는 앞으로 나와서 체육대회 진행자로 부터 체육행사 물품을 수령하세요' },
  { type: EventType.WORKSHOP, label: '워크숍', image: 'https://i.ibb.co/prkDpVpQ/event7.jpg', instruction: '오늘은 지나온 날을 돌아보고, 앞으로를 함께 다짐하는 워크숍이 있는 날. 역시 남는 건 사진 뿐! 단체사진 촬영을 위해 모두 앞으로 나오세요.' },
  { type: EventType.HEALTH_CHECK, label: '건강검진', image: 'https://i.ibb.co/ycsSt8bS/2.png', instruction: '오늘은 건강검진이 있는 날. 시력검사를 받으러 다 함께 나오세요.' },
  { type: EventType.VOLUNTEER, label: '봉사활동', image: 'https://i.ibb.co/sJdwz5Gv/event9.jpg', instruction: '오늘은 ESG활동의 일환으로 지역 봉사활동이 있는 날! 모든 팀원이 함께 교육장 내 모든 책상 위에 있는 쓰레기를 모두 모아 분리수거를 완료하고, 본부장(강사)께 완료보고 하세요.' },
  { type: EventType.TOWN_HALL, label: '타운홀 미팅', image: 'https://i.ibb.co/Zpxfgmfh/event10.jpg', instruction: '오늘은 타운홀 미팅이 열리는 날! 전 팀원이 함께 2열 종대로 줄을 맞추어 교육장을 크게 3바퀴 뛰고, 결승선(강사)으로 들어와 인증을 받으세요' },
  { type: EventType.GOAL_SETTING, label: '목표설정', image: '', instruction: '팀장은 팀원들과 함께 이번 분기 핵심 목표(OKR)를 수립하세요. 목표는 구체적이고 측정 가능해야 합니다!' },
  { type: EventType.TASK_ASSIGN, label: '업무분담', image: '', instruction: '팀장은 팀원 각자의 강점을 고려하여 업무를 배분하세요. R&R을 명확히 정하고 팀원 전원의 동의를 받으세요!' },
  { type: EventType.ONE_ON_ONE, label: '1on1 면담', image: '', instruction: '팀장은 팀원 한 명과 1:1 면담을 진행하세요. 업무 현황, 고충, 성장 목표에 대해 진심으로 경청하세요!' },
  { type: EventType.WEEKLY_REPORT, label: '주간업무보고', image: '', instruction: '각 팀의 팀장은 이번 주 성과와 다음 주 계획을 30초 내로 발표하세요. 핵심만 두괄식으로!' },
  { type: EventType.PERFORMANCE, label: '성과평가', image: '', instruction: '팀장은 팀원의 성과를 공정하게 평가하고, 구체적인 피드백을 제공하세요. 칭찬과 개선점을 균형있게!' },
  { type: EventType.HIRING, label: '채용면접', image: '', instruction: '팀에 새 인재가 필요합니다! 팀장은 면접관이 되어 지원자(옆 팀원)에게 핵심 질문 3개를 던지세요!' },
  { type: EventType.EXIT_INTERVIEW, label: '퇴사면담', image: '', instruction: '핵심 인재가 퇴사를 고민합니다. 팀장은 진심으로 이야기를 듣고, 남아야 할 이유를 설득하세요!' },
];

// ==========================================
// RELAY RACING DATA
// ==========================================

export const OBSTACLES_HUMAN = ["비꼬기", "말 자르기", "감정적 비난", "무시하기", "편견", "비아냥", "일방적 훈수", "고집불통", "공로 가로채기", "냉소적 태도"];
export const OBSTACLES_WORK = ["정보 독점", "책임 회피", "독단적 결정", "불투명한 공유", "비협조", "성과 가로채기", "불명확한 R&R", "피드백 거부", "업무 지연", "마감 임박"];
export const OBSTACLES_CULTURE = ["수직적 권위", "눈치 문화", "형식주의", "꼰대 문화", "사일로 현상", "무사안일", "변화 기피", "창의성 억압", "경직된 분위기"];
export const ITEMS_ENERGY = ["충전에너지", "활력", "열정", "집중력", "긍정 마인드"];
export const ITEMS_SHIELD = ["신뢰", "심리적 안전", "동료 지지", "팀워크", "존중"];
export const ITEMS_BOOST = ["시너지", "협업 파워", "집단 지성", "추진력", "도약"];
export const PLAYER_NAMES = ["팀장", "전략가", "소통가", "실행가", "기록자", "서포터"];

export const RELAY_THEMES = [
  { name: '해안도로', sky1: '#87CEEB', sky2: '#1E90FF', ground: '#C2B280', road: '#404040', rumble1: '#ff0000', rumble2: '#ffffff', grass1: '#10b981', grass2: '#059669', line: '#ffffff', fog: '#87CEEB', sceneryTypes: ['palm', 'rock'] as const },
  { name: '도심 고속도로', sky1: '#2c3e50', sky2: '#1a252f', ground: '#34495e', road: '#2c3e50', rumble1: '#f39c12', rumble2: '#2c3e50', grass1: '#27ae60', grass2: '#229954', line: '#f1c40f', fog: '#34495e', sceneryTypes: ['building', 'sign'] as const },
  { name: '숲길', sky1: '#87CEEB', sky2: '#5DADE2', ground: '#2E7D32', road: '#424242', rumble1: '#ff5722', rumble2: '#ffffff', grass1: '#388E3C', grass2: '#2E7D32', line: '#ffffff', fog: '#90CAF9', sceneryTypes: ['tree', 'rock'] as const },
  { name: '석양 드라이브', sky1: '#FF6B35', sky2: '#F7C59F', ground: '#8B4513', road: '#363636', rumble1: '#DC143C', rumble2: '#FFD700', grass1: '#D2691E', grass2: '#A0522D', line: '#FFD700', fog: '#FF8C00', sceneryTypes: ['palm', 'rock'] as const },
  { name: '야간 질주', sky1: '#0c0c1e', sky2: '#1a1a3e', ground: '#1a1a2e', road: '#16213e', rumble1: '#e94560', rumble2: '#0f3460', grass1: '#1a1a2e', grass2: '#0f0f1e', line: '#e94560', fog: '#1a1a3e', sceneryTypes: ['building', 'sign'] as const },
  { name: '본사 진입', sky1: '#667eea', sky2: '#764ba2', ground: '#2d3436', road: '#2d3436', rumble1: '#fdcb6e', rumble2: '#6c5ce7', grass1: '#00b894', grass2: '#00a085', line: '#fdcb6e', fog: '#a29bfe', sceneryTypes: ['building', 'tree'] as const },
];
