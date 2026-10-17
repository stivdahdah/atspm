# Harden compatible dependencies and pin Node LTS

This change updates vulnerable dependencies without changing API contracts,
database migrations, React 18, EF Core 8, or the .NET 8 target frameworks.
The current comparison base is fork main
`839d04d9b3d7188c27a8e41140b97402a6d756d3`. The branch includes the merged
time-space regression fixes from PR #5 as well as the dependency updates.

## Changes

| Dependency | Previous resolved version | Updated version |
| --- | --- | --- |
| Node Docker base | `current-alpine` (rolling release) | `24.22.0-alpine` |
| Next.js | 16.3.6 | 16.4.2 |
| sharp | 0.35.4 | 0.35.5 |
| source-map-js | 1.2.1 | 1.2.2 |
| Jest | 30.2.0 | 30.5.2 |
| System.Security.Cryptography.Pkcs | 8.0.0 / 8.0.1 | 8.0.2 |
| SQLitePCLRaw bundle/native library | 2.1.6 | 2.1.14 |
| Fare | 2.1.1 | 2.2.2 |
| DeviceEmulator System.Text.Json | 8.0.0 | 8.0.5 |

The npm lockfile includes compatible transitive updates. `eslint-config-next`
is classified as a development dependency because it configures linting, and
is still installed for development and builds. No audit exclusions or forced
major upgrades were added.

`.nvmrc`, the Dockerfile, and the package engine range now select Node 24 LTS.
Local developers need Node 24.22.0 or a later Node 24 patch; Docker users need
no host Node installation. Keep these version declarations together when
updating the tested runtime. See the [Node release policy](https://nodejs.org/en/about/previous-releases).

Explicit NuGet references raise vulnerable transitive dependencies at their
owning projects. Fare's .NET Standard 2.0 build removes the legacy
`NETStandard.Library` chain containing System.Net.Http 4.3.0 and
System.Text.RegularExpressions 4.3.0. The SQLite bundle keeps its native
library and managed provider on matching 2.1.14 versions.

## Security audit results

Audits were run on 2026-10-17 against the configured npm and NuGet advisory
feeds. Counts are package findings, including affected parent packages;
they are not counts of distinct vulnerabilities or proof of exploitability.

| Check | Before | After |
| --- | --- | --- |
| npm, all dependencies | 45: 40 high, 5 moderate | 33: 14 high, 19 moderate |
| npm, `--omit=dev` | 12 high | 0 |
| NuGet, all 23 restored C# projects, including transitive packages | Vulnerable PKCS, SQLite, legacy HTTP/Regex and emulator JSON dependencies | 0 |

The initial solution-level NuGet command could not audit the Compose and
JavaScript project types, and DeviceEmulator needed a restore. Final checks
audited every C# project individually, including the restored emulator, with
no command errors. These are package audits, not container OS scans.

The remaining npm findings have three underlying advisories:

- [Faker `helpers.fake`](https://github.com/advisories/GHSA-qxc2-j82w-r537):
  the fix requires Faker 10.5 or later; the project uses Faker 9 in generated
  test mocks. A major upgrade needs its own compatibility validation.
- [braces nested-pattern denial of service](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm):
  no patched braces version is available. It remains through the existing
  lint/type tooling. Replacing or upgrading those toolchains is separate work.
- [sprintf-js precision denial of service](https://github.com/advisories/GHSA-hp3w-g68c-fv3c):
  no compatible fix is available in the js-yaml/coverage-tool dependency
  chain. Do not force npm's suggested major downgrade of Jest to clear it.

These packages remain installed in development/build environments. A clean
production-dependency audit does not eliminate that development exposure.

## Combined validation against current fork main

- Node 24.22.0, npm 11.19.1: clean `npm ci --ignore-scripts` and dependency/peer
  validation passed.
- Full Jest run: **288 passed, 0 failed**, across **60 passing suites**.
- Full TypeScript comparison: **1,213 existing errors**, with no additions or
  removals against current main after normalizing diagnostic line offsets.
- Full ESLint: **13 existing errors, 377 warnings**, with unchanged messages
  compared with the original hardening baseline.
- Release builds: DataApi, EventLogUtility, and DeviceEmulator passed.
- Seven backend suites: **582 passed, 0 failed, 13 existing skips**. SQLite
  repository tests exercised the updated native library; the 2.1.14 Windows
  native binary reports SQLite **3.54.0**, above the advisory's 3.50.2 threshold.
- Live migration test opt-in variables were unset; the two live-provider test
  methods returned without database access. Their reported passes do not
  represent SQL Server or PostgreSQL upgrade testing.

The initial dependency-only validation against the older main commit
`62ce1cc6` had 282 UI passes and three existing historic time-space failures.
Fork PR #5 subsequently fixed those failures and added three regression cases.
Those fixes are now integrated into this branch; all 288 UI tests pass with
the hardened dependencies. The restored test helper also removed one existing
TypeScript diagnostic from the initial 1,214-error baseline.

No tests were disabled, lint rules suppressed, or TypeScript build settings
changed. The existing `ignoreBuildErrors` setting still means a production
build alone is not proof of a clean type check.

An isolated Docker Compose installation uses synthetic credentials, a new
PostgreSQL volume, and separate loopback ports. Compose validation and the
combined UI production image build passed, including `npm ci --ignore-scripts`
and `npm run build` on Node 24.22.0 Alpine. The five backend images from the
earlier hardening validation were reused only after verifying that all backend
source and dependency files are unchanged from that tested commit. Backend
builds and all seven test suites were also rerun on the combined branch.
The installer exited 0 after creating the databases and admin account;
PostgreSQL was healthy and all seven long-running services were running.

Certificate-validated HTTPS checks passed for the login page, admin login,
authorized Users access, installed/latest stable version endpoints, About
page, and its JavaScript assets. Anonymous Users access returned 401. The initial
hardening browser checks also verified login, the seeded Admin in Manage Users,
and the correct Ahead of latest stable status with installed v5.4.0-rc1,
stable v5.3.1, and the configured utahudot/udot-atspm release source. The
production Node 24 container successfully loaded sharp 0.35.5 and resized
an in-memory PNG using its native library.

The temporary test stack was stopped after validation. Existing installation
containers and data were not replaced. This validates a fresh PostgreSQL
installation; it does not claim a live Oracle/SQL Server migration or a
production deployment. Existing static-check failures and development
dependency advisories above remain follow-up work; the three prior UI test
failures are resolved.
