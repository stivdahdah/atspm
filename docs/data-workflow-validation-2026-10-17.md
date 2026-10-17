# Validate controller import, charts, exports and Usage

Title: Initialize the file-decoding workflow before importing controller events.

## Problem and correction

`EventLogUtility decode-events --path ...` found a valid controller file but
failed with `ArgumentNullException: target` before decoding it. The hosted
service constructed `DecodeEventLogWorkflow` without calling `Initialize()`.
Its input block was therefore null. Initialize the workflow before sending
files, drain its output and wait for output completion as well as its steps.
The small-file regression test reproduces the original exception and verifies
that decoded events are persisted, the partial batch completes and the source
file is retained.

No API contracts, database migrations, package versions, authentication rules
or frontend behavior changed. Existing installations need a rebuilt
EventLogUtility image to use the correction. No database reset is required.

## Separate installation and fixture

Validation used a dedicated Compose project, `atspm-workflow-20261017`, with a
new named PostgreSQL volume, network, administrator, passwords and localhost
certificate. Only loopback ports 3080 and 3483 were exposed; database/API ports
were not published. Nothing was imported into the existing installation.
The unchanged API/UI images from the tested fork main were reused; the utility
was rebuilt from this branch using its repository Dockerfile.

The synthetic configuration was created through Config API, not direct SQL:

- Intersection `WF001`, named Synthetic Main / Validation Avenue, active from
  2026-01-01 with charting enabled and a synthetic region/jurisdiction.
- Approaches for protected phases 2 (NB) and 6 (SB), without physical detectors.
- Device `WFDEV001` linked to this location, status Testing, logging disabled,
  address 127.0.0.1. Its configuration selected `MaxtimeToIndianaDecoder`.
- One MaxTime XML file containing 144 events on 2026-10-17: twelve cycles per
  phase, each with green, termination, green-termination, yellow/red and
  phase-off events. Each phase has four gap-outs, four max-outs and four
  force-offs. All names, coordinates, addresses and data are synthetic.

## Repeating the workflow

Use a separate Compose installation following [the installation guide](../Atspm/README.md).
Give it a unique project name, volume, credentials and nonconflicting loopback
ports. Create the fixture's configuration above through the admin UI or Config
API. The decoder accepts XML events such as:

```xml
<EventResponses><EventResponse>
  <Event TimeStamp="2026-10-17T08:00:00" EventTypeID="1" Parameter="2" />
  <Event TimeStamp="2026-10-17T08:00:25" EventTypeID="4" Parameter="2" />
  <Event TimeStamp="2026-10-17T08:00:25" EventTypeID="7" Parameter="2" />
</EventResponse></EventResponses>
```

For the full fixture, repeat twelve cycles 90 seconds apart for phases 2 and 6;
offset phase 6 by 40 seconds. Per cycle use event/second pairs 1/0, termination/25,
7/25, 8/28, 9/31 and 11/32. Rotate termination codes 4, 5 and 6. Use a date in
the past or today, and ensure the location version starts before that date.

Mount the fixture directory at `/synthetic` on the `eventlogutility` service.
Files must be beneath a `<DeviceIdentifier>-<IP>` directory, for example
`/synthetic/WFDEV001-127.0.0.1/events.xml`. The device identifier must match a
configured device. Keep source-file and remote-file deletion disabled.

From the isolated Compose folder, including any override files used to create
that installation, build and run the supported commands:

```sh
docker compose -p atspm-workflow-20261017 build eventlogutility
docker compose -p atspm-workflow-20261017 run --rm --no-deps eventlogutility decode-events --path /synthetic
docker compose -p atspm-workflow-20261017 run --rm --no-deps eventlogutility extract --date 2026-10-17 --include-locations WF001 --filetype csv --path /synthetic/export-csv
docker compose -p atspm-workflow-20261017 run --rm --no-deps eventlogutility extract --date 2026-10-17 --include-locations WF001 --filetype json --path /synthetic/export-json
```

The generated frontend upload client references an `EventLogImport` endpoint
that is not implemented by the current Data API. Use the supported utility;
this change does not add a new upload API.

## Results

- Baseline container import exited 1 with the null-target exception. The new
  regression test failed with the same exception before the fix and passed
  afterward. The corrected container imported all 144 events and exited 0.
- Re-importing the same XML retained exactly 144 unique events.
- HTTP and certificate/hostname-verified HTTPS archive queries matched every
  source timestamp, event code and parameter. The archive retained its location.
- Purdue Phase Termination returned phases 2 and 6, each with exactly four
  gap-outs, four max-outs and four force-offs at the expected timestamps.
  The production browser UI generated the chart with the corresponding marks.
- Actual browser CSV and JSON downloads were captured and parsed. Both matched
  all 144 source events; JSON preserved the existing archive/location envelope.
  Command-line CSV and JSON exports also matched all 144 events.
- Usage persisted successful data-download and report records with byte sizes
  and user identity on both ports. Its browser totals, chart and request table
  populated; direct navigation and refresh worked. Counts include validation
  requests and are not a real agency usage measurement.
- InfrastructureTests: **175 passed, 0 failed, 1 existing skip**. The utility
  Docker build passed. Existing compiler warnings remain; none were suppressed.
  Frontend source/dependencies are unchanged, so its unit suites and image build
  were reused rather than rerun. The five previously deferred generated Speed
  Management mock type errors remain outside this change.

The browser checks used HTTP; HTTPS API checks trusted only the generated test
certificate and verified its hostname. This is a PostgreSQL synthetic-data
workflow check, not live-controller, hardware-decoder, other-provider or
production-load certification. No aggregation job was required for this raw
phase-termination chart; the other aggregation/metric workflows are not certified
by this fixture.

Local logs, synthetic input/output files, screenshots and preservation snapshots
are under `audit-evidence/data-workflow-20261017`, outside the repository.

After validation, the test project was stopped with its synthetic database
volume retained. The original installation kept all seven container IDs and
remained running. All 48 table counts and content fingerprints across its six
databases matched the pre-test snapshot, including users, credentials and
roles. Its database volume, `.env`, frontend settings and certificates were
unchanged. Nothing was pushed and no PR was opened.
