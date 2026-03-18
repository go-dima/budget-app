import type { Meta, StoryObj } from '@storybook/react';
import { AmountDisplay } from './AmountDisplay.js';

const meta: Meta<typeof AmountDisplay> = { component: AmountDisplay, title: 'Components/AmountDisplay' };
export default meta;
type Story = StoryObj<typeof AmountDisplay>;

export const Income: Story = { args: { amount: 500000 } };
export const Expense: Story = { args: { amount: -30000 } };
export const Zero: Story = { args: { amount: 0 } };
export const WithSign: Story = { args: { amount: -30000, showSign: true } };
