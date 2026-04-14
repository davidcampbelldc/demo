#!/usr/bin/env bash
# Rebuild WebGoat.NET database (fixes the broken "Rebuild Database" button)
# The built-in button fails because DROP TABLE lacks IF EXISTS on a fresh DB
set -euo pipefail

CONTAINER="webgoat"
DB="/WebGoat.NET-master/WebGoat/App_Data/webgoat.sqlite3"
WORKDIR="/WebGoat.NET-master/WebGoat"

if ! docker ps -q --filter "name=$CONTAINER" | grep -q .; then
    echo "WebGoat container is not running. Start it first: webgoat-start"
    exit 1
fi

echo "Rebuilding WebGoat.NET database..."

# Create schema (fix DROP TABLE statements to use IF EXISTS)
docker exec "$CONTAINER" bash -c "cd $WORKDIR && sed 's/^DROP TABLE /DROP TABLE IF EXISTS /g' DB_Scripts/create_webgoatcoins_sqlite3.sql | sqlite3 $DB"

# Load seed data
docker exec "$CONTAINER" bash -c "cd $WORKDIR && sqlite3 $DB < DB_Scripts/load_webgoatcoins_sqlite3.sql"

# Fix inverted login logic (IsValidCustomerLogin returns Rows.Count == 0, should be != 0)
docker exec "$CONTAINER" sed -i '95s/Rows.Count == 0/Rows.Count != 0/' "$WORKDIR/App_Code/DB/SqliteDbProvider.cs" 2>/dev/null && echo "Fixed login validation bug." || true

# Verify
COUNT=$(docker exec "$CONTAINER" sqlite3 "$DB" "SELECT COUNT(*) FROM CustomerLogin;")
TABLES=$(docker exec "$CONTAINER" sqlite3 "$DB" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")

echo "Done. $TABLES tables, $COUNT customer logins."
echo ""
echo "Test accounts:"
echo "  bob@ateliergraphique.com / 123456"
echo "  jerry@goatgoldstore.net  / password"
