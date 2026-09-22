import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

/** Arguments driving the button stories. */
interface ButtonArgs {
  /** Semantic colour variant. */
  variant: 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
  /** Visual treatment. */
  appearance: 'accent' | 'filled' | 'outlined' | 'plain';
  /** Control size. */
  size: 'small' | 'medium' | 'large';
  /** Renders a spinner and blocks interaction. */
  loading: boolean;
  /** Disables the control. */
  disabled: boolean;
  /** Fully rounded ends. */
  pill: boolean;
  /** Button label. */
  label: string;
}

const meta: Meta<ButtonArgs> = {
  title: 'Components/Button',
  decorators: [moduleMetadata({ schemas: [CUSTOM_ELEMENTS_SCHEMA] })],
  argTypes: {
    variant: {
      control: 'select',
      options: ['brand', 'neutral', 'success', 'warning', 'danger'],
    },
    appearance: {
      control: 'select',
      options: ['accent', 'filled', 'outlined', 'plain'],
    },
    size: { control: 'radio', options: ['small', 'medium', 'large'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    pill: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    variant: 'brand',
    appearance: 'accent',
    size: 'medium',
    loading: false,
    disabled: false,
    pill: false,
    label: 'Publish',
  },
  parameters: {
    docs: {
      description: {
        component:
          'Web Awesome `<wa-button>` rendered through Angular. Attributes are bound with ' +
          '`[attr.*]` because the element reads them as HTML attributes rather than as ' +
          'Angular inputs.',
      },
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <wa-button
        [attr.variant]="variant"
        [attr.appearance]="appearance"
        [attr.size]="size"
        [attr.loading]="loading ? '' : null"
        [attr.disabled]="disabled ? '' : null"
        [attr.pill]="pill ? '' : null"
      >{{ label }}</wa-button>
    `,
  }),
};

export default meta;

type Story = StoryObj<ButtonArgs>;

/** Default brand button. */
export const Default: Story = {};

/** Every semantic variant side by side. */
export const Variants: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:.5rem; flex-wrap:wrap">
        <wa-button variant="brand">Brand</wa-button>
        <wa-button variant="neutral">Neutral</wa-button>
        <wa-button variant="success">Success</wa-button>
        <wa-button variant="warning">Warning</wa-button>
        <wa-button variant="danger">Danger</wa-button>
      </div>
    `,
  }),
};

/** Appearance treatments for a single variant. */
export const Appearances: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:.5rem; flex-wrap:wrap">
        <wa-button variant="brand" appearance="accent">Accent</wa-button>
        <wa-button variant="brand" appearance="filled">Filled</wa-button>
        <wa-button variant="brand" appearance="outlined">Outlined</wa-button>
        <wa-button variant="brand" appearance="plain">Plain</wa-button>
      </div>
    `,
  }),
};

/** Loading and disabled states. */
export const States: Story = {
  render: () => ({
    template: `
      <div style="display:flex; gap:.5rem; flex-wrap:wrap">
        <wa-button variant="brand" loading>Loading</wa-button>
        <wa-button variant="brand" disabled>Disabled</wa-button>
        <wa-button variant="brand" pill>Pill</wa-button>
        <wa-button variant="brand">
          <wa-icon slot="start" name="cloud-arrow-up"></wa-icon>
          With icon
        </wa-button>
      </div>
    `,
  }),
};
