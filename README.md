# VibeForge — Local Engine Builder

VibeForge is a mobile-first browser workspace that uses its built-in local rule-based engine only. It does not connect to external AI providers and does not require an API key.

## Included

- File explorer and in-browser code editor
- Sandboxed HTML/CSS/JavaScript preview
- Preview error capture for JavaScript errors, unhandled promise rejections, and console errors
- Local engine project generation for todo apps, calculators, quizzes, reaction games, store demos, dashboards, portfolios, and landing pages
- Multi-file project updates from supported local rules
- Mobile-first generated layouts and browser-local demo data
- Local browser autosave
- Undo and redo history
- ZIP export (JSZip CDN; text-file fallback if unavailable)
- React/Vite starter project scaffolding

## Local engine

All prompts are processed by `local-engine.js`. External API settings and network-based model calls have been removed.

The current engine is deterministic and rule/template-based, not a trained large language model. It recognizes supported request patterns and generates corresponding project files. It cannot yet understand arbitrary requests or reason with ChatGPT-level flexibility. Its capabilities can be expanded by implementing more intent handlers, code transformations, project analysis, and validation rules.

Try prompts such as:

- `할 일 관리 앱 만들어줘`
- `계산기 만들어줘`
- `반응속도 게임 만들어줘`

## React + Vite projects

Use the **React/Vite** button to create a starter containing `package.json`, Vite config, React entry point, app component, and CSS. Export the project as ZIP, then run `npm install` and `npm run dev` in a Node.js environment. The in-browser preview currently supports plain HTML/CSS/JS, not Vite bundling.

## Run

Open `index.html` in a modern browser, or publish this repository with GitHub Pages / another static host.

## Important limitations

- The local engine is not a general-purpose trained language model.
- This is an MVP, not a full Bolt/Lovable/Cursor replacement.
- Generated code runs in a sandboxed iframe, not a secure server-side runtime.
- Projects are stored in the current browser's localStorage unless exported. Clearing browser data can erase them.
- React/Vite scaffolding is provided, but package installation and build execution are not performed in the browser.

## Deploy

Enable GitHub Pages for the repository and select the default branch with `/(root)`. The entry point is `index.html`.

## License

No license has been added yet. Add one before redistributing the project.
