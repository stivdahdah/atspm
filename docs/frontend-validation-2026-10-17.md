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

## Validation

- Node 24.22.0: clean locked `npm ci --ignore-scripts` and full dependency/peer validation passed.
- Full ESLint: **0 errors, 376 warnings**; baseline 13 errors, 377 warnings.
- Full TypeScript: **1,048 errors remain**, down from 1,213 (net reduction 165). Compiler settings, source inclusion and existing build type-check bypass are unchanged. The remaining diagnostics include more precise errors exposed by correcting collection result types; a net reduction is not a claim that every remaining diagnostic matches the old messages.
- Full Jest: **64 suites, 297 tests passed, zero failed**. Nine new cases cover typed GET selection/metadata lookup, collection/count contracts, WatchDog hierarchy/filtering and impact callback variables.
- Production webpack build passed. The existing `ignoreBuildErrors` setting remains; this does not establish a clean type check.
- PDF table plugin smoke produced a valid in-memory PDF containing the expected table text.
- Production npm audit: zero findings. Full npm audit remains 33 development findings (14 high, 19 moderate). No audit exclusions or forced upgrades were applied.
- `git diff --check` passed. Backend tests were not repeated: no backend source, schema, migrations or settings changed.

## Remaining work

The largest remaining groups are route editing (56 diagnostics), approach editing (35), pedestrian activity (33), optional speed-management hotspot UI (30), transit-priority report rendering (28), and priority detail charts (26). Further groups include optional/null form values, ECharts option contracts, stale/missing feature modules, generated API shapes and test fixtures. The checked-in OpenAPI/Orval inputs and MSW collection fixtures also need alignment before future regeneration of the corrected client declarations.

Some issues represent behavior or API mismatches, not formatting: the route-view/upsert client declares void while its consumer expects route data; location forms mix string names, numeric enums and transient blank values; numeric chart plans call a timestamp-oriented helper; optional speed-management screens refer to unavailable types/endpoints. These need focused fixes and behavior tests, rather than assertions that hide errors. The separate Speed Management API is not present in this repository; its source or a test endpoint has been requested for contract validation.

Nothing pushed, no PR opened, and the existing local installation was not rebuilt or modified during this task. Existing databases and credentials were accessed only through read-only response-shape checks. Full logs and remaining diagnostic inventory are local under `audit-evidence/frontend-validation-20261017`.
