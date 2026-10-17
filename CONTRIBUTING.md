# Contributing to ATSPM

This fork tracks [OpenSourceTransportation/ATSPM](https://github.com/OpenSourceTransportation/ATSPM). Keep changes focused and compatible with upstream so they can be reviewed and merged independently.

1. Start each change from the latest upstream `main` when possible. Use an `enhancement/` branch for a new feature or improvement, such as `enhancement/credential-safe-http-logs`. Use a short, descriptive suffix and keep unrelated changes on separate branches.
2. Give every pull request a clear **title** describing the result and a **description** explaining the problem, the change, how it was tested, and any migration or compatibility impact. For fixes, include the triggering failure and the behavior after the fix. The [pull request template](.github/PULL_REQUEST_TEMPLATE.md) provides these prompts.
3. Run the relevant checks locally before opening a pull request and report what passed or failed. Do not claim the whole test suite passes when only targeted tests were run. Avoid extra GitHub Actions runs when minutes are limited; upstream maintainers still decide which hosted checks are required before merging.
4. Do not commit secrets, private certificates, live traffic-controller data, or generated build output. Preserve the Apache 2.0 license notices and identify significant changes in the pull request.
5. Open the pull request against upstream `main` only when the branch is ready for review. Address reviewer feedback on the same branch, and do not assume a fork PR is merged until upstream confirms it.
