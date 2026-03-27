import type { Meta, StoryObj } from '@storybook/react';
import { Button } from 'antd';
import { PageHeader } from './PageHeader.js';

const meta: Meta<typeof PageHeader> = {
  component: PageHeader,
  title: 'Components/PageHeader',
};
export default meta;

type Story = StoryObj<typeof PageHeader>;

export const TitleOnly: Story = {
  args: { title: 'Category Mapping' },
};

export const WithAction: Story = {
  args: {
    title: 'Category Mapping',
    children: <Button>Re-calculate</Button>,
  },
};

export const WithMultipleActions: Story = {
  args: {
    title: 'Settings',
    children: (
      <>
        <Button>Secondary</Button>
        <Button type="primary">Primary</Button>
      </>
    ),
  },
};
