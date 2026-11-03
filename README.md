# VibeForge — AI Vibe Coding Builder

A mobile-first browser workspace for creating and editing small web projects with an OpenAI-compatible chat-completions model.

## Included

- File explorer and in-browser code editor
- Live HTML preview in a sandboxed iframe
- Preview error capture for JavaScript errors, unhandled promise rejections, and `console.error`
- AI repair workflow that sends the preview error and selected source file back to the model
- AI chat that can generate or update multiple project files
- Local browser autosave
- ZIP export (JSZip CDN; text-file fallback if unavailable)
- Responsive mobile layout
- Configurable API endpoint, model ID, temperature, and API key

## React + Vite projects

Use the **React/Vite** button to replace the current project with a starter containing `package.json`, Vite config, React entry point, app component, and CSS. Export the project as ZIP, then run `npm install` and `npm run dev` in a Node.js environment. The in-browser preview currently supports plain HTML/CSS/JS, not Vite bundling.

## Run

Open `index.html` in a modern browser, or publish this repository with GitHub Pages / Netlify.

## Connect an AI model

Open **AI 연결 설정** and enter:

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

- This is an MVP, not a full Bolt/Lovable/Cursor replacement.
- The browser sends the configured key directly to the selected provider. Avoid saving keys on shared devices.
- Provider quotas, pricing, and model availability are controlled by the provider. No unlimited free inference is promised.
- Generated code runs in a sandboxed iframe. This is a preview, not a secure server-side build/runtime environment.
- Projects are stored in the current browser's localStorage unless exported. Clearing browser data can erase them.
- React/Vite/Next.js project scaffolding and secure package installation/build execution are not included yet.

## Deploy

Enable GitHub Pages for the repository and select the default branch with `/(root)`, or connect the repository to a static host. The entry point is `index.html`.

## License

No license has been added yet. Add one before redistributing the project.
