#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:9000}"
USERNAME="${WEBGOAT_USERNAME:-jerry@goatgoldstore.net}"
PASSWORD="${WEBGOAT_PASSWORD:-password}"

need_cmd() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Missing dependency: $1" >&2
        exit 1
    fi
}

need_cmd curl
need_cmd perl
need_cmd rg

BASE_URL="${BASE_URL%/}"
TMP_DIR="$(mktemp -d)"
COOKIE_JAR="$TMP_DIR/cookies.txt"
DEFAULT_HTML="$TMP_DIR/default.html"
LOGIN_HTML="$TMP_DIR/login.html"
LOGIN_HDR="$TMP_DIR/login.hdr"
POST_HDR="$TMP_DIR/post.hdr"
POST_BODY="$TMP_DIR/post.html"
MAIN_HDR="$TMP_DIR/main.hdr"
MAIN_BODY="$TMP_DIR/main.html"

cleanup() {
    rm -rf "$TMP_DIR"
}
trap cleanup EXIT

fetch_page() {
    local url="$1"
    local hdr="$2"
    local body="$3"

    curl -fsS \
        -D "$hdr" \
        -o "$body" \
        -c "$COOKIE_JAR" \
        -b "$COOKIE_JAR" \
        "$url"
}

echo "Smoke-testing auth flow at $BASE_URL"
echo "Using account: $USERNAME"

# Fresh sessions are redirected to Default.aspx by Site.Master before the
# customer-login page can render, so always warm the session first.
fetch_page "$BASE_URL/Default.aspx" "$TMP_DIR/default.hdr" "$DEFAULT_HTML"

fetch_page "$BASE_URL/WebGoatCoins/CustomerLogin.aspx" "$LOGIN_HDR" "$LOGIN_HTML"

LOGIN_STATUS="$(awk 'NR==1 {print $2}' "$LOGIN_HDR")"
if [ "$LOGIN_STATUS" != "200" ]; then
    echo "Expected CustomerLogin.aspx to return 200 after warm-up, got $LOGIN_STATUS" >&2
    sed -n '1,20p' "$LOGIN_HDR" >&2
    exit 1
fi

if ! rg -q 'ctl00\$BodyContentPlaceholder\$txtUserName' "$LOGIN_HTML"; then
    echo "Login form not found in CustomerLogin.aspx response" >&2
    exit 1
fi

VIEWSTATE="$(perl -0ne 'print $1 if /id="__VIEWSTATE" value="([^"]+)"/' "$LOGIN_HTML")"
EVENTVALIDATION="$(perl -0ne 'print $1 if /id="__EVENTVALIDATION" value="([^"]+)"/' "$LOGIN_HTML")"

if [ -z "$VIEWSTATE" ] || [ -z "$EVENTVALIDATION" ]; then
    echo "Missing __VIEWSTATE or __EVENTVALIDATION in login form" >&2
    exit 1
fi

curl -fsS \
    -D "$POST_HDR" \
    -o "$POST_BODY" \
    -c "$COOKIE_JAR" \
    -b "$COOKIE_JAR" \
    -X POST "$BASE_URL/WebGoatCoins/CustomerLogin.aspx" \
    --data-urlencode "__VIEWSTATE=$VIEWSTATE" \
    --data-urlencode "__EVENTVALIDATION=$EVENTVALIDATION" \
    --data-urlencode "__EVENTTARGET=" \
    --data-urlencode "__EVENTARGUMENT=" \
    --data-urlencode "ctl00\$BodyContentPlaceholder\$txtUserName=$USERNAME" \
    --data-urlencode "ctl00\$BodyContentPlaceholder\$txtPassword=$PASSWORD" \
    --data-urlencode "ctl00\$BodyContentPlaceholder\$buttonLogOn=Login"

POST_STATUS="$(awk 'NR==1 {print $2}' "$POST_HDR")"
POST_LOCATION="$(awk 'BEGIN {IGNORECASE=1} /^Location:/ {print $2}' "$POST_HDR" | tr -d '\r')"

if [ "$POST_STATUS" != "302" ]; then
    echo "Expected login POST to return 302, got $POST_STATUS" >&2
    sed -n '1,20p' "$POST_HDR" >&2
    sed -n '1,80p' "$POST_BODY" >&2
    exit 1
fi

if [ "$POST_LOCATION" != "/WebGoatCoins/MainPage.aspx" ]; then
    echo "Expected login redirect to /WebGoatCoins/MainPage.aspx, got ${POST_LOCATION:-<empty>}" >&2
    sed -n '1,20p' "$POST_HDR" >&2
    exit 1
fi

if ! rg -q $'\tcustomer_login\t' "$COOKIE_JAR"; then
    echo "Auth cookie customer_login was not issued" >&2
    cat "$COOKIE_JAR" >&2
    exit 1
fi

fetch_page "$BASE_URL/WebGoatCoins/MainPage.aspx" "$MAIN_HDR" "$MAIN_BODY"

MAIN_STATUS="$(awk 'NR==1 {print $2}' "$MAIN_HDR")"
if [ "$MAIN_STATUS" != "200" ]; then
    echo "Expected MainPage.aspx to return 200, got $MAIN_STATUS" >&2
    sed -n '1,20p' "$MAIN_HDR" >&2
    exit 1
fi

if rg -q 'Incorrect username/password|ReturnUrl=%2fWebGoatCoins%2fMainPage.aspx' "$MAIN_BODY"; then
    echo "Main page still looks unauthenticated" >&2
    rg -n 'Incorrect username/password|ReturnUrl=%2fWebGoatCoins%2fMainPage.aspx' "$MAIN_BODY" -n -C 2 >&2
    exit 1
fi

if ! rg -q 'HeadLoginStatus\$ctl00|>Logout<' "$MAIN_BODY"; then
    echo "Authenticated logout link not found on MainPage.aspx" >&2
    exit 1
fi

echo "Auth smoke test passed"
echo "  Base URL: $BASE_URL"
echo "  Redirect: $POST_LOCATION"
echo "  Cookie: customer_login issued"
