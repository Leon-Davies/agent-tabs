# Agent Tabs

Agent Tabs is a Chrome extension for visually organizing browser tabs used as long-running AI or agent workspaces.

The project is intentionally generic: colours and future status indicators are not tied to any particular project, provider, or workflow.

## Current development target

The first milestone provides manual per-tab colour assignment from the Chrome tab-strip context menu by using native Chrome tab groups.

Planned follow-up work will add optional live agent-state indicators (for example working, response ready, viewed, or error) behind narrowly scoped site permissions.

## Development principles

- Manifest V3
- No framework or build step for the initial implementation
- No backend
- Minimal browser permissions
- No analytics or remote data collection
- Generic project/agent semantics

See `docs/architecture.md` on the development branch for implementation details.
