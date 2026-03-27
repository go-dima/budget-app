import type { Meta, StoryObj } from '@storybook/react';
import { CategoryMappingPage } from './CategoryMappingPage.js';

/**
 * NOTE: CategoryMappingPage fetches data via useCategoryMapping and useCategories hooks.
 * These stories render the page shell but require API mocking (MSW or similar) for
 * interactive data. The component will show a loading spinner until API calls resolve.
 *
 * For now, stories are exported as documentation stubs. Wire up MSW handlers when
 * the project-level MSW setup is in place.
 */

const meta: Meta<typeof CategoryMappingPage> = {
  component: CategoryMappingPage,
  title: 'Pages/CategoryMappingPage',
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;
type Story = StoryObj<typeof CategoryMappingPage>;

/**
 * WithMappings — populated mapping table, each row has a preferred category.
 * Requires MSW to intercept GET /api/category-mappings and GET /api/categories.
 *
 * Sample data the MSW handler should return for GET /api/category-mappings:
 * [
 *   { account: 'Bank Leumi', description: 'שופרסל דיל', preferredCategoryId: 'cat-1', suggestedCategoryIds: [], preferredCategory: { id: 'cat-1', name: 'Groceries', type: 'expense', excludedByDefault: false } },
 *   { account: 'Bank Leumi', description: 'מקדונלדס',    preferredCategoryId: 'cat-2', suggestedCategoryIds: ['cat-3'], preferredCategory: { id: 'cat-2', name: 'Dining', type: 'expense', excludedByDefault: false }, suggestedCategories: [{ id: 'cat-3', name: 'Transport', type: 'expense', excludedByDefault: false }] },
 *   { account: 'Visa Cal',   description: 'רב-קו',       preferredCategoryId: 'cat-3', suggestedCategoryIds: [], preferredCategory: { id: 'cat-3', name: 'Transport', type: 'expense', excludedByDefault: false } },
 *   { account: 'Visa Cal',   description: 'סופר-פארם',   preferredCategoryId: 'cat-1', suggestedCategoryIds: [], preferredCategory: { id: 'cat-1', name: 'Groceries', type: 'expense', excludedByDefault: false } },
 * ]
 */
export const WithMappings: Story = {};

/**
 * WithNoPreferred — two rows with no preferred (tie during recalculate) showing "None — choose one".
 *
 * Sample data the MSW handler should return for GET /api/category-mappings:
 * [
 *   { account: 'Bank Leumi', description: 'העברה בנקאית', preferredCategoryId: null, suggestedCategoryIds: ['cat-1', 'cat-2'], suggestedCategories: [{ id: 'cat-1', name: 'Groceries', type: 'expense', excludedByDefault: false }, { id: 'cat-2', name: 'Dining', type: 'expense', excludedByDefault: false }] },
 *   { account: 'Visa Cal',   description: 'פייפאל',       preferredCategoryId: null, suggestedCategoryIds: ['cat-3', 'cat-4'], suggestedCategories: [{ id: 'cat-3', name: 'Transport', type: 'expense', excludedByDefault: false }, { id: 'cat-4', name: 'Salary', type: 'income', excludedByDefault: false }] },
 *   { account: 'Bank Leumi', description: 'שופרסל דיל',   preferredCategoryId: 'cat-1', suggestedCategoryIds: [], preferredCategory: { id: 'cat-1', name: 'Groceries', type: 'expense', excludedByDefault: false } },
 *   { account: 'Visa Cal',   description: 'רב-קו',         preferredCategoryId: 'cat-3', suggestedCategoryIds: [], preferredCategory: { id: 'cat-3', name: 'Transport', type: 'expense', excludedByDefault: false } },
 * ]
 */
export const WithNoPreferred: Story = {};

/**
 * Empty — no mappings at all.
 *
 * Sample data the MSW handler should return for GET /api/category-mappings: []
 */
export const Empty: Story = {};
