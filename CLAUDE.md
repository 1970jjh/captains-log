# CAPTAIN'S LOG - 신임 팀장 리더십 시뮬레이션

## 프로젝트 개요
KIM'S BACK(kim-is-back.vercel.app)과 동일한 구조/기술스택으로 만드는 새로운 기업교육용 시뮬레이션 앱.
**KIM'S BACK 코드는 절대 수정하지 않는다. 완전히 별도 프로젝트로 개발.**

## 컨셉
- 갑자기 팀장으로 승진한 신임 팀장이 12개월간 겪는 리더십 상황을 팀 단위로 시뮬레이션
- AI가 리더십 유형(변혁적/서번트/코칭형 등)을 분석하고 레이더차트로 시각화
- 타겟: 신임 관리자, 차세대 리더 양성 과정

## 기술스택 (KIM'S BACK과 동일)
- **프론트엔드**: Next.js (App Router) + TailwindCSS + Vercel 배포
- **백엔드**: Google Apps Script (GAS) + Google Sheets (DB) + Google Drive (이미지)
- **AI**: Gemini API (gemini-3-flash-preview)
- **참여**: 모바일 웹 (앱 설치 없음), 팀 5~6명, 최대 10팀 동시

## KIM'S BACK 참조
KIM'S BACK 코드를 **읽기 전용**으로 참조하여 동일한 구조/패턴을 따른다:
- 경로: `C:/Users/ksajh/OneDrive/Desktop/킴스백/` (현재 폴더의 상위)
- GitHub: 1970jjh/kim-is-back
- 핵심 참조 파일: AdminDashboard.tsx, FinalResultReport.tsx, gasService.ts, geminiService.ts, Code.gs

## 핵심 기능 (KIM'S BACK에서 가져올 것)
1. 12개 미션 (Q1~Q4 분기별 스토리)
2. 실시간 관리자 대시보드 (SCORE RANKING, MISSION PROGRESS, LIVE STATUS)
3. EVENT 시스템 (돌발 이벤트)
4. AI 사진/답변 검증
5. 결과보고서 (레이더차트 2개 + AI 코멘트)
6. 퍼센타일 기반 상대평가 (45~95% 범위 min-max 정규화)
7. 산업/테마 커스터마이징

## 개발자 정보
- 전재현 소장 (JJ Creative 교육연구소 대표)
- 게이미피케이션 기업교육 전문가
- 한국어로 소통
