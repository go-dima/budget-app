import type { Meta, StoryObj } from '@storybook/react';
import { MonthlyTrendChart } from './MonthlyTrendChart.js';

const meta: Meta<typeof MonthlyTrendChart> = { component: MonthlyTrendChart, title: 'Components/MonthlyTrendChart' };
export default meta;
type Story = StoryObj<typeof MonthlyTrendChart>;

export const Default: Story = {
  args: {
    data: [
      { month: '2025-01', income: 1000000, expenses: 600000 },
      { month: '2025-02', income: 1000000, expenses: 750000 },
      { month: '2025-03', income: 1200000, expenses: 500000 },
    ],
  },
};
export const Empty: Story = { args: { data: [] } };
