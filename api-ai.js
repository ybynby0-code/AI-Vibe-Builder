/* VibeForge Gemini runtime — project-aware file generation */
(function () {
  'use strict';

  const STORAGE_KEY = 'vibeforge-gemini-api-key';
  const MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash'];
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
    '당신은 VibeForge 안에서 실제 프로젝트를 수정하는 시니어 소프트웨어 엔지니어입니다.',
    '항상 한국어로 답변하고, 사용자의 기존 프로젝트 구조와 기술 스택을 우선 존중합니다.',
    '사용자 메시지에 [VIBEFORGE_PROJECT_CONTEXT]가 포함되어 있으면 현재 파일을 실제로 읽은 것으로 간주하고 그 내용을 기준으로 작업하세요.',
    '프로젝트 작업이면 반드시 JSON 객체 하나만 출력합니다. Markdown 코드 펜스나 JSON 바깥의 설명은 절대 출력하지 않습니다.',
    '프로젝트 작업 JSON 형식은 {"message":"수정 내용 요약","files":{"상대경로/파일명":"해당 파일의 완전한 새 내용"}} 입니다.',
    'files에는 실제로 생성하거나 수정한 파일만 포함합니다. 수정하지 않은 파일은 절대 반환하지 않습니다.',
    '기존 파일을 수정할 때는 기존 기능과 스타일을 유지하면서 요청한 부분만 변경합니다. 파일을 통째로 새로 작성해야 할 이유가 없다면 기존 코드를 삭제하거나 단순 예제로 축소하지 않습니다.',
    '파일 내용은 생략 없이 완전하게 작성합니다. TODO, 생략 표시, 의사 코드, 미구현 함수, 가짜 버튼을 넣지 않습니다.',
    '여러 파일이 함께 작동하도록 import, 경로, 함수 이름, CSS 선택자, 이벤트 연결을 서로 일치시킵니다.',
    '새 파일을 만들 때는 현재 프로젝트의 폴더 구조와 네이밍 규칙을 따릅니다. 이미 존재하는 파일을 중복 생성하지 않습니다.',
    '요청에 필요한 정보가 프로젝트에 없으면 임의의 API 키, 서버 주소, DB 스키마, 외부 서비스 기능을 지어내지 말고 필요한 설정값을 명확한 placeholder로 둡니다.',
    '실제로 실행하거나 테스트하지 않았다면 실행·테스트했다고 말하지 않습니다. 백엔드나 Node 런타임이 없는 브라우저 미리보기에서 서버 기능이 동작한다고 주장하지 않습니다.',
    '일반 질문, 설명, 번역, 아이디어 상담에는 파일 JSON을 만들지 말고 자연스러운 한국어 텍스트로 답합니다.',
    '웹사이트나 앱을 새로 만들거나 UI를 크게 개선할 때는 기본 템플릿처럼 보이는 단순 카드와 보라색 그라데이션을 남발하지 않습니다. 목적에 맞는 독자적인 시각 방향, 명확한 타이포그래피 위계, 여백, 정렬, 색상 체계, 실제 콘텐츠를 설계합니다.',
    '전문적인 결과물을 요구하면 첫 화면만 꾸미지 말고 전체 화면 구조, 주요 상태, 모바일 레이아웃, 빈 상태, 로딩 상태, 오류 상태까지 일관되게 구현합니다.',
    '버튼과 메뉴는 실제 동작을 연결합니다. 동작하지 않는 가짜 기능, 임시 문구, 장식용 컨트롤, 의미 없는 숫자와 데이터는 만들지 않습니다.',
    '기존 프로젝트 개선 요청에서는 먼저 현재 코드의 구조와 이미 구현된 기능을 파악하고, 요청과 직접 관련된 부분을 수정합니다. 작동 중인 기능을 임의로 제거하거나 전체 프로젝트를 초보자용 예제로 교체하지 않습니다.',
    '코드 생성 시 파일 간 연결, import/export, 이벤트 처리, 반응형 동작, 접근성, 오류 처리를 함께 확인합니다. 요구사항을 충족하지 못한 부분은 완료했다고 주장하지 않습니다.',
    '프로젝트 작업의 경우 파일 변경이 필요 없으면 files를 빈 객체로 하고 그 이유를 message에 씁니다.'
  ].join('\n');

  function isProjectTask(prompt) {
    return /(만들어|제작|구현|개발|코딩|코드|파일|프로젝트|웹사이트|사이트|페이지|앱\b|게임|컴포넌트|기능\s*(추가|수정|삭제|구현)|추가해|수정해|고쳐|수정\s*부탁|오류\s*수정|버그|디자인\s*적용|연결해|작동하게|빌드해|create|build|implement|code|coding|refactor|debug|fix this|modify|add feature|website|web app|game)/i.test(String(prompt || ''));
  }

  function buildProjectContext(project) {
    if (!project || !project.files || typeof project.files !== 'object') return '';
    const files = project.files;
    const names = Object.keys(files);
    const active = project.active && Object.prototype.hasOwnProperty.call(files, project.active) ? project.active : names[0];
    const ordered = active ? [active].concat(names.filter(name => name !== active)) : names;
    const selected = [];
    let total = 0;
    for (const name of ordered) {
      if (selected.length >= 12 || typeof files[name] !== 'string') continue;
      const content = files[name];
      const allowance = name === active ? 16000 : 2800;
      const clipped = content.length > allowance ? content.slice(0, allowance) + '\n[파일 내용 일부 생략: 전체 파일을 수정할 때는 제공된 부분을 기준으로 안전하게 변경하세요.]' : content;
      if (total + clipped.length > 32000 && selected.length > 0) continue;
      selected.push({ path: name, content: clipped });
      total += clipped.length;
    }
    return '\n\n[VIBEFORGE_PROJECT_CONTEXT]\n' +
      '현재 선택 파일: ' + (active || '(없음)') + '\n' +
      '프로젝트 파일 목록: ' + names.join(', ') + '\n' +
      '아래는 현재 브라우저 작업공간에 저장된 실제 파일 내용입니다. 변경 파일은 이 내용과 일치하도록 작성하세요.\n' +
      selected.map(file => '\n--- FILE: ' + file.path + ' ---\n' + file.content).join('\n') +
      '\n[/VIBEFORGE_PROJECT_CONTEXT]';
  }

  async function generate(prompt, history, project) {
    const key = getKey();
    if (!key) throw new Error('Gemini API 키가 설정되지 않았습니다. 먼저 API 설정을 열어 키를 저장해 주세요.');

    const projectTask = isProjectTask(prompt);
    const previous = Array.isArray(history) ? history.slice(-6) : [];
    const contents = previous
      .filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
      .map(item => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content.slice(0, item.role === 'user' ? 1800 : 1200) }]
      }));

    const latestText = String(prompt || '') + (projectTask ? buildProjectContext(project) : '');
    if (!contents.length || contents[contents.length - 1].role !== 'user') {
      contents.push({ role: 'user', parts: [{ text: latestText }] });
    } else {
      contents[contents.length - 1].parts = [{ text: latestText }];
    }

    let lastError = null;
    for (const model of MODELS) {
      activeModel = model;
      let response;
      try {
        const generationConfig = {
          maxOutputTokens: 8192,
          thinkingConfig: { thinkingLevel: projectTask ? 'medium' : 'low' }
        };
        if (projectTask) generationConfig.responseMimeType = 'application/json';
        response = await fetch(ENDPOINT + model + ':generateContent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM }] },
            contents,
            generationConfig
          })
        });
      } catch (networkError) {
        lastError = new Error('네트워크 연결 실패: ' + (networkError && networkError.message ? networkError.message : String(networkError)));
        break;
      }

      let data;
      try { data = await response.json(); } catch (_) { data = {}; }
      if (response.ok) {
        const candidate = data && data.candidates && data.candidates[0];
        const parts = candidate && candidate.content && candidate.content.parts;
        const answer = Array.isArray(parts) ? parts.map(part => part.text || '').join('') : '';
        if (!answer.trim()) {
          const reason = candidate && candidate.finishReason;
          throw new Error('AI가 빈 응답을 반환했습니다.' + (reason ? ' 종료 사유: ' + reason : ''));
        }
        return { text: answer.trim(), provider: 'Google Gemini', model, mode: projectTask ? 'project' : 'chat' };
      }

      const detail = data && data.error && data.error.message ? data.error.message : 'HTTP ' + response.status;
      const statusCode = response.status;
      const temporary = statusCode === 500 || statusCode === 502 || statusCode === 503 || statusCode === 504 ||
        (statusCode === 429 && /capacity|high demand|temporar|overload/i.test(detail));
      lastError = new Error('HTTP ' + statusCode + ': ' + detail);
      if (!temporary) {
        if (statusCode === 429) throw new Error('Gemini API 사용 한도에 도달했습니다. Google AI Studio에서 할당량을 확인해 주세요. (' + detail + ')');
        if (statusCode === 400 || statusCode === 403) throw new Error('Gemini API 키 또는 요청 설정을 확인해 주세요. (' + detail + ')');
        throw lastError;
      }
    }
    throw new Error('Gemini 기본 모델과 빠른 대체 모델이 응답하지 않습니다. 잠시 후 다시 시도해 주세요. 마지막 오류: ' +
      (lastError && lastError.message ? lastError.message : '알 수 없는 서버 오류'));
  }

  window.VibeForgeAPI = { configure, status, generate, MODELS: MODELS.slice() };
})();