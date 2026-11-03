# VibeForge — AI Builder

VibeForge is a mobile-first browser workspace with a hosted Gemini API assistant. It does not download a language model to the device.

## Included

- Google Gemini API chat and code generation
- API key entry in the app; the key is stored in this browser's local storage
- File explorer and in-browser code editor
- Sandboxed HTML/CSS/JavaScript preview
- Preview error capture for JavaScript errors, unhandled promise rejections, and console errors
- AI-generated project files applied to the current workspace
- Local browser autosave and chat history
- Undo and redo history
- ZIP export (JSZip CDN; text-file fallback if unavailable)
- React/Vite starter project scaffolding

## Configure Gemini

1. Create an API key in [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Open VibeForge and tap **API 설정**.
3. Paste the key and save it.
4. Ask a question or request a project.

The current runtime calls the Gemini API model `gemini-3.8-flash`. Google provides a free tier for eligible models, but requests and rate limits are not unlimited and may change. Check the usage and limits shown in Google AI Studio.

## Privacy and key security

- The language model runs on Google's servers. Prompts and conversation context are sent to the Gemini API.
- The API key is stored in this browser's local storage and is not committed to this GitHub repository.
- A key used directly in a public browser app can be inspected by the person using that browser. This setup is intended for personal use, not as a secure shared public service. A production multi-user app should call Gemini through a server-side proxy and keep the key on the server.
- Google's free-tier data-use terms may differ from paid-tier terms. Do not send passwords, personal secrets, or sensitive information.

## Important limitations

- Free API use has provider-defined rate and token limits; it is not unlimited.
- If the quota is exhausted, wait for the limit reset or use another configured provider.
- Real multi-user chat, secure authentication, shared databases, and server-side services still require a backend.
- React/Vite projects are exported as files; this static preview does not run a Vite build.

## Development notes

- `index.html`: mobile-first IDE UI and project workspace.
- `api-ai.js`: Gemini API runtime.
- `browser-ai.js`: legacy browser-local inference runtime, no longer loaded by the app.
- `local-engine.js`: legacy template engine, no longer used for chat or generation.


## VibeForge Studio and project-aware AI update (v2.2.0)

Gemini now uses Gemini 3.8 Flash as the primary model, with Gemini 3.6 Flash and Gemini 3.1 Flash-Lite as fallbacks. For project-edit requests, the current project files are included as context and the model returns structured JSON containing complete contents for changed files.

- Refined dark workspace styling, responsive layout refinements, and optional light theme.
- File search and quick creation buttons for HTML, CSS, and JavaScript files.
- Editor toolbar: copy current file, download current file, find/replace, indentation cleanup, and font-size controls.
- Command palette with `Ctrl/⌘ + K` for common editor and project actions.
- Keyboard shortcuts: save (`Ctrl/⌘ + S`), find/replace (`Ctrl/⌘ + F`), copy (`Ctrl/⌘ + Shift + C`), and editor font sizing.
- Live editor statistics for active file, line count, and word count.
- Quick file rename, JSON formatting, and theme preference persistence.
- AI file updates are merged into the existing workspace instead of replacing unrelated files. The editor selects an actually changed file after applying the response.
- Invalid AI file responses are rejected without changing project files. This prevents a natural-language reply from being mistaken for a successful file update.
- The Studio UI is loaded as a separate script and stylesheet. Project starter HTML no longer injects the editor's own UI script.

These are browser-local workspace tools. They do not add a cloud terminal, Node.js runtime, server-side execution, multi-user collaboration, or unlimited AI inference. Gemini API availability and quotas remain controlled by Google.
