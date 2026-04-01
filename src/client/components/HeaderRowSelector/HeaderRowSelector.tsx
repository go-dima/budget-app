import { useState } from 'react';
import { Button, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ImportPreviewSheet } from '../../../shared/types.js';

const { Text } = Typography;

interface HeaderRowSelectorProps {
  sheets: ImportPreviewSheet[];
  onConfirm: (headerRowOverrides: Record<string, number>) => void;
}

/**
 * Shown when a file has extra rows before the real header row (e.g. HTML-as-XLS
 * exports from banks). Displays up to 15 raw rows per sheet; the auto-detected
 * header row is pre-selected. The user can click any row to change the selection.
 */
export function HeaderRowSelector({ sheets, onConfirm }: HeaderRowSelectorProps) {
  const sheetsWithRawRows = sheets.filter(s => s.rawRows && s.rawRows.length > 0);

  const [selections, setSelections] = useState<Record<string, number>>(
    () => Object.fromEntries(sheetsWithRawRows.map(s => [s.sheetName, s.detectedHeaderRow]))
  );

  function handleRowClick(sheetName: string, rowIdx: number) {
    setSelections(prev => ({ ...prev, [sheetName]: rowIdx }));
  }

  function handleConfirm() {
    onConfirm(selections);
  }

  return (
    <div>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        The file contains rows before the column headers. The highlighted row was
        auto-detected as the header — click a different row to change it.
      </Text>

      {sheetsWithRawRows.map(sheet => {
        const rows = sheet.rawRows!;
        const selectedIdx = selections[sheet.sheetName] ?? sheet.detectedHeaderRow;

        // Build column definitions from the widest row
        const maxCols = Math.max(...rows.map(r => r.length));
        const columns: ColumnsType<string[]> = Array.from({ length: maxCols }, (_, i) => ({
          key: i,
          title: `Col ${i + 1}`,
          dataIndex: i,
          render: (val: string) => <span dir="rtl">{val}</span>,
          ellipsis: true,
          width: 160,
        }));

        const dataSource = rows.map((row, idx) => {
          // Extend row to maxCols
          const padded = [...row, ...Array(maxCols - row.length).fill('')];
          return Object.assign(padded, { _idx: idx });
        });

        return (
          <div key={sheet.sheetName} style={{ marginBottom: 32 }}>
            {sheetsWithRawRows.length > 1 && (
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Sheet: {sheet.sheetName}</Text>
            )}
            <Table<string[]>
              dataSource={dataSource}
              columns={columns}
              rowKey={r => String((r as unknown as { _idx: number })._idx)}
              pagination={false}
              size="small"
              scroll={{ x: 'max-content', y: 400 }}
              onRow={(record) => {
                const idx = (record as unknown as { _idx: number })._idx;
                return {
                  onClick: () => handleRowClick(sheet.sheetName, idx),
                  style: {
                    cursor: 'pointer',
                    background: idx === selectedIdx ? '#e6f4ff' : undefined,
                    fontWeight: idx === selectedIdx ? 600 : undefined,
                  },
                };
              }}
              title={() => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Click the row that contains the column headers.{' '}
                  <Tag color="blue">Row {selectedIdx + 1}</Tag> is currently selected.
                </Text>
              )}
            />
          </div>
        );
      })}

      <Button type="primary" onClick={handleConfirm}>
        Confirm Header Row
      </Button>
    </div>
  );
}
