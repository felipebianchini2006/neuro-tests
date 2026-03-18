# Development Commands

## Running the App
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm start            # Run production build
```

## Testing
```bash
npm test             # Run all tests once
npm run test:watch   # Run tests in watch mode (auto-rerun on changes)
npx vitest run src/lib/domain/cubes.test.ts  # Run single test file
```

## Code Quality
```bash
npm run lint         # Lint the codebase with ESLint
```

## Asset Management (for client-provided assets)
```bash
npm run sync:sequence-assets   # Sync sequence images, regenerate manifest
npm run sync:cube-assets       # Sync cube images
```

## Git Workflow
```bash
git status           # Check changes
git add <files>      # Stage changes
git commit -m "message"  # Commit
git push             # Push to remote
```
