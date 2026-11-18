# NEON STRIKE — Tactical FPS Field Test

A browser-based, original-IP, stylized 3D tactical FPS prototype built with Three.js. No game engine installation or build step is required.

## Run
Open the GitHub Pages path: `/AI-Vibe-Builder/game/`.
The page loads Three.js r180 as an ES module from jsDelivr. A WebGL-capable browser and an internet connection are required.

## Controls
### Touch
- Left virtual stick: move
- Drag the right side of the screen: aim
- FIRE: hold to fire
- Reload, jump, dash and weapon-switch buttons: perform the named action
- Pause button: pause the match

### Keyboard and mouse
- WASD: move
- Mouse: aim (click the canvas to lock pointer)
- Left mouse: fire
- R: reload
- Space: jump
- Q: dash
- 1: switch weapon
- Escape: pause/resume

## Systems
- Three.js 3D arena with more than 90 generated environment mesh instances
- Custom GLSL toon/cel lighting with quantized diffuse bands and rim lighting
- Procedurally assembled stylized operator characters with animated legs
- First-person weapon viewmodel, two weapon profiles, ammo and reload
- Raycast hits, headshot multiplier, hit confirmation and elimination feed
- Enemy wave spawning, basic pursuit/attack behavior, armor and health
- Mobile pointer-event controls, safe-area spacing and responsive HUD
- Training mode and round-result screen

## Scope and limitations
This is a single-player technical field-test prototype, not a finished commercial game or a networked Valorant clone. The 90+ count refers to generated mesh instances, not 90 unique high-detail authored model files. Multiplayer, objective planting, agent abilities, production animation rigs, and external art assets are not implemented.
