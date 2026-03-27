import type { Meta, StoryObj } from '@storybook/react';
import { SuggestedChips } from './SuggestedChips.js';

const meta: Meta<typeof SuggestedChips> = {
  component: SuggestedChips,
  title: 'Components/SuggestedChips',
};
export default meta;

type Story = StoryObj<typeof SuggestedChips>;

const ITEMS = [
  { key: 'visa', label: 'Visa' },
  { key: 'mastercard', label: 'Mastercard' },
  { key: 'cash', label: 'Cash' },
];

export const Selectable: Story = {
  args: {
    items: ITEMS,
    canRemove: false,
    onSelect: () => {},
  },
};

export const Removable: Story = {
  args: {
    items: ITEMS,
    canRemove: true,
    onSelect: () => {},
    onRemove: () => {},
  },
};

export const Empty: Story = {
  args: {
    items: [],
    onSelect: () => {},
  },
};
