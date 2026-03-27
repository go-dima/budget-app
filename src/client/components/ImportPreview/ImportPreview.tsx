import { useState } from 'react';
import { Alert, Button, Card, Checkbox, Input, Table, Tag, Typography } from 'antd';
import type { ImportPreviewResponse } from '../../../shared/types.js';
import { amountCol, dateCol, descriptionColSimple } from '../tableColumns.js';

const { Text } = Typography;

interface ImportPreviewProps {
  preview: ImportPreviewResponse;
  onConfirm: (sheetNameOverrides: Record<string, string>, selectedSheets: string[]) => void;
  isLoading: boolean;
}

export function ImportPreview({ preview, onConfirm, isLoading }: ImportPreviewProps) {
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});

  const validSheets = preview.sheets.filter(s => !s.error && s.rowCount > 0);

  // Pre-select sheets that match an existing account
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(
    () => new Set(validSheets.filter(s => s.existingAccount !== null).map(s => s.sheetName))
  );

  function handleNameChange(originalName: string, newName: string) {
    setNameOverrides(prev => ({ ...prev, [originalName]: newName }));
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
    for (const [orig, renamed] of Object.entries(nameOverrides)) {
      const trimmed = renamed.trim();
      if (trimmed && trimmed !== orig) overrides[orig] = trimmed;
    }
    onConfirm(overrides, Array.from(selectedSheets));
  }

  const selectedCount = selectedSheets.size;

  type SampleRow = { date: string; description: string; category: string; amount: number };
  const sampleColumns = [
    dateCol<SampleRow>(),
    descriptionColSimple<SampleRow>(),
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
                <Input
                  defaultValue={sheet.sheetName}
                  onChange={e => handleNameChange(sheet.sheetName, e.target.value)}
                  style={{ maxWidth: 300 }}
                  dir="rtl"
                  disabled={!isValid || !isSelected}
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
                  rowKey={(_, i) => String(i)}
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
