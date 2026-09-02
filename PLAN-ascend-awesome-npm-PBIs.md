# Delivery Plan: `@trustage/ascend-awesome` NPM Package

**Epic:** Publish AscendAwesome as `@trustage/ascend-awesome` to the private registry, replacing the floating CDN `/lts/` pointer.

## Epic acceptance criteria (from stakeholders)

| # | Criterion |
|---|---|
| AC1 | `@trustage/ascend-awesome` published to the private registry |
| AC2 | Installation must use the private feed |
| AC3 | Package includes CSS: `trustage-aa.css`, `trustage-aa_sulsans.css` |
| AC4 | Package includes JS: `designsystem-webcomponents.js`, `webawesome.loader.js` |
| AC5 | Package uses semantic versioning (e.g., v2.3.1, v2.4.0) |
| AC6 | Storybook offers a switch between current AscendAwesome CSS/JS from the CDN and the new NPM package |

## Research notes (informing the PBIs)

**Private feed.** Assumed Azure Artifacts npm feed ("private feed" + PBI terminology). Standard setup: scoped `@trustage` packages, project `.npmrc` committed with the feed URL, credentials never committed (user PAT locally, `npmAuthenticate` task in pipelines injecting a run-scoped token). Enabling the npmjs upstream source on the feed lets public dependencies resolve through the same feed — one registry line, full caching/offline story.

**`webawesome.loader.js` is Web Awesome's autoloader.** It watches the DOM and lazy-loads component definitions at runtime from a base path. Two hard implications for packaging:

1. The loader fetches component modules and chunks at runtime — shipping the loader alone is not enough. Either the package must also carry the Web Awesome `dist` tree (components/chunks) it loads from, or clients get it transitively via a pinned `@awesome.me/webawesome` dependency, and either way clients must serve those files statically and call `setBasePath()`.
2. Lazy-loading over the network partially reintroduces the CDN problem (runtime fetches). Acceptable if assets are served from the app's own origin, versioned with the app — but the base-path step must be a documented, verified part of client setup. PBI-2 resolves the packaging approach; PBI-6 verifies it.

**File-name discrepancy to confirm:** criteria list `trustage-aa.cs` — assumed typo for `trustage-aa.css` (confirm in PBI-2).

See also: `STEP-BY-STEP-research-notes.md` (procedures) and `npm-security-guidance.md` (security rationale).

---

## PBI-1 — Provision the private npm feed for `@trustage` scope

*As a* design system team, *we need* an npm feed with the `@trustage` scope and npmjs upstream, *so that* internal packages install privately and public dependencies resolve through the same feed.

**Acceptance criteria**

- Feed exists with npmjs.com upstream source enabled
- `@trustage` scope resolves only from the private feed (dependency-confusion protection: scope is claimed/blocked publicly or verified unregisterable)
- Permissions: design system CI can publish; all engineering can read
- A committed `.npmrc` template (feed URL only, no credentials) is documented for client repos
- Local-dev auth instructions published (PAT / `vsts-npm-auth` or platform equivalent)

**Estimate:** 5 days | **Depends on:** — (start first) | **Maps to:** AC1, AC2

---

## PBI-2 — Define package contents and structure

*As a* design system team, *we need* the package layout, entry points, and Web Awesome distribution approach decided and implemented, *so that* the four required artifacts install and function correctly.

**Acceptance criteria**

- `package.json` name `@trustage/ascend-awesome`; `files`/`exports` expose:
  - `trustage-aa.css`
  - `trustage-aa_sulsans.css` (SulSans variant)
  - `designsystem-webcomponents.js`
  - `webawesome.loader.js`
- Decision recorded (ADR): Web Awesome component modules/chunks ship **inside** this package vs. via pinned `@awesome.me/webawesome` dependency — either way, the loader's runtime targets are installable and servable
- Web Awesome version pinned **exactly**; recorded in changelog
- `sideEffects` configured so bundlers cannot tree-shake component registration
- Confirmed with stakeholders: `trustage-aa.cs` in the criteria means `trustage-aa.css`
- README documents usage incl. `setBasePath()` for the loader

**Estimate:** 8 days | **Depends on:** — | **Maps to:** AC3, AC4

---

## PBI-3 — Build pipeline producing the package artifacts

*As a* design system team, *we need* CI that builds the four artifacts from source, *so that* published contents are reproducible and traceable to a commit.

**Acceptance criteria**

- Pipeline builds both CSS themes and both JS files from design system source
- Output is byte-comparable against the current CDN `/lts/` build (parity report reviewed and signed off)
- `npm pack --dry-run` contents check runs in CI and fails on unexpected files
- No manual build steps on developer laptops

**Estimate:** 8 days | **Depends on:** PBI-2 | **Maps to:** AC3, AC4

---

## PBI-4 — Release pipeline with semantic versioning

*As a* design system team, *we need* an automated, semver-enforced release process, *so that* every published version is intentional, tagged, and auditable.

**Acceptance criteria**

- Publishing triggered only by version tag (`vX.Y.Z`) or release pipeline — never from a laptop
- Pipeline authenticates via `npmAuthenticate` (run-scoped token); no PATs stored in repo
- Publish registry configured via `.npmrc` (note: Azure Artifacts does **not** support `publishConfig.registry` overrides at publish time)
- Pipeline fails if git tag ≠ `package.json` version
- Semver policy documented, including: Web Awesome major upgrade ⇒ package major bump
- Dist-tags managed: `latest` (stable) and `lts` (maintenance line replacing the CDN `/lts/` pointer)
- CHANGELOG entry required per release; states bundled Web Awesome version

**Estimate:** 5 days | **Depends on:** PBI-1, PBI-3 | **Maps to:** AC1, AC5

---

## PBI-5 — First publish + feed installation verified

*As a* client app developer, *I can* install `@trustage/ascend-awesome` from the private feed only, *so that* AC1/AC2 are demonstrably met.

**Acceptance criteria**

- v-initial (versioned to continue the existing AscendAwesome line) visible in the feed
- Fresh project with only the committed `.npmrc` installs the package; all four files present in `node_modules/@trustage/ascend-awesome`
- Install fails cleanly when the feed is unreachable/unauthenticated (proves it does not fall back to public npm)
- `npm ci --offline` succeeds after warm cache (offline-build goal)

**Estimate:** 3 days | **Depends on:** PBI-4 | **Maps to:** AC1, AC2, AC5

---

## PBI-6 — Pilot migration of one client application

*As a* pilot app team, *we replace* the CDN `<link>`/`<script>` tags with the npm package, *so that* the loader/base-path setup and docs are proven before broad rollout.

**Acceptance criteria**

- Pilot app loads theme CSS (incl. SulSans variant where applicable) and both JS files from the package
- Loader base path configured; component definitions load from app-served assets — zero requests to the old CDN (verified in network tab)
- No visual or functional regressions (smoke test signed off)
- FOUCE guard verified
- Findings folded back into the migration guide

**Estimate:** 8 days | **Depends on:** PBI-5 | **Maps to:** all

---

## PBI-7 — Client migration guide + rollout comms

*As an* engineering org, *we need* a migration guide and CDN deprecation schedule, *so that* all teams move off `/lts/` predictably.

**Acceptance criteria**

- Migration guide published (feed auth, install/pin, tag replacement, base path/assets, FOUCE, verification checklist, rollback)
- CDN deprecation phases announced: freeze `/lts/` → versioned paths only → removal
- Renovate/Dependabot preset available for the package

**Estimate:** 5 days | **Depends on:** PBI-6 | **Maps to:** AC2 (rollout)

---

## PBI-8 — Supply chain security hardening

*As an* engineering org, *we need* layered supply chain controls on the feed, the publish pipeline, and consumer guidance, *so that* the package and its dependency tree are protected against credential-hijack and malicious-package attacks (Shai-Hulud, Sept-2025 wave, Axios compromise pattern).

**Acceptance criteria**

*Feed policies (with PBI-1):*

- `@trustage` scope claimed on public npmjs (placeholder) — dependency-confusion blocked
- npmjs upstream caching confirmed immutable; cooldown/quarantine policy (~7 days) for new upstream versions documented and enabled where supported
- Feed permissions least-privilege: only design system CI can publish

*Pipeline hardening (with PBI-4):*

- WebAuthn/2FA enforced on all accounts with publish rights
- Publishing uses run-scoped tokens (`npmAuthenticate`) or OIDC trusted publishing — zero static tokens stored anywhere
- CI gate: `npm pack --dry-run` output diffed against expected file manifest; unexpected files fail the build
- Published package contains no lifecycle scripts (`postinstall` etc.) — asserted in CI

*Consumer guidance (with PBI-7, added to migration guide):*

- `ignore-scripts=true` in client `.npmrc` documented (with per-package allowlist note for legit cases like esbuild)
- Lockfile + `npm ci` requirement stated; PR check flagging new dependencies with `hasInstallScript` recommended
- Renovate/Dependabot preset includes `minimumReleaseAge` (~7 days)

**Reference:** `npm-security-guidance.md` (full rationale, sources, and checklist)

**Estimate:** 5 days | **Depends on:** runs alongside PBI-1, PBI-4, PBI-7 | **Maps to:** AC1, AC2 (hardens both)

---

## PBI-9 — Storybook source toggle: CDN vs NPM

*As a* design system developer, *I can* switch Storybook between the current CDN-delivered AscendAwesome and the NPM package, *so that* the two delivery paths can be compared side by side and parity regressions are caught visually before rollout.

**Acceptance criteria**

- Storybook toolbar control (globalType) with two options: **CDN (`/lts/`)** and **NPM (`@trustage/ascend-awesome`)**
- CDN mode injects the current `<link>`/`<script>` CDN tags; NPM mode loads `trustage-aa.css` / `trustage-aa_sulsans.css`, `designsystem-webcomponents.js`, and `webawesome.loader.js` (with base path configured) from the installed package
- Switching modes fully swaps assets — no leakage of the other source's CSS or duplicate custom-element registration (page reload on toggle is acceptable and likely required, since custom elements can't be unregistered)
- Selected mode is visible in the UI and persisted across stories
- Both SulSans and default theme render correctly in both modes
- Documented in Storybook's docs page; used as the verification harness for PBI-3's parity report and PBI-6's pilot sign-off

**Estimate:** 5 days | **Depends on:** PBI-5 | **Maps to:** AC6; supports AC3, AC4 verification

---

## Sequencing

```
PBI-1 (feed)      ─┐
                   ├→ PBI-4 (release) → PBI-5 (publish+verify) ─┬→ PBI-6 (pilot) → PBI-7 (rollout)
PBI-2 (contents) → PBI-3 (build)     ─┘                         └→ PBI-9 (Storybook toggle)
```

PBI-1 and PBI-2 can run in parallel in sprint 1. PBI-8 (security) is a cross-cutting track: its feed controls land with PBI-1, pipeline controls with PBI-4, and consumer guidance with PBI-7 — schedule its verification as the closing item of sprint 3. PBI-9 starts once PBI-5 delivers an installable package and ideally lands before PBI-6 sign-off so the pilot can use it as the comparison harness. Suggested: sprint 1 = PBI-1–3; sprint 2 = PBI-4–6 + PBI-9; sprint 3 = PBI-7–8 + rollout support.

## Estimates (1 pt = 1 day)

| PBI | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | Total |
|---|---|---|---|---|---|---|---|---|---|---|
| Days | 5 | 8 | 8 | 5 | 3 | 8 | 5 | 5 | 5 | **52** |

## Alternative option: Azure Artifacts quickstart path (manual publish)

Per [Microsoft's get-started guide](https://learn.microsoft.com/en-us/azure/devops/artifacts/get-started-npm?view=azure-devops), a minimal version of this migration can ship without most of the pipeline work:

1. **Create feed** in the Azure DevOps project UI (Artifacts → Create Feed), with "Include packages from common public sources" checked (npmjs upstream). Choose scope deliberately: project-scoped is the quickstart default; **org-scoped is recommended** if multiple projects will consume
2. **Connect to feed** → npm → follow the generated Project setup: a committed project `.npmrc` next to `package.json`, credentials in the user-level `~/.npmrc` (`vsts-npm-auth` on Windows; PAT credential block on macOS/Linux — note `vsts-npm-auth` is not supported on Azure DevOps Server)
3. **Version manually**: `npm version patch|minor|major` (still satisfies AC5)
4. **Publish manually**: `npm publish` from the design system repo by an authorized developer
5. Clients install with the same committed `.npmrc` + `npm install @trustage/ascend-awesome`

**What this replaces:** PBI-1 shrinks to a UI walkthrough; PBI-4 (release pipeline) is deferred entirely; PBI-3 can start as a local `npm run build` + publish checklist. Rough effort: ~1 week to first installable package.

**Trade-offs vs. the pipeline approach**

- ✅ Live in days, not sprints — meets AC1–AC5 with minimal infrastructure
- ✅ Same feed, same `.npmrc`, same client experience — nothing thrown away when pipeline automation is added later
- ❌ Publishing from laptops: weaker audit trail (no guaranteed commit↔version link), and a human PAT with publish rights exists — the exact credential-theft surface PBI-8 eliminates
- ❌ No CI gates (tarball contents check, tag/version match, changelog enforcement)

**Recommended use:** adopt as **phase 0** — validate the feed, package contents, and one pilot client quickly — then layer PBI-4/PBI-8 on top before broad rollout, rather than as the permanent end state.

**Constraint that applies to both approaches:** Azure Artifacts does **not** support `publishConfig.registry` overrides at publish time — the publish registry must come from the `.npmrc`, not `package.json`.

## Risks

- **Loader runtime fetches**: if the WA dist tree isn't shipped/served correctly, components silently fail to upgrade — mitigated by PBI-2 ADR + PBI-6 network-tab verification
- **Parity gap vs CDN build**: pilot could surface differences between source-built artifacts and what the CDN served — mitigated by PBI-3 parity report
- **Feed fallback to public npm**: a misconfigured client `.npmrc` could resolve `@trustage` publicly — mitigated by scope claiming (PBI-1/8) and negative test (PBI-5)
