/* VibeForge Browser AI — local in-browser inference via Transformers.js */
(function () {
  'use strict';

  const MODEL_ID = 'onnx-community/Qwen2.5-0.5B-Instruct';
  const LIBRARY_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
  let generator = null;
  let loading = null;
  let runtime = 'unknown';

  async function load(onProgress) {
    if (generator) return { ready: true, runtime, model: MODEL_ID };
    if (loading) return loading;

    loading = (async () => {
      if (typeof onProgress === 'function') onProgress({ status: 'library', message: '브라우저 AI 라이브러리를 불러오는 중…' });
      const transformers = await import(LIBRARY_URL);
      transformers.env.allowLocalModels = false;
      transformers.env.useBrowserCache = true;

      let useWebGPU = false;
      if (navigator.gpu && typeof navigator.gpu.requestAdapter === 'function') {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          useWebGPU = Boolean(adapter);
        } catch (_) {
          useWebGPU = false;
        }
      }

      const options = {
        dtype: 'q4',
        progress_callback: (event) => {
          if (typeof onProgress === 'function') onProgress(event);
        }
      };

      if (useWebGPU) {
        try {
          if (typeof onProgress === 'function') onProgress({ status: 'runtime', message: 'WebGPU 가속으로 모델을 준비하는 중…' });
          generator = await transformers.pipeline('text-generation', MODEL_ID, { ...options, device: 'webgpu' });
          runtime = 'WebGPU';
        } catch (webgpuError) {
          generator = null;
          if (typeof onProgress === 'function') onProgress({ status: 'fallback', message: 'WebGPU 초기화 실패. CPU(WASM)로 다시 시도합니다…' });
        }
      }

      if (!generator) {
        if (typeof onProgress === 'function') onProgress({ status: 'runtime', message: 'CPU(WASM)로 모델을 준비하는 중…' });
        generator = await transformers.pipeline('text-generation', MODEL_ID, options);
        runtime = 'WASM';
      }

      return { ready: true, runtime, model: MODEL_ID };
    })();

    try {
      return await loading;
    } catch (error) {
      generator = null;
      throw error;
    } finally {
      loading = null;
    }
  }

  function makeMessages(prompt, history) {
    const system = [
      '당신은 VibeForge에 내장된 한국어 범용 AI 도우미입니다.',
      '사용자가 일반적인 질문, 설명, 번역, 수학, 아이디어, 계획, 코딩 질문을 하면 해당 요청에 직접 답변하세요. 요청 유형을 지원하지 않는다고 거절하지 마세요.',
      '사용자가 웹사이트, 앱, 게임, 기능을 실제로 만들거나 기존 프로젝트 코드를 수정해 달라고 명시한 경우에만 파일을 생성하세요.',
      '파일 생성 작업은 반드시 다음 JSON 객체 하나만 출력하세요: {"message":"사용자에게 보여줄 설명","files":{"index.html":"전체 파일 내용","style.css":"전체 파일 내용","script.js":"전체 파일 내용"}}.',
      '파일 생성이 필요 없는 일반 대화는 자연스러운 일반 텍스트로 답변하세요.',
      '파일을 생성할 때는 요청에 필요한 파일만 포함하고 각 파일은 생략 없이 완전한 내용으로 작성하세요. 기존 프로젝트 파일을 수정할 때는 기존 기능을 유지하고 필요한 변경만 하세요.',
      '실행하지 않은 코드가 실행되었다고 말하지 마세요. 백엔드, 로그인 서버, 실시간 통신 등 실제 서버가 필요한 기능은 브라우저 데모만으로 완성되었다고 주장하지 말고 한계를 설명하세요.',
      '모르는 정보는 지어내지 말고 불확실하다고 말하세요. 답변은 명확하고 구체적으로 작성하세요.'
    ].join('\n');

    const recent = Array.isArray(history) ? history.slice(-10) : [];
    const messages = [{ role: 'system', content: system }];
    for (const item of recent) {
      if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') continue;
      messages.push({ role: item.role, content: item.content.slice(0, 5000) });
    }
    if (!recent.length || recent[recent.length - 1]?.content !== prompt) {
      messages.push({ role: 'user', content: prompt });
    }
    return messages;
  }

  async function generate(prompt, history, onProgress) {
    if (!generator) await load(onProgress);
    const messages = makeMessages(prompt, history);
    const output = await generator(messages, {
      max_new_tokens: 900,
      temperature: 0.35,
      do_sample: true,
      top_p: 0.9,
      repetition_penalty: 1.08,
      return_full_text: false
    });
    const first = Array.isArray(output) ? output[0] : output;
    let generated = first && first.generated_text !== undefined ? first.generated_text : first;
    if (Array.isArray(generated)) {
      const last = generated[generated.length - 1];
      generated = last && typeof last.content === 'string' ? last.content : JSON.stringify(last);
    } else if (generated && typeof generated === 'object' && typeof generated.content === 'string') {
      generated = generated.content;
    }
    return { text: String(generated || '').trim(), runtime, model: MODEL_ID };
  }

  function status() {
    return { ready: Boolean(generator), loading: Boolean(loading), runtime, model: MODEL_ID };
  }

  window.VibeForgeBrowserAI = { load, generate, status, MODEL_ID };
})();