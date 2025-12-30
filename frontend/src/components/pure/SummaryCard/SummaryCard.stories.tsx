import type { Meta, StoryObj } from "@storybook/react";
import { SummaryCard } from "./SummaryCard";

const meta: Meta<typeof SummaryCard> = {
  title: "Components/SummaryCard",
  component: SummaryCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Account Name",
    totalIncome: 50000,
    totalExpense: 35000,
    balance: 15000,
    transactionCount: 150,
    lastTransactionDate: Math.floor(Date.now() / 1000),
  },
};

export const Overall: Story = {
  args: {
    title: "Overall Summary",
    totalIncome: 150000,
    totalExpense: 95000,
    balance: 55000,
    transactionCount: 450,
    lastTransactionDate: Math.floor(Date.now() / 1000),
    isOverall: true,
  },
};

export const NegativeBalance: Story = {
  args: {
    title: "Account with Deficit",
    totalIncome: 10000,
    totalExpense: 15000,
    balance: -5000,
    transactionCount: 50,
  },
};
