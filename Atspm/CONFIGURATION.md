# Advanced configuration reference

Start with the five steps in the [installation guide](README.md). The small
[`.env.example`](.env.example) is sufficient for the bundled PostgreSQL stack
and first admin login. This reference is for changing those defaults, adding
email or collection, and migrating settings from older examples.

## Where settings belong

| File or interface | Purpose |
| --- | --- |
| `.env`, beside `docker-compose.yml` | Values interpolated by Compose. Only variables explicitly referenced in Compose are forwarded to application containers. |
| `frontend-env.txt` | Public browser API/map settings loaded by the UI. Never put passwords or signing keys here. |
| WatchDog `generate` arguments | Per-run overrides, including dates and advanced options not forwarded from `.env`. |
| A separate Compose override file | Additional container environment, mounts, or port mappings. Use `docker compose -f docker-compose.yml -f your-override.yml ...` consistently for config, startup, tools, and shutdown. |

Run commands below from `Atspm`. Keep `.env` private and single-quote values
containing `$`, `#`, or spaces. A shell variable of the same name takes
precedence over `.env`; check the shell when an edit appears ineffective.
Run `docker compose config --quiet` after edits, then `docker compose up -d`
to recreate services whose configuration changed. A plain container restart
does not apply a changed Compose environment. Avoid sharing full rendered
Compose configuration: it contains secrets.

## Core `.env` settings

These are Compose defaults, not suggested production credentials.

| Setting | Default when unset | Meaning |
| --- | --- | --- |
| `POSTGRES_USER` | `atspm` | Bundled PostgreSQL login; default application database user. |
| `POSTGRES_PASSWORD` | Required, no default | Initial PostgreSQL password and fallback password for all four contexts. |
| `ADMIN_EMAIL` | Required, no default | Account seeded by the installer; fallback WatchDog alert address. The template uses `admin@example.org`; replace it. |
| `ADMIN_PASSWORD` | Required, no default | Initial admin password: at least 6 characters with uppercase, lowercase, digit, and symbol. Prefer a longer unique password. |
| `ADMIN_ROLE` | `Admin` | Role assigned during seeding. Keep `Admin` for the documented administrator setup. |
| `SEED_ADMIN` | `true` | Whether the installer seeds the account. Compose still requires admin email/password when this is false. |
| `JWT_KEY` | Required, no default | Unique signing secret. Generate with `openssl rand -hex 32`; do not reuse a published example. |
| `JWT_ISSUER` | `ATSPM-local` | API token issuer shared by the services. |
| `JWT_EXPIRE_DAYS` | `1` | Token lifetime in days. |
| `CERT_PASSWORD` | Required, no default | Must match the password used to export the PFX. |
| `ALLOWED_HOSTS` | `*` | API host-header filter for this local setup. |
| `CERT_LOCATION` | `./nginx/certs:/app/certs:ro` | API certificate directory bind mount. Keep the PFX at `/app/certs/aspnetapp.pfx`. |

Defaults using Compose's `:-` syntax also apply to empty values. Required
values using `:?` reject both missing and empty values. The local APIs run
with `ASPNETCORE_ENVIRONMENT=Development`; that is set in Compose, not exposed
as a `.env` switch. This stack is for local development and evaluation.

Seeding does not reset an existing user's password. Changing
`POSTGRES_PASSWORD` does not rotate the password in an initialized database.
Back up existing data and plan credential changes separately.

## Database contexts and connection options

Compose configures each context for every API, the installer, and the optional
tools. Leave all overrides unset to use the bundled database.

| Context | Default database |
| --- | --- |
| `ConfigContext` | `ATSPM-Config` |
| `AggregationContext` | `ATSPM-Aggregation` |
| `EventLogContext` | `ATSPM-EventLogs` |
| `IdentityContext` | `ATSPM-Identity` |

For each context, `.env` accepts
`DatabaseConfiguration__<Context>__<Property>`. Substitute a context from the
table and a property below; the double underscores are literal.

| Property | Compose default | Meaning |
| --- | --- | --- |
| `DBType` | `PostgreSql` | Database provider. Preserve this spelling for the bundled setup. |
| `Host` | `postgres` | Host reachable from inside the containers; `localhost` points to the container itself. |
| `Port` | `5432` | Database server port inside its network. |
| `Database` | Context-specific table above | Database name. |
| `User` | `POSTGRES_USER`, falling back to `atspm` | Application database login. |
| `Password` | `POSTGRES_PASSWORD` | Application database password. |
| `Options__CommandTimeout` | `60` | Command timeout, seconds. |
| `Options__Keepalive` | `30` | PostgreSQL keepalive interval, seconds. |
| `Options__Pooling` | `true` | Enable connection pooling. |
| `Options__Timeout` | `30` | Connection timeout, seconds. |

For example, to override just the Config context, add and customize:

```env
DatabaseConfiguration__ConfigContext__DBType=PostgreSql
DatabaseConfiguration__ConfigContext__Host=your-database-host
DatabaseConfiguration__ConfigContext__Port=5432
DatabaseConfiguration__ConfigContext__Database=ATSPM-Config
DatabaseConfiguration__ConfigContext__User=your-database-user
DatabaseConfiguration__ConfigContext__Password='your-database-password'
DatabaseConfiguration__ConfigContext__Options__CommandTimeout=60
DatabaseConfiguration__ConfigContext__Options__Keepalive=30
DatabaseConfiguration__ConfigContext__Options__Pooling=true
DatabaseConfiguration__ConfigContext__Options__Timeout=30
```

Repeat for the other three contexts when moving the whole application.
The bundled `postgres` service still starts unless you change the Compose
topology; its health dependency and `POSTGRES_PASSWORD` requirement remain.

The application's provider enum also includes `SqlServer`, `MySql`, `Oracle`,
`Sqlite`, and `InMemory`. Provider availability is not proof that every
migration/feature is supported on that provider. PostgreSQL is the path
exercised by this installation guide. Use provider-specific connection
options and the [installer guide](DatabaseInstaller/README.md) before changing
providers; do not apply PostgreSQL options blindly to another provider.

## SMTP email

SMTP is optional for the seeded admin login. Configure it for Identity email
and WatchDog notifications; use your provider's settings.

| `.env` setting | Compose default | Meaning |
| --- | --- | --- |
| `EmailConfiguration__Host` | Empty | SMTP server; empty is not a working mail configuration. |
| `EmailConfiguration__Port` | `25` | SMTP port. |
| `EmailConfiguration__UserName` | Empty | SMTP login, if required. |
| `EmailConfiguration__Password` | Empty | SMTP password, if required. |
| `EmailConfiguration__EnableSsl` | `false` | SMTP TLS setting; match your provider. |

```env
EmailConfiguration__Host=smtp.example.org
EmailConfiguration__Port=587
EmailConfiguration__UserName=you@example.org
EmailConfiguration__Password='your-smtp-password'
EmailConfiguration__EnableSsl=true
```

Compose maps these to `EmailConfiguration__SmtpEmailService__...` inside
Identity and WatchDog. Do not replace the `.env` names with the internal names
unless you also change the container environment mapping. SMTP delivery was
not part of the fresh-installation login test.

## WatchDog settings forwarded by Compose

WatchDog is in the optional `tools` profile. Starting the web stack does not
run scans or schedule them. Configure locations, devices, event data, email,
and recipients before running scans. Scans can send email; the safe command
inspection below only displays help:

```sh
docker compose --profile tools run --rm watchdog generate --help
```

Every name in the next table is prefixed with `WatchdogConfiguration__` in
`.env`. For example, use `WatchdogConfiguration__WeekdayOnly=false` to permit
weekend email. Defaults below are from Compose and the matching configuration.
Thresholds need local traffic-engineering review before operational use.

| Suffix | Default | Purpose |
| --- | --- | --- |
| `TimeZoneId` | `America/Denver` | Time zone used to resolve automatic scan dates. Set the monitored location's zone, e.g. `Asia/Riyadh`. |
| `ConsecutiveCount` | `3` | Consecutive occurrence count supplied to phase analysis. |
| `LowHitThreshold` | `50` | Low detector-hit threshold. |
| `MaximumPedestrianEvents` | `200` | Pedestrian-event count threshold. |
| `MinimumRecords` | `500` | Minimum event-record threshold. |
| `MinPhaseTerminations` | `50` | Phase termination count threshold for phase checks. |
| `PercentThreshold` | `0.9` | Fraction used by force-off/max-out checks; `0.9` means 90%. |
| `PmPeakStartHour` | `17` | PM analysis start hour. |
| `PmPeakEndHour` | `18` | PM analysis end hour. |
| `AmStartHour` | `1` | AM analysis start hour. |
| `AmEndHour` | `5` | AM analysis end hour. |
| `RampMainlineStartHour` | `15` | Ramp mainline check start hour. |
| `RampMainlineEndHour` | `19` | Ramp mainline check end hour. |
| `RampStuckQueueStartHour` | `1` | Ramp stuck-queue check start hour. |
| `RampStuckQueueEndHour` | `4` | Ramp stuck-queue check end hour. |
| `WeekdayOnly` | `true` | Suppress weekend email; scans and stored errors still run. |
| `DefaultEmailAddress` | `ADMIN_EMAIL` | Fallback notification address. |
| `EmailAllErrors` | `false` | Enable the all-errors email path. |
| `Sort` | `Location` | Email sorting; supported choices are `Location`, `Error`, and `Consecutive` (case-insensitive). |

Hours are local clock hours in the application's event-data convention, not
UTC conversion controls. Choose hours from 0–23. The time zone setting chooses
default dates; it does not convert imported event timestamps.

### Additional per-run WatchDog options

These options exist in `generate` but are **not forwarded from `.env` by the
bundled Compose file**. Use the CLI names below. Alternatively, explicitly add
`WatchdogConfiguration__<Property>` to the watchdog service's environment in a
separate Compose override. Simply adding the key to `.env` has no effect.

| CLI option | Configuration property | Default | Purpose |
| --- | --- | --- | --- |
| `--pmScanDate` | `PmScanDate` | Yesterday in `TimeZoneId` | PM scan date. |
| `--amScanDate` | `AmScanDate` | Today in `TimeZoneId` | AM scan date. |
| `--rampMissedDetectorHitsStartScanDate` | `RampMissedDetectorHitsStartScanDate` | Yesterday in `TimeZoneId` | Ramp missed-hit start date. |
| `--rampMissedDetectorHitsEndScanDate` | `RampMissedDetectorHitsEndScanDate` | Today in `TimeZoneId` | Ramp missed-hit end date. |
| `--rampDetectorStartHour` | `RampDetectorStartHour` | `7` | Ramp detector start hour. |
| `--rampDetectorEndHour` | `RampDetectorEndHour` | `8` | Ramp detector end hour. |
| `--rampMissedDetectorHitStartHour` | `RampMissedDetectorHitStartHour` | `15` | Ramp missed-hit start hour. |
| `--rampMissedDetectorHitEndHour` | `RampMissedDetectorHitEndHour` | `7` | Ramp missed-hit end hour. |
| `--lowHitRampThreshold` | `LowHitRampThreshold` | `10` | Ramp low-hit volume threshold. |
| `--rampMissedEventsThreshold` | `RampMissedEventsThreshold` | `3` | Missed ramp event-bucket threshold. |
| `--emailPmErrors` | `EmailPmErrors` | `true` | Enable PM scan/email path. |
| `--emailAmErrors` | `EmailAmErrors` | `true` | Enable AM scan/email path. |
| `--emailRampErrors` | `EmailRampErrors` | `true` | Enable ramp scan/email path. |

CLI overrides also exist for the forwarded settings (see `generate --help`).
Use `YYYY-MM-DD` for explicit dates and pass `true` or `false` explicitly for
boolean options. For a repeatable historical scan, choose all four dates
deliberately rather than relying on today's defaults. See the
[WatchDog guide](WatchDog/README.md) for scan and notification behavior.

## Event collection and import settings

`eventlogutility` is also an optional `tools` service. Inspect commands before
connecting devices or importing files:

```sh
docker compose --profile tools run --rm eventlogutility log --help
```

| `.env` setting | Compose default | Purpose |
| --- | --- | --- |
| `DeviceDownloaderConfiguration__DeviceDownloader__BasePath` | `/app/logs` | Download destination in the container. |
| `DeviceDownloaderConfiguration__DeviceDownloader__DeleteRemoteFile` | `false` | Whether to delete downloaded files on the remote device. Keep false unless explicitly intended. |
| `DeviceDownloaderConfiguration__DeviceDownloader__Ping` | `false` | Enable the downloader ping check. |
| `EventLogImporterConfiguration__EventLogFileImporter__EarliestAcceptableDate` | `1980-01-01` | Earliest accepted event date. |
| `EventLogImporterConfiguration__EventLogFileImporter__DeleteSource` | `false` | Whether to delete source files after import. |
| `EventLogUtility__SiemensDecoder` | `false` | Enable the Siemens decoder configuration switch. |
| `DeviceEventLoggingConfiguration__Path` | `/app/logs` | Event-log working path in the container. |
| `DeviceEventLoggingConfiguration__ProcessingBatchSize` | `50000` | Event processing batch size. |
| `DeviceEventLoggingConfiguration__ParallelProcesses` | `50` | Configured processing parallelism. |

The bundled service has no persistent `/app/logs` mount. To retain or supply
files for a `run --rm` container, add a deliberate bind mount or volume in an
override and use the same path in download/import settings. No collector or
recurring scheduler is started automatically. Consult the
[event utility commands](EventLogUtility/Commands) and their `--help` output
for the available operations.

## Browser configuration

Edit `frontend-env.txt`, not `.env`, for these settings. The UI reads the mounted
file at startup; restart `webui` after editing it and reload the browser.
These values are public through `/api/get-env`.

| Key | Bundled value | Purpose |
| --- | --- | --- |
| `CONFIG_URL` | `/config` | Config API root through Nginx. |
| `IDENTITY_URL` | `/identity` | Identity API root through Nginx. |
| `DATA_URL` | `/data` | Data API root through Nginx. |
| `REPORTS_URL` | `/report` | Report API root through Nginx. |
| `MAP_DEFAULT_LATITUDE` | `40.758701` | Initial map latitude. |
| `MAP_DEFAULT_LONGITUDE` | `-111.876183` | Initial map longitude. |
| `MAP_TILE_LAYER` | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` | Tile URL template; retain required attribution. |
| `MAP_TILE_ATTRIBUTION` | OpenStreetMap copyright link | Tile provider attribution HTML. |
| `POWERED_BY_IMAGE_URL` | UDOT logo URL in `frontend-env.txt` | Footer image. |
| `MAP_DEFAULT_ZOOM` | Not set in bundled file | Optional map zoom. |
| `SPEED_URL` | Not set in bundled file | Optional speed API root; no separate speed service is defined by Compose. |
| `SPEED_LIMIT_MAP_LAYER` | Not set in bundled file | Optional speed-limit map layer. |

Keep the relative API roots for the bundled Nginx routes. External API URLs
require compatible routing, TLS, and cross-origin settings; changing a URL
alone does not provision a service.

## Old-to-current settings

Older README samples are not drop-in `.env` files for this fork. Preserve a
private backup, copy required values into the current template, and use the
mapping below. Unchanged passwords in the file do not migrate a database or
reset an existing account.

| Older sample | Current configuration or action |
| --- | --- |
| `CONFIG_CONNECTION` | Split into `DatabaseConfiguration__ConfigContext__Host`, `Port`, `User`, `Password`, `Database`, and `Options__...`. |
| `AGGREGATION_CONNECTION` | Same split under `DatabaseConfiguration__AggregationContext__...`. |
| `EVENTLOG_CONNECTION` | Same split under `DatabaseConfiguration__EventLogContext__...`. |
| `IDENTITY_CONNECTION` | Same split under `DatabaseConfiguration__IdentityContext__...`. |
| `ConfigContext_Provider` | `DatabaseConfiguration__ConfigContext__DBType=PostgreSql`. |
| `AggregationContext_Provider` | `DatabaseConfiguration__AggregationContext__DBType=PostgreSql`. |
| `EventLogContext_Provider` | `DatabaseConfiguration__EventLogContext__DBType=PostgreSql`. |
| `IdentityContext_Provider` | `DatabaseConfiguration__IdentityContext__DBType=PostgreSql`. |
| Connection string `Username` | Context `User`; not `Username`. |
| Connection string `Pooling`, `Timeout`, `CommandTimeout` | Context `Options__Pooling`, `Options__Timeout`, `Options__CommandTimeout`; values remain provider-specific. |
| `CERT_LOCATION=./nginx/certs:/root/.aspnet/https:ro` | Omit to use the current default, or use `./nginx/certs:/app/certs:ro`. |
| Certificate export `-passout pass:password` | Choose a private `CERT_PASSWORD`, use it for PFX export, and set the same value in `.env`. |
| `WatchdogConfiguration__ScanDate` | No single replacement. Use the four explicit date CLI options above for the intended scan, or leave dates automatic. |
| `WatchdogConfiguration__PreviousDayPMPeakStart` | `WatchdogConfiguration__PmPeakStartHour` (default `17`). |
| `WatchdogConfiguration__PreviousDayPMPeakEnd` | `WatchdogConfiguration__PmPeakEndHour` (default `18`). |
| `WatchdogConfiguration__ScanDayStartHour` | `WatchdogConfiguration__AmStartHour` (default `1`). |
| `WatchdogConfiguration__ScanDayEndHour` | `WatchdogConfiguration__AmEndHour` (default `5`). |
| `WatchdogConfiguration__WeekdayOnly=false` | Same key; explicitly retain false if you want weekend email. Current default is true. |
| Remaining WatchDog threshold/ramp-hour/email/sort keys in the old sample | Same names where listed in the forwarded-settings table. Replace the example email address with your own. |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_ROLE`, `ADMIN_PASSWORD`, `SEED_ADMIN`, `ALLOWED_HOSTS` | Same keys; supply private values appropriate to your installation. |
| `EmailConfiguration__Host`, `Port`, `UserName`, `Password`, `EnableSsl` | Same `.env` keys, with the full `EmailConfiguration__` prefix on each; Compose now maps them to the SMTP service section. |
| `JWT_KEY`, `JWT_ISSUER`, `JWT_EXPIRE_DAYS` | Same keys; generate your own key. Keep issuer consistent across services. Replacing an existing signing key invalidates previously issued tokens. |

The old connection/provider keys are unused by this Compose configuration;
leaving them in `.env` does not override the new database settings. The old
anonymous PostgreSQL volume is not automatically imported into `postgres_data`.
Preserve it and use a verified backup/restore before changing installations.

For certificates, local ports, volume preservation, and startup diagnosis,
return to [Existing installations](README.md#existing-installations) and
[Troubleshooting](README.md#troubleshooting). The source of truth for these
tables is [Compose](docker-compose.yml),
[WatchDog configuration](Infrastructure/Configuration/WatchdogConfiguration.cs),
and its [generate options](WatchDog/Commands/GenerateCommand.cs).
