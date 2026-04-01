import { sqliteTable, text, integer, unique, primaryKey } from 'drizzle-orm/sqlite-core';

export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull().default('checking'), // checking/savings/credit/cash
  currency: text('currency').notNull().default('ILS'),
  createdAt: integer('created_at').notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  type: text('type').notNull().default('expense'), // income/expense
  excludedByDefault: integer('excluded_by_default').notNull().default(0), // 1 = hidden in default view
});

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id),
  categoryId: text('category_id').references(() => categories.id),
  amount: integer('amount').notNull(), // agorot (×100), positive=income, negative=expense
  type: text('type').notNull(), // income/expense/transfer
  description: text('description').notNull(),
  paymentMethod: text('payment_method'),
  details: text('details'),
  reference: text('reference'),
  balance: integer('balance'), // running balance in agorot
  date: text('date').notNull(), // ISO 8601 YYYY-MM-DD
  createdAt: integer('created_at').notNull(),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const importLogs = sqliteTable('import_logs', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id),
  rowCount: integer('row_count').notNull(),
  importedAt: integer('imported_at').notNull(),
});

export const descriptionPaymentMethodMap = sqliteTable(
  'description_payment_method_map',
  {
    id: text('id').primaryKey(),
    account: text('account').notNull(),
    description: text('description').notNull(),
    preferredPaymentMethod: text('preferred_payment_method'),
    suggestedPaymentMethods: text('suggested_payment_methods').notNull().default('[]'),
  },
  (t) => ({
    uniq: unique().on(t.account, t.description),
  })
);

export const accountColumnMapping = sqliteTable(
  'account_column_mapping',
  {
    account: text('account').notNull(),
    sourceColumn: text('source_column').notNull(),
    targetField: text('target_field').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.account, t.sourceColumn] }),
  })
);

export const descriptionCategoryMap = sqliteTable(
  'description_category_map',
  {
    id: text('id').primaryKey(),
    account: text('account').notNull(),
    description: text('description').notNull(),
    preferredCategoryId: text('preferred_category_id').references(() => categories.id),
    suggestedCategoryIds: text('suggested_category_ids').notNull().default('[]'),
  },
  (t) => ({
    uniq: unique().on(t.account, t.description),
  })
);
