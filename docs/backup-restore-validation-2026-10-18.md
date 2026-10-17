# Backup and restore validation — 2026-10-18

Branch: `enhancement/backup-restore-validation`. Application source tested: fork main `ba6c877c7e24e2534669713189d95ee9537f702a` with PostgreSQL 16.

## Scope

The recovery helper and [recovery guide](../Atspm/BACKUP-RESTORE.md) cover the default Compose PostgreSQL named volume. No application API contracts, database migrations or upstream configuration keys change.

Two separate recovery projects used new volumes and non-conflicting loopback web ports. The original installation remained running. Recovery reused the matching locally built application images; a cold image build from the archived source was not repeated in this drill.

The follow-up [recovery from archived source](recovery-from-source-validation-2026-10-18.md) covers rebuilding all eight application/tool images without existing application images, restoring synthetic traffic records, and checking charts and exports.

## Checks

- Backed up all six non-template databases using custom-format `pg_dump` archives, validated their archive listings, and saved global roles, private configuration, certificates and matching Git source.
- Completed an initial full restore and another full restore through `scripts/postgres_recovery.py`.
- Compared all 48 application tables: names, record counts and sorted record-content fingerprints matched the original baseline.
- Compared database schemas, owners, grants, sequence definitions and values across all six databases.
- Compared PostgreSQL login-role attributes and password hashes, private settings and certificates without exposing their values.
- Verified existing admin credentials, Admin authorization and authenticated Users access on HTTP and HTTPS. Anonymous Users requests returned 401. HTTPS checks verified the certificate and hostname.
- Checked Login, About, Data Export and Usage direct pages. A browser login in the first restored installation reached the application with the Admin menu.
- Confirmed the helper refuses the source project, an older recovery volume, a corrupted archive and a second restore into a populated cluster.
- Executed the guide's PowerShell configuration block and validated the resulting Compose file, separate volume, recovery ports and disabled admin seeding.
- Final before/after comparison confirmed the original database volume, all table contents, Identity accounts, private settings and certificates were unchanged.

The source contained existing users and seeded configuration, but no signal locations or live traffic events. This drill therefore verifies the available database contents and account recovery; it does not claim recovery testing on a large traffic archive. Import, chart and CSV/JSON behavior with synthetic events was tested separately in [data workflow validation](data-workflow-validation-2026-10-17.md).

## Operational limits

Pause all writers for cross-database consistency; per-database dumps are not a simultaneous cluster snapshot. Restore to the same PostgreSQL major version and application revision first. External databases, extra mounts and custom deployment files require a separately reviewed procedure.

Backup files include private keys and passwords and stay outside Git. Recovery never performs an automatic cutover or deletes the original volume. Test projects are stopped after verification while their recovery volumes remain available for inspection.
