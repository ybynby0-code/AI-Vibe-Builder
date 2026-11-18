# IMPERIUM: WORLD ORDER

Mobile-first grand strategy browser game. The first playable slice includes:

- Supabase email/password authentication
- World creation and joining
- 8 generated nations and 48 generated provinces per world
- SVG-like canvas hex-map visualization with selectable provinces
- National treasury, manpower, stability, prestige and province ownership
- Build, recruit, research, tax, trade and diplomacy orders
- Host-controlled turn resolution with server-side validation
- Nation list, event feed and world chat
- Supabase Realtime subscriptions and Presence
- MCP-compatible Streamable HTTP endpoint (Edge Function)

## Deployment
GitHub Pages serves the static client from `/imperium/`.
The backend uses the existing NEXUS Supabase project with isolated `imperium_*` tables and RLS. The client uses only the publishable key; no service-role key is exposed.

## MCP endpoint
After deploying the Edge Function, use:
`https://wqhudsyehjfdtzhstsnf.supabase.co/functions/v1/imperium-mcp`
Authenticate requests with a Supabase user access token. Supported MCP tools are listed by `tools/list`.

## Honest implementation boundary
This is the initial playable foundation, not a finished 10,000-feature production game. AI diplomacy, combat resolution, pathfinding, full economic chains, fog-of-war enforcement, and robust simultaneous-turn conflict resolution remain future systems.

## MCP connection
Endpoint:
`https://wqhudsyehjfdtzhstsnf.supabase.co/functions/v1/imperium-mcp`

The endpoint implements JSON-RPC MCP methods `initialize`, `tools/list`, and `tools/call`. It requires a valid Supabase user access token as a Bearer token; it does not accept the publishable key as user authentication.

Available tools:
- `get_world_overview`
- `list_provinces`
- `issue_order`
- `send_world_chat`
- `respond_to_treaty`
- `advance_turn` (host only)

Never place a Supabase service-role key in a browser or MCP client configuration.
