# VibeForge — AI Vibe Coding Builder

A mobile-first browser workspace with a built-in offline rule-based project generator and an optional OpenAI-compatible chat-completions connection.

## Included

- File explorer and in-browser code editor
- Live HTML preview in a sandboxed iframe
- Preview error capture for JavaScript errors, unhandled promise rejections, and `console.error`
- AI repair workflow that sends the preview error and selected source file back to the model
- Built-in offline Local Engine that generates working starter projects without an API key\n- Local templates for todo apps, calculators, quizzes, reaction games, stores, dashboards, portfolios, and landing pages\n- Mobile-first generated layouts, theme toggle, and browser-local demo data\n- Optional AI chat that can generate or update multiple project files through a compatible provider
- Local browser autosave
- ZIP export (JSZip CDN; text-file fallback if unavailable)
- Responsive mobile layout
- Configurable API endpoint, model ID, temperature, and API key

## React + Vite projects

Use the **React/Vite** button to replace the current project with a starter containing `package.json`, Vite config, React entry point, app component, and CSS. Export the project as ZIP, then run `npm install` and `npm run dev` in a Node.js environment. The in-browser preview currently supports plain HTML/CSS/JS, not Vite bundling.

## Run

Open `index.html` in a modern browser, or publish this repository with GitHub Pages / Netlify.

## Use the built-in Local Engine\n\nNo API setup is required. When no external model is configured, the app uses `local-engine.js` to classify common project requests and generate a working multi-file starter. Try prompts such as `할 일 관리 앱 만들어줘`, `계산기 만들어줘`, or `반응속도 게임 만들어줘`. This is a deterministic rule-based generator, not a trained large language model: it does not understand arbitrary requests with ChatGPT-level flexibility. Its generated demo data is stored in the current browser only.\n\n## Connect an optional external AI model

Open **외부 AI 설정** and enter:

- **API base URL**: provider's OpenAI-compatible API base, without the trailing slash
- **Model ID**: exact model identifier supplied by the provider
- **API key**: key issued by the provider

The app calls:

```
POST {API_BASE_URL}/chat/completions
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

The provider must allow browser CORS requests. If it does not, use a server-side proxy and keep the API key on the server. Do not commit API keys to this repository.

## Important limitations

- The built-in Local Engine is deterministic and template/rule-based; it is not a general-purpose language model and cannot replace ChatGPT-level reasoning.\n- This is an MVP, not a full Bolt/Lovable/Cursor replacement.
- The browser sends the configured key directly to the selected provider. Avoid saving keys on shared devices.
- Provider quotas, pricing, and model availability are controlled by the provider. No unlimited free inference is promised.
- Generated code runs in a sandboxed iframe. This is a preview, not a secure server-side build/runtime environment.
- Projects are stored in the current browser's localStorage unless exported. Clearing browser data can erase them.
- React/Vite/Next.js project scaffolding and secure package installation/build execution are not included yet.

## Deploy

Enable GitHub Pages for the repository and select the default branch with `/(root)`, or connect the repository to a static host. The entry point is `index.html`.

## License

No license has been added yet. Add one before redistributing the project.
