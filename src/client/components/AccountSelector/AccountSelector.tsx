import { useState } from 'react';
import { Input, Select } from 'antd';

const NEW_ACCOUNT_VALUE = '__new__';

interface AccountSelectorProps {
  /** The sheet's original name — used as the default new-account name */
  sheetName: string;
  availableAccounts: string[];
  disabled?: boolean;
  onChange: (accountName: string) => void;
}

/**
 * Per-sheet account selector: choose an existing account from a dropdown,
 * or pick "New account" and type a custom name.
 *
 * Controlled externally via `onChange`; the parent tracks the effective name.
 */
export function AccountSelector({ sheetName, availableAccounts, disabled, onChange }: AccountSelectorProps) {
  const isExisting = availableAccounts.includes(sheetName);
  const [mode, setMode] = useState<'existing' | 'new'>(isExisting ? 'existing' : 'new');
  const [selectedAccount, setSelectedAccount] = useState(isExisting ? sheetName : '');
  const [newName, setNewName] = useState(sheetName);

  const options = [
    ...availableAccounts.map(a => ({ value: a, label: a })),
    { value: NEW_ACCOUNT_VALUE, label: '+ New account' },
  ];

  function handleSelectChange(val: string) {
    if (val === NEW_ACCOUNT_VALUE) {
      setMode('new');
      onChange(newName);
    } else {
      setMode('existing');
      setSelectedAccount(val);
      onChange(val);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNewName(e.target.value);
    onChange(e.target.value);
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Select
        value={mode === 'existing' ? selectedAccount : NEW_ACCOUNT_VALUE}
        options={options}
        style={{ minWidth: 200 }}
        disabled={disabled}
        showSearch
        optionFilterProp="label"
        onChange={handleSelectChange}
      />
      {mode === 'new' && (
        <Input
          value={newName}
          onChange={handleInputChange}
          placeholder="Account name"
          style={{ maxWidth: 220 }}
          disabled={disabled}
          dir="rtl"
        />
      )}
    </div>
  );
}
