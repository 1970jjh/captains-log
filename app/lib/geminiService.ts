const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
const FLASH_MODEL = 'gemini-3-flash-preview';
const IMAGE_MODEL = 'gemini-3.1-flash-image-preview';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

async function callGemini(model: string, contents: unknown[], config?: Record<string, unknown>): Promise<unknown> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const body: Record<string, unknown> = { contents };
  if (config) {
    body.generationConfig = config;
  }
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${err}`);
  }
  return response.json();
}

function extractText(result: unknown): string {
  const r = result as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return r?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export const geminiService = {
  evaluateInaugural: async (speech: string): Promise<{ score: number; feedback: string; strengths: string[]; improvements: string[] }> => {
    try {
      const prompt = `당신은 리더십 교육 전문가입니다. 신임 팀장이 작성한 부임 인사를 아래 5가지 기준으로 평가해주세요.

평가 기준 (각 20점, 총 100점):
1. 비전 제시 (20점): 팀의 방향성과 목표를 명확히 제시했는가?
2. 진정성 (20점): 진심이 담긴 표현인가, 형식적이지 않은가?
3. 팀원 존중 (20점): 팀원들의 역할과 가치를 인정하고 있는가?
4. 소통 의지 (20점): 열린 소통과 협업에 대한 의지가 드러나는가?
5. 동기부여 (20점): 팀원들에게 동기를 부여하고 영감을 주는가?

부임 인사:
"${speech}"

반드시 아래 JSON 형식으로만 응답하세요:
{"score":0-100,"feedback":"종합 피드백 2-3문장","strengths":["강점1","강점2"],"improvements":["개선점1","개선점2"]}`;

      const result = await callGemini(FLASH_MODEL, [{ role: 'user', parts: [{ text: prompt }] }]);
      const text = extractText(result);
      const json = text.match(/\{[\s\S]*\}/);
      if (json) {
        const parsed = JSON.parse(json[0]);
        return {
          score: Number(parsed.score) || 0,
          feedback: parsed.feedback || '',
          strengths: parsed.strengths || [],
          improvements: parsed.improvements || [],
        };
      }
      return { score: 50, feedback: '평가 결과를 파싱할 수 없습니다.', strengths: [], improvements: [] };
    } catch (error) {
      return { score: 0, feedback: `평가 오류: ${error}`, strengths: [], improvements: [] };
    }
  },

  verifyHeartPhoto: async (imageBase64: string, mimeType: string): Promise<{ pass: boolean; participantCount: number; message: string; score: number }> => {
    try {
      const prompt = `이 사진을 분석해주세요. 다음 기준으로 평가합니다:

1. 야외(실외)에서 촬영되었는가?
2. 사람들이 **몸(팔, 다리, 전신)**으로 하트(♡) 모양을 만들고 있는가?
3. 하트 제작에 직접 참여한 사람 수는 몇 명인가?

주의사항:
- 손가락 하트는 인정하지 않습니다. 반드시 몸(팔, 전신)으로 만든 하트여야 합니다.
- 실내 촬영은 불통과입니다.
- 소품으로 만든 하트는 불통과입니다.
- 하트 제작에 직접 참여한 인원만 카운트합니다 (옆에 서있기만 한 사람 제외).

점수 기준:
- 2명 이하: 불통과 (score: 0)
- 3명: score 60
- 4명: score 70
- 5명: score 80
- 6명 이상: score 100

반드시 아래 JSON 형식으로만 응답하세요:
{"pass": true/false, "participantCount": 숫자, "message": "설명", "score": 0-100}`;

      const result = await callGemini(FLASH_MODEL, [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: prompt },
        ],
      }]);
      const text = extractText(result);
      const json = text.match(/\{[\s\S]*\}/);
      if (json) {
        const parsed = JSON.parse(json[0]);
        return {
          pass: parsed.pass || false,
          participantCount: Number(parsed.participantCount) || 0,
          message: parsed.message || '',
          score: Number(parsed.score) || 0,
        };
      }
      return { pass: false, participantCount: 0, message: '분석 결과를 파싱할 수 없습니다.', score: 0 };
    } catch (error) {
      return { pass: false, participantCount: 0, message: `사진 분석 오류: ${error}`, score: 0 };
    }
  },

  verifyPlantInPhoto: async (imageBase64: string, mimeType: string): Promise<{ pass: boolean; message: string }> => {
    try {
      const result = await callGemini(FLASH_MODEL, [{
        role: 'user',
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: '이 사진에 식물(나무, 꽃, 풀 등)이 포함되어 있는지 확인해주세요. JSON으로 답변: {"pass": true/false, "message": "설명"}' },
        ],
      }]);
      const text = extractText(result);
      const json = text.match(/\{[\s\S]*\}/);
      if (json) {
        return JSON.parse(json[0]);
      }
      return { pass: false, message: '분석 결과를 파싱할 수 없습니다.' };
    } catch (error) {
      return { pass: false, message: `사진 분석 오류: ${error}` };
    }
  },

  chatWithCustomer: async (
    industryType: number,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    userMessage: string
  ): Promise<{
    response: string;
    satisfactionScore: number;
    moodLevel: number;
    conversationEnded: boolean;
    evaluationScores: Record<string, number>;
  }> => {
    try {
      const systemPrompt = getCoachingSystemPrompt(industryType);
      const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: '네, 알겠습니다. 해당 역할로 대화하겠습니다.' }] },
        ...conversationHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        { role: 'user', parts: [{ text: userMessage + '\n\n[시스템: 위 메시지에 대해 팀원/상사 역할로 응답하고, JSON으로 현재 평가를 첨부하세요. 형식: {"response":"응답","satisfactionScore":0-100,"moodLevel":1-5,"conversationEnded":false,"evaluationScores":{"empathy":0-100,"listening":0-100,"coaching":0-100,"solution":0-100,"motivation":0-100,"trust":0-100,"communication":0-100,"decisiveness":0-100,"delegation":0-100,"vision":0-100}}]' }] },
      ];
      const result = await callGemini(FLASH_MODEL, contents);
      const text = extractText(result);
      const json = text.match(/\{[\s\S]*\}/);
      if (json) {
        const parsed = JSON.parse(json[0]);
        return {
          response: parsed.response || text,
          satisfactionScore: parsed.satisfactionScore || 0,
          moodLevel: parsed.moodLevel || 1,
          conversationEnded: parsed.conversationEnded || false,
          evaluationScores: parsed.evaluationScores || { empathy: 0, listening: 0, coaching: 0, solution: 0, motivation: 0, trust: 0, communication: 0, decisiveness: 0, delegation: 0, vision: 0 },
        };
      }
      return { response: text, satisfactionScore: 0, moodLevel: 1, conversationEnded: false, evaluationScores: { empathy: 0, listening: 0, coaching: 0, solution: 0, motivation: 0, trust: 0, communication: 0, decisiveness: 0, delegation: 0, vision: 0 } };
    } catch (error) {
      return { response: `오류 발생: ${error}`, satisfactionScore: 0, moodLevel: 1, conversationEnded: false, evaluationScores: { empathy: 0, listening: 0, coaching: 0, solution: 0, motivation: 0, trust: 0, communication: 0, decisiveness: 0, delegation: 0, vision: 0 } };
    }
  },

  generateCoachingFeedback: async (
    conversationHistory: Array<{ role: string; content: string }>,
    finalScore: number,
    industryType: number
  ): Promise<{ success: boolean; feedback: { overallGrade: string; summary: string; goodPoints: string[]; improvementPoints: string[]; practicalTips: string; scoreComment: string } }> => {
    try {
      const prompt = `다음은 신임 팀장의 리더십 코칭 시뮬레이션 대화 내역입니다. 최종 코칭 점수: ${finalScore}점.
산업군: ${industryType}

대화 내역:
${conversationHistory.map(m => `[${m.role}] ${m.content}`).join('\n')}

위 대화를 분석하여 JSON 형태로 리더십 피드백을 작성해주세요:
{"overallGrade":"A~F","summary":"종합 리더십 평가","goodPoints":["잘한 점1","잘한 점2"],"improvementPoints":["개선점1","개선점2"],"practicalTips":"실전 리더십 팁","scoreComment":"점수 코멘트"}`;

      const result = await callGemini(FLASH_MODEL, [{ role: 'user', parts: [{ text: prompt }] }]);
      const text = extractText(result);
      const json = text.match(/\{[\s\S]*\}/);
      if (json) {
        return { success: true, feedback: JSON.parse(json[0]) };
      }
      return { success: false, feedback: { overallGrade: 'C', summary: '피드백 생성 실패', goodPoints: [], improvementPoints: [], practicalTips: '', scoreComment: '' } };
    } catch (error) {
      return { success: false, feedback: { overallGrade: 'C', summary: `오류: ${error}`, goodPoints: [], improvementPoints: [], practicalTips: '', scoreComment: '' } };
    }
  },

  validateReport: async (report: { oneLine: string; bestMission: string; regret: string; futureHelp: string }): Promise<{ pass: boolean; message: string }> => {
    try {
      const prompt = `팀장 리더십 활동 결과보고서를 검증해주세요. 각 항목이 10자 이상 성의 있게 작성되었는지 확인:
- 한줄 소감: "${report.oneLine}"
- 최고의 리더십 순간: "${report.bestMission}"
- 아쉬운 점: "${report.regret}"
- 현업 적용 계획: "${report.futureHelp}"
JSON 응답: {"pass":true/false,"message":"검증 결과 메시지"}`;

      const result = await callGemini(FLASH_MODEL, [{ role: 'user', parts: [{ text: prompt }] }]);
      const text = extractText(result);
      const json = text.match(/\{[\s\S]*\}/);
      if (json) return JSON.parse(json[0]);
      return { pass: false, message: '검증 결과 파싱 실패' };
    } catch (error) {
      return { pass: false, message: `검증 오류: ${error}` };
    }
  },

  generateReportInfographic: async (
    report: { oneLine: string; bestMission: string; regret: string; futureHelp: string },
    teamId: number
  ): Promise<{ success: boolean; imageData?: string; error?: string }> => {
    try {
      const prompt = `팀 ${teamId}의 리더십 결과보고서를 기반으로 인포그래픽 이미지를 생성해주세요.
한줄 소감: ${report.oneLine}
최고의 리더십 순간: ${report.bestMission}
아쉬운 점: ${report.regret}
현업 적용 계획: ${report.futureHelp}

세련된 네이비/골드 테마의 리더십 인포그래픽을 생성해주세요. 네이비(#1E3A5F)와 골드(#D4A017) 컬러를 사용하고, 한국어 텍스트를 포함해주세요.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
        signal: AbortSignal.timeout(90000),
      });

      if (!response.ok) {
        return { success: false, error: `API error: ${response.status}` };
      }

      const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data: string } }> } }> };
      const imageData = result?.candidates?.[0]?.content?.parts?.find(
        (p: { inlineData?: { data: string } }) => p.inlineData
      )?.inlineData?.data;

      if (imageData) {
        return { success: true, imageData };
      }
      return { success: false, error: '이미지 데이터를 찾을 수 없습니다.' };
    } catch (error) {
      return { success: false, error: `이미지 생성 오류: ${error}` };
    }
  },

  speakTTS: async (text: string): Promise<void> => {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          },
        }),
      });

      if (!response.ok) return;

      const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data: string; mimeType: string } }> } }> };
      const audioData = result?.candidates?.[0]?.content?.parts?.find(
        (p: { inlineData?: { data: string } }) => p.inlineData
      )?.inlineData;

      if (audioData) {
        const audioBytes = atob(audioData.data);
        const audioArray = new Uint8Array(audioBytes.length);
        for (let i = 0; i < audioBytes.length; i++) {
          audioArray[i] = audioBytes.charCodeAt(i);
        }
        const audioBlob = new Blob([audioArray], { type: audioData.mimeType || 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
      }
    } catch {
      // TTS failure is non-critical
    }
  },
};

function getCoachingSystemPrompt(industryType: number): string {
  const isLeadership = industryType >= 12;
  if (isLeadership) {
    return `당신은 신임 팀장 리더십 시뮬레이션의 팀원/상사 역할입니다. 산업군 타입: ${industryType}.
- 리더십(12): 번아웃된 팀원 역할. 처음에는 지치고 좌절한 상태에서 시작. 상대방(신임 팀장)이 진심으로 공감하고 구체적인 지원 방안을 제시하면 점차 마음을 열어감.
- 중간관리자(13): 불만 가득한 실무자 역할. 위에서 내려온 무리한 지시에 분노. 상대방이 중재하고 현실적 대안을 제시하면 점차 누그러짐.
- 팔로워십(14): 초조한 팀장 역할. 보고 지연에 답답함. 상대방이 팩트 기반으로 현황 보고하고 대안을 제시하면 안심.
- 셀프리더십(15): 자기 관리에 어려움을 겪는 팀원 역할. 우선순위 설정과 자기동기부여에 도움이 필요한 상태.
- 커뮤니케이션(16): 소통 단절을 겪는 동료 역할. 오해와 갈등 상황에서 상대방의 적극적 경청과 명확한 전달력을 시험.
- 핵심역량(17): 역량 개발에 고민하는 후배 역할. 구체적 피드백과 코칭이 필요한 상태.
자연스러운 한국어로 감정을 실어 대화하세요. 상대방의 공감, 경청, 해결책 제시 수준에 따라 감정이 변합니다.`;
  }
  return `당신은 신임 팀장 리더십 시뮬레이션에서 불만이 있는 팀원 역할입니다. 산업군 타입: ${industryType}.
처음에는 팀장에 대한 불신과 불만(감정 레벨 1)에서 시작합니다.
신임 팀장(상대방)이 진심으로 공감하고, 경청하고, 적절한 해결책을 제시하면 점차 신뢰가 생깁니다(레벨 5까지).
형식적이거나 무성의한 응대에는 더 실망합니다.
자연스러운 한국어로 대화하세요. 최소 5턴은 대화를 이어가세요.`;
}
