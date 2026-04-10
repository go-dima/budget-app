import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { NavBar } from './NavBar.js';

const meta: Meta<typeof NavBar> = {
  component: NavBar,
  title: 'Components/NavBar',
  decorators: [Story => <MemoryRouter><Story /></MemoryRouter>],
};
export default meta;
type Story = StoryObj<typeof NavBar>;
export const Default: Story = {};
