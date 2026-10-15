#!/bin/zsh
# Ice Realm: puts the site online from this Mac with one double-click.
# Starts the backend if it isn't running, opens a public Cloudflare link, copies the link,
# and keeps the Mac awake. Close this window, or press Ctrl+C, to take the site offline.

cd "${0:A:h}"
export JAVA_HOME="$HOME/.local/jdk-21/Contents/Home"
export PATH="$JAVA_HOME/bin:$HOME/.local/bin:$HOME/.local/node-22/bin:$PATH"

site_up() { curl -s -o /dev/null --max-time 3 http://localhost:8080/api/cities; }

started_backend=""
cleanup() {
  if [[ -n $started_backend ]]; then
    echo "Stopping Ice Realm…"
    kill $(lsof -nP -t -iTCP:8080 -sTCP:LISTEN) 2>/dev/null
  fi
}
trap cleanup EXIT INT TERM HUP

if ! site_up; then
  echo "Starting Ice Realm (this takes about a minute)…"
  (cd backend && ./mvnw -q spring-boot:run > ../backend.log 2>&1) &
  started_backend=yes
  for i in {1..90}; do site_up && break; sleep 2; done
  if ! site_up; then
    echo "Ice Realm didn't start. The details are in backend.log."
    exit 1
  fi
fi

# Keep the Mac awake for as long as this window is open.
caffeinate -dims -w $$ &

echo "Opening a public link…"
cloudflared tunnel --no-autoupdate --url http://localhost:8080 2>&1 | while read -r line; do
  if [[ $line =~ '(https://[a-z0-9-]+\.trycloudflare\.com)' ]]; then
    url=$match[1]
    print -n "$url" | pbcopy
    print ""
    print "  Ice Realm is online:  $url"
    print "  The link is copied. Paste it anywhere to share it."
    print "  Staff page:           $url/admin"
    print ""
    print "  Keep this window open. Close it to take the site offline."
    print ""
  fi
done
