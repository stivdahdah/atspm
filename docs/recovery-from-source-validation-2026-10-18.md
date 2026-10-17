# Recovery from archived source — 2026-10-18

Branch: `enhancement/recovery-from-source-validation`.

## Scope and setup

This drill closes the image-reuse and traffic-data gaps in the [initial recovery validation](backup-restore-validation-2026-10-18.md). It uses the existing [synthetic workflow fixture](data-workflow-validation-2026-10-17.md): location `WF001`, a disabled-logging test device, phases 2 and 6, and 144 controller events on 2026-10-17. No physical controller or live agency data is involved.

The backup helper archived six databases from the retained synthetic PostgreSQL installation, its existing test administrator, global roles, settings, certificates and source revision `ea00cdaa989ff903ec0a42d547a327e6a8c05eac`. The source checkout matched that committed revision; the backup file checksums were checked before extraction and again by the restore helper.

Recovery used project `atspm-source-recovery-20261018`, a new named volume, a separate network and loopback web ports 3140/3583. Database and API ports were not published. Admin seeding was disabled in both the installer environment and command arguments.

## Build results

- All **2,702 archived source files** remained byte-identical after extracting settings and completing the builds. No application source changes were needed.
- All **eight application/tool images** were built from the extracted archive: DatabaseInstaller, ConfigApi, DataApi, ReportApi, IdentityApi, WebUI, EventLogUtility and WatchDog.
- A separate, initially empty `docker-container` BuildKit builder was used with `--pull --no-cache --load`. Each output had a unique recovery image tag that did not exist before its build. Existing ATSPM application images and host-builder application layers were not inputs.
- Image IDs and revision labels were checked before startup. Recovery started with `--no-build --pull never`, using the newly built application images. PostgreSQL and Nginx used official base images pulled from their registries.
- The production WebUI build installed dependencies from its lockfile and generated **44 pages**. Existing compiler/package warnings and the frontend build's existing type-check bypass remain. This drill does not establish a clean standalone TypeScript check or resolve the five deferred Speed Management mock diagnostics.

This was a cold application build on the existing Docker host using an empty builder, not a new operating-system installation or an offline recovery. Base-image registries, NuGet and npm were available over the network.

## Restore and application results

| Check | Result |
| --- | --- |
| All six databases and 48 application tables | Identical record counts and sorted record-content fingerprints before starting application services |
| Database definitions and permissions | Schema, ownership, grants and sequence definitions/values matched |
| PostgreSQL login roles | Attributes and password hashes matched, compared without exposing their values |
| Existing test administrator | Login succeeded without reseeding; Admin claims and authenticated Users access worked on HTTP and HTTPS |
| Anonymous Users access | HTTP 401 on both ports |
| HTTPS | Certificate chain and hostname verified against the backed-up test certificate |
| Traffic archive | Both ports returned exactly all 144 source events with matching locations, timestamps, event codes and parameters |
| Purdue Phase Termination | Both ports returned phases 2 and 6, each with four gap-outs, four max-outs and four force-offs at the expected timestamps |
| Production browser chart | Restored intersection/date selected; chart rendered both phases and termination series |
| Browser CSV and JSON downloads | Actual downloaded files parsed; each matched all 144 source events; JSON retained its archive/location envelope |
| EventLogUtility CSV and JSON exports | Both cold-built utility exports completed and matched all 144 events; CSV retained the location |
| Usage | Successful data-download/report records persisted with byte sizes and user identity |
| Login, About, Export and Usage direct pages | HTTP 200 on both ports |

The browser drill used `127.0.0.1` while the original browser tabs used `localhost`, keeping their login cookies separate. HTTPS API tests used a client without browser cookies.

## Recovery documentation correction

The previous guide stored its resolved Compose JSON inside the backend image build context. That file contains expanded passwords. The guide now places it at the recovery root, outside both application build contexts, and uses that path consistently for subsequent commands. Both Docker ignore files also exclude `.recovery-compose.json` at any depth.

A real Docker `FROM scratch` / `COPY` probe with harmless synthetic password sentinels reproduced the previous inclusion. With each corrected ignore file, root and nested recovery configurations were excluded, `.env` stayed excluded, and public source remained available. All eight recovered runtime images were also checked for the private recovery filename; none contained it.

The guide's exact PowerShell extraction/settings-copy block preserved every backed-up settings file and certificate checksum. Its revised configuration block generated valid isolated ports, volume and disabled admin seeding, with the private file outside all build contexts.

## Preservation and limits

The original installation stayed running. Its database volume, all 48 table counts/content fingerprints (including admin credentials and roles), private settings and certificates were compared before and after the drill. The test project was stopped without deleting its recovered volume; its backup, exported files and local verification evidence remain outside Git. Only the two temporary builders created for this drill were removed.

This validates recovery of the small synthetic traffic archive, not large-history performance, every metric/aggregation workflow, hardware decoding, other database providers or a production cutover. No API contract, database migration, dependency version, authentication behavior or application implementation changes are introduced.
