# Build-loop profile: ai-shadowboxing (DRAFT, awaiting owner confirmation)

## Source requirements (verbatim, stage 9 re-derives from these)
- `.docs/product_requirements.md` (core loop P0 -> Zipper -> M1 -> P1, four rubrics)
- `.docs/phase_3_prd.md` (status: proposed; Dynamic Interest Loop / Governor)
- `AGENT.md` architectural constraints (sub-500ms, no mid-stream RAG, thick client / thin server, no media proxy)
- OPEN: is there an external brief beyond these? [owner to confirm]

## Requirements ledger
- Path: `.docs/requirements_ledger.md` (does not exist; first slice builds it line by line from the sources above)

## ADRs / specs / tests
- ADRs: `docs/adr/NNNN-title.md` (0001-0007 exist). Proposals: `docs/proposals/`
- Specs and PRDs: `.docs/`
- Unit/integration tests: `src/**/__tests__/`, `src/lib/schemas.test.ts` (Vitest + MSW). E2E: `e2e/` (Playwright)
- Eval and rubric data: `src/lib/rubrics.csv`, `rubrics.csv`

## Commands
- Typecheck + unit: `npx tsc --noEmit && npx vitest run`
- Full: `npm test` (adds Playwright)
- Build: `npm run build`

## Reviewer
- `implementation-review` subagent; adversarial, told to hunt passes earned for the wrong reason.

## Lecture/course corpus
- None named for this project. [owner to confirm]

## Git and release
- Branch per task (`feature/...`), never commit to `main`. Atomic commits.
- AGENT.md: do not push or open a PR at task end; pause for local review; merge to `main` locally only after explicit approval; then push `main` and deploy to Vercel.
- OPEN: AGENT.md vs global "push without asking" [owner to resolve]

## Cost and safety
- Live Tavus calls burn credits: tests are hermetic (MSW) unless the owner approves a live check.
- `.env.local` holds secrets: never read into output, never commit.

## Hygiene
- Disk: warn below 15 GB free. Do not leave `.next` or `test-results` bloat; share one build dir across worktrees.
