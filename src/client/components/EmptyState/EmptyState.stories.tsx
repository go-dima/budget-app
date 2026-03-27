import type { Meta, StoryObj } from '@storybook/react';
import { Button, Typography } from 'antd';
import { EmptyState } from './EmptyState.js';

const meta: Meta<typeof EmptyState> = { component: EmptyState, title: 'Components/EmptyState' };
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const TitleOnly: Story = {
  args: { title: 'No data yet.' },
};

export const WithAction: Story = {
  args: {
    title: 'No transaction data yet.',
    action: <Button type="primary" size="large">Import Data</Button>,
  },
};

export const WithTextAction: Story = {
  args: {
    title: 'No data yet.',
    action: <Typography.Text><a href="#">Import transactions</a> to get started.</Typography.Text>,
  },
};
