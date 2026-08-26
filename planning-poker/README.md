# Planning Poker for Azure DevOps

A real Azure DevOps extension that adds a **Planning Poker** panel directly inside
the work item form (under the work item's group/tab list), with real-time
multiplayer voting synced across everyone who has the work item open.

```
planning-poker/
├── extension/   ← Azure DevOps extension (work item form group, TypeScript/React)
└── backend/     ← Azure Functions + Azure SignalR Service (real-time fan-out)
```

## How it works

- The extension contributes a `ms.vss-work-web.work-item-form-group`, so it
  shows up as a panel on every work item form (or scope it to specific work
  item types — see "Scoping" below).
- Each work item gets its own SignalR **group**, keyed as `org/project/workItemId`,
  so two different stories being estimated at once never cross-talk.
- Votes are hidden from teammates until someone clicks **Reveal** — classic
  planning poker etiquette (no anchoring on the first vote shown).
- **Apply to Story Points** writes the rounded average straight back into the
  work item's `Microsoft.VSTS.Scheduling.StoryPoints` field via the Work Item
  Form SDK — no manual copy/paste.
- State is persisted in Azure Table Storage so a vote isn't lost if everyone's
  SignalR connections drop and reconnect, and so late joiners see current votes.

---

## 1. Deploy the backend (Azure Functions + SignalR Service)

You need two Azure resources: a **SignalR Service** (in **Serverless** mode) and
a **Function App**.

```bash
# from the backend/PlanningPokerFunctions directory
az group create --name planning-poker-rg --location eastus

az signalr create \
  --name planning-poker-signalr \
  --resource-group planning-poker-rg \
  --sku Free_F1 \
  --service-mode Serverless

az storage account create \
  --name planningpokerstorage \
  --resource-group planning-poker-rg \
  --sku Standard_LRS

az functionapp create \
  --name planning-poker-functions \
  --resource-group planning-poker-rg \
  --storage-account planningpokerstorage \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4

# wire the SignalR connection string into the function app
SIGNALR_CS=$(az signalr key list -n planning-poker-signalr -g planning-poker-rg --query primaryConnectionString -o tsv)
az functionapp config appsettings set \
  --name planning-poker-functions \
  --resource-group planning-poker-rg \
  --settings AzureSignalRConnectionString="$SIGNALR_CS"

# allow the ADO iframe origins to call your API
az functionapp cors add \
  --name planning-poker-functions \
  --resource-group planning-poker-rg \
  --allowed-origins https://dev.azure.com https://*.visualstudio.com
```

Then deploy the function code:

```bash
cd backend/PlanningPokerFunctions
npm install
func azure functionapp publish planning-poker-functions
```

Your API base URL will be:
`https://planning-poker-functions.azurewebsites.net/api`

> **Free tier note:** SignalR `Free_F1` caps at 20 concurrent connections and
> 20K messages/day — fine for one team. Bump to `Standard_S1` for larger orgs.

---

## 2. Point the extension at your backend

Edit `extension/src/poker-panel/pokerConnection.ts`:

```ts
export const BACKEND_BASE_URL = "https://planning-poker-functions.azurewebsites.net/api";
```

---

## 3. Build & package the extension

```bash
cd extension
npm install
npm run build          # bundles poker-panel.tsx into dist/poker-panel.html + .js
npx tfx-cli extension create --manifest-globs vss-extension.json
```

This produces a `.vsix` file. Before packaging for real, update in
`vss-extension.json`:
- `publisher` → your Marketplace publisher ID (create one free at
  https://marketplace.visualstudio.com/manage if you don't have one)
- `id` → must stay globally unique under that publisher
- add real `img/icon.png` (128x128) — currently referenced but not included

---

## 4. Install into your Azure DevOps org

**Private/internal use (recommended to start):**
```bash
npx tfx-cli extension publish \
  --manifest-globs vss-extension.json \
  --share-with your-org-name
```
Then in your org: **Organization Settings → Extensions → Browse Marketplace**,
find it under "Shared", and install.

**Public Marketplace:** set `"public": true` in the manifest and publish
through https://marketplace.visualstudio.com/manage — only do this once
you've tested privately, since public listings go through Microsoft review.

---

## 5. Scoping to specific work item types (optional)

By default the panel shows on every work item type. To restrict it (e.g. only
Product Backlog Items / User Stories), add a `scope` to the contribution in
`vss-extension.json`:

```json
"properties": {
  "name": "Planning Poker",
  "uri": "dist/poker-panel.html",
  "height": 480
}
```
→ work item type filtering isn't a manifest property; instead check
`workItemType` inside `index.tsx` via `formService.getFieldValue("System.WorkItemType")`
and render nothing (or a "not applicable" message) when it doesn't match.

---

## Local development

**Backend:**
```bash
cd backend/PlanningPokerFunctions
npm install
func start
```

**Extension (with hot reload against a dev iframe):**
```bash
cd extension
npm install
npm run watch
```
Azure DevOps extensions must be served over HTTPS even locally — use the
[Microsoft Azure DevOps Extension sample tooling](https://learn.microsoft.com/azure/devops/extend/get-started/node)
or `ngrok` to tunnel `dist/` while iterating, then point a dev-published
extension's manifest `baseUri` at the tunnel.

---

## Known limitations / next steps

- **Auth**: backend endpoints are `authLevel: anonymous` for simplicity. For
  production, validate the ADO-issued JWT (available via `SDK.getAppToken()`
  in the extension) on each backend call, or put the Function App behind
  Azure AD auth.
- **Story Points field name**: hardcoded to `Microsoft.VSTS.Scheduling.StoryPoints`
  (Scrum template). Change to `Microsoft.VSTS.Scheduling.Effort` (Agile) or
  `Microsoft.VSTS.Scheduling.Size` (CMMI) in `index.tsx` to match your process.
- **Card deck**: Fibonacci-ish deck is hardcoded in `PokerPanel.tsx` (`DECK`
  array) — trivial to make configurable via extension settings if you want
  per-team decks.
