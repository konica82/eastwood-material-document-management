# Hồ sơ nguyên liệu — Claude Code Project Memory

## Stack
Next.js (App Router) · TypeScript · Tailwind · shadcn/ui · TanStack Query · Zod · Lucide

## Absolute rules
- TypeScript only. No .jsx or .js files ever.
- No hardcoded colors, fonts, spacing, or radii in components. 
  All visual values use CSS custom properties from src/styles/tokens.css 
  or Tailwind classes that map to those properties.
- Every data call takes a plantId. No data fetching without plant scope.
- All data access through src/lib/repository/ interfaces only.
- Vietnamese labels and copy throughout the UI.
- shadcn/ui as the component base — extend, never rebuild.

## Key documents
- DESIGN.md — token contract (read every session)
- docs/Design_Brief.md — component behavior and layout
- docs/PRD_and_Design_Brief.md — module specs and architecture
- docs/Business_Rules.md — 13 computed fields to implement

## Build sequence
1. Token setup (src/styles/tokens.css + tailwind.config.ts)
2. Domain types (src/types/index.ts)
3. Repository interface (src/lib/repository/)
4. Convert mockups to .tsx with token references
5. App shell (Sidebar, Header, PlantContext)
6. Modules in order: Materials → Suppliers → Drivers → Cargo → Weighing → Photos → Completion → Plots → Dashboard