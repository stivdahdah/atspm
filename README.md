# Automated Traffic Signal Performance Measures (ATSPM)

ATSPM collects high-resolution traffic signal controller events and presents reports that help traffic engineers and maintenance teams investigate signal operations.

**Get started:** follow the [five-step installation guide](Atspm/README.md), including the [sample `.env` file and setting explanations](Atspm/README.md#sample-env-file). Copy the template, fill five settings, create the local certificate, start Docker Compose, and sign in. Docker builds the app and sets up PostgreSQL for you.

The [database installer guide](Atspm/DatabaseInstaller/README.md) covers importing configuration and event data after startup.

This repository is a community development fork of [OpenSourceTransportation/atspm](https://github.com/opensourcetransportation/atspm). Changes are intended to stay compatible with upstream. The project is licensed under [Apache License 2.0](LICENSE).

To get this fork's combined improvements, clone its `main` branch:

```sh
git clone --branch main https://github.com/stivdahdah/atspm.git
cd atspm
```

Then follow the [local installation guide](Atspm/README.md). Existing clones can update with `git switch main` and `git pull --ff-only origin main` after saving local changes. Building from this source includes the fork's changes; upstream release downloads and images may not include them yet.

Development uses focused `enhancement/` branches. See [Contributing](CONTRIBUTING.md) for the build, test, integration, PR approval, and upstream-sync workflow. The [regression validation record](docs/application-test-repairs-2026-10-17.md) documents the resolved application failures, current test results, existing skipped coverage, and evaluation limits.
