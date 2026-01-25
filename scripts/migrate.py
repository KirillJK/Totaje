#!/usr/bin/env python3
"""
Database migration script for PostgreSQL.
Runs SQL files from ../database folder in order.
Tracks applied migrations in a migrations table.
"""

import os
import sys
import glob
import psycopg2
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from parent .env
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Database connection settings
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST', 'localhost'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB', 'jktota_db'),
    'user': os.getenv('POSTGRES_USER', 'jktota'),
    'password': os.getenv('POSTGRES_PASSWORD', 'jktota123'),
}

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), '..', 'database')


def get_connection():
    """Create database connection."""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        return conn
    except psycopg2.Error as e:
        print(f"Failed to connect to database: {e}")
        sys.exit(1)


def ensure_migrations_table(conn):
    """Create migrations tracking table if not exists."""
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS _migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
    conn.commit()


def get_applied_migrations(conn):
    """Get list of already applied migrations."""
    with conn.cursor() as cur:
        cur.execute("SELECT filename FROM _migrations ORDER BY filename")
        return {row[0] for row in cur.fetchall()}


def get_pending_migrations(applied):
    """Get list of SQL files that haven't been applied yet."""
    pattern = os.path.join(MIGRATIONS_DIR, '*.sql')
    all_files = sorted(glob.glob(pattern))

    pending = []
    for filepath in all_files:
        filename = os.path.basename(filepath)
        if filename not in applied:
            pending.append((filename, filepath))

    return pending


def apply_migration(conn, filename, filepath):
    """Apply a single migration file."""
    print(f"  Applying: {filename}...", end=' ')

    with open(filepath, 'r', encoding='utf-8') as f:
        sql = f.read()

    try:
        with conn.cursor() as cur:
            cur.execute(sql)
            cur.execute(
                "INSERT INTO _migrations (filename) VALUES (%s)",
                (filename,)
            )
        conn.commit()
        print("OK")
        return True
    except psycopg2.Error as e:
        conn.rollback()
        print(f"FAILED\n    Error: {e}")
        return False


def main():
    print(f"Database: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    print(f"Migrations dir: {MIGRATIONS_DIR}")
    print()

    conn = get_connection()

    try:
        ensure_migrations_table(conn)
        applied = get_applied_migrations(conn)
        pending = get_pending_migrations(applied)

        if not pending:
            print("No pending migrations.")
            return 0

        print(f"Found {len(pending)} pending migration(s):")
        for filename, _ in pending:
            print(f"  - {filename}")
        print()

        print("Applying migrations:")
        failed = 0
        for filename, filepath in pending:
            if not apply_migration(conn, filename, filepath):
                failed += 1
                break  # Stop on first failure

        print()
        if failed:
            print(f"Migration failed. {len(pending) - failed - 1} remaining.")
            return 1
        else:
            print(f"Successfully applied {len(pending)} migration(s).")
            return 0

    finally:
        conn.close()


if __name__ == '__main__':
    sys.exit(main())
