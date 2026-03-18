import { Button, Checkbox, DatePicker, Drawer, Radio, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import type { Account, Category, TransactionFilters } from '../../../shared/types.js';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface FilterFormProps {
  filters: TransactionFilters;
  accounts: Account[];
  categories: Category[];
  onSetAccountIds: (ids: string[]) => void;
  onSetExcludeCategories: (ids: string[]) => void;
  onSetDateRange: (start: string | undefined, end: string | undefined) => void;
  onSetType: (type: TransactionFilters['type']) => void;
  onReset: () => void;
}

interface FilterSidebarProps extends FilterFormProps {
  drawerOpen?: boolean;
  onDrawerClose?: () => void;
}

/** Checkbox list where empty selectedIds means "all selected" (include mode) */
function CheckboxFilterList({
  items,
  selectedIds,
  onChange,
}: {
  items: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const allIds = items.map(i => i.id);
  const effectiveSelected = selectedIds.length === 0 ? allIds : selectedIds;

  function handleCheck(id: string, checked: boolean) {
    if (checked) {
      const next = [...effectiveSelected.filter(x => x !== id), id];
      onChange(next.length === allIds.length ? [] : next);
    } else {
      onChange(effectiveSelected.filter(x => x !== id));
    }
  }

  if (items.length === 0) {
    return <Text type="secondary" style={{ fontSize: 12 }}>No data yet</Text>;
  }

  const allChecked = selectedIds.length === 0;

  return (
    <div>
      {items.length > 1 && (
        <div style={{ marginBottom: 6 }}>
          <Checkbox
            checked={allChecked}
            indeterminate={!allChecked && effectiveSelected.length > 0}
            onChange={() => onChange([])}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>All</Text>
          </Checkbox>
        </div>
      )}
      <div style={{ maxHeight: 180, overflowY: 'auto', paddingLeft: 4 }}>
        {items.map(item => (
          <div key={item.id} style={{ marginBottom: 4 }}>
            <Checkbox
              checked={effectiveSelected.includes(item.id)}
              onChange={e => handleCheck(item.id, e.target.checked)}
            >
              <span style={{ fontSize: 13 }}>{item.name}</span>
            </Checkbox>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Category checkbox list in exclude mode.
 * Checked = visible (NOT in excludeIds). Unchecked = hidden (IN excludeIds).
 * Default-hidden categories start unchecked.
 */
function ExcludeCategoryList({
  items,
  excludeIds,
  onChangeExclude,
}: {
  items: { id: string; name: string }[];
  excludeIds: string[];
  onChangeExclude: (ids: string[]) => void;
}) {
  function handleCheck(id: string, checked: boolean) {
    if (checked) {
      onChangeExclude(excludeIds.filter(x => x !== id));
    } else {
      onChangeExclude([...excludeIds, id]);
    }
  }

  const allVisible = excludeIds.length === 0;
  const someHidden = !allVisible && excludeIds.length < items.length;

  if (items.length === 0) {
    return <Text type="secondary" style={{ fontSize: 12 }}>No data yet</Text>;
  }

  return (
    <div>
      {items.length > 1 && (
        <div style={{ marginBottom: 6 }}>
          <Checkbox
            checked={allVisible}
            indeterminate={someHidden}
            onChange={() => onChangeExclude(allVisible ? items.map(i => i.id) : [])}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>All</Text>
          </Checkbox>
        </div>
      )}
      <div style={{ maxHeight: 180, overflowY: 'auto', paddingLeft: 4 }}>
        {items.map(item => (
          <div key={item.id} style={{ marginBottom: 4 }}>
            <Checkbox
              checked={!excludeIds.includes(item.id)}
              onChange={e => handleCheck(item.id, e.target.checked)}
            >
              <span dir="rtl" style={{ fontSize: 13 }}>{item.name}</span>
            </Checkbox>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FilterForm({
  filters, accounts, categories,
  onSetAccountIds, onSetExcludeCategories, onSetDateRange, onSetType, onReset,
}: FilterFormProps) {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <div>
        <Text type="secondary" style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Accounts</Text>
        <CheckboxFilterList
          items={accounts}
          selectedIds={filters.accountIds ?? []}
          onChange={onSetAccountIds}
        />
      </div>

      <div>
        <Text type="secondary" style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Categories</Text>
        <ExcludeCategoryList
          items={categories}
          excludeIds={filters.excludeCategories ?? []}
          onChangeExclude={onSetExcludeCategories}
        />
      </div>

      <div>
        <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Date Range</Text>
        <RangePicker
          picker="month"
          style={{ width: '100%' }}
          value={[
            filters.startDate ? dayjs(filters.startDate) : null,
            filters.endDate ? dayjs(filters.endDate) : null,
          ]}
          onChange={dates => onSetDateRange(
            dates?.[0]?.startOf('month').format('YYYY-MM-DD'),
            dates?.[1]?.endOf('month').format('YYYY-MM-DD'),
          )}
        />
      </div>

      <div>
        <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Type</Text>
        <Radio.Group value={filters.type ?? 'all'} onChange={e => onSetType(e.target.value as TransactionFilters['type'])}>
          <Radio.Button value="all">All</Radio.Button>
          <Radio.Button value="income">Income</Radio.Button>
          <Radio.Button value="expense">Expense</Radio.Button>
        </Radio.Group>
      </div>

      <Button block onClick={onReset}>Reset Filters</Button>
    </Space>
  );
}

export function FilterSidebar(props: FilterSidebarProps) {
  const { drawerOpen, onDrawerClose, ...formProps } = props;

  return (
    <Drawer title="Filters" open={drawerOpen} onClose={onDrawerClose} placement="left" width={300}>
      <FilterForm {...formProps} />
    </Drawer>
  );
}
