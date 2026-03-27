import type { ColumnType } from 'antd/es/table';
import { Tooltip } from 'antd';
import { AmountDisplay } from './AmountDisplay/AmountDisplay.js';

/** Date column — sortable, 120px wide */
export function dateCol<T extends { date: string }>(overrides?: Partial<ColumnType<T>>): ColumnType<T> {
  return { title: 'Date', dataIndex: 'date', key: 'date', width: 120, ...overrides };
}

/** RTL description column — ellipsis + tooltip */
export function descriptionCol<T extends { description: string }>(overrides?: Partial<ColumnType<T>>): ColumnType<T> {
  return {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    ellipsis: { showTitle: false },
    render: (v: string) => <Tooltip title={v}><span dir="rtl">{v}</span></Tooltip>,
    ...overrides,
  };
}

/** RTL description column without tooltip (simpler variant for review/preview tables) */
export function descriptionColSimple<T extends { description: string }>(overrides?: Partial<ColumnType<T>>): ColumnType<T> {
  return {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    render: (v: string) => <span dir="rtl">{v}</span>,
    ...overrides,
  };
}

/** Amount column — 120px, renders via AmountDisplay */
export function amountCol<T extends { amount: number }>(overrides?: Partial<ColumnType<T>>): ColumnType<T> {
  return {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    width: 120,
    render: (v: number) => <AmountDisplay amount={v} />,
    ...overrides,
  };
}
