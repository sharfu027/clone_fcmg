# Database Backup & Recovery Strategy

This directory contains backup policies, point-in-time recovery (PITR) documentation, and dump/restore utilities.

## Backup Policies
- Daily automated full pg_dump backups.
- WAL archiving for point-in-time recovery.
