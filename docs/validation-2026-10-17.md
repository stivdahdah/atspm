# Fork integration validation — 17 October 2026

**Historical integration baseline:** the 44 application failures below were subsequently resolved. See the [application regression repair record](application-test-repairs-2026-10-17.md) for the current passing backend results and remaining skipped coverage.

This integration combines the twenty focused contributions proposed in [upstream PRs #7–#26](https://github.com/opensourcetransportation/atspm/pulls?q=is%3Apr+author%3Astivdahdah). It preserves the fork's contribution instructions and adds a repeatable development and integration workflow.

The runtime source matches the combined tree at `204fefca1dd0771fb64106d8a1afba8c26f72d4f`, based on upstream `5c7d96285567a1a136f5f4bdf5a6c5f0c5d35735`. Every published contribution head was checked as an ancestor of the integration candidate. No conflicts occurred during integration.

## Backend results

Executed on Windows with .NET SDK 8.0.403, in Release configuration, using the individual project commands in [CONTRIBUTING.md](../CONTRIBUTING.md). Tests build their referenced application projects. DataApi and EventLogUtility were also built separately; both builds succeeded.

| Test project | Passed | Failed | Skipped |
| --- | ---: | ---: | ---: |
| ApplicationTests | 204 | 44 | 12 |
| InfrastructureTests | 174 | 0 | 1 |
| DatabaseInstallerTests | 27 | 0 | 0 |
| ConfigApiTests | 11 | 0 | 0 |
| ReportApiTests | 88 | 0 | 0 |
| IdentityTests | 15 | 0 | 0 |
| WatchDogTests | 3 | 0 | 0 |
| **Total** | **522** | **44** | **13** |

The full backend test suite is **not passing**. ApplicationTests returns a nonzero exit code; these results do not establish correctness for every traffic metric or production deployment.

The two live migration test methods return without database access when their opt-in connection variables are absent. They are included in the 27 reported installer passes above, but no live database test was executed during this integration run. Earlier validation of the provider-migration contribution used disposable PostgreSQL 16 and SQL Server 2022 Developer databases, exercised all four contexts, and checked a synthetic SQL Server Config upgrade. Actual agency database upgrades remain unverified.

## Comparison of application failures

The comparison base was `e32dbeaf3568813089665daf474fd9677a94a14b`: upstream plus only the portable-fixture repair from PR #10. This lets the existing tests reach their assertions instead of failing on a developer-specific file path. That repair changes test infrastructure, not production calculations.

Both base and candidate were tested in the same environment and produced TRX results:

| ApplicationTests revision | Passed | Failed | Skipped | Total |
| --- | ---: | ---: | ---: | ---: |
| Upstream with portable fixtures | 201 | 47 | 12 | 260 |
| Combined contributions | 204 | 44 | 12 | 260 |

All 44 remaining failed cases have identical test names and error messages on the base and candidate. Comparing every test outcome found exactly three changes, each from failed to passed:

- `FilterPhaseIntervalChangeDateProcessStepTests.WorkflowFilterTestsFilteredCodes`
- `IndianaEventExtensionsTests.DetectsSingleValidCycle_ForOnePhase`
- `IndianaEventExtensionsTests.RespectsTimestampOrder_WhenEventsAreOutOfOrder`

There were no newly failing cases and no newly skipped cases in this comparison. This establishes no new failures in the tested cases, not proof that no untested regression exists.

The remaining failure groups are:

| Group | Failing cases |
| --- | ---: |
| Workflow `NotCompleted` placeholders | 6 |
| CalculateTotalVolumesTests | 8 |
| AggregatePreemptStepTests / AggregatePriorityStepTests | 2 |
| IdentifyandAdjustVehicleActivationsTests | 3 |
| TurningMovementCountsServiceTests | 13 |
| CalculateMaxExtensionTests | 4 |
| CalculateTransitSignalPriorityMaxTests | 8 |

These remain follow-up work. Tests have not been disabled or changed to hide these failures. Recompare results after future code, dependency, or environment changes; this record is not a permanent failure allowance.

## Configuration and workflow checks

- Compose configuration validation succeeded with temporary example values and the checked-in environment template.
- The container workflow YAML parsed successfully. The change-detection job now uses the same repository condition as its existing container build/push job; publishing, permissions, and required review checks are unchanged.
- The documented PowerShell commands parsed successfully, and linked local documentation paths were checked.
- Dependency restoration initially encountered restricted network access. Restoration with network access succeeded; a fresh restore with refreshed NuGet cache completed without warnings. The earlier build logs retain warnings from cached advisory retrieval failures.

Earlier installation validation exercised the full local Compose stack, migrations and admin seeding, repeated installation, HTTPS access, and admin login. The installer image also passed its build and CLI help smoke test. Those installation checks were not repeated during this integration run. The WebUI source and dependencies were unchanged by this integration; a fresh frontend build and browser test were not part of this run.

Use the [local setup guide](../Atspm/README.md) for evaluation. Production infrastructure, live controller access, historical agency data, and a published release require separate validation.
