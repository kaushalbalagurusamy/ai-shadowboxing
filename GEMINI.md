# AI Coding Assistant Directives: AI Shadowboxing

This file contains repository-level instructions for any AI coding assistant or agent working within this codebase.

## 1. Context, Architecture & PRDs
- **Source of Truth:** All project context, architectural diagrams, and Phase-specific requirements (PRDs) are located in the `.docs/` directory.
- **Key Files:**
    - `.docs/architecture.md`: High-level system flow and Tavus-native stack details.
    - `.docs/phase_1_prd.md`: Baseline sparring partner implementation (Completed).
    - `.docs/phase_2_prd.md`: Mentor synthesis and the "Zipper" distillation logic (Completed).
    - `.docs/product_requirements.md`: Overall project goals and high-value rubrics (EQ, IQ, Wealth, Physique).
- **Mandate:** Always read the relevant files in `.docs/` before proposing or implementing changes to ensure alignment with the established 2026 SOTA architecture.

## 2. Technical Stack & Styles
- **Framework:** Next.js (React) with TypeScript.
- **Client/Server Split:** Use a "thick client, thin secure server" model. Secure ephemeral token generation happens on the server; WebRTC media streams are handled directly by the client.
- **Code Style:** Strict TypeScript, functional components, and modern React hooks.

## 3. Autonomous (YOLO) Development Workflow
This project utilizes a high-velocity, autonomous development loop. You are expected to operate with minimal interruption while maintaining high safety and structural integrity.

1. **Branch-Per-Phase/Task:** Always create a new feature branch for each phase of a PRD or significant task (e.g., `feature/phase-3-refactoring`).
2. **Atomic Commits:** Make frequent, highly specific commits. Each commit should represent a single logical step or milestone.
3. **Architectural Rationale:** Commit messages must explain *why* a change was made, focusing on the architectural intent.
4. **Autonomous Completion:**
    - **No Review Handoff:** Do not pause for local review or manual approval unless a change is fundamentally ambiguous.
    - **Push & Deploy:** Once a task or phase is complete and verified locally, autonomously:
        - Merge the branch into `main`.
        - Push the updated `main` to the remote repository.
        - Trigger a Vercel deployment (`npx vercel deploy --prod --yes`) to sync the live environment.
5. **Validation is Mandatory:** Every task must be verified via local execution, build checks, or automated tests before merging and deploying.
