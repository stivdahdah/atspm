# Data Export and Usage proxy routing

## Change

Direct requests to `/data/export` and `/data/usage` previously matched the
`/data/` API proxy and returned 404, including browser refreshes. The shared
HTTP/HTTPS Nginx server now sends only these two page documents, with an
optional trailing slash, to Next.js. It preserves the URI and query string;
Next.js retains responsibility for canonical redirects. Other `/data/` paths
continue to use the existing Data API proxy and prefix removal.

No application, API, database schema, dependency or environment setting changes
are required. Existing installations can apply the configuration with
`docker compose config --quiet`, `docker compose exec -T nginx nginx -t`, then
`docker compose exec -T nginx nginx -s reload` from the Compose folder. Include
the installation's usual `-p` option if it uses a custom project name.

## Validation procedure

Check both configured proxy ports, using the installation's certificate as a
trusted CA for HTTPS rather than disabling verification:

- Open `/data/export` and `/data/usage` directly and refresh each page.
- Repeat requests with a query string, a trailing slash, and both together.
  Confirm the final response is the correct Next.js page and redirects retain
  the query string.
- Fetch each page's JavaScript assets through the same port.
- Sign in with an existing administrator and request
  `/data/api/v1/EventLog/GetDataTypes` and
  `/data/api/v1/Aggregation/GetDataTypes`; confirm JSON data types are returned.
- Request `/config/api/v1/UsageEntry?$top=1&$count=true` with the same token;
  confirm the Usage page's OData collection and count are returned.
- Confirm anonymous `/identity/api/v1/Users` remains 401 and the same request
  with the administrator's token succeeds.
- Confirm `/data/export/not-a-page` and `/data/usage/not-a-page` still return
  API 404 responses rather than matching the frontend exception.

## Local results

The baseline returned 404 for both page URLs on HTTP port 3000 and HTTPS port
3443, including query strings and trailing slashes. The authenticated Data API
already worked on both ports (3 raw and 13 aggregation types).

After the change, all 32 document requests pass on both ports: two pages,
four URL forms per page and two loads per form. Each response is the correct
Next.js page. Trailing slashes redirect successfully and query strings survive.
All referenced JavaScript assets load through each port. Both Data API metadata
endpoints still return their expected nonempty JSON arrays; nested non-page
paths still return API 404 responses. Anonymous Users requests remain 401;
existing-admin login and authenticated Users requests succeed on both ports.

The candidate passes Nginx's syntax check in the running proxy container and
Compose configuration validation. It was applied with a graceful Nginx reload;
all seven service container IDs remained unchanged. Database backup archives
were created and their archive inventories checked before applying the change.
All 48 table row counts and content fingerprints across six databases match
the baseline, including Identity users, credentials and roles. The same data
volume, `.env`, frontend settings and certificates were preserved.

Browser direct navigation and refresh pass for Export and Usage on port 3000.
The existing admin can still sign in, Export loads 3 raw and 13 aggregation
types, and Usage renders its existing empty results. Authenticated UsageEntry
requests return the expected OData collection and count on both ports.

HTTPS verification uses the existing installation certificate as a trusted CA
and validates the hostname. HTTPS document reloads are tested as repeated GET
requests; browser rendering/refresh is exercised on HTTP. No browser security
warning is bypassed. There are no configured signal locations in this local
installation, so a real controller-data download is outside these checks.

Local evidence and private backups remain outside the repository in
`audit-evidence/proxy-routing-20261017`; no credentials, tokens, database
contents or private certificates are included in this document. This change
does not modify frontend/backend code or dependencies, so application unit
suites and production builds were not rerun for the proxy-only fix.
