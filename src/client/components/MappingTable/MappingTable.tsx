import { Button, Table, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { MappingSelectCell } from '../MappingSelectCell/MappingSelectCell.js';
import { COLUMN_MAPPING_TARGETS } from '../../../shared/types.js';
import type { ColumnMappingTarget } from '../../../shared/types.js';

const MAPPING_OPTIONS = COLUMN_MAPPING_TARGETS.filter(t => t.value !== 'ignore');

export interface MappingTableRow {
  key: string;
  sourceColumn: string;
  targetField: ColumnMappingTarget | null;
}

export interface MappingTableProps {
  rows: MappingTableRow[];
  onSave: (sourceColumn: string, targetField: ColumnMappingTarget) => void;
  onDelete?: (sourceColumn: string) => void;
  placeholder?: string;
}

export function MappingTable({ rows, onSave, onDelete, placeholder }: MappingTableProps) {
  const columns: ColumnsType<MappingTableRow> = [
    {
      title: 'Source Column',
      dataIndex: 'sourceColumn',
      key: 'sourceColumn',
      render: (val: string) => <Typography.Text strong dir="rtl">{val}</Typography.Text>,
    },
    {
      title: 'Maps To',
      key: 'targetField',
      render: (_: unknown, record: MappingTableRow) => (
        <MappingSelectCell
          value={record.targetField === 'ignore' ? null : record.targetField}
          valueLabel={MAPPING_OPTIONS.find(t => t.value === record.targetField)?.label}
          options={MAPPING_OPTIONS}
          onSave={(val) => onSave(record.sourceColumn, val as ColumnMappingTarget)}
          placeholder={placeholder}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 96,
      render: (_: unknown, record: MappingTableRow) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button
            size="small"
            onClick={() => onSave(record.sourceColumn, 'ignore')}
            type={record.targetField === 'ignore' ? 'primary' : 'default'}
            danger={record.targetField !== 'ignore'}
          >
            Ignore
          </Button>
          {onDelete && (
            <Button
              icon={<DeleteOutlined />}
              danger
              size="small"
              onClick={() => onDelete(record.sourceColumn)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <Table<MappingTableRow>
      columns={columns}
      dataSource={rows}
      rowKey="key"
      pagination={false}
      size="small"
    />
  );
}
