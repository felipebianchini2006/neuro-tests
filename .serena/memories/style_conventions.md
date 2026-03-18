# Code Style and Conventions

## TypeScript
- Strict mode enabled
- Type hints on all function parameters and return values
- Use `interface` for contracts, `type` for unions/tuples

## File Organization
- Keep domain logic in `src/lib/domain/` (pure functions, zero dependencies)
- Keep content definitions in `src/lib/content/catalog.ts`
- Server logic in `src/lib/server/`, client in `src/lib/client/`
- Components in `src/components/` organized by feature (admin/, participant/, observer/, shared/)

## Naming
- Functions and variables: camelCase
- Types and interfaces: PascalCase
- Files: kebab-case for components, camelCase for utilities
- Constants: UPPER_SNAKE_CASE

## Testing
- Use Vitest for unit tests
- Tests co-located with source files (e.g., `cubes.ts` → `cubes.test.ts`)
- Use Testing Library for component tests

## Imports
- Use path aliases: `@/lib/`, `@/components/`, etc.
- Group imports: external, then aliases, then relative

## Session & Repository Pattern
- All session data flows through `SessionRepository` interface
- Implementations: `supabaseRepository` (Postgres) or `memoryRepository` (Map)
- Selected via `getSessionRepository()` at runtime based on env vars

## Catalog Pattern
- All test content (challenges, stories) defined in `src/lib/content/catalog.ts`
- Exports functions like `getCubeChallengeAt()`, `getSequenceStoryAt()`, etc.
- Teen variant functions follow pattern: `getCubeChallengeTeenAt()`, `validateCubeTeenAnswer()`
