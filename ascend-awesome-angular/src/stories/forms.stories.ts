import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { WaValueAccessorDirective } from '../app/shared/wa-value-accessor.directive';

const meta: Meta = {
  title: 'Components/Form controls',
  decorators: [
    moduleMetadata({
      imports: [FormsModule, JsonPipe, WaValueAccessorDirective],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Form primitives, including the `WaValueAccessorDirective` bridge that makes ' +
          '`ngModel` and `formControlName` work on Web Awesome custom elements.',
      },
    },
  },
};

export default meta;

type Story = StoryObj;

/** Text inputs in their common configurations. */
export const TextInputs: Story = {
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap:1rem; max-width:24rem">
        <wa-input label="Default" placeholder="Type something"></wa-input>
        <wa-input label="With hint" hint="We never share this." placeholder="you@example.com"></wa-input>
        <wa-input label="Password" type="password" password-toggle value="hunter2"></wa-input>
        <wa-input label="Disabled" disabled value="Not editable"></wa-input>
      </div>
    `,
  }),
};

/** Checkboxes, switches and radio groups. */
export const SelectionControls: Story = {
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap:1rem">
        <wa-checkbox checked>Checked</wa-checkbox>
        <wa-checkbox indeterminate>Indeterminate</wa-checkbox>
        <wa-switch checked>Switch on</wa-switch>
        <wa-radio-group label="Preferred contact" value="email">
          <wa-radio value="email">Email</wa-radio>
          <wa-radio value="phone">Phone</wa-radio>
        </wa-radio-group>
      </div>
    `,
  }),
};

/**
 * Two-way binding through the custom value accessor.
 *
 * The echoed value updates as the controls change, which is the quickest way to
 * confirm the accessor is wired up correctly.
 */
export const AngularFormsBinding: Story = {
  render: () => ({
    props: {
      name: 'Ada Lovelace',
      notify: true,
      rating: 4,
    },
    template: `
      <div style="display:flex; flex-direction:column; gap:1rem; max-width:24rem">
        <wa-input label="Full name" [(ngModel)]="name" name="name"></wa-input>
        <wa-switch [(ngModel)]="notify" name="notify">Email me updates</wa-switch>
        <wa-rating label="Rating" [(ngModel)]="rating" name="rating"></wa-rating>

        <pre style="font-size:.75rem; background:var(--wa-color-neutral-fill-quiet); padding:.75rem; border-radius:.375rem">{{ { name, notify, rating } | json }}</pre>
      </div>
    `,
  }),
};
