import { useState } from 'react';
import { Alert, Button, Card, Checkbox, Table, Tag, Typography } from 'antd';
import type { ImportPreviewResponse } from '../../../shared/types.js';
import { amountCol, dateCol, descriptionColSimple } from '../tableColumns.js';
import { AccountSelector } from '../AccountSelector/AccountSelector.js';
import { fixBidiVisualOrder } from '../../../shared/bidiUtils.js';

const { Text } = Typography;

interface ImportPreviewProps {
  preview: ImportPreviewResponse;
  availableAccounts: string[];
  initialNameOverrides?: Record<string, string>;
  onConfirm: (sheetNameOverrides: Record<string, string>, selectedSheets: string[], fixBidi: boolean) => void;
  isLoading: boolean;
}

export function ImportPreview({ preview, availableAccounts, initialNameOverrides, onConfirm, isLoading }: ImportPreviewProps) {
  // nameOverrides: sheetName → effective account name (defaults to sheet name, or pre-filled from column mapping)
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>(
    () => Object.fromEntries(preview.sheets.map(s => [s.sheetName, initialNameOverrides?.[s.sheetName] ?? s.sheetName]))
  );

  const validSheets = preview.sheets.filter(s => !s.error && s.rowCount > 0);

  // Pre-select sheets that match an existing account
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(
    () => new Set(validSheets.filter(s => s.existingAccount !== null).map(s => s.sheetName))
  );
  const [fixBidi, setFixBidi] = useState(false);

  function handleAccountChange(sheetName: string, accountName: string) {
    setNameOverrides(prev => ({ ...prev, [sheetName]: accountName }));
  }

  function toggleSheet(sheetName: string, checked: boolean) {
    setSelectedSheets(prev => {
      const next = new Set(prev);
      if (checked) next.add(sheetName); else next.delete(sheetName);
      return next;
    });
  }

  function handleConfirm() {
    const overrides: Record<string, string> = {};
    for (const [orig, name] of Object.entries(nameOverrides)) {
      const trimmed = name.trim();
      if (trimmed) overrides[orig] = trimmed;
    }
    onConfirm(overrides, Array.from(selectedSheets), fixBidi);
  }

  const selectedCount = selectedSheets.size;

  type SampleRow = { date: string; description: string; category: string; amount: number };
  const sampleColumns = [
    dateCol<SampleRow>(),
    descriptionColSimple<SampleRow>({
      render: (v: string) => <span dir="rtl">{fixBidi ? fixBidiVisualOrder(v) : v}</span>,
    }),
    { title: 'Category', dataIndex: 'category', key: 'category', render: (v: string) => <span dir="rtl">{v}</span> },
    amountCol<SampleRow>(),
  ];

  return (
    <div>
      {preview.sheets.map(sheet => {
        const isValid = !sheet.error && sheet.rowCount > 0;
        const isSelected = selectedSheets.has(sheet.sheetName);

        return (
          <Card
            key={sheet.sheetName}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isValid && (
                  <Checkbox
                    checked={isSelected}
                    onChange={e => toggleSheet(sheet.sheetName, e.target.checked)}
                  />
                )}
                <AccountSelector
                  sheetName={sheet.sheetName}
                  availableAccounts={availableAccounts}
                  disabled={!isValid || !isSelected}
                  onChange={name => handleAccountChange(sheet.sheetName, name)}
                />
              </div>
            }
            size="small"
            className="mb-12"
            style={{ opacity: isValid && !isSelected ? 0.5 : 1 }}
          >
            {sheet.error ? (
              <Alert type="error" message={sheet.error} />
            ) : sheet.rowCount === 0 ? (
              <Text type="secondary">No data rows found — skipping.</Text>
            ) : (
              <>
                <Text>Rows: {sheet.rowCount}</Text>
                {sheet.dateRange && <Text style={{ marginLeft: 12 }}>Range: {sheet.dateRange.from} → {sheet.dateRange.to}</Text>}
                {sheet.existingAccount && (
                  <div style={{ marginTop: 4 }}>
                    <Tag color="blue">⚡ Account exists</Tag>
                    <Text>{sheet.existingAccount.newRows} new rows will be added, {sheet.existingAccount.duplicates} duplicates will be skipped</Text>
                  </div>
                )}
                <Table
                  dataSource={sheet.sampleRows}
                  rowKey={r => `${r.date}-${r.description}`}
                  size="small"
                  pagination={false}
                  style={{ marginTop: 8 }}
                  columns={sampleColumns}
                />
              </>
            )}
          </Card>
        );
      })}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        <Checkbox checked={fixBidi} onChange={e => setFixBidi(e.target.checked)}>
          Fix reversed Hebrew text (BiDi)
        </Checkbox>
      </div>

      <Button
        type="primary"
        onClick={handleConfirm}
        loading={isLoading}
        disabled={selectedCount === 0}
      >
        {selectedCount > 0
          ? `Import ${selectedCount} sheet${selectedCount > 1 ? 's' : ''}`
          : 'Select at least one sheet'}
      </Button>
    </div>
  );
}
