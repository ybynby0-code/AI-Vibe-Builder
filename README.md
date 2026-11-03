# VibeForge — Browser AI Builder

VibeForge is a mobile-first browser workspace with an on-device language model. Chat and generation run locally in the browser after the model is downloaded and cached.

## Included

- Browser-local AI chat using Transformers.js
- Qwen2.5-0.5B-Instruct ONNX model from Hugging Face
- WebGPU acceleration when available, with a WASM fallback
- Model download progress and runtime status in the UI
- File explorer and in-browser code editor
- Sandboxed HTML/CSS/JavaScript preview
- Preview error capture for JavaScript errors, unhandled promise rejections, and console errors
- AI-generated project files applied to the current workspace
- Local browser autosave and chat history
- Undo and redo history
- ZIP export (JSZip CDN; text-file fallback if unavailable)
- React/Vite starter project scaffolding

## Browser AI

The runtime is in `browser-ai.js` and uses `@huggingface/transformers` 3.8.1 with the model `onnx-community/Qwen2.5-0.5B-Instruct`.

1. Open the GitHub Pages site over HTTPS.
2. Tap **AI 모델 불러오기**.
3. Keep the page open while the model files download. The initial download is roughly several hundred MB; the browser cache is used on later visits.
4. When the status says **모델 준비 완료**, ask a question or request a project.

The runtime tries WebGPU first and falls back to the default WASM backend if WebGPU is unavailable or initialization fails. Actual speed depends on the browser, GPU, available memory, and device thermal state.

## Important limitations

- This is a small 0.5B-parameter local model, not a ChatGPT-class model. It can answer general prompts, but reasoning, Korean fluency, factual accuracy, and long code generation are limited.
- Browser-local inference does not require an AI API key and does not send chat prompts to an AI inference server. The model and runtime library are downloaded from public hosting services.
- The model must be downloaded at least once. Clearing browser site data may remove its cache.
- A mobile browser may terminate a large model load when memory is low. Close other tabs and retry if loading fails.
- Generated front-end demos run in the local preview. Real multi-user chat, secure authentication, shared databases, and server-side services still require a backend.
- React/Vite projects are exported as files; this static preview does not run a Vite build.

## Development notes

- `index.html`: mobile-first IDE UI and project workspace.
- `browser-ai.js`: local Transformers.js inference runtime.
- `local-engine.js`: legacy template engine, retained in the repository but no longer used for chat or generation.

No AI API key is configured or required.
