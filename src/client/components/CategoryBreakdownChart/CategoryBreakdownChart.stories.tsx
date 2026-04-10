import type { Meta, StoryObj } from '@storybook/react';
import { CategoryBreakdownChart } from './CategoryBreakdownChart.js';

const meta: Meta<typeof CategoryBreakdownChart> = { component: CategoryBreakdownChart, title: 'Components/CategoryBreakdownChart' };
export default meta;
type Story = StoryObj<typeof CategoryBreakdownChart>;

export const Default: Story = {
  args: {
    data: [
      { categoryId: '1', categoryName: 'שכירות', total: 500000, percentage: 45, count: 1 },
      { categoryId: '2', categoryName: 'מזון', total: 300000, percentage: 27, count: 12 },
      { categoryId: '3', categoryName: 'תחבורה', total: 150000, percentage: 14, count: 8 },
    ],
  },
};
