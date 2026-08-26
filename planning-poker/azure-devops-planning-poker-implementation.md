# Implementing Planning Poker in Azure DevOps — Step-by-Step Guide

This guide walks through deploying the Planning Poker extension end to end: provisioning Azure resources, deploying the backend, building and packaging the extension, and installing it into your Azure DevOps organization.

---

## 0. Prerequisites

Install these locally before starting:

- **Node.js 20 LTS** and npm
- **Azure CLI** (`az`) — `az --version` to confirm, `az login` to authenticate against your subscription
- **Azure Functions Core Tools v4** — `npm install -g azure-functions-core-tools@4 --unsafe-perm true`
- **tfx-cli** — `npm install -g tfx-cli` (used to package and publish the extension)
- An Azure DevOps **Marketplace publisher** — if you don't have one, create it free at https://marketplace.visualstudio.com/manage/createpublisher (just needs a publisher ID/name, takes two minutes)

Unzip the project and `cd` into it.

---

## 1. Provision Azure resources

Run this from `backend/PlanningPokerFunctions/`. Pick a region close to your team; adjust names if they're taken (Storage and Function App names must be globally unique).

```bash
az group create --name planning-poker-rg --location eastus

az signalr create \
  --name planning-poker-signalr \
  --resource-group planning-poker-rg \
  --sku Free_F1 \
  --service-mode Serverless

az storage account create \
  --name planningpokerstg$RANDOM \
  --resource-group planning-poker-rg \
  --sku Standard_LRS \
  --location eastus
```

Note the exact storage account name it creates — you'll need it in the next command.

```bash
az functionapp create \
  --name planning-poker-functions \
  --resource-group planning-poker-rg \
  --storage-account <your-storage-account-name> \
  --consumption-plan-location eastus \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4
```

If `planning-poker-functions` is taken globally, change the name here and remember it for later steps — your API URL will be `https://<that-name>.azurewebsites.net/api`.

Wire the SignalR connection string into the Function App's settings:

```bash
SIGNALR_CS=$(az signalr key list -n planning-poker-signalr -g planning-poker-rg --query primaryConnectionString -o tsv)

az functionapp config appsettings set \
  --name planning-poker-functions \
  --resource-group planning-poker-rg \
  --settings AzureSignalRConnectionString="$SIGNALR_CS"
```

Enable CORS so the extension iframe (served from Azure DevOps's domain, not yours) is allowed to call your API:

```bash
az functionapp cors add \
  --name planning-poker-functions \
  --resource-group planning-poker-rg \
  --allowed-origins https://dev.azure.com https://*.visualstudio.com
```

If your org uses on-prem/Server URLs instead of dev.azure.com, add those origins too.

> **Free tier note:** SignalR `Free_F1` caps at 20 concurrent connections and 20K messages/day — fine for one team. Bump to `Standard_S1` for larger orgs.

---

## 2. Deploy the backend code

```bash
cd backend/PlanningPokerFunctions
npm install
func azure functionapp publish planning-poker-functions
```

Confirm it's live:

```bash
curl -X POST "https://planning-poker-functions.azurewebsites.net/api/negotiate?roomId=test"
```

You should get back JSON with `url` and `accessToken`. If you get a 404, double check the Function App name and that `func azure functionapp publish` reported success (it lists the deployed function names at the end — you should see `negotiate`, `onConnected`, `broadcastVote`, `getState`).

---

## 3. Point the extension at your backend

Edit `extension/src/poker-panel/pokerConnection.ts`:

```ts
export const BACKEND_BASE_URL =
  "https://planning-poker-functions.azurewebsites.net/api";
```

Use your actual Function App URL from step 1/2.

---

## 4. Build the extension

```bash
cd extension
npm install
npm run build
```

This produces `dist/poker-panel.html` and `dist/poker-panel.js`. Quick check that it built: `ls dist/`.

---

## 5. Update the manifest with your publisher info

Open `extension/vss-extension.json` and change:

```json
"publisher": "your-publisher-id",
"id": "planning-poker-formgroup"
```

`publisher` must match the publisher ID you created in step 0 exactly. `id` just needs to be unique within that publisher.

Add a real icon — drop a 128×128 PNG at `extension/img/icon.png` (the manifest already references this path).

---

## 6. Package the extension

```bash
npx tfx-cli extension create --manifest-globs vss-extension.json
```

This outputs a `.vsix` file like `your-publisher-id.planning-poker-formgroup-1.0.0.vsix`.

---

## 7. Publish it privately to your org first

```bash
npx tfx-cli extension publish \
  --manifest-globs vss-extension.json \
  --share-with your-org-name
```

It'll prompt for a Personal Access Token if you're not already logged in via `tfx login` — create one in Azure DevOps under **User Settings → Personal Access Tokens** with the **Marketplace (Publish)** scope.

`your-org-name` is the part before `.visualstudio.com` or after `dev.azure.com/` in your org's URL.

---

## 8. Install it into your organization

In your browser:

1. Go to **Organization Settings → Extensions → Browse Marketplace**
2. Click **Shared** in the left nav — your extension shows up there since you shared it with your org
3. Click it, then **Get it free** / **Install**, pick the project(s) you want it enabled for

---

## 9. Verify it on a work item

Open any work item (Product Backlog Item, User Story, etc.), look at the group/tab list on the form — you should see a **Planning Poker** panel. Open the same work item in two browser windows (or two people open it), vote in each, click Reveal in one — both should update in real time.

If the panel shows the connection error banner instead, open browser dev tools console on that tab — it'll show whether negotiate failed (check CORS/Function App URL) or whether SignalR itself failed to connect (check the SignalR Service's connection string was set correctly).

---

## Troubleshooting checklist

| Symptom                                          | Likely cause                                                                                                                                                                           |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Panel doesn't appear on work item form at all    | Extension not installed for that project, or manifest didn't build — recheck step 4/8                                                                                                  |
| Panel loads but shows the red connection error   | `BACKEND_BASE_URL` wrong, or CORS not configured on the Function App                                                                                                                   |
| Votes don't sync between users                   | `onConnected` function didn't fire, or `AzureSignalRConnectionString` not set — check Function App logs in Azure Portal → your Function App → Functions → Monitor                      |
| "Apply to Story Points" doesn't update the field | Your process template uses a different field (Agile = `Microsoft.VSTS.Scheduling.Effort`, CMMI = `Microsoft.VSTS.Scheduling.Size`) — edit `index.tsx` line referencing `setFieldValue` |
| `tfx publish` fails with auth error              | PAT missing the Marketplace (Publish) scope, or expired                                                                                                                                |

---

## Updating after changes

Bump the `version` in `vss-extension.json`, then repeat steps 4, 6, 7 — `tfx extension publish` overwrites the shared version, and installed orgs pick up the update automatically (or via a manual "update" click depending on org settings).

---

## Next steps to consider

- **Lock down the backend with real auth.** The backend endpoints are currently anonymous-auth. Before rolling this out to a wider team, validate the ADO app token (available via `SDK.getAppToken()` in the extension) on each backend call, or put the Function App behind Azure AD auth.
