# ATSPM fork working conventions

- Create new work branches under `enhancement/` with a descriptive suffix. Keep independent changes on separate branches based on upstream `main` when possible.
- Give every change a clear title and description. Use a descriptive commit subject and body, and prepare a pull request title and body covering the problem, change, validation, and compatibility or migration impact. See [CONTRIBUTING.md](CONTRIBUTING.md).
- Validate affected behavior locally and report known failures accurately. Compare existing failures against the base before integration; do not bypass required checks or treat a known-failure list as permission to skip tests.
- Keep changes suitable for upstream contribution. Do not commit secrets, private certificates, or live controller data.
- `origin/main` is the fork's combined version. Use focused branches based on `upstream/main` for independent upstream contributions; use `origin/main` for fork-specific changes and integrations. Verify the PR's base repository before publishing or merging.
- Keep public titles and descriptions focused on the problem, behavior, validation, and compatibility. Omit billing, Actions-minute usage, and development-tool commentary. Report material limitations honestly.
- Preserve open upstream PR branches and both repositories' history. Merge upstream updates through an `enhancement/` integration branch; never reset or force-push the fork's `main` to synchronize it.
- Follow the build, validation, integration, and synchronization workflow in [CONTRIBUTING.md](CONTRIBUTING.md). Publishing code does not authorize deployment or release publication.
- Obtain explicit user approval before opening any new pull request, into either this fork or upstream. First prepare the target repository/base branch, title, description, and validation summary for review. Permission to implement, push, or merge is not permission to open a PR. An explicitly authorized direct merge into the fork is allowed when repository safeguards permit it.
