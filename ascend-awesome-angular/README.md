# @trustage/ascend-awesome-angular

Angular reference application for the **AscendAwesome** design system, built on
[Web Awesome](https://webawesome.com) web components.

It exists for three reasons: to prove the npm-delivered design system works in a
real Angular app, to give client teams a copyable integration pattern, and to act
as the parity harness for the CDN-to-npm migration (Storybook can render either
delivery path on demand).

## Stack

| Concern            | Choice                                                                  |
| ------------------ | ----------------------------------------------------------------------- |
| Framework          | Angular 22, standalone components, zoneless change detection            |
| Components         | `@awesome.me/webawesome` 3.13 (exact pin)                               |
| Language           | TypeScript 6, `strict` plus `noUnusedLocals` / `noUnusedParameters`     |
| Styles             | Sass (SCSS), `--wa-*` token overrides, BEM-ish class naming             |
| Linting            | ESLint 10 + `angular-eslint` + `typescript-eslint`, template a11y rules |
| Formatting         | Prettier 3 (`.html` via the Angular parser)                             |
| Docs               | TypeDoc from TSDoc comments                                             |
| Component workshop | Storybook 10                                                            |

## Quick start

```sh
npm install          # postinstall copies the Web Awesome asset tree to public/
npm start            # dev server at http://localhost:4200
npm run storybook    # Storybook at http://localhost:6006
```

## Scripts

| Script                            | What it does                                          |
| --------------------------------- | ----------------------------------------------------- |
| `npm start`                       | Dev server                                            |
| `npm run build`                   | Production build                                      |
| `npm test`                        | Unit tests (Vitest via the Angular unit-test builder) |
| `npm run lint` / `lint:fix`       | ESLint over TS and templates                          |
| `npm run format` / `format:check` | Prettier                                              |
| `npm run docs`                    | TypeDoc → `docs/`                                     |
| `npm run storybook`               | Storybook dev server                                  |
| `npm run build-storybook`         | Static Storybook → `storybook-static/`                |
| `npm run sync:wa-assets`          | Re-copy Web Awesome assets to `public/wa-assets`      |
| `npm run verify`                  | lint + format:check + build                           |

## Demo pages

| Route           | Covers                                                                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/forms`        | Inputs, selects, checkboxes, radios, switches, sliders, ratings, OTP, tag input, colour picker, buttons — plus a reactive form proving the value-accessor bridge |
| `/data-display` | Cards, badges, avatars, tags, progress, spinners, skeletons, trees, carousel, QR code, and the `wa-format-*` localisation primitives                             |
| `/overlays`     | Dialogs, drawers, tooltips, popovers, callouts, details, copy button                                                                                             |
| `/navigation`   | Tabs, accordions, breadcrumbs, dropdowns, pagination, split panel, scroller, dividers                                                                            |
| `/kitchen-sink` | Coverage inventory of all 67 components, image comparison, icons, type scale, colour swatches                                                                    |

## Three things worth knowing

### 1. `CUSTOM_ELEMENTS_SCHEMA` is required per component

Angular's compiler rejects unknown elements, so every component whose template
contains `<wa-*>` tags declares:

```ts
@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  // ...
})
```

The trade-off is real: it relaxes template checking for _all_ unknown tags in
that component, so a typo in a `<wa->` tag name fails silently at runtime rather
than loudly at build time.

### 2. Angular forms need a bridge

Angular's built-in value accessors only recognise native `input`, `select` and
`textarea`. On a `<wa-input>`, `[(ngModel)]` and `formControlName` are inert
without help. `src/app/shared/wa-value-accessor.directive.ts` supplies a
`ControlValueAccessor` that reads and writes the element's `value` (or
`checked`) property and listens for its `input`/`change` events.

```html
<wa-input label="Full name" formControlName="fullName"></wa-input>
<wa-switch formControlName="newsletter">Email me updates</wa-switch>
```

The `/forms` page echoes the submitted payload so the binding can be verified
rather than assumed.

### 3. Runtime assets must be served, not just bundled

Web Awesome resolves icons and some resources at runtime from a configurable
base path. Bundlers cannot see those references. `scripts/sync-wa-assets.mjs`
(wired to `postinstall`) copies `node_modules/@awesome.me/webawesome/dist` to
`public/wa-assets`, and `src/main.ts` calls `setBasePath('/wa-assets')` before
bootstrap.

Skip that step and the app still compiles — it just renders with missing icons.
That failure mode is the single most common integration mistake, which is why it
is a build step rather than a documentation note.

## Storybook: CDN vs NPM toggle

The **Asset source** control in the Storybook toolbar switches between the legacy
CDN distribution (`/lts/` pointer) and the npm package, so the two can be
compared component by component. `Foundations/Delivery mode → Parity Check`
renders a cross-section chosen to surface theming differences.

Switching sources reloads the preview iframe. That is deliberate:
`customElements.define()` is permanent for the life of a document, so
definitions registered by one source cannot be swapped for the other's without a
fresh page. Stylesheets alone _can_ be exchanged in place, and are.

Point `CDN_BASE_URL` in `src/app/core/asset-source.ts` at the real CDN host
before using the comparison in anger — it ships with a placeholder.

## Theming

`src/styles/_tokens.scss` overrides Web Awesome's semantic `--wa-*` groups
(`brand`, `neutral`, `success`, `warning`, `danger`) rather than the underlying
palette scales. Components pick the changes up without any shadow-DOM
overrides. The values there are placeholders — replace them with the tokens
exported from Figma.

`ThemeService` toggles light/dark by switching a `wa-dark` class on the document
root.

## Known gaps

- Component inventory is catalogued but six behavioural utilities
  (`wa-animation`, the observer components, `wa-include`, `wa-zoomable-frame`)
  have no live example — they have no standalone visual output.
- No unit tests beyond the scaffold; the `test` target is wired but empty.
- SSR is not configured. Web Awesome needs Declarative Shadow DOM / Lit SSR for
  server rendering — a spike, not a switch.
