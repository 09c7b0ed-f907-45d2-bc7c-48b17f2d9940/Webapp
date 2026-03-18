# Webapp Service — Runbook

This README only covers:

- How to run the webapp as a developer
- How to run it in production

---

## Related repositories

- Webapp (this repo): https://github.com/09c7b0ed-f907-45d2-bc7c-48b17f2d9940/Webapp
- Action: https://github.com/09c7b0ed-f907-45d2-bc7c-48b17f2d9940/Action
- Rasa: https://github.com/09c7b0ed-f907-45d2-bc7c-48b17f2d9940/Rasa
- SSOT: https://github.com/09c7b0ed-f907-45d2-bc7c-48b17f2d9940/SSOT

---

## 1) Development setup

### Prerequisites (recommended path)

- Docker + Docker Compose
- VS Code + Dev Containers extension

### Dev Container workflow (recommended)

1. Open this repository in VS Code.
2. Choose **Reopen in Container**.
3. Wait for post-create setup to finish (`corepack enable && corepack prepare pnpm@latest --activate && pnpm install --frozen-lockfile`).
4. Configure `.env` (repo root) as shown below.
5. Run the dev server.

### Option B: Local machine

Local-only prerequisites:

- Node.js 22+
- `pnpm` (or Corepack enabled)

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install --frozen-lockfile
```

### Configure environment (`.env` in repo root)

Create/update:

```env
CALLBACK_BASE_URL="http://host.docker.internal:3000"
RASA_URL_LIST="en=http://host.docker.internal:5005"

KEYCLOAK_CLIENT_ID="<keycloak-client-id>"
KEYCLOAK_CLIENT_SECRET="<keycloak-client-secret>"
KEYCLOAK_ISSUER="https://<keycloak-host>/realms/<realm>"
NEXTAUTH_SECRET="<random-long-secret>"

ACTION_SERVER_TOKEN="<shared-action-token>"
RASA_PROXY_TIMEOUT_MS=120000
RASA_PROXY_TARGETS='{"graphql":"https://<host>","analytics":"https://<host>"}'

CVA_BASE_URL="https://stroke.dev.qualityregistry.org/api/rest/cva/v1"
```

`RASA_URL_LIST` supports separators `;`, `,`, or newline, for example `en=http://localhost:5005;es=http://localhost:5006`.

### Run locally

```bash
pnpm dev
```

Open `http://localhost:3000`.

### VS Code tasks (optional)

This repo includes `.vscode/tasks.json` with:

- `Start Webbapp in dev`

Run from VS Code: **Terminal → Run Task**.

---

## 2) Production run

### Required dependencies

- One or more Rasa containers reachable from the Webapp
- Action service token shared with the Action container
- Upstream GraphQL/analytics APIs reachable from Webapp proxy

### Recommended image tags

- `ghcr.io/09c7b0ed-f907-45d2-bc7c-48b17f2d9940/webapp:latest`
- `ghcr.io/09c7b0ed-f907-45d2-bc7c-48b17f2d9940/action:latest`
- `ghcr.io/09c7b0ed-f907-45d2-bc7c-48b17f2d9940/rasa:<locale>-latest`

### Required Webapp environment variables

- `RASA_URL_LIST`
- `CALLBACK_BASE_URL`
- `CVA_BASE_URL`
- `RASA_PROXY_TARGETS`
- `KEYCLOAK_CLIENT_ID`
- `KEYCLOAK_CLIENT_SECRET`
- `KEYCLOAK_ISSUER`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `HOSTNAME=0.0.0.0`
- `ACTION_SERVER_TOKEN`

### Minimal production compose snippet (webapp)

Use this template and replace placeholders:

```yaml
services:
  cva-webapp:
    image: ghcr.io/09c7b0ed-f907-45d2-bc7c-48b17f2d9940/webapp:latest
    container_name: cva-webapp
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      RASA_URL_LIST: |
        en=http://cva-rasa-en:5005
        es=http://cva-rasa-esmx:5005
        da=http://cva-rasa-dk:5005
        cs=http://cva-rasa-cz:5005
        el=http://cva-rasa-gr:5005
      CALLBACK_BASE_URL: "http://cva-webapp:3000"
      CVA_BASE_URL: "https://stroke.dev.qualityregistry.org/api/rest/cva/v1"
      RASA_PROXY_TARGETS: '{"graphql":"https://stroke.dev.qualityregistry.org","analytics":"https://stroke.dev.qualityregistry.org"}'
      KEYCLOAK_CLIENT_ID: "<keycloak-client-id>"
      KEYCLOAK_CLIENT_SECRET: "<keycloak-client-secret>"
      KEYCLOAK_ISSUER: "https://<keycloak-host>/realms/<realm>"
      NEXTAUTH_SECRET: "<random-long-secret>"
      NEXTAUTH_URL: "https://<public-webapp-url>"
      HOSTNAME: "0.0.0.0"
      ACTION_SERVER_TOKEN: "<shared-action-token>"
```

Start:

```bash
docker compose pull
docker compose up -d
```

---

## 3) Quick verification

- `docker compose ps`
- `docker compose logs -f cva-webapp`
- Confirm `RASA_URL_LIST` targets are reachable
- Confirm `ACTION_SERVER_TOKEN` matches Webapp + Action
- Confirm `NEXTAUTH_URL` matches the public URL

---

## 4) Common commands

Run dev server:

```bash
pnpm dev
```

Inspect running stack:

```bash
docker compose ps
docker compose logs -f cva-webapp
```

