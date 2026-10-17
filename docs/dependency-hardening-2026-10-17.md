# Harden compatible dependencies and pin Node LTS

This change updates vulnerable dependencies without changing API contracts,
database migrations, React 18, EF Core 8, or the .NET 8 target frameworks.
The comparison base is `62ce1cc68b6e5fd835a243abcb2ee1756554356e`.

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

## Validation

- Node 24.22.0, npm 11.19.1: clean `npm ci` and dependency/peer validation passed.
- Full Jest run before and after: **282 passed, 3 failed**, across 60 suites
  (59 passed, 1 failed). Failing test names and assertion results match exactly.
- Full TypeScript diagnostics match byte for byte: **1,214 existing errors**.
- Full ESLint messages match exactly: **13 existing errors, 377 warnings**.
- Release builds: DataApi, EventLogUtility, and DeviceEmulator passed.
- Seven backend suites: **582 passed, 0 failed, 13 existing skips**. SQLite
  repository tests exercised the updated native library; the 2.1.14 Windows
  native binary reports SQLite **3.54.0**, above the advisory's 3.50.2 threshold.
- Live migration test opt-in variables were unset; the two live-provider test
  methods returned without database access. Their reported passes do not
  represent SQL Server or PostgreSQL upgrade testing.

The three existing UI failures are in
`Atspm/WebUI/src/features/charts/timeSpaceDiagram/historic/timeSpaceHistoric.transformer.test.ts`:

1. `omits programmed split from phase labels`: `collectRenderTexts` is undefined.
2. `renders and legends turn series for both primary and opposing directions`:
   an expected strictly smaller distance is equal.
3. `draws opposing SRM tracks in the opposing distance direction`: the same
   distance-direction assertion fails.

No tests were disabled, lint rules suppressed, or TypeScript build settings
changed. The existing `ignoreBuildErrors` setting still means a production
build alone is not proof of a clean type check.

An isolated Docker Compose installation was built from the candidate source
with synthetic credentials, a new PostgreSQL volume, and separate loopback
ports. Compose validation and all six application image builds passed,
including `npm ci --ignore-scripts` and `npm run build` on Node 24.22.0 Alpine.
The installer exited 0 after creating the databases and admin account;
PostgreSQL was healthy and all seven long-running services were running.

Certificate-validated HTTPS checks passed for the login page, admin login,
authorized Users access, installed/latest stable version endpoints, About
page, and all 11 of its JavaScript assets. Anonymous Users access returned
401. Browser checks also verified login, the seeded Admin in Manage Users,
and the correct Ahead of latest stable status with installed v5.4.0-rc1,
stable v5.3.1, and the configured utahudot/udot-atspm release source. The
production Node 24 container successfully loaded sharp 0.35.5 and resized
an in-memory PNG using its native library.

The temporary test stack was stopped after validation. Existing installation
containers and data were not replaced. This validates a fresh PostgreSQL
installation; it does not claim a live Oracle/SQL Server migration or a
production deployment. Existing UI test/static-check failures and development
dependency advisories above remain follow-up work.
