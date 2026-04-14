#!/usr/bin/env bash
# Start WebGoat.NET + Cloudflare Tunnel
# URL: https://asp.loadmagic.ai (stable, never changes)
# Alias: webgoat-start
set -euo pipefail

TUNNEL_NAME="asp"
TUNNEL_ID="a7f2b65c-1474-4ece-b4ef-8d640abb30a8"
CONTAINER_NAME="webgoat"
CONTAINER_PORT=9000
IMAGE="appsecco/owasp-webgoat-dot-net"
SQLITE_DB_PATH="/WebGoat.NET-master/WebGoat/App_Data/webgoat.sqlite3"

# --- Preflight checks ---
missing=""
command -v docker >/dev/null 2>&1 || missing="docker"
command -v cloudflared >/dev/null 2>&1 || missing="$missing cloudflared"
if [ -n "$missing" ]; then
    echo "Missing dependencies: $missing"
    echo "Install docker: https://docs.docker.com/engine/install/"
    echo "Install cloudflared: curl -L -o /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i /tmp/cloudflared.deb"
    exit 1
fi

if [ ! -f "$HOME/.cloudflared/$TUNNEL_ID.json" ]; then
    echo "Tunnel credentials not found at ~/.cloudflared/$TUNNEL_ID.json"
    echo "Copy from an authorised machine: scp user@host:~/.cloudflared/$TUNNEL_ID.json ~/.cloudflared/"
    echo "You also need: ~/.cloudflared/config.yml"
    exit 1
fi

echo "Starting WebGoat.NET (ASP.NET WebForms + ViewState)..."

# --- Docker container ---
if docker ps -q --filter "name=$CONTAINER_NAME" | grep -q .; then
    echo "WebGoat container already running."
elif docker ps -aq --filter "name=$CONTAINER_NAME" | grep -q .; then
    echo "Starting stopped container..."
    docker start "$CONTAINER_NAME"
else
    echo "Creating new container (first run — pulling image)..."
    docker run --name "$CONTAINER_NAME" -d -it -p "$CONTAINER_PORT:$CONTAINER_PORT" \
        --restart unless-stopped \
        --memory 512m \
        "$IMAGE"
fi

# Wait for WebGoat to be ready
echo -n "Waiting for WebGoat..."
for i in $(seq 1 15); do
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$CONTAINER_PORT/" 2>/dev/null | grep -q "302\|200"; then
        echo " ready!"
        break
    fi
    if [ "$i" -eq 15 ]; then
        echo " timeout — check: docker logs $CONTAINER_NAME"
        exit 1
    fi
    echo -n "."
    sleep 1
done

# --- Patches (don't survive container restart) ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Fix inverted login logic (binary DLL patch — source edits don't work, DLL takes precedence)
if [ -f "$SCRIPT_DIR/DotNetGoat.patched.dll" ]; then
    docker cp "$SCRIPT_DIR/DotNetGoat.patched.dll" "$CONTAINER_NAME:/WebGoat.NET-master/WebGoat/bin/DotNetGoat.dll" 2>/dev/null || true
fi
# Fix config: force SQLite and create missing WebGoatCoins config directory
docker exec "$CONTAINER_NAME" bash -c \
    "printf 'dbtype=Sqlite\nfilename=$SQLITE_DB_PATH\n' > /WebGoat.NET-master/WebGoat/Configuration/Default.config && \
     mkdir -p /WebGoat.NET-master/WebGoat/WebGoatCoins/Configuration && \
     printf 'dbtype=Sqlite\nfilename=$SQLITE_DB_PATH\n' > /WebGoat.NET-master/WebGoat/WebGoatCoins/Configuration/Default.config" 2>/dev/null || true

# --- Database (auto-seed on first run) ---
if docker exec "$CONTAINER_NAME" sqlite3 /WebGoat.NET-master/WebGoat/App_Data/webgoat.sqlite3 "SELECT COUNT(*) FROM CustomerLogin;" 2>/dev/null | grep -q "^[1-9]"; then
    : # DB already seeded
else
    echo "Seeding database (first run)..."
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    "$SCRIPT_DIR/webgoat-rebuild-db.sh"
fi

# --- Cloudflare Tunnel ---
# Prefer the systemd service (installed via `sudo cloudflared service install`);
# fall back to a detached process so older setups still work.
if systemctl is-active --quiet cloudflared 2>/dev/null; then
    echo "Tunnel running via systemd (cloudflared.service)."
elif pgrep -f "cloudflared tunnel run $TUNNEL_NAME" >/dev/null 2>&1; then
    echo "Tunnel already running."
else
    echo "Starting Cloudflare Tunnel..."
    nohup setsid cloudflared tunnel run "$TUNNEL_NAME" > /tmp/cloudflared-asp.log 2>&1 &
    echo $! > /tmp/cloudflared-asp.pid
    sleep 2
    if grep -q "Registered tunnel connection" /tmp/cloudflared-asp.log 2>/dev/null; then
        echo "Tunnel connected."
    else
        echo "Tunnel starting (check /tmp/cloudflared-asp.log if issues)..."
    fi
fi

echo ""
echo "========================================="
echo "  WebGoat.NET is live!"
echo "  URL:   https://asp.loadmagic.ai"
echo "  Local: http://localhost:$CONTAINER_PORT"
echo "  Stop:  webgoat-stop"
echo "========================================="
echo ""
echo "First run? Visit the URL and click 'Rebuild Database'"
