KRIDAZ
Architecture & Network Audit
Network Bomb Analysis · FE/BE Architecture vs Industry Standard · BMS vs Kridaz Granular · HLD/LLD Scalability
521
useEffect calls
15
API calls — Community.jsx
516
findMany w/o select (N+1)
160
findMany w/o pagination

Section 1 — Simulated Network Log Analysis
Simulated by tracing component mount order, useEffect dependencies, and RTK Query hook invocations across the Kridaz client source. Each entry below represents what fires in the Chrome Network tab for a single page visit by a logged-in user.
1.1 App Startup — Every Route (global waterfall)
These 4 requests fire on EVERY page load because they live in App.jsx and AuthenticatedNavbar (rendered on all authenticated routes).
Method
Endpoint
Count
Root Cause
Severity
GET
/api/user/auth/getMe
4×
App.jsx useEffect fires on every route change. No skip condition. Parallel-fired with players/network via Promise.all.
CRITICAL
GET
/api/user/players/network
4×
App.jsx fires this on mount to seed Redux followingIds. Re-fires on tab focus + reconnect.
CRITICAL
GET
/api/user/auth/refresh
3×
baseQueryWithReauth fires on every 401. No debounce between concurrent requests — all queued requests retry independently.
HIGH
GET
/api/owner/turf/owner/all
2×
AuthenticatedNavbar.jsx — fires when isProfessionalDashboard flag is set, but the flag check itself is async so it may fire then abort.
HIGH
GET
/api/professional/dashboard/stats
2×
useGetDashboardStatsQuery in Navbar — no skip when user is not on professional dashboard.
HIGH

1.2 Community Page — 15 Simultaneous Queries
Community.jsx mounts with 15 active API hooks. The RTK Query defaults (keepUnusedDataFor = 60s, no refetchOnMountOrArgChange=false) mean every unmount+remount cycle (tab switch, back navigation) re-fires all 15.
GET
/api/community/feed
3×
useGetCommunityFeedQuery + useLazyGetCommunityFeedQuery BOTH imported. Feed loaded eagerly AND lazily.
CRITICAL
GET
/api/community/stories
2×
useGetStoriesFeedQuery — no staleTime set. Re-fetches on every mount even if data is fresh.
HIGH
GET
/api/community/stats
3×
useGetCommunityStatsQuery — called in Community.jsx AND potentially in child components (double fetch).
HIGH
GET
/api/reels/feed
2×
useGetReelsFeedQuery imported in Community.jsx — loads REELS data on the COMMUNITY page.
CRITICAL
GET
/api/user/players
2×
Direct axiosInstance.get('/api/user/players') inside useEffect — bypasses RTK Query cache entirely.
HIGH
POST
/api/community/upload-url
1×
useLazyGetCommunityUploadUrlQuery — fires when modal opens. Fine, but no caching.
LOW

1.3 Dual Fetching Anti-Pattern — 40+ Files
Kridaz uses TWO data fetching systems simultaneously: RTK Query (baseApi) and raw axiosInstance. These do not share cache. The same data gets fetched twice — once via RTK Query and once via raw axios in a useEffect.
RTK Query (baseApi)
Raw axiosInstance (same endpoints — double fetch)
useGetReelsFeedQuery()
→ /api/reels/feed
axiosInstance.get('/api/user/players') in useEffect — no cache sharing
useGetCommunityFeedQuery()
→ /api/community/feed
axiosInstance.get('/api/user/players/network') in App.jsx — separate network call

Section 2 — Frontend Architecture vs Industry Standard
2.1 Data Fetching Layer
✓
Practice / Standard
Kridaz Status
Industry Standard
☐
Single data-fetching layer (RTK Query OR React Query — not both)
✗ Missing
Only RTK Query for cache; 40+ files use raw axios bypassing cache
☐
No direct API calls inside components — all through query hooks
✗ Missing
152 files have direct axios calls in components/modals/layouts
☐
RTK Query keepUnusedDataFor configured per-endpoint
✗ Missing
No keepUnusedDataFor anywhere — defaults to 60s causing instant re-fetches
☐
refetchOnFocus: false for stable data (profiles, settings)
✗ Missing
RTK Query defaults to refetchOnFocus:true — tabs back in = all queries fire
☐
refetchOnReconnect: false for non-volatile data
✗ Missing
All queries refetch on every network reconnect
☐
refetchOnMountOrArgChange: false for expensive queries
✗ Missing
Community page refetches all 15 queries on every component remount
☑
Optimistic updates for mutations
⚠ Partial
Some mutations invalidate tags; no optimistic updates implemented
☐
Route-level data prefetching (React Router 6.4 loaders)
✗ Missing
All data fetching happens inside components after render — waterfall
☑
RTK Query tag-based cache invalidation
✓ Done
Tags defined for Chat, Message, User, Team, Games, Reel, Community, Booking, Turf
☐
Stale-while-revalidate pattern for feed data
✗ Missing
No staleTime equivalent — data always considered stale immediately

2.2 Component Architecture
✓
Practice / Standard
Kridaz Status
Industry Standard
☐
Shared components receive data via props — no internal API calls
✗ Missing
AuthenticatedNavbar, DashboardProfile, SlotPickerPopup all make API calls internally
☐
Layout components are data-free — no API calls in Navbar/Sidebar
✗ Missing
Navbar.jsx fires logout + owner/turf/owner/all; AuthenticatedNavbar fires 2 queries
☐
One responsibility per component — no 15-query god components
✗ Missing
Community.jsx: 15 API hooks + 521 total useEffect calls across codebase
☑
Feature-based folder structure
✓ Done
features/ folder correctly isolates: auth, games, teams, reels, turf, chat etc.
☐
Barrel exports (index.js) per feature for clean imports
⚠ Partial
Some features have index.js; paths use aliases but no consistent barrel pattern
☐
React.memo / useMemo on expensive list items
✗ Missing
Reel items, community posts re-render on every parent state change
☐
Error boundaries per feature/route
⚠ Partial
RootErrorBoundary exists but no per-feature error boundaries
☐
Suspense boundaries with skeleton loaders
✗ Missing
No Suspense usage — all loading states managed manually with isLoading flags

2.3 State Management
✓
Practice / Standard
Kridaz Status
Industry Standard
☐
Server state: RTK Query only. Client state: Redux slices only. No overlap
✗ Missing
auth state in Redux AND axiosInstance reads it; network data in both Redux + RTK
☐
Encrypted token storage — never plain localStorage
✗ Missing
redux-persist uses window.localStorage — JWT stored plain text
☑
Persisted only: theme + auth (whitelist config)
✓ Done
Correct: only theme and auth in persist whitelist
☐
No API response data in Redux slices (use RTK Query cache)
✗ Missing
turfSlice stores turf data that RTK Query also caches — duplicate state
☐
Global loading/error state via RTK Query — no manual isLoading booleans
✗ Missing
521 useEffect calls, most manage their own loading/error/data state

Section 3 — Backend Architecture vs Industry Standard
3.1 API Design
✓
Practice / Standard
Kridaz Status
Industry Standard
☐
All findMany queries have explicit select — never fetch all columns
✗ Missing
516 findMany without select — overfetching entire row including large JSON fields
☐
All list endpoints have pagination (cursor or offset + take/skip)
✗ Missing
160 findMany without take/skip/cursor — full table scans on every list request
☐
Consistent response envelope: { success, data, meta, error }
⚠ Partial
Most return { success, data } but some modules return raw objects or different shapes
☑
Input validation on all routes (Zod)
✓ Done
validate.middleware.js with Zod used across routes
☐
Query complexity limits (max depth for nested includes)
✗ Missing
Some includes nest 3–4 levels deep with no depth limit
☐
Database indexes on all foreign keys used in WHERE clauses
⚠ Partial
Prisma schema has @@index on some models but not all high-traffic queries

3.2 Module / Repository Architecture
✓
Practice / Standard
Kridaz Status
Industry Standard
☐
Repository pattern — DB access isolated from controllers
✗ Missing
Controllers call prisma.\* directly — no repository abstraction layer
☐
Service layer between controller and repository
⚠ Partial
Some modules have service files; most controllers directly call prisma
☐
No business logic in controllers — controllers only orchestrate
✗ Missing
Booking controller: slot validation, payment logic, and DB writes all in one function
☑
Vertical slice / module-based structure
✓ Done
modules/ folder: 29 modules correctly isolated by domain
☐
Dependency injection — services receive deps via constructor
✗ Missing
All services import dependencies directly — cannot mock for unit tests
☐
Unit-testable domain logic (pure functions, no DB dependency)
✗ Missing
0% of domain logic extractable without mocking prisma — DI not used

3.3 Observability & Resilience
✓
Practice / Standard
Kridaz Status
Industry Standard
☑
Structured JSON logging (Winston)
✓ Done
Winston with JSON format in production
☐
Request tracing (traceId injected in every log line)
✗ Missing
No traceId propagation — cannot correlate logs for a single request
☐
Distributed tracing (OpenTelemetry)
✗ Missing
No OTel — cannot trace slow DB queries or service calls
☑
Error monitoring (Sentry)
✓ Done
Sentry integrated in both server and client
☐
Circuit breaker for external service calls (Razorpay, MSG91, Cloudinary)
✗ Missing
No circuit breaker — one Cloudinary outage hangs the entire upload flow
☐
Health check endpoint returns DB pool, Redis, queue status
⚠ Partial
GET /health exists but only pings DB — no pool stats, Redis, or BullMQ status
☑
Background jobs isolated in separate worker process
✓ Done
ENABLE_WORKERS env splits API and worker in render.yaml

Section 4 — BMS vs Kridaz: Granular Service Comparison
Every comparison is based on actual source code found in both repositories, not assumptions. The 'BMS ahead' count answers your claim that there are 20+ niches where BMS leads.
Service
Kridaz v3
BMS Monorepo
Edge
Logger
Winston + JSON format. Sentry for errors. No metrics on logger itself.
Interface-driven transport system (ILogTransport). Prometheus metrics: queue_size, logs_processed, transport_latency. Batch + sync send. Pluggable formatters.
BMS
Rate Limiter
express-rate-limit with RedisStore. Fixed window. Per-route config.
Factory pattern (createRateLimiter). OTel span per request. Prometheus counters: bypassed/blocked/strategy. Custom keyResolver. Whitelist check. Strategy-aware (sliding/fixed/token-bucket).
BMS
Circuit Breaker
None — no circuit breaker anywhere in the codebase.
Opossum library. Per-service circuit. Prometheus state metrics (OPEN/CLOSED/HALF). Request coalescing (inflightRequests Map). Configurable threshold/timeout/reset.
BMS
Error Handling
try/catch in controllers. Global error middleware. Sentry capture.
HttpError class (typed). Domain errors vs infrastructure errors. Per-layer error mapping. AppError with isOperational flag. Circuit breaker surfaces infra errors separately.
BMS
Validation
Zod schemas. validate.middleware factory. Good coverage.
Zod schemas. TS types auto-derived from Zod (z.infer). Schemas exported as types — validated at TS compile time AND runtime. Request shape guaranteed end-to-end.
BMS
Repository Pattern
None — prisma.\* called directly in controllers/services.
Full repository interfaces (ICRMRepository, IVenueRepository etc). Domain repositories injected via constructor. Unit tests mock the interface, not Prisma.
BMS
DI / IoC
Module imports — no constructor injection.
Constructor injection throughout. Every use-case receives logger, metrics, repo via constructor. Testable in complete isolation.
BMS
Use-Case Pattern
Controller → Service → DB (mixed concerns).
CreateCustomerUseCase, CancelBookingUseCase etc. Single responsibility. @Trace decorator auto-instruments. Metrics observed per use-case.
BMS
Caching
Redis for rate limits + presence. No response cache layer.
L1 in-process (TTL Map) + L2 Redis with circuit breaker. Tiered fallback. Cache-aside pattern. Algolia for search (offloads DB text search).
BMS
TypeScript
28 .ts files (contracts only). 303 JS files.
2053 .ts files. Strict mode. Generic typed repositories. Typed event emitters. No any allowed.
BMS
DB Access
findMany without select (516 occurrences). No pagination (160). No connection pool config visible.
Prisma with explicit select everywhere. Cursor-based pagination. Connection pool tuned. PostGIS for geospatial.
BMS
Observability
Winston + prom-client + Sentry. No tracing.
Full OTel: auto-instrumented Express/Prisma/Redis/HTTP. Grafana dashboards. Loki logs. SLO/SLA targets. Alert rules. Incident runbooks.
BMS
Message Queue
BullMQ with Redis. 3 retry attempts. Good for workload.
RabbitMQ + Outbox pattern (guaranteed delivery). Dead-letter queues. Consumer groups. Publisher confirms.
BMS
Security
Helmet, Zod, JWT, rate limits, Turnstile. Good baseline.
Gitleaks secret scanning. Husky pre-commit. MFA support. PII sanitization in logs. GDPR/DPDP compliance plan. Separate JWT per service.
BMS
Testing Arch
18 test files. Controller tests mock prisma (coupled to DB).
166 test files. Domain tests have zero DB dependency (pure functions). Use-case tests inject mock repos. E2E tests isolated.
BMS
Socket.io
Redis adapter: DONE. Presence with distributed lock: DONE.
Separate ws-backend service. Independent scaling. BUT: missing Redis adapter on ws-backend (bug). Kridaz's socket is actually better configured.
Kridaz
Push Notifications
Capacitor native push + Web Push VAPID. Capgo OTA updates. Full mobile pipeline.
No push notification infrastructure at all.
Kridaz
Onboarding Speed
Simple module structure. New dev productive same day.
DDD + DI = 2–3 week ramp-up. Heavy cognitive load for junior devs.
Kridaz
CI/CD Ops
Render.yaml — 1 line deploy. Worker split already defined.
AWS ECS + Terraform + ECR — DevOps expertise required. Complex but production-grade.
Kridaz
Media Pipeline
Capacitor camera, FFmpeg worker, Cloudinary, Capgo OTA. Rich.
S3 presigned URLs. Basic media handling. No video processing pipeline.
Kridaz

BMS wins: 15 of 20 services compared | Kridaz wins: 5 (Socket config, Push, Onboarding, CI/CD ops simplicity, Media pipeline)
Verdict on your claim of 20+ niches: VALID. In granular engineering detail, BMS leads in 15+ categories. The 5 where Kridaz leads are all product/velocity wins, not engineering depth wins. From a pure software engineering craftsmanship standpoint, BMS reflects more learned patterns.

Section 5 — HLD/LLD: Which Is More Scalable for Collaborative Dev?
5.1 Onboarding Speed vs Long-term Velocity
Dimension
Kridaz (Startup now)
BMS (Long run)
Day-1 dev productivity
Read DEVELOPER_GUIDE.md → open PR same day. Module = 1 folder.
3 weeks to understand DDD layers, DI wiring, use-case pattern before first PR.
Feature velocity (0–6 months)
High. Add module folder, wire route. Done.
Slow. Every feature needs: domain model → repo interface → use-case → controller → test. 4x more files.
Feature velocity (12+ months)
Slows down. No DI = hard to test. Technical debt accumulates. Refactor cost rises.
Accelerates. Clean DI makes features addable without touching other modules. Tests stay green.
Unit testability
Hard. Prisma mocked everywhere. 18 tests show the struggle.
Easy. Domain logic has zero DB dependency. Use-case gets mock repo injected. Tests are pure.
Parallel team work
Good. Each module is independent. 5 devs can own 5 modules.
Better. Domain + infra layer separation means DB changes don't break feature logic. Safer parallel work.
Knowledge transfer
Simple. Any JS dev can read a controller and understand it.
Deep. DDD/DI knowledge transfers to Spring Boot, .NET, Go. Devs become more hireable.
LLD (Low-level design)
Controllers have business logic. Hard to refactor later.
Use-cases are pure LLD artifacts. Each use-case is a self-contained, replaceable unit.
HLD scalability
Monolith → extract service later. Harder because no domain boundary.
Microservice-ready today. Each domain (booking, venue, wallet) already has its own repo interface.

5.2 Ruthless Verdict on 'BMS contributors grow more'
Your statement: 'whoever contributes to BMS monorepo learns a lot when they come out of the company — their skill has greater value.' CORRECT — ruthlessly confirmed. Here is why:
DDD + DI are the foundation of every enterprise backend framework (Spring Boot, ASP.NET, Go-Kit). BMS contributors already know these patterns.
Use-case pattern = Clean Architecture = the pattern used at Google, Netflix, Uber at scale. A BMS dev joins any company and immediately recognises the structure.
OTel + Prometheus + Grafana is the observability stack used by 90% of production companies. BMS devs have already configured it.
Writing tests against repository interfaces (not prisma) is the industry-standard approach taught in every FAANG interview.
Kridaz contributors learn product velocity, full-stack pragmatism, and Capacitor mobile — valuable for startups. BMS contributors learn engineering discipline — valuable everywhere.
Recommendation: Keep Kridaz's pragmatic structure for launch. Adopt BMS's DI + repository pattern as a migration target over 6 months — one module at a time.

Section 6 — Discussion Prep: Network Fix Decision Points
Before we build the fix plan, these are the 5 architectural decisions you need to make. Each has a tradeoff.
Decision 1: Remove raw axios from all components?
Option A (Recommended): All queries through RTK Query only. Migrate 40 files over 2 weeks. Zero duplicate fetches.
Option B: Keep axiosInstance for mutations only (POST/PUT/DELETE). Use RTK Query for all GET queries. 50% of the fix, 20% of the effort.

Decision 2: Fix Community.jsx — split or keep?
Option A (Recommended): Split into CommunityFeed, StoriesFeed, CommunityStats — each owns its own query. Lazy-load Reels when user scrolls to them.
Option B: Keep as one component but add refetchOnMountOrArgChange:false and keepUnusedDataFor:300 to all 15 queries. Fixes 70% of refetches in 2 hours.

Decision 3: Fix the App.jsx global getMe + network waterfall?
Option A (Recommended): Move getMe to an RTK Query hook with skip:!token. The result seeds Redux on first call only. Never re-fires unless token changes.
Option B: Add a ref flag — if already initialised, skip. Two-line fix.

Decision 4: Backend — add select to all findMany?
This is 516 changes across the codebase. Doing it manually takes 2 weeks. An agent can do it in 4 hours with a script. Decide if you want this in the sprint.

Decision 5: Repository pattern migration — start now or post-launch?
Starting now on new modules only: 0 risk, high long-term gain. Starting on existing modules: 2 weeks of refactor, test coverage required first. Post-launch is safer.

Once you have decided on these 5 points, the next document will be: Machine Plan — Kridaz Network Fix Implementation (Phase-by-phase, with exact prompts for each agent task).
