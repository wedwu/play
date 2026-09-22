import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

/**
 * Delivery-source comparison harness.
 *
 * Use the **Asset source** control in the toolbar to switch between the legacy
 * CDN distribution and the NPM package, then compare the rendering below.
 *
 * Switching reloads the preview iframe. That is deliberate rather than a
 * limitation worked around: `customElements.define()` is permanent for the life
 * of a document, so definitions registered by one source cannot be replaced by
 * the other without a fresh page.
 */
const meta: Meta = {
  title: 'Foundations/Delivery mode',
  decorators: [moduleMetadata({ schemas: [CUSTOM_ELEMENTS_SCHEMA] })],
  parameters: {
    docs: {
      description: {
        component:
          'Parity harness for the CDN-to-NPM migration. Switch the **Asset source** toolbar ' +
          'control and compare; any visual difference is a parity regression worth filing.',
      },
    },
  },
};

export default meta;

type Story = StoryObj;

/**
 * A cross-section of components, chosen to surface theming differences
 * (colour, radius, typography, spacing) between the two delivery paths.
 */
export const ParityCheck: Story = {
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap:1.5rem; max-width:40rem">
        <div>
          <strong style="display:block; margin-bottom:.5rem">Buttons</strong>
          <div style="display:flex; gap:.5rem; flex-wrap:wrap">
            <wa-button variant="brand">Brand</wa-button>
            <wa-button variant="brand" appearance="outlined">Outlined</wa-button>
            <wa-button variant="danger">Danger</wa-button>
          </div>
        </div>

        <div>
          <strong style="display:block; margin-bottom:.5rem">Badges and tags</strong>
          <div style="display:flex; gap:.5rem; flex-wrap:wrap; align-items:center">
            <wa-badge variant="brand">Brand</wa-badge>
            <wa-badge variant="success" pill>Pill</wa-badge>
            <wa-tag variant="neutral">Tag</wa-tag>
          </div>
        </div>

        <div>
          <strong style="display:block; margin-bottom:.5rem">Inputs</strong>
          <div style="display:flex; flex-direction:column; gap:.75rem">
            <wa-input label="Email" placeholder="you@example.com"></wa-input>
            <wa-select label="Plan" value="standard">
              <wa-option value="starter">Starter</wa-option>
              <wa-option value="standard">Standard</wa-option>
            </wa-select>
            <wa-switch checked>Switch</wa-switch>
          </div>
        </div>

        <div>
          <strong style="display:block; margin-bottom:.5rem">Feedback</strong>
          <wa-callout variant="brand">
            <wa-icon slot="icon" name="circle-info"></wa-icon>
            Compare typography, radius and brand colour across both sources.
          </wa-callout>
        </div>

        <div>
          <strong style="display:block; margin-bottom:.5rem">Current source</strong>
          <code style="font-size:.8rem">
            document.documentElement.dataset.aaAssetSource
          </code>
        </div>
      </div>
    `,
  }),
};
