import { useEffect, useState } from 'react';
import { Button, Checkbox, DatePicker, Drawer, Radio, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import type { Account, Category, TransactionFilters } from '../../../shared/types.js';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface FilterFormProps {
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
      <div style={{ paddingLeft: 4 }}>
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
  filters, accounts, categories, defaultExcludedIds,
  onSetAccountIds, onSetExcludeCategories, onSetDateRange, onSetType, onReset,
}: FilterFormProps) {
  const [pendingStart, setPendingStart] = useState<string | undefined>(filters.startDate);
  const [pendingEnd, setPendingEnd] = useState<string | undefined>(filters.endDate);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setPendingStart(filters.startDate);
    setPendingEnd(filters.endDate);
  }, [filters.startDate, filters.endDate]);

  const sortedCategories = [...categories].sort((a, b) => {
    if (a.type !== b.type) return a.type === 'expense' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div>
        <Text type="secondary" style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Accounts</Text>
        <CheckboxFilterList
          items={accounts}
          selectedIds={filters.accountIds ?? []}
          onChange={onSetAccountIds}
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

      <div>
        <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Date Range</Text>
        <RangePicker
          picker="month"
          style={{ width: '100%' }}
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          value={[
            pendingStart ? dayjs(pendingStart) : null,
            pendingEnd ? dayjs(pendingEnd) : null,
          ]}
          onChange={dates => {
            setPendingStart(dates?.[0]?.startOf('month').format('YYYY-MM-DD'));
            setPendingEnd(dates?.[1]?.endOf('month').format('YYYY-MM-DD'));
          }}
          renderExtraFooter={() => (
            <div style={{ padding: '8px 4px' }}>
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  onSetDateRange(pendingStart, pendingEnd);
                  setPickerOpen(false);
                }}
              >
                Apply
              </Button>
            </div>
          )}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <Button
            size="small"
            onClick={() => {
              setPendingStart(undefined);
              setPendingEnd(undefined);
              onSetDateRange(undefined, undefined);
            }}
          >
            Full time
          </Button>
          <Button
            size="small"
            onClick={() => {
              const y = dayjs().subtract(1, 'year').year();
              const start = dayjs().year(y).startOf('year').format('YYYY-MM-DD');
              const end = dayjs().year(y).endOf('year').format('YYYY-MM-DD');
              setPendingStart(start);
              setPendingEnd(end);
              onSetDateRange(start, end);
            }}
          >
            Last year
          </Button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Categories</Text>
        <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
          <Tag
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => onSetExcludeCategories([])}
          >
            All
          </Tag>
          <Tag
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => onSetExcludeCategories(sortedCategories.map(c => c.id))}
          >
            None
          </Tag>
          <Tag
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => onSetExcludeCategories(defaultExcludedIds)}
          >
            Preset
          </Tag>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <ExcludeCategoryList
            items={sortedCategories}
            excludeIds={filters.excludeCategories ?? []}
            onChangeExclude={onSetExcludeCategories}
          />
        </div>
      </div>

      <Button block onClick={onReset}>Reset Filters</Button>
    </div>
  );
}

export function FilterSidebar(props: FilterSidebarProps) {
  const { drawerOpen, onDrawerClose, ...formProps } = props;

  return (
    <Drawer
      title="Filters"
      open={drawerOpen}
      onClose={onDrawerClose}
      placement="left"
      size="default"
      styles={{ body: { display: 'flex', flexDirection: 'column', padding: 16, overflow: 'hidden' } }}
    >
      <FilterForm {...formProps} />
    </Drawer>
  );
}
