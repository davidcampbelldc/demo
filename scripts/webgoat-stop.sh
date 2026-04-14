#!/usr/bin/env bash
# Stop WebGoat.NET + Cloudflare Tunnel
# Alias: webgoat-stop
set -euo pipefail

# The Cloudflare Tunnel runs as a systemd service (cloudflared.service) that
# survives terminal close and reboot. Leave it alone — stopping WebGoat just
# makes asp.loadmagic.ai return a 502, which is the intended offline signal.
if systemctl is-active --quiet cloudflared 2>/dev/null; then
    echo "Leaving cloudflared.service running (persistent tunnel)."
else
    echo "Stopping Cloudflare Tunnel..."
    if [ -f /tmp/cloudflared-asp.pid ]; then
        kill "$(cat /tmp/cloudflared-asp.pid)" 2>/dev/null || true
        rm -f /tmp/cloudflared-asp.pid
    fi
    pkill -f "cloudflared tunnel run asp" 2>/dev/null || true
fi

echo "Stopping WebGoat container..."
docker stop webgoat 2>/dev/null || true

echo "Done. WebGoat offline (tunnel still up if managed by systemd)."
