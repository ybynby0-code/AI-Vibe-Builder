/* VibeForge Gemini API runtime — no local model download */
(function () {
  'use strict';
  const STORAGE_KEY = 'vibeforge-gemini-api-key';
  const MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.1-flash-lite'];
  const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/';
  let activeModel = MODELS[0];

  function getKey() {
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch (_) { return ''; }
  }
  function configure(key) {
    const clean = String(key || '').trim();
    if (clean) localStorage.setItem(STORAGE_KEY, clean);
    else localStorage.removeItem(STORAGE_KEY);
    return status();
  }
  function status() {
    return { configured: Boolean(getKey()), provider: 'Google Gemini', model: activeModel, fallbackModels: MODELS.slice(1) };
  }
  const SYSTEM = [
    '당신은 VibeForge의 한국어 범용 AI이자 전문 소프트웨어 개발 도우미입니다.',
    '일반 질문, 설명, 번역, 수학, 분석, 아이디어, 계획, 코딩 질문에 직접 답변하세요.',
    '사용자가 웹사이트, 앱, 게임, 기능을 실제로 만들거나 프로젝트 코드를 수정해 달라고 요청한 경우에만 파일을 생성하세요.',
    '파일 생성 작업에서는 반드시 JSON 객체 하나만 출력하세요. 형식: {"message":"설명","files":{"index.html":"전체 내용","style.css":"전체 내용","script.js":"전체 내용"}}.',
    '일반 대화는 자연스러운 한국어 텍스트로 답변하세요.',
    '코드는 생략 없이 완전하게 작성하고 기존 기능을 유지하세요. 요청에 필요한 파일만 반환하세요.',
    '실제로 실행하지 않은 코드가 실행되었다고 말하지 마세요. 서버, 인증, 데이터베이스, 실시간 기능은 실제 백엔드 없이 완성됐다고 주장하지 마세요.',
    '모르는 사실은 지어내지 말고 불확실하다고 설명하세요.'
  ].join('\n');

  async function generate(prompt, history) {
    const key = getKey();
    if (!key) throw new Error('Gemini API 키가 설정되지 않았습니다. 먼저 API 설정을 열어 키를 저장해 주세요.');
    const previous = Array.isArray(history) ? history.slice(-12) : [];
    const contents = previous
      .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
      .map(item => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content.slice(0, 12000) }]
      }));
    if (!contents.length || contents[contents.length - 1].role !== 'user' ||
        contents[contents.length - 1].parts[0].text !== prompt) {
      contents.push({ role: 'user', parts: [{ text: prompt }] });
    }

    let lastError = null;
    for (const model of MODELS) {
      activeModel = model;
      for (let attempt = 0; attempt < 2; attempt++) {
        let response;
        try {
          response = await fetch(ENDPOINT + model + ':generateContent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: SYSTEM }] },
              contents,
              generationConfig: { temperature: 0.45, topP: 0.9, maxOutputTokens: 8192 }
            })
          });
        } catch (networkError) {
          lastError = new Error('네트워크 연결 실패: ' + (networkError && networkError.message ? networkError.message : String(networkError)));
          if (attempt === 0) { await new Promise(resolve => setTimeout(resolve, 1200)); continue; }
          break;
        }

        let data;
        try { data = await response.json(); } catch (_) { data = {}; }
        if (response.ok) {
          const parts = data && data.candidates && data.candidates[0] &&
            data.candidates[0].content && data.candidates[0].content.parts;
          const answer = Array.isArray(parts) ? parts.map(part => part.text || '').join('') : '';
          if (!answer.trim()) {
            const reason = data && data.candidates && data.candidates[0] && data.candidates[0].finishReason;
            throw new Error('AI가 빈 응답을 반환했습니다.' + (reason ? ' 종료 사유: ' + reason : ''));
          }
          return { text: answer.trim(), provider: 'Google Gemini', model };
        }

        const detail = data && data.error && data.error.message ? data.error.message : 'HTTP ' + response.status;
        const status = response.status;
        const temporary = status === 500 || status === 502 || status === 503 || status === 504 ||
          (status === 429 && /capacity|high demand|temporar|overload/i.test(detail));
        lastError = new Error('HTTP ' + status + ': ' + detail);
        if (!temporary) {
          if (status === 429) throw new Error('Gemini API 사용 한도에 도달했습니다. Google AI Studio에서 할당량을 확인해 주세요. (' + detail + ')');
          if (status === 400 || status === 403) throw new Error('Gemini API 키 또는 요청 설정을 확인해 주세요. (' + detail + ')');
          throw lastError;
        }
        if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 1400));
      }
    }
    throw new Error('기본 모델과 대체 모델 모두 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해 주세요. 마지막 오류: ' +
      (lastError && lastError.message ? lastError.message : '알 수 없는 서버 오류'));
  }

  window.VibeForgeAPI = { configure, status, generate, MODEL };
})();