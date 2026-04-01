import { Button, Table, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { MappingSelectCell } from '../MappingSelectCell/MappingSelectCell.js';
import { COLUMN_MAPPING_TARGETS } from '../../../shared/types.js';
import type { ColumnMappingTarget } from '../../../shared/types.js';

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
          value={record.targetField}
          valueLabel={COLUMN_MAPPING_TARGETS.find(t => t.value === record.targetField)?.label}
          options={COLUMN_MAPPING_TARGETS}
          onSave={(val) => onSave(record.sourceColumn, val as ColumnMappingTarget)}
          placeholder={placeholder}
        />
      ),
    },
    ...(onDelete ? [{
      title: '',
      key: 'delete',
      width: 48,
      render: (_: unknown, record: MappingTableRow) => (
        <Button
          icon={<DeleteOutlined />}
          danger
          onClick={() => onDelete(record.sourceColumn)}
        />
      ),
    }] : []),
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
