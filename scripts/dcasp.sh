#!/bin/bash

# DCASP - WebGoat.NET ASP Demo Manager
# Manages the WebGoat.NET ViewState demo at asp.loadmagic.ai
# Install: ln -sf "$(pwd)/dcasp.sh" ~/.local/bin/dcasp

SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"

show_status() {
    local container_status tunnel_status url_status

    if docker ps -q --filter "name=webgoat" 2>/dev/null | grep -q .; then
        container_status="RUNNING"
    elif docker ps -aq --filter "name=webgoat" 2>/dev/null | grep -q .; then
        container_status="STOPPED"
    else
        container_status="NOT CREATED"
    fi

    if pgrep -f "cloudflared tunnel run asp" >/dev/null 2>&1; then
        tunnel_status="CONNECTED"
    else
        tunnel_status="OFFLINE"
    fi

    if [ "$container_status" = "RUNNING" ] && [ "$tunnel_status" = "CONNECTED" ]; then
        url_status="LIVE"
    else
        url_status="DOWN"
    fi

    echo ""
    echo "  Container:  $container_status"
    echo "  Tunnel:     $tunnel_status"
    echo "  URL:        https://asp.loadmagic.ai ($url_status)"
    echo "  Local:      http://localhost:9000"
    echo ""
}

show_menu() {
    clear 2>/dev/null || true
    echo "╔════════════════════════════════════════╗"
    echo "║       DCASP - WebGoat.NET Demo         ║"
    echo "║       asp.loadmagic.ai                 ║"
    echo "╠════════════════════════════════════════╣"
    echo "║  1. Start (container + tunnel)         ║"
    echo "║  2. Stop                               ║"
    echo "║  3. Status                             ║"
    echo "║  4. Rebuild Database                   ║"
    echo "║  5. Open in Browser                    ║"
    echo "║  6. View Logs                          ║"
    echo "║  7. Test Accounts                      ║"
    echo "║  8. Setup New Machine                  ║"
    echo "║  9. Exit                               ║"
    echo "╚════════════════════════════════════════╝"

    show_status

    echo -n "Select [1-9]: "
}

setup_new_machine() {
    echo ""
    echo "Setting up WebGoat.NET on a new machine..."
    echo ""

    # Check dependencies
    local missing=""
    command -v docker >/dev/null 2>&1 || missing="docker"
    command -v cloudflared >/dev/null 2>&1 || missing="$missing cloudflared"
    command -v bws >/dev/null 2>&1 || missing="$missing bws"

    if [ -n "$missing" ]; then
        echo "Missing: $missing"
        echo ""
        echo "Install:"
        echo "  docker:      https://docs.docker.com/engine/install/"
        echo "  cloudflared: curl -L -o /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb && sudo dpkg -i /tmp/cloudflared.deb"
        echo "  bws:         https://bitwarden.com/help/secrets-manager-cli/"
        echo ""
        echo "Then re-run: dcasp → 8"
        return 1
    fi

    # Pull tunnel credentials from Bitwarden
    local creds_file="$HOME/.cloudflared/a7f2b65c-1474-4ece-b4ef-8d640abb30a8.json"
    if [ -f "$creds_file" ]; then
        echo "Tunnel credentials already present."
    else
        echo "Pulling tunnel credentials from Bitwarden..."
        mkdir -p "$HOME/.cloudflared"
        bws secret get CLOUDFLARE_TUNNEL_ASP --output json | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['value'])" > "$creds_file"
        echo "Saved to $creds_file"
    fi

    # Create config.yml
    local config_file="$HOME/.cloudflared/config.yml"
    if [ -f "$config_file" ]; then
        echo "Tunnel config already present."
    else
        cat > "$config_file" << 'YAML'
tunnel: a7f2b65c-1474-4ece-b4ef-8d640abb30a8
credentials-file: HOMEDIR/.cloudflared/a7f2b65c-1474-4ece-b4ef-8d640abb30a8.json

ingress:
  - hostname: asp.loadmagic.ai
    service: http://localhost:9000
  - service: http_status:404
YAML
        sed -i "s|HOMEDIR|$HOME|g" "$config_file"
        echo "Created $config_file"
    fi

    # Pull Docker image
    echo "Pulling Docker image..."
    docker pull appsecco/owasp-webgoat-dot-net

    echo ""
    echo "Setup complete. Run: dcasp → 1 to start."
}

# Handle direct command (dcasp start / dcasp stop / etc)
if [ -n "${1:-}" ]; then
    case "$1" in
        start)   exec "$SCRIPT_DIR/webgoat-start.sh" ;;
        stop)    exec "$SCRIPT_DIR/webgoat-stop.sh" ;;
        rebuild) exec "$SCRIPT_DIR/webgoat-rebuild-db.sh" ;;
        status)  show_status; exit 0 ;;
        *)       echo "Usage: dcasp [start|stop|rebuild|status]"; exit 1 ;;
    esac
fi

# Interactive menu
while true; do
    show_menu
    read -r choice
    case $choice in
        1)
            echo ""
            "$SCRIPT_DIR/webgoat-start.sh"
            echo ""
            read -rp "Press Enter to continue..."
            ;;
        2)
            echo ""
            "$SCRIPT_DIR/webgoat-stop.sh"
            echo ""
            read -rp "Press Enter to continue..."
            ;;
        3)
            show_status
            read -rp "Press Enter to continue..."
            ;;
        4)
            echo ""
            "$SCRIPT_DIR/webgoat-rebuild-db.sh"
            echo ""
            read -rp "Press Enter to continue..."
            ;;
        5)
            echo "Opening https://asp.loadmagic.ai ..."
            xdg-open "https://asp.loadmagic.ai" 2>/dev/null || open "https://asp.loadmagic.ai" 2>/dev/null || echo "Open https://asp.loadmagic.ai in your browser"
            read -rp "Press Enter to continue..."
            ;;
        6)
            echo ""
            echo "=== Docker logs (last 30 lines) ==="
            docker logs --tail 30 webgoat 2>&1
            echo ""
            echo "=== Tunnel log ==="
            tail -15 /tmp/cloudflared-asp.log 2>/dev/null || echo "No tunnel log found"
            echo ""
            read -rp "Press Enter to continue..."
            ;;
        7)
            echo ""
            echo "╔════════════════════════════════════════════════╗"
            echo "║  Test Accounts (WebGoat Coins Portal)         ║"
            echo "╠════════════════════════════════════════════════╣"
            echo "║  bob@ateliergraphique.com    / 123456         ║"
            echo "║  jerry@goatgoldstore.net     / password       ║"
            echo "║  bill@australiancollectors.net / love         ║"
            echo "║  mark@larochellegold.net     / 12345678       ║"
            echo "║  jill@baanepreciousimports.net / princess     ║"
            echo "╚════════════════════════════════════════════════╝"
            echo ""
            read -rp "Press Enter to continue..."
            ;;
        8)
            setup_new_machine
            read -rp "Press Enter to continue..."
            ;;
        9)
            echo "Bye."
            exit 0
            ;;
        *)
            echo "Invalid option."
            sleep 1
            ;;
    esac
done
