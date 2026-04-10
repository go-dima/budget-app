import type { Meta, StoryObj } from '@storybook/react';
import { PaymentMappingPage } from './PaymentMappingPage.js';

/**
 * NOTE: PaymentMappingPage fetches data via usePaymentMapping hook.
 * These stories render the page shell but require API mocking (MSW or similar)
 * for interactive data. The component will show a loading spinner until the API
 * call resolves.
 *
 * Stories: Empty, WithMappings (clean rows), WithConflicts (tie rows).
 */

const meta: Meta<typeof PaymentMappingPage> = {
  component: PaymentMappingPage,
  title: 'Pages/PaymentMappingPage',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof PaymentMappingPage>;

export const Empty: Story = {};

export const WithMappings: Story = {};

export const WithConflicts: Story = {};
