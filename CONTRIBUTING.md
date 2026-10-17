# Contributing to ATSPM

This fork tracks [OpenSourceTransportation/ATSPM](https://github.com/OpenSourceTransportation/ATSPM). Keep changes focused and compatible with upstream so they can be reviewed and merged independently.

## Repositories and branches

| Location | Purpose |
| --- | --- |
| `origin` = `stivdahdah/atspm` | This fork, where development branches are published. |
| `origin/main` | Combined improvements available for users to clone and evaluate. |
| `upstream` = `OpenSourceTransportation/ATSPM` | The original project and its releases. |
| `enhancement/<short-description>` | One focused fix, feature, documentation change, or integration. |

A pull request appears in the repository selected as its **base**. A PR into this fork updates this fork's `main`; a PR into upstream proposes a contribution to the original project. Merging either does not automatically merge the other. Upstream approval is not required to maintain this fork.

## 1. Start a focused change

Run commands from the repository root with a clean working tree. Check existing remotes with `git remote -v`. If `upstream` is missing, add it once:

```sh
git remote add upstream https://github.com/OpenSourceTransportation/ATSPM.git
git fetch origin
git fetch upstream
```

For an independent contribution to the original project, start from upstream so the PR contains only that change:

```sh
git switch -c enhancement/describe-the-change upstream/main
```

For fork-specific documentation or work that must use already integrated fork changes, start from `origin/main` instead. If an upstream contribution depends on another unmerged contribution, document that dependency and keep its review branch focused. Do not send the fork's combined `main` as one large upstream PR.

Use `enhancement/` for every new work branch, with a short, descriptive suffix. Keep unrelated changes separate. Preserve upstream interfaces, migration history, and Apache 2.0 notices. Do not commit secrets, private certificates, live controller data, or generated output.

## 2. Build and validate

Run the affected tests while developing. Before integrating several changes into `main`, run the combined backend checks below using the .NET 8 SDK and PowerShell. Each test command restores dependencies and builds its project references. The two build commands cover entry points not built by these test projects.

```powershell
$checkFailed = $false
$resultsDirectory = Join-Path 'TestResults' (Get-Date -Format 'yyyyMMdd-HHmmss')
foreach ($project in @('DataApi', 'EventLogUtility')) {
    dotnet build "Atspm/$project/$project.csproj" -c Release
    if ($LASTEXITCODE -ne 0) { $checkFailed = $true }
}
foreach ($project in @('ApplicationTests', 'InfrastructureTests', 'DatabaseInstallerTests', 'ConfigApiTests', 'ReportApiTests', 'IdentityTests', 'WatchDogTests')) {
    dotnet test "Atspm/$project/$project.csproj" -c Release --logger "trx;LogFileName=$project.trx" --results-directory $resultsDirectory
    if ($LASTEXITCODE -ne 0) { $checkFailed = $true }
}
if ($checkFailed) { throw 'Validation failed. Review the build output and test results before merging.' }
```

Do not suppress failures or skip required checks to obtain a passing result. Record exact passed, failed, and skipped counts. If failures already exist on the base, compare the failing cases on the base and candidate under the same environment; resolve new regressions and document remaining failures. The [17 October 2026 integration results](docs/validation-2026-10-17.md) record the current comparison and limitations. They are historical evidence, not a permanent exception for future changes.

Database migration tests require separate opt-in configuration: `ATSPM_MIGRATION_TEST_POSTGRES` and `ATSPM_MIGRATION_TEST_SQLSERVER`. Use disposable test databases only; the tests create and drop databases. Without these variables, the two live test methods return without accessing a database, although the test runner counts them as passed. Report live database execution separately; see the [installer test instructions](Atspm/DatabaseInstaller/README.md).

For UI changes, run `npm ci`, `npm run build`, and the relevant tests in `Atspm/WebUI`. For container, configuration, or installation changes, follow the [Compose setup guide](Atspm/README.md), validate configuration with `docker compose config --quiet`, and exercise startup, migration/seeding, HTTPS access, and login in an isolated local stack. Use the guide's explicit stop command when finished; retain data volumes unless they are disposable and deletion is intentional.

Validate locally during development. Preserve the checks and review requirements of each target repository. Publishing a branch or merging code does not authorize a deployment, image publication, or release.

## 3. Describe and publish the change

Every commit and pull request needs a clear **title and description**. Explain the problem, resulting behavior, validation, and compatibility or migration impact. For a fix, include the triggering failure and the behavior after the fix. Use the [PR template](.github/PULL_REQUEST_TEMPLATE.md).

Keep public descriptions about the contribution. Include meaningful limitations and test results, and omit unrelated process commentary. Do not imply all tests passed when only targeted checks passed.

After reviewing the diff and validation results, publish the named branch when authorized:

```sh
git diff --check
git push -u origin enhancement/describe-the-change
```

Before opening any new PR, obtain explicit approval from the repository owner. Prepare the target repository/base branch, title, description, and validation summary first so the approval covers a concrete contribution. Authorization to implement, push, or merge does not authorize opening a PR.

For this fork, the PR target is **base repository `stivdahdah/atspm`, base branch `main`**. After approval, open the PR, review the combined diff and results, and merge when authorized. If the owner explicitly authorizes a direct merge instead, validate the enhancement branch and merge it into the fork's `main` without a PR, provided repository safeguards permit it. Keep `main` history intact; do not force-push it or bypass required checks.

For upstream, prepare a separate PR with **base repository `OpenSourceTransportation/ATSPM`, base branch `main`**, using the focused contribution branch from the fork. Obtain approval before opening it. Address review feedback on that branch. Keep it available while its upstream PR is open, even after the change is integrated into the fork. Bring later corrections into the fork as well.

## 4. Bring upstream updates into the fork

Preserve both histories by testing updates on an integration branch:

```sh
git fetch origin
git fetch upstream
git switch -c enhancement/sync-upstream-YYYYMMDD origin/main
git merge upstream/main
```

Resolve conflicts deliberately, rerun affected and combined checks, and prepare a PR into **this fork's `main`** for approval before opening it. An explicitly authorized direct merge follows the same validation and safeguards. Use a fresh date or suffix for each sync branch. Do not reset the fork to upstream or force-sync away its improvements. Once upstream accepts a contribution, include that upstream merge through this same process; do not apply its patch a second time.
