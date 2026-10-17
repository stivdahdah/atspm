# Backup and recovery

Use this guide for the bundled Docker Compose PostgreSQL installation. Recovery creates a **separate installation and new database volume**. Keep the original installation until you have checked the recovered data and logged in with your existing account.

You need Python 3.10+, Git, Docker Compose v2, and sufficient disk space for the backup and another database volume. The examples use **PowerShell 7** and run from the source installation's `Atspm` directory. Replace the example paths and project names. `docker compose ls` shows your running project name.

Building on a replacement machine also requires network access to the base-image registries, NuGet and npm. The backup contains source and settings, not downloaded packages or prebuilt images.

External database servers, custom tablespaces, extra Compose files, custom certificate mounts, external file stores and additional bind mounts need their own backup procedure. This helper covers the default files and PostgreSQL named volume only.

## 1. Make a private backup

Pause imports, collectors, scheduled jobs and other database writers first. Each database dump is consistent individually; the helper does not take a simultaneous snapshot across databases. Keep writers paused until the backup succeeds. The database must stay running. Save tracked source changes in Git before backing up so the archived revision matches your installation.

```powershell
$SourceProject = 'my-atspm'
$Backup = 'E:\ATSPM-backups\2026-10-18'
python ./scripts/postgres_recovery.py backup --project $SourceProject --backup $Backup --compose-directory .
if ($LASTEXITCODE -ne 0) { throw 'Backup failed; do not use this directory for recovery.' }
```

Choose a new directory **outside the repository** each time. A successful run prints `PASS`. It saves every non-template database (including Identity and any initial user database), PostgreSQL roles and password hashes, `.env`, frontend settings, proxy configuration, Compose files, all three certificates, the committed source archive and a copy of the helper. A manifest records the source commit, PostgreSQL version and SHA-256 file checksums.

The backup contains passwords and private keys. Keep it private, copy it to a separate protected disk or backup system, and never commit it. A partially completed backup is not a recovery point. Keep earlier verified backups.

## 2. Prepare a separate recovery installation

Use the same PostgreSQL major version and archived application revision first. Upgrade only after recovery is verified. Choose an unused project name, a new empty directory and free web ports. Do not reuse the source project's volume or project name.

```powershell
$RecoveryProject = 'atspm-recovery-20261018'
$RecoveryRoot = 'E:\ATSPM-recovery\2026-10-18'
if (Test-Path $RecoveryRoot) { throw 'Choose a new recovery directory.' }
New-Item -ItemType Directory $RecoveryRoot | Out-Null
tar -xf "$Backup/source.tar" -C $RecoveryRoot
if ($LASTEXITCODE -ne 0) { throw 'Source extraction failed.' }
$Manifest = Get-Content "$Backup/manifest.json" -Raw | ConvertFrom-Json
Set-Location (Join-Path $RecoveryRoot $Manifest.composePath)
Copy-Item "$Backup/settings/*" . -Recurse -Force
# Copy-Item wildcard handling for hidden files varies; copy .env explicitly.
Copy-Item "$Backup/settings/.env" ./.env -Force
```

Keep your backed-up settings and certificates. Do not generate a new JWT key or reset the admin password during recovery. The database contains your existing accounts; the `.env` admin setting only controls initial seeding.

Generate a private resolved configuration. This removes published database/API ports, uses recovery-only web ports, forces a distinct database volume and disables admin seeding. Run these commands **from the recovered Atspm directory**:

```powershell
$Raw = docker compose -p $RecoveryProject config --format json
if ($LASTEXITCODE -ne 0) { throw 'Compose configuration failed.' }
$Config = $Raw | ConvertFrom-Json -AsHashtable
foreach ($Service in $Config.services.Values) { $Service.Remove('ports') | Out-Null }
$Config.services.nginx.ports = @(
    @{ target = 80; published = '3100'; host_ip = '127.0.0.1'; protocol = 'tcp' },
    @{ target = 443; published = '3543'; host_ip = '127.0.0.1'; protocol = 'tcp' }
)
$Volume = "${RecoveryProject}_postgres_data"
$Existing = docker volume ls -q --filter "name=^${Volume}$"
if ($LASTEXITCODE -ne 0 -or $Existing) { throw 'Choose a new recovery project and volume.' }
$Config.volumes.postgres_data = @{ name = $Volume }
$Installer = $Config.services.'database-installer'
$Installer.environment.SEED_ADMIN = 'false'
$SeedIndex = [Array]::IndexOf($Installer.entrypoint, '--seed-admin')
if ($SeedIndex -lt 0) { throw 'Installer configuration has changed; review before recovery.' }
$Installer.entrypoint[$SeedIndex + 1] = 'false'
$RecoveryCompose = Join-Path $RecoveryRoot '.recovery-compose.json'
$Config | ConvertTo-Json -Depth 100 | Set-Content $RecoveryCompose -Encoding utf8
```

This resolved file contains private values. Keep it at the recovery root, outside the `Atspm` and `WebUI` build contexts, so it is not sent to the image builder. Use **only this file** for all remaining recovery commands; adding the original Compose files can reintroduce conflicting ports. If the backed-up configuration uses an external network or custom mounts, stop and adapt the recovery procedure before starting anything.

For a drill that rebuilds the application without cached build steps, add `--pull --no-cache` to the `build` command below. There is no need to delete existing images, prune Docker or stop another installation.

```powershell
docker compose -p $RecoveryProject -f $RecoveryCompose build
if ($LASTEXITCODE -ne 0) { throw 'Recovery image build failed.' }
docker compose -p $RecoveryProject -f $RecoveryCompose up -d --wait postgres
if ($LASTEXITCODE -ne 0) { throw 'Recovery PostgreSQL failed to start.' }
python "$Backup/postgres_recovery.py" restore --project $RecoveryProject --backup $Backup
if ($LASTEXITCODE -ne 0) { throw 'Restore failed. Do not start the APIs.' }
docker compose -p $RecoveryProject -f $RecoveryCompose up -d --no-build
if ($LASTEXITCODE -ne 0) { throw 'Check recovery service logs.' }
```

Only PostgreSQL may be running in the recovery project when restoring. The helper checks every manifest file before issuing SQL, requires a new volume created after the backup, and rejects application databases or tables already present in the target. It restores roles, owners, grants, schemas, records and sequences. The already-created bootstrap role skips only its duplicate `CREATE ROLE`; its original password hash and privileges are restored. Other SQL errors stop recovery.

If a checksum fails, use an intact backup. If a restore fails partway, keep its logs and volume for investigation and retry in another fresh project; the helper deliberately refuses to overwrite a partially restored database. Do not use `docker volume prune` or remove your original volume to solve a recovery error.

## 3. Check the recovered installation

```powershell
docker compose -p $RecoveryProject -f $RecoveryCompose ps -a
docker compose -p $RecoveryProject -f $RecoveryCompose logs --tail 50 database-installer identityapi nginx
```

For a side-by-side browser drill, open `http://127.0.0.1:3100` while your original installation uses `localhost`. Different ports alone do not isolate login cookies. If using `https://localhost:3543`, use a separate browser profile to keep the original session separate; your browser may ask you to trust the existing local development certificate.

Log in with your **existing admin email and password**, open the Admin pages, and check your users, locations and expected records. Where traffic data exists, compare a known chart and CSV/JSON export with the original installation. Editing `ADMIN_PASSWORD` does not reset a restored account.

For a recovery drill, stop the separate installation afterward:

```powershell
docker compose -p $RecoveryProject -f $RecoveryCompose down
```

This keeps the recovery volume. Never add `-v` unless you intentionally want to delete that project's database. For a real cutover, first verify recovery and arrange downtime, backups, public URLs and port changes separately. These commands do not switch or modify your original installation.

See the [initial recovery validation](../docs/backup-restore-validation-2026-10-18.md) and [recovery from archived source](../docs/recovery-from-source-validation-2026-10-18.md) for the tested scope and limitations.
