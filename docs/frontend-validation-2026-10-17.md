# Frontend validation repair — 17 October 2026

Branch: `enhancement/frontend-validation`, based on fork main `588a52c0`.
This is a partial TypeScript cleanup; it is not ready to enable mandatory build type checking.

## Changes

- Fix all 13 ESLint errors without changing lint severity or adding suppressions: const bindings, escaped page text, optional dialog callback arguments, named React test mocks and explicit observer mocks, and removal of an unused mutation callback.
- Remove identical duplicate configuration schema members, constants and type aliases. Preserve every distinct member and wire value.
- Correct 102 generated configuration collection/count response annotations. Collections preserve their OData `value` envelope and metadata; count functions return numbers. Version history remains a plain array. Live read-only checks confirmed six representative collection endpoints and two count endpoints against the existing installation. Request URLs, bodies and transport logic are unchanged.
- Add a separate selected-result type to the generic GET hook; parse configuration metadata from raw XML with the configured Axios instance. Correct the legacy location hook's query-option response type.
- Fix stale type imports/exports, form value callback types, CSS property inference, optional test graphic access without weakening assertions, and the WatchDog product/model/firmware hierarchy against the backend's existing `Common.cs` models.
- Correct mutation option types and retain the edit-impact variables object and callbacks. Explicit numeric coercion retains existing rounding behavior.
- Declare the already-used lodash 4.18.1 runtime and add its declarations 4.17.26. Add the missing jspdf-autotable 5.0.9 runtime; its registry peer range supports the existing jsPDF 4.2.1. No React, Next.js, Node, backend or API contract upgrade.

## First checkpoint validation

- Node 24.22.0: clean locked `npm ci --ignore-scripts` and full dependency/peer validation passed.
- Full ESLint: **0 errors, 376 warnings**; baseline 13 errors, 377 warnings.
- Full TypeScript: **1,048 errors remain**, down from 1,213 (net reduction 165). Compiler settings, source inclusion and existing build type-check bypass are unchanged. The remaining diagnostics include more precise errors exposed by correcting collection result types; a net reduction is not a claim that every remaining diagnostic matches the old messages.
- Full Jest: **64 suites, 297 tests passed, zero failed**. Nine new cases cover typed GET selection/metadata lookup, collection/count contracts, WatchDog hierarchy/filtering and impact callback variables.
- Production webpack build passed. The existing `ignoreBuildErrors` setting remains; this does not establish a clean type check.
- PDF table plugin smoke produced a valid in-memory PDF containing the expected table text.
- Production npm audit: zero findings. Full npm audit remains 33 development findings (14 high, 19 moderate). No audit exclusions or forced upgrades were applied.
- `git diff --check` passed. Backend tests were not repeated: no backend source, schema, migrations or settings changed.

## Route and location editor checkpoint

The second checkpoint reduces TypeScript diagnostics from **1,048 to 858** (190 fewer; 355 fewer than the original 1,213). No file has a higher diagnostic count than the first checkpoint under the same compiler and dependencies. This is still a partial cleanup; compiler settings, source inclusion and the existing build type-check bypass remain unchanged.

- Model editable route and location drafts separately from API DTOs. Validate IDs and required inputs; distinguish blank values from zero; normalize enum names to existing numeric wire values without silently replacing unknown values.
- Correct route-view/upsert response declarations to `RouteDto` and align their two checked-in OpenAPI response schemas with the existing controller/service. Keep request URLs and payload contracts unchanged.
- Repair route direction selection without mutating props or query-cache arrays. Rebuild both sides of distance links after add/reorder/delete, clear stale endpoints, preserve zero distances and retain server-assigned distance IDs after saving.
- Correct location collection reads, approach upsert results, initialized detector collections and local temporary IDs. Preserve audit data on reads and omit it from save payloads.
- Await general location persistence and reload before announcing success. Persist pedestrian phases as numbers and retain unrelated unsaved approach edits; failed requests do not mark drafts saved.
- Align related selection, summary and device controls with their actual response shapes. Preserve numeric search filters when adding expanded approaches. Do not mutate cached device configurations; convert device status/type selections to the existing enum values before saving.
- Guard incomplete coordinates before requesting route geometry. Preserve the existing OSRM match-to-route fallback.

Validation: **71 Jest suites / 322 tests passed**, including 25 new regression cases for DTO contracts, editor normalization, route links/directions, save timing/failure, pedestrian settings and routing fallback. No real controller or routing-service calls are made by these tests. Full ESLint passed with **0 errors and 376 warnings**. The production webpack build passed; its existing type-check bypass remains and does not establish a clean TypeScript check. `git diff --check` passed. The locked dependency installation from the first checkpoint is reused because the dependency manifests, lockfile and runtime are unchanged. No backend source, database schema, migration or dependency changes were made in this checkpoint.

## Report and remaining location configuration checkpoint

The third checkpoint reduces TypeScript diagnostics from **858 to 757** (101 fewer; 456 fewer than the original 1,213). No file has a higher diagnostic count than the second checkpoint. This remains a partial cleanup, with compiler settings and source inclusion unchanged.

- Separate Watchdog menu options from saved ignore-event records. Match both named OData enums and metadata-resolved numeric values; preserve the existing named-enum mutation payload. Handle incomplete dates, validate ranges, retain permission guards and report failed save/delete requests.
- Replace the legacy location configuration helper's duplicate draft types with the shared editor model. Disable queries without a selected numeric ID, initialize new approach drafts and clear stale state after deselection. Align template selection with the search-location contract.
- Align pedestrian report forms, numeric time units, nullable All-phase requests and location identifiers with the existing backend models. Preserve pedestrian phase configuration while expanding selected locations, without overwriting numeric search filters.
- Round pedestrian display data immutably and tolerate absent collections/statistics. Read total volume from the backend's top-level field instead of a nonexistent statistics member. Preserve zero and missing values.
- Flatten transit-priority plans with absent phase arrays into zero rows, so grid rendering and spreadsheet export do not dereference undefined rows. Keep missing minimum-green values blank.
- Validate saved transit-priority preset data before loading it. Preserve explicit designated phases, including intentionally empty selections, and apply the existing [2, 6] default only to new selections. Resolve search locations through the existing optimized search endpoint and disable preset queries until the measure ID is available.
- Align dialog audit prop types with the existing audit display and remove the ignored-events table's unchecked response cast.

Validation: **78 Jest suites / 344 tests passed**, including 22 new regression cases. Full ESLint passed with **0 errors / 376 warnings**. The production webpack build passed and generated the expected 44 static pages. The existing type-check bypass remains; the separate compiler run still reports 757 errors. No modified source file has compiler diagnostics. A new page test was relocated to the feature test folder after the build detected it as a page; the relocated/adjusted tests were rerun successfully. `git diff --check` passed.

The existing locked dependencies and Node 24.22.0 runtime are unchanged, so prior installation validation is reused. No backend, database schema, migration, dependency or installation changes were made. No real controller writes or external routing calls are made by the new tests. Local evidence is under `audit-evidence/frontend-reports-20261017`.

## Remaining work

The largest remaining groups are optional speed-management hotspot UI (30 diagnostics), priority detail charts (26), segment administration (17), speed-compliance chart containers (14), speed-management chart composition (14), speed-management location filters (13) and preemption detail charts (12). The core route edit page, route editor components, approach editor, shared draft models and location general settings have no TypeScript diagnostics. The remaining location template/configuration helpers and Watchdog editor were addressed in the third checkpoint. Other optional/null form values, chart contracts, missing feature modules and test fixtures still need cleanup.

The wider OpenAPI/Orval inputs and MSW collection fixtures still need alignment before regenerating all clients; this checkpoint corrects only the two route response schemas it relies on. The separate Speed Management API is not present in this repository; its source or a test endpoint has been requested for contract validation. Partial multi-request pedestrian updates are not transactional on the existing API: an API failure reports an error and keeps the draft unsaved; no backend transaction behavior is introduced.

Nothing pushed, no PR opened, and the existing local installation was not rebuilt or modified during this task. Existing databases and credentials were accessed only through read-only response-shape checks. Full logs and remaining diagnostic inventories are local under `audit-evidence/frontend-validation-20261017` , `audit-evidence/frontend-editors-20261017` and `audit-evidence/frontend-reports-20261017`.
