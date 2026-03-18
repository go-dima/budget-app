import { useState } from 'react';
import { Alert, Button, Card, Input, Table, Tag, Typography } from 'antd';
import { AmountDisplay } from '../AmountDisplay/AmountDisplay.js';
import type { ImportPreviewResponse } from '../../../shared/types.js';

const { Text } = Typography;

interface ImportPreviewProps {
  preview: ImportPreviewResponse;
  onConfirm: (sheetNameOverrides: Record<string, string>) => void;
  isLoading: boolean;
}

export function ImportPreview({ preview, onConfirm, isLoading }: ImportPreviewProps) {
  const [nameOverrides, setNameOverrides] = useState<Record<string, string>>({});
  const validSheets = preview.sheets.filter(s => !s.error && s.rowCount > 0);

  function handleNameChange(originalName: string, newName: string) {
    setNameOverrides(prev => ({ ...prev, [originalName]: newName }));
  }

  function handleConfirm() {
    // Only include overrides that differ from the original name
    const overrides: Record<string, string> = {};
    for (const [orig, renamed] of Object.entries(nameOverrides)) {
      const trimmed = renamed.trim();
      if (trimmed && trimmed !== orig) overrides[orig] = trimmed;
    }
    onConfirm(overrides);
  }

  return (
    <div>
      {preview.sheets.map(sheet => (
        <Card
          key={sheet.sheetName}
          title={
            <Input
              defaultValue={sheet.sheetName}
              onChange={e => handleNameChange(sheet.sheetName, e.target.value)}
              style={{ maxWidth: 300 }}
              dir="rtl"
            />
          }
          size="small"
          style={{ marginBottom: 12 }}
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
                columns={[
                  { title: 'Date', dataIndex: 'date', key: 'date', width: 110 },
                  { title: 'Description', dataIndex: 'description', key: 'description', render: v => <span dir="rtl">{v}</span> },
                  { title: 'Category', dataIndex: 'category', key: 'category', render: v => <span dir="rtl">{v}</span> },
                  { title: 'Amount', dataIndex: 'amount', key: 'amount', render: v => <AmountDisplay amount={v as number} /> },
                ]}
              />
            </>
          )}
        </Card>
      ))}
      <Button type="primary" onClick={handleConfirm} loading={isLoading} disabled={validSheets.length === 0}>
        Confirm Import
      </Button>
    </div>
  );
}
