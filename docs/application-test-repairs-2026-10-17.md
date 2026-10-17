# Application regression repairs — 17 October 2026

The 44 application failures recorded in the [earlier integration run](validation-2026-10-17.md) are resolved. The work starts from fork `main` at `6109e46ec36e0e939d0b6e934fb7d419592d1d28` and uses `enhancement/application-regression-repairs` with focused commits.

## Results

Release tests ran with .NET SDK 8.0.403 on Windows:

| Test project | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| ApplicationTests | 262 | 0 | 12 |
| InfrastructureTests | 174 | 0 | 1 |
| DatabaseInstallerTests | 27 | 0 | 0 |
| ConfigApiTests | 11 | 0 | 0 |
| ReportApiTests | 88 | 0 | 0 |
| IdentityTests | 15 | 0 | 0 |
| WatchDogTests | 3 | 0 | 0 |
| **Total** | **580** | **0** | **13** |

DataApi and EventLogUtility also built in Release with zero warnings and errors. Existing restored dependencies were reused; no package versions changed. The [contribution guide](../CONTRIBUTING.md) contains reproducible build and test commands.

ApplicationTests increased from 260 to 274 cases through additional boundary and regression coverage. All 204 previously passing application cases still pass. The exact set of 12 previously skipped application cases is unchanged, and InfrastructureTests retains its existing skip. No test project exclusions or skip annotations were added.

## Causes and changes

| Original failure group | Cases | Repair |
| --- | ---: | --- |
| Turning movement service | 13 | Populate movement and lane detector counts from unique channels. Update stale tests to preserve upstream's unknown-lane grouping, zero-filled empty results, and lane-volume utilization formula. Add explicit known-lane and duplicate-channel coverage. |
| Transit signal priority | 12 | Supply classification flags normally populated by the preceding pipeline stage, use upstream's zero recommendation sentinel, and assert extension-based priority maxima. Keep inactive and invalid phases' cleared limits from being overwritten by later passes. Add paired-ring and invalid designated-phase coverage. |
| Vehicle-activation fixtures | 3 | Restore the owning location on deserialized event batches, whose model intentionally ignores the serialized location field. Check all metadata exactly and timestamps within one millisecond because the legacy fixture predates full-precision `AddSeconds`. |
| Combined volumes | 8 | Replace seven unconditional-failure placeholders with deterministic scenarios. Match complete 15-minute bins explicitly, preserve the available count when the opposing bin is absent, and handle missing input safely. Retain the large fixture comparison and add missing-phase coverage. |
| Preemption/priority aggregation fixtures | 2 | Anchor the timeline to the event date, not the execution date. Repair expected rows to use non-overlapping 15-minute bins over the fixture day and counts derived independently from the raw events. |
| Legacy workflow placeholders | 6 | Replace unconditional failures with assertions on supported delay, arrival classification, volume-report, coordination-result, termination-aggregation, and preemption-detail components. Add boundary cases and name each test for the component it actually exercises. |

The two aggregation fixtures preserve their configuration, raw input events, and model types. Expected preemption totals are 3 requests and 3 services. Expected priority totals are 64 requests, 60 early-green adjustments, and 57 extended-green adjustments.

The new total-volume scenarios reproduced lost counts and null-input failures before the production correction. Additional invalid designated-phase tests also failed before the later-pass guard was added, then passed with the correction.

## Compatibility and scope

Public method signatures, database migrations, package versions, and authentication contracts are unchanged. Turning-movement detector-count fields now report unique contributing channels instead of their unassigned default zero. Unknown physical lanes remain unknown; no lane assignment or traffic-engineering policy was invented to satisfy old assertions. Transit-priority classification and paired-ring calculation rules remain upstream's existing rules.

Several old workflow orchestrators are excluded from the application build, and other legacy stages remain incomplete. Replacing their placeholder tests with supported component tests does not implement or certify those orchestrators. The new coverage explicitly tests metric components and selected step pipelines rather than claiming full agency workflows.

The two opt-in live migration methods did not access databases during this run because their connection variables were absent, although the test runner counts them as passed. Previously recorded disposable PostgreSQL and SQL Server checks remain separate evidence. A full Compose startup, frontend/browser validation, live controller run, or production database upgrade was not repeated for these backend and test changes.

The workflow now requires explicit owner approval before opening any new PR into either repository. The owner authorized direct integration of these tested fixes into the fork's `main`; required repository safeguards still apply. Upstream contribution branches and existing PRs are preserved.
