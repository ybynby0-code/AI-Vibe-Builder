# NEON STRIKE — Tactical Lab

A mobile-first, browser-based, original 3D tactical FPS prototype built with Three.js.

## Current build
- First-person 3D arena with a stylized urban combat map.
- Custom GLSL toon/cel shading with stepped lighting and rim lighting for characters and weapon models.
- Procedurally assembled environment with well over 90 mesh components.
- Stylized articulated agent models with animated legs and arms.
- Enemy AI that advances, tracks the player, and attacks at range.
- Wave elimination, headshots, armor, health, ammo, reload, weapon switching, dash, jump, kill feed, hit markers, and round results.
- Mobile touch controls: virtual movement stick, drag-to-aim zone, hold-to-fire, reload, jump, dash, weapon switch, and pause.
- Desktop controls: WASD, mouse look, click fire, R reload, Space jump, Q dash, Esc pause.
- Responsive menu, briefing, control manual, pause screen, and result screen.
- Mobile fullscreen and landscape-orientation request when the browser allows it.
- No Unity and no external game-builder plugins. Runs as a static GitHub Pages site.

## Controls
Mobile: left stick to move; drag the right side to aim; hold FIRE to shoot.
Desktop: WASD to move; mouse to aim; left click to shoot.

## Run
Open /game/ on the deployed GitHub Pages site. The Three.js module is loaded from jsDelivr, so an internet connection is required.

## Prototype limitations
This is a single-player gameplay test, not online multiplayer or a production Valorant clone. Models are generated procedurally at runtime; the 90+ count refers to scene mesh components, not 90 individually authored high-poly character assets.
