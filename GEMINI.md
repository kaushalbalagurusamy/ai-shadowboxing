# AI Coding Assistant Directives: AI Shadowboxing

This file contains repository-level instructions for any AI coding assistant or agent working within this codebase.

## 1. Context, Architecture & PRDs
- **Source of Truth:** All project context, architectural diagrams, and Phase-specific requirements (PRDs) are located in the `.docs/` directory.
- **Key Files:**
    - `.docs/architecture.md`: High-level system flow and Tavus-native stack details.
    - `.docs/hardening_roadmap.md`: Prioritized engineering hardening roadmap & execution journal.
    - `.docs/phase_1_prd.md`: Baseline sparring partner implementation (Completed).
    - `.docs/phase_2_prd.md`: Mentor synthesis and the "Zipper" distillation logic (Completed).
    - `.docs/product_requirements.md`: Overall project goals and high-value rubrics (EQ, IQ, Wealth, Physique).
- **Mandate:** Always read the relevant files in `.docs/` before proposing or implementing changes to ensure alignment with the established 2026 SOTA architecture.

## 2. Technical Stack & Styles
- **Framework:** Next.js (React) with TypeScript.
- **Client/Server Split:** Use a "thick client, thin secure server" model. Secure ephemeral token generation happens on the server; WebRTC media streams are handled directly by the client.
- **Code Style:** Strict TypeScript, functional components, and modern React hooks. Zero usage of `any` types.

## 3. Google Distinguished Engineer (L9+) Operational Directives
All engineering tasks must adhere to Google L9+ Distinguished Engineering standards:

1. **Pre-Implementation Failure Mode Analysis (FMA):** Before writing code for any feature or refactor, explicitly analyze 4 failure vectors:
    - *Upstream Failure:* Handling external API rate limits, timeouts, and 5xx errors gracefully with transparent recovery.
    - *Schema / Data Corruption:* Validating inputs strictly at system boundaries using schemas or types before domain processing.
    - *Concurrency & Race Conditions:* Guaranteeing idempotency for parallel webhook arrivals and async event streams.
    - *Resource Safety:* Enforcing zero-byte memory buffer protocols for streams and media transfers to prevent OOM errors.
2. **Hermeticity & Contract Rigor:**
    - Zero tolerance for ambient `any` types or dynamic untyped objects across API boundaries, stores, and hooks.
    - Explicit contract enforcement using native SDK response schemas (e.g. Gemini `responseSchema`) or validation schemas.
3. **Zero Silent Failures:**
    - Never catch and swallow exceptions with dummy returns or empty `console.error` blocks.
    - Error paths must classify failure severity, log structured context, and propagate errors or execute explicit fallback workflows.
4. **Time & Scale Invariance:**
    - Decouple external third-party SDK dependencies behind clean domain interfaces to isolate upstream API deprecations or signature shifts.

## 4. Google Fellow (L11+) Systems Performance Directives (Jeff Dean & Sanjay Ghemawat FAST Principles)
All system design choices must incorporate Abseil FAST performance principles distilled from Google L11+ Fellows (Jeff Dean & Sanjay Ghemawat):

1. **The Critical 3% Rule (Knuth Contextualized):**
   - Do not disregard performance during initial construction to avoid creating a "flat profile" where slowness is diffused everywhere. Choose the faster alternative whenever it does not compromise code readability.
2. **Back-of-the-Envelope Latency & Resource Estimation:**
   - Conduct order-of-magnitude estimations before code construction (L1/L2 cache vs RAM vs SSD vs Datacenter RTT). Eliminate inefficient candidates early without unnecessary prototyping.
3. **Bulk APIs over Granular Traversal:**
   - Avoid fine-grained per-item crossing across system, network, or DB boundaries. Design deep modules with bulk methods (`LookupMany`, `DeleteRefs`, `InitFrom`) to amortize locking, network, and IPC overhead.
4. **Memory Footprint & Allocation Minimization:**
   - Prefer contiguous array/vector storage over pointer-rich node structures to maximize cache hit rates.
   - Avoid per-request heap allocations; reuse pre-allocated zero-buffers, view types (`string_view`, `Span<T>`), or flat map representations.
   - Separate hot read-only fields from hot mutable fields in data structures to eliminate false sharing and cache line invalidation.
5. **Flat Profile Diagnostics:**
   - When CPU profiles lack single hotspots, aggregate processing into batch operations, replace complex regex with specialized string matchers, and eliminate heap allocations.

## 5. Autonomous (YOLO) Development Workflow
This project utilizes a high-velocity, autonomous development loop. You are expected to operate with minimal interruption while maintaining high safety and structural integrity.

1. **Branch-Per-Phase/Task:** Always create a new feature branch for each phase of a PRD or significant task (e.g., `feature/phase-2-hardening`).
2. **Atomic Commits:** Make frequent, highly specific commits. Each commit should represent a single logical step or milestone.
3. **Architectural Rationale:** Commit messages must explain *why* a change was made, focusing on the architectural intent, invariants preserved, and failure modes mitigated.
4. **Autonomous Completion:**
    - **No Review Handoff:** Do not pause for local review or manual approval unless a change is fundamentally ambiguous.
    - **Push & Deploy:** Once a task or phase is complete and verified locally, autonomously:
        - Merge the branch into `main`.
        - Push the updated `main` to the remote repository.
        - Trigger a Vercel deployment (`npx vercel deploy --prod --yes`) to sync the live environment.
5. **Validation is Mandatory:** Every task must be verified via local execution, type checking (`npx tsc --noEmit`), build checks, or automated tests before merging and deploying.

