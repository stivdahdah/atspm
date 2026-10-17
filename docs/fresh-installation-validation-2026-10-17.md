# Fresh installation validation — 2026-10-17

## Source and environment

Tested a new clone of `stivdahdah/atspm` main at
`aa6c9281df4ab1104d5a4b0512e556a266bf82d9`, following `Atspm/README.md`.
The host was Windows with PowerShell, Git's OpenSSL, Docker Engine 29.8.2
running Linux containers, and Docker Compose v5.5.1.

Used an isolated Compose project, `atspm-readme-20261017`, with a new
PostgreSQL volume and synthetic credentials. Existing installations and their
data were not reused. Configuration and private certificate files were kept
outside the contribution. No production or controller connections were used.

## Results

| Step | Result |
| --- | --- |
| Download | README's `git clone --branch main` command succeeded into an empty directory. |
| Configuration | Copied `.env.example`, filled the required values, and passed `docker compose config --quiet`. |
| Certificates | Windows OpenSSL commands produced the key, localhost certificate, and password-protected PFX. |
| Initial build/start | `docker compose up --build -d` succeeded; PostgreSQL became healthy. |
| Database initialization | Installer exited 0 after migrations and admin creation/role assignment; all four APIs, UI, and Nginx ran. |
| Fresh frontend dependencies | A separate `docker compose build --no-cache webui` completed dependency installation and the production build successfully. |
| Browser login | On `http://localhost:3000`, both the dashboard login dialog and `/login` page accepted the seeded credentials. The Admin menu appeared and Admin > Users showed the account with its Admin role. |
| HTTPS | A client trusting only the generated certificate for this request verified the localhost certificate/hostname and received HTTP 200 for `/login`. HTTPS login returned an Admin token; authenticated Users access returned 200 and included the seeded account; anonymous Users access returned 401. |
| Chrome HTTPS page | The owner accepted the local certificate warning in Chrome and confirmed that the Performance Measures page opened. |
| Stop/restart | `docker compose down` followed by `docker compose up -d` retained the database and used the freshly rebuilt UI image. Installer exited 0, recognized the existing admin/role, and HTTPS login/access checks passed again. |

## Usability correction

The root URL opens Performance Measures rather than a login form, and the
login action is behind the navigation and user menus. The README now links
directly to `/login`, explains the dashboard login route, and gives the
Admin > Users check as confirmation that setup succeeded. Application behavior,
database migrations, and upstream interfaces are unchanged.

## Limits and follow-up

- Automated browser login used the documented localhost HTTP port. Browser
  automation could not pass the HTTPS certificate warning; Chrome HTTPS page
  access was confirmed by the owner. HTTPS credentials and authorization were
  independently tested with certificate verification, without changing the
  machine's trust settings.
- Initial Compose builds could use existing Docker build layers. The separate
  frontend build explicitly disabled layer reuse. Global Docker caches were
  not cleared.
- `npm ci` reported **45 dependency advisories: 5 moderate and 40 high**.
  These remain unresolved and require dependency-specific investigation;
  installation success is not a security clearance. No forced audit upgrades
  were applied. The build also retains its existing TypeScript-validation
  skip and backend compiler warnings.
- The Windows clone path was exercised. ZIP download, Linux/macOS execution,
  SMTP, external identity providers, controller import, and production
  deployment were not exercised. No full unit-test rerun was needed for this
  documentation-only correction.

## Advanced reference validation

The subsequent `Atspm/CONFIGURATION.md` addition keeps the quick installation
sample intact and documents all 85 Compose input variables, including the 40
database context overrides and 19 forwarded WatchDog settings. Checks compared
rendered Compose JSON with the documented database, SMTP, core, collection,
and WatchDog defaults; verified the copyable database/SMTP examples on every
intended service; and confirmed that legacy/unforwarded keys have no effect.
No rendered secrets were published.

Additional WatchDog options and literal defaults were checked against the
configuration class and `generate --help` output. Local links/README anchors
and bundled browser setting names were checked against their source files.
WatchDog help exited 0. EventLogUtility help exited 0 in a temporary Linux
SDK container using the existing Release binaries. A direct Windows utility
help attempt failed before argument parsing because its existing startup code
requires Windows Event Log permissions; no permissions were changed. The
documented installation uses Linux containers.

No scans, email delivery, device downloads, or external database connections
were performed. This is documentation/configuration validation, not operational
validation of WatchDog thresholds or external services. Application source and
Compose runtime behavior are unchanged, so the previous fresh-installation
results above remain applicable; the full build/test suite was not repeated.
