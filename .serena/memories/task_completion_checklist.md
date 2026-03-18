# Task Completion Checklist

Always perform these steps when completing a task:

1. **Run Tests**: `npm test` — ensure all tests pass
2. **Lint**: `npm run lint` — fix any linting issues
3. **Verify Changes**: Review git diff to ensure changes are intentional
4. **Commit**: Use `git add <files>` and `git commit -m "feat: ..."` following conventional commits
5. **Type Safety**: Ensure TypeScript compiles without errors
6. **Import Cleanup**: Remove unused imports, add necessary ones

## Conventional Commits
- `feat:` - new feature
- `fix:` - bug fix
- `refactor:` - code restructuring (no functional change)
- `test:` - tests only
- `docs:` - documentation
- `chore:` - build, dependencies, etc.

Example: `git commit -m "feat: add cubes-teen session support"`
