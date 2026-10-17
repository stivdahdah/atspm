# ATSPM fork working conventions

- Create new work branches under `enhancement/` with a descriptive suffix. Keep independent changes on separate branches based on upstream `main` when possible.
- Give every change a clear title and description. Use a descriptive commit subject and body, and prepare a pull request title and body covering the problem, change, validation, and compatibility or migration impact. See [CONTRIBUTING.md](CONTRIBUTING.md).
- Validate affected behavior locally and report known failures accurately. Avoid unnecessary GitHub Actions runs when minutes are limited; do not bypass checks required by upstream maintainers.
- Keep changes suitable for upstream contribution. Do not commit secrets, private certificates, or live controller data.
