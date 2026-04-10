import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { AppLayout } from './AppLayout.js';

const meta: Meta<typeof AppLayout> = {
  component: AppLayout,
  title: 'Components/AppLayout',
  decorators: [Story => <MemoryRouter><Story /></MemoryRouter>],
};
export default meta;
type Story = StoryObj<typeof AppLayout>;

export const Default: Story = {
  args: { children: <div style={{ padding: 24 }}>Page content here</div> },
};
