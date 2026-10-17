"""Back up bundled Compose PostgreSQL, or restore into a fresh isolated cluster.

Licensed under the repository's Apache License 2.0.
Requires Python 3.10+, Git (backup only), Docker and Docker Compose v2.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys


def run(*args, **kwargs):
    return subprocess.run(args, check=True, capture_output=True, **kwargs)


def docker(*args, **kwargs):
    return run('docker', *args, **kwargs)


def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest() if hasattr(hashlib, 'file_digest') else hashlib.sha256(stream.read()).hexdigest()


def postgres(project):
    ids = docker('ps', '-q', '--filter', 'label=com.docker.compose.project=' + project,
                 '--filter', 'label=com.docker.compose.service=postgres', text=True).stdout.split()
    if len(ids) != 1:
        raise ValueError('Expected one running Compose postgres service for the selected project.')
    container = ids[0]
    info = json.loads(docker('inspect', container, text=True).stdout)[0]
    mounts = [mount for mount in info['Mounts'] if mount['Destination'] == '/var/lib/postgresql/data']
    if len(mounts) != 1 or mounts[0]['Type'] != 'volume':
        raise ValueError('Only the bundled PostgreSQL named-volume setup is supported.')
    user = docker('exec', container, 'printenv', 'POSTGRES_USER', text=True).stdout.strip()
    return container, mounts[0]['Name'], user


def query(container, user, database, sql):
    return docker('exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', user,
                  '-d', database, '-At', input=sql, text=True).stdout.strip()


def databases(container, user):
    return query(container, user, 'template1', 'SELECT datname FROM pg_database WHERE NOT datistemplate ORDER BY datname;').splitlines()


def backup(args):
    root, destination = args.compose_directory.resolve(), args.backup.resolve()
    if destination.exists():
        raise ValueError('Choose a new backup directory; existing backups are never overwritten.')
    container, volume, user = postgres(args.project)
    if query(container, user, 'postgres', "SELECT count(*) FROM pg_tablespace WHERE spcname NOT IN ('pg_default','pg_global');") != '0':
        raise ValueError('Custom tablespaces require a separate recovery procedure.')
    repo = Path(run('git', '-C', str(root), 'rev-parse', '--show-toplevel', text=True).stdout.strip())
    if destination.is_relative_to(repo):
        raise ValueError('Keep private backups outside the Git repository.')
    compose_path = root.relative_to(repo)
    if run('git', '-C', str(repo), 'diff', '--name-only', 'HEAD', text=True).stdout.strip():
        raise ValueError('Save tracked source changes before archiving the matching source revision.')
    # Check every required private file before creating a partial backup.
    private = ['.env', 'frontend-env.txt', 'default.conf', 'docker-compose.yml',
               'nginx/certs/aspnetapp.crt', 'nginx/certs/aspnetapp.key', 'nginx/certs/aspnetapp.pfx']
    if (root / 'docker-compose.override.yml').exists():
        private.append('docker-compose.override.yml')
    if not all((root / name).is_file() for name in private):
        raise ValueError('The Compose directory must contain its settings and all three certificates.')
    destination.mkdir(parents=True)
    manifest = {'format': 1, 'createdUtc': datetime.now(timezone.utc).isoformat(),
                'sourceProject': args.project, 'sourceVolume': volume, 'postgresUser': user,
                'postgresVersion': query(container, user, 'postgres', 'SHOW server_version_num;'),
                'sourceCommit': run('git', '-C', str(repo), 'rev-parse', 'HEAD', text=True).stdout.strip(),
                'composePath': compose_path.as_posix(), 'databases': [], 'files': {}}
    # Write binary archives directly to files; never use shell redirection.
    for index, database in enumerate(databases(container, user)):
        filename = f'database-{index}.dump'
        with (destination / filename).open('wb') as output:
            subprocess.run(['docker', 'exec', container, 'pg_dump', '-U', user, '-Fc', database],
                           stdout=output, stderr=subprocess.PIPE, check=True)
        with (destination / filename).open('rb') as source:
            docker('exec', '-i', container, 'pg_restore', '--list', stdin=source)
        manifest['databases'].append({'name': database, 'file': filename})
    with (destination / 'globals.sql').open('wb') as output:
        subprocess.run(['docker', 'exec', container, 'pg_dumpall', '-U', user, '--globals-only'],
                       stdout=output, stderr=subprocess.PIPE, check=True)
    for name in private:
        target = destination / 'settings' / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(root / name, target)
    run('git', '-C', str(repo), 'archive', '--format=tar', '--output=' + str(destination / 'source.tar'), 'HEAD')
    shutil.copyfile(__file__, destination / 'postgres_recovery.py')
    for path in sorted(destination.rglob('*')):
        if path.is_file():
            manifest['files'][path.relative_to(destination).as_posix()] = sha(path)
    (destination / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    print(f'PASS: {len(manifest["databases"])} database archives, global roles, source and private settings backed up. Keep this directory private.')


def restore(args):
    directory = args.backup.resolve()
    manifest = json.loads((directory / 'manifest.json').read_text(encoding='utf-8'))
    if manifest['format'] != 1 or args.project == manifest['sourceProject']:
        raise ValueError('Restore requires a different, fresh recovery project.')
    required = ['globals.sql', 'source.tar'] + [entry['file'] for entry in manifest['databases']]
    if not manifest['databases'] or any(name not in manifest['files'] for name in required):
        raise ValueError('Backup manifest is missing required archives or checksums.')
    for name, expected in manifest['files'].items():
        path = (directory / name).resolve()
        if not path.is_relative_to(directory) or sha(path) != expected:
            raise ValueError('Backup checksum/path validation failed; nothing restored.')
    container, volume, user = postgres(args.project)
    created = json.loads(docker('volume', 'inspect', volume, text=True).stdout)[0]['CreatedAt']
    if volume == manifest['sourceVolume'] or datetime.fromisoformat(created.replace('Z', '+00:00')) < datetime.fromisoformat(manifest['createdUtc']):
        raise ValueError('Target volume must be different and created after this backup.')
    if user != manifest['postgresUser']:
        raise ValueError('Initialize recovery PostgreSQL with the backed-up POSTGRES_USER.')
    if int(query(container, user, 'postgres', 'SHOW server_version_num;')) // 10000 != int(manifest['postgresVersion']) // 10000:
        raise ValueError('Use the same PostgreSQL major version for this recovery procedure.')
    services = docker('ps', '-q', '--filter', 'label=com.docker.compose.project=' + args.project, text=True).stdout.split()
    if services != [container]:
        raise ValueError('Start only PostgreSQL before restoring; other recovery services must be stopped.')
    if set(databases(container, user)) - {'postgres', user}:
        raise ValueError('Target cluster already has application databases; refusing to overwrite them.')
    for database in databases(container, user):
        count = query(container, user, database, "SELECT count(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') AND schemaname NOT LIKE 'pg_toast%';")
        if count != '0':
            raise ValueError('Target cluster is not empty; refusing to overwrite its data.')
    globals_sql = (directory / 'globals.sql').read_text(encoding='utf-8').splitlines()
    create = query(container, user, 'postgres', "SELECT format('CREATE ROLE %I;', current_user);")
    if globals_sql.count(create) != 1:
        raise ValueError('Unexpected bootstrap-role definition; nothing restored.')
    # A fresh cluster already has its bootstrap role. Skip only that CREATE;
    # restore its ALTER ROLE, password hash and privileges without ignoring errors.
    roles = '\n'.join(line for line in globals_sql if line != create)
    docker('exec', '-i', container, 'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-U', user,
           '-d', 'template1', input=roles, text=True)
    for database in manifest['databases']:
        with (directory / database['file']).open('rb') as source:
            docker('exec', '-i', container, 'pg_restore', '-U', user, '--exit-on-error', '--clean',
                   '--if-exists', '--create', '--dbname=template1', stdin=source)
    print(f'PASS: restored all {len(manifest["databases"])} databases and global roles into the fresh recovery volume. Start APIs only after this succeeds.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('backup', 'restore'))
    parser.add_argument('--project', required=True, help='Explicit Compose project name')
    parser.add_argument('--backup', required=True, type=Path, help='Private backup directory')
    parser.add_argument('--compose-directory', type=Path, default=Path.cwd(), help='Source Atspm directory (backup only)')
    args = parser.parse_args()
    try:
        (backup if args.mode == 'backup' else restore)(args)
    except (ValueError, OSError, subprocess.CalledProcessError, KeyError) as error:
        # Do not print captured Docker/SQL output: it can contain private settings.
        print(f'FAILED: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
