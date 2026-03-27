import { useMemo } from 'react';
import { Button, DatePicker, Radio, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import type { Account, Category, TransactionFilters } from '../../../shared/types.js';
import { CheckboxList } from '../CheckboxList/CheckboxList.js';
import styles from './FilterSidebar.module.css';

const { RangePicker } = DatePicker;
const { Text } = Typography;

export interface FilterFormProps {
  filters: TransactionFilters;
  accounts: Account[];
  categories: Category[];
  defaultExcludedIds: string[];
  onSetAccountIds: (ids: string[]) => void;
  onSetExcludeCategories: (ids: string[]) => void;
  onSetDateRange: (start: string | undefined, end: string | undefined) => void;
  onSetType: (type: TransactionFilters['type']) => void;
  onReset: () => void;
}

export function FilterForm({
  filters, accounts, categories, defaultExcludedIds,
  onSetAccountIds, onSetExcludeCategories, onSetDateRange, onSetType, onReset,
}: FilterFormProps) {
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'expense' ? -1 : 1;
      return a.name.localeCompare(b.name);
    }),
    [categories],
  );

  // Key-based reset: remount the picker whenever the external date range changes
  // (e.g. after refreshAll or Reset Filters). This keeps the picker fully uncontrolled
  // so it never feeds a new object reference into rc-picker's useControlledState.
  const pickerKey = `${filters.startDate ?? 'none'}/${filters.endDate ?? 'none'}`;

  return (
    <div className={styles.form}>
      <div>
        <Text type="secondary" className={styles.sectionLabel}>Accounts</Text>
        <CheckboxList
          items={accounts}
          mode="include"
          selectedIds={filters.accountIds ?? []}
          onChange={onSetAccountIds}
        />
      </div>

      <div>
        <Text type="secondary" className={styles.sectionLabel}>Type</Text>
        <Radio.Group value={filters.type ?? 'all'} onChange={e => onSetType(e.target.value as TransactionFilters['type'])}>
          <Radio.Button value="all">All</Radio.Button>
          <Radio.Button value="income">Income</Radio.Button>
          <Radio.Button value="expense">Expense</Radio.Button>
        </Radio.Group>
      </div>

      <div>
        <Text type="secondary" className={styles.sectionLabel}>Date Range</Text>
        <RangePicker
          key={pickerKey}
          picker="month"
          className="full-width"
          defaultValue={[
            filters.startDate ? dayjs(filters.startDate) : null,
            filters.endDate ? dayjs(filters.endDate) : null,
          ]}
          onChange={dates => {
            if (dates?.[0] && dates?.[1]) {
              onSetDateRange(
                dates[0].startOf('month').format('YYYY-MM-DD'),
                dates[1].endOf('month').format('YYYY-MM-DD'),
              );
            }
          }}
        />
        <div className={styles.dateButtons}>
          <Button
            size="small"
            onClick={() => onSetDateRange(undefined, undefined)}
          >
            Full time
          </Button>
          <Button
            size="small"
            onClick={() => {
              const y = dayjs().subtract(1, 'year').year();
              onSetDateRange(
                dayjs().year(y).startOf('year').format('YYYY-MM-DD'),
                dayjs().year(y).endOf('year').format('YYYY-MM-DD'),
              );
            }}
          >
            Last year
          </Button>
        </div>
      </div>

      <div className={styles.categoriesSection}>
        <Text type="secondary" className={styles.sectionLabel}>Categories</Text>
        <div className={styles.categoryPresetTags}>
          <Tag
            className={styles.presetTag}
            onClick={() => onSetExcludeCategories([])}
          >
            All
          </Tag>
          <Tag
            className={styles.presetTag}
            onClick={() => onSetExcludeCategories(sortedCategories.map(c => c.id))}
          >
            None
          </Tag>
          <Tag
            className={styles.presetTag}
            onClick={() => onSetExcludeCategories(defaultExcludedIds)}
          >
            Preset
          </Tag>
        </div>
        <div className={styles.categoryScrollList}>
          <CheckboxList
            items={sortedCategories}
            mode="exclude"
            excludeIds={filters.excludeCategories ?? []}
            onChangeExclude={onSetExcludeCategories}
            rtl
          />
        </div>
      </div>

      <Button block onClick={onReset}>Reset Filters</Button>
    </div>
  );
}
