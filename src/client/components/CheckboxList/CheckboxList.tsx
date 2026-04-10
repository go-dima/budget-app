import { Checkbox, Typography } from 'antd';
import styles from './CheckboxList.module.css';

const { Text } = Typography;

export interface CheckboxListProps {
  items: { id: string; name: string }[];
  /**
   * include mode: selectedIds is the explicit include list; empty = all selected.
   * exclude mode: excludeIds is the explicit exclude list; empty = all visible.
   */
  mode: 'include' | 'exclude';
  selectedIds?: string[];             // include mode
  excludeIds?: string[];              // exclude mode
  onChange?: (ids: string[]) => void;          // include mode callback
  onChangeExclude?: (ids: string[]) => void;   // exclude mode callback
  /** Whether items have RTL text (renders <span dir="rtl">) */
  rtl?: boolean;
}

export function CheckboxList({
  items,
  mode,
  selectedIds = [],
  excludeIds = [],
  onChange,
  onChangeExclude,
  rtl = false,
}: CheckboxListProps) {
  if (items.length === 0) {
    return <Text type="secondary" className="text-sm">No data yet</Text>;
  }

  if (mode === 'include') {
    const allIds = items.map(i => i.id);
    const effectiveSelected = selectedIds.length === 0 ? allIds : selectedIds;
    const allChecked = selectedIds.length === 0;

    function handleCheck(id: string, checked: boolean) {
      if (!onChange) return;
      if (checked) {
        const next = [...effectiveSelected.filter(x => x !== id), id];
        onChange(next.length === allIds.length ? [] : next);
      } else {
        onChange(effectiveSelected.filter(x => x !== id));
      }
    }

    return (
      <div>
        {items.length > 1 && (
          <div className={styles.masterRow}>
            <Checkbox
              checked={allChecked}
              indeterminate={!allChecked && effectiveSelected.length > 0}
              onChange={() => onChange?.([])}
            >
              <Text type="secondary" className="text-sm">All</Text>
            </Checkbox>
          </div>
        )}
        <div className={styles.scrollList}>
          {items.map(item => (
            <div key={item.id} className={styles.checkboxItem}>
              <Checkbox
                checked={effectiveSelected.includes(item.id)}
                onChange={e => handleCheck(item.id, e.target.checked)}
              >
                {rtl
                  ? <span dir="rtl" className="text-body-sm">{item.name}</span>
                  : <span className="text-body-sm">{item.name}</span>}
              </Checkbox>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // exclude mode
  const allVisible = excludeIds.length === 0;
  const someHidden = !allVisible && excludeIds.length < items.length;

  function handleExcludeCheck(id: string, checked: boolean) {
    if (!onChangeExclude) return;
    if (checked) {
      onChangeExclude(excludeIds.filter(x => x !== id));
    } else {
      onChangeExclude([...excludeIds, id]);
    }
  }

  return (
    <div>
      {items.length > 1 && (
        <div className={styles.masterRow}>
          <Checkbox
            checked={allVisible}
            indeterminate={someHidden}
            onChange={() => onChangeExclude?.(allVisible ? items.map(i => i.id) : [])}
          >
            <Text type="secondary" className="text-sm">All</Text>
          </Checkbox>
        </div>
      )}
      <div className={styles.itemList}>
        {items.map(item => (
          <div key={item.id} className={styles.checkboxItem}>
            <Checkbox
              checked={!excludeIds.includes(item.id)}
              onChange={e => handleExcludeCheck(item.id, e.target.checked)}
            >
              {rtl
                ? <span dir="rtl" className="text-body-sm">{item.name}</span>
                : <span className="text-body-sm">{item.name}</span>}
            </Checkbox>
          </div>
        ))}
      </div>
    </div>
  );
}
