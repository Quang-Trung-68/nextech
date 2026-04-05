#!/bin/bash

# init-letsencrypt.sh
# Run this script ONCE on your VPS to obtain the initial SSL certificates.
# Requires: .env (copy from .env.deploy.template), DNS pointing to this server.
# After success, deploy the full stack: bash scripts/deploy.sh

set -e

if ! [ -x "$(command -v docker)" ]; then
  echo "Error: docker is not installed." >&2
  exit 1
fi

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

RSA_KEY_SIZE=4096
DATA_PATH="./certbot"
STAGING=0 # Set to 1 to test without hitting Let's Encrypt rate limits

# --- Load .env ---
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
else
  echo "ERROR: .env file not found! Copy .env.deploy.template to .env first."
  exit 1
fi

EMAIL="${CERTBOT_EMAIL}"
if [ -z "$EMAIL" ]; then
  echo "ERROR: CERTBOT_EMAIL is empty in .env. Please set it."
  exit 1
fi

# Certificate groups:
# Group 1: nextech.io.vn + www.nextech.io.vn  → stored under nextech.io.vn
# Group 2: api.nextech.io.vn                  → stored under api.nextech.io.vn
declare -A CERT_GROUPS
CERT_GROUPS["nextech.io.vn"]="-d nextech.io.vn -d www.nextech.io.vn"
CERT_GROUPS["api.nextech.io.vn"]="-d api.nextech.io.vn"

if [ -d "$DATA_PATH" ]; then
  read -p "Existing certbot data found. Continue and replace existing certificate? (y/N) " decision
  if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
    exit 0
  fi
fi

# 1. Download recommended TLS parameters from Certbot
if [ ! -e "$DATA_PATH/conf/options-ssl-nginx.conf" ] || [ ! -e "$DATA_PATH/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters ..."
  mkdir -p "$DATA_PATH/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$DATA_PATH/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$DATA_PATH/conf/ssl-dhparams.pem"
  echo "### Done."
fi

# 2. Create dummy certificates so Nginx can start before real certs exist
for primary_domain in "${!CERT_GROUPS[@]}"; do
  echo "### Creating dummy certificate for $primary_domain ..."
  mkdir -p "$DATA_PATH/conf/live/$primary_domain"
  docker compose -f "$COMPOSE_FILE" run --rm --entrypoint \
    "openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
      -keyout /etc/letsencrypt/live/$primary_domain/privkey.pem \
      -out /etc/letsencrypt/live/$primary_domain/fullchain.pem \
      -subj '/CN=localhost'" \
    certbot
  echo "### Done."
done

# 3. Start stack so nginx can resolve upstreams (frontend, backend, soketi)
echo "### Starting postgres, soketi, backend, frontend, nginx (build if needed) ..."
docker compose -f "$COMPOSE_FILE" up --force-recreate -d --build postgres soketi backend frontend nginx
sleep 5
echo "### Stack started."

# 4. Delete dummy certificates
for primary_domain in "${!CERT_GROUPS[@]}"; do
  echo "### Deleting dummy certificate for $primary_domain ..."
  docker compose -f "$COMPOSE_FILE" run --rm --entrypoint \
    "rm -Rf /etc/letsencrypt/live/$primary_domain \
       /etc/letsencrypt/archive/$primary_domain \
       /etc/letsencrypt/renewal/$primary_domain.conf" \
    certbot
  echo "### Done."
done

# 5. Request real certificates from Let's Encrypt
echo "### Requesting Let's Encrypt certificates ..."

if [ $STAGING -ne 0 ]; then
  STAGING_FLAG="--staging"
else
  STAGING_FLAG=""
fi

for primary_domain in "${!CERT_GROUPS[@]}"; do
  domain_args="${CERT_GROUPS[$primary_domain]}"
  echo "### Requesting cert for: $domain_args ..."

  docker compose -f "$COMPOSE_FILE" run --rm --entrypoint \
    "certbot certonly --webroot -w /var/www/certbot \
      $STAGING_FLAG \
      --email $EMAIL \
      $domain_args \
      --key-type rsa \
      --rsa-key-size $RSA_KEY_SIZE \
      --agree-tos \
      --force-renewal \
      --no-eff-email" \
    certbot
  echo "### Done."
done

# 6. Reload Nginx with real certs
echo "### Reloading nginx ..."
docker compose -f "$COMPOSE_FILE" exec nginx nginx -s reload

echo ""
echo "✅ SSL certificates obtained successfully!"
echo "   Start / refresh full stack: bash scripts/deploy.sh"
