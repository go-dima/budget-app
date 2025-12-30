import type { Meta, StoryObj } from "@storybook/react";
import { TransactionTable } from "./TransactionTable";
import type { Transaction } from "../../../types";

const mockTransactions: Transaction[] = [
  {
    id: "1",
    account_id: "acc-1",
    date: Math.floor(Date.now() / 1000),
    description: "Salary Payment",
    payment_method: "Bank Transfer",
    category: "Income",
    details: null,
    reference: "REF001",
    expense: 0,
    income: 15000,
    balance: 50000,
    raw_date_string: "27 Dec 2024",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    account_id: "acc-1",
    date: Math.floor(Date.now() / 1000) - 86400,
    description: "Supermarket",
    payment_method: "Credit Card",
    category: "Groceries",
    details: null,
    reference: "REF002",
    expense: 350,
    income: 0,
    balance: 35000,
    raw_date_string: "26 Dec 2024",
    created_at: new Date().toISOString(),
  },
];

const meta: Meta<typeof TransactionTable> = {
  title: "Components/TransactionTable",
  component: TransactionTable,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    transactions: mockTransactions,
    accountNames: { "acc-1": "Main Account" },
  },
};

export const Loading: Story = {
  args: {
    transactions: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    transactions: [],
  },
};
