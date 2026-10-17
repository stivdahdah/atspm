# Automated Traffic Signal Performance Measures (ATSPM)

ATSPM collects high-resolution traffic signal controller events and presents reports that help traffic engineers and maintenance teams investigate signal operations.

For a local Docker Compose installation, follow the [setup guide](Atspm/README.md). It covers the environment file, development certificates, startup, and troubleshooting. The [database installer guide](Atspm/DatabaseInstaller/README.md) documents migration and transfer commands.

This repository is a community development fork of [OpenSourceTransportation/atspm](https://github.com/opensourcetransportation/atspm). Changes are intended to stay compatible with upstream. The project is licensed under [Apache License 2.0](LICENSE).

To get this fork's combined improvements, clone its `main` branch:

```sh
git clone --branch main https://github.com/stivdahdah/atspm.git
cd atspm
```

Then follow the [local installation guide](Atspm/README.md). Existing clones can update with `git switch main` and `git pull --ff-only origin main` after saving local changes. Building from this source includes the fork's changes; upstream release downloads and images may not include them yet.

Development uses focused `enhancement/` branches, with separate pull requests into this fork and upstream. See [Contributing](CONTRIBUTING.md) for the build, test, review, and upstream-sync workflow. The [integration validation record](docs/validation-2026-10-17.md) lists the remaining application test failures and evaluation limits; this development branch is not a production certification.
