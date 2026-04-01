import { useCallback, useState } from 'react';
import { Button, Typography } from 'antd';
import { MappingTable } from '../MappingTable/MappingTable.js';
import type { MappingTableRow } from '../MappingTable/MappingTable.js';
import { AccountSelector } from '../AccountSelector/AccountSelector.js';
import type { ColumnMappingEntry, ColumnMappingMap, ColumnMappingTarget } from '../../../shared/types.js';

const { Text } = Typography;

export interface SheetToMap {
  sheetName: string;
  /** Columns that need explicit mapping. Empty = all columns recognised. */
  unknownColumns: string[];
  storedMapping: ColumnMappingEntry[] | null;
}

export interface ColumnMappingStepProps {
  sheets: SheetToMap[];
  availableAccounts: string[];
  onConfirm: (mapping: ColumnMappingMap, accountOverrides: Record<string, string>) => void;
  isLoading: boolean;
}

function initRows(sheet: SheetToMap): MappingTableRow[] {
  const storedMap = new Map(sheet.storedMapping?.map(e => [e.sourceColumn, e.targetField]) ?? []);
  return sheet.unknownColumns.map(col => ({
    key: col,
    sourceColumn: col,
    targetField: storedMap.get(col) ?? null,
  }));
}

export function ColumnMappingStep({ sheets, availableAccounts, onConfirm, isLoading }: ColumnMappingStepProps) {
  const [sheetRows, setSheetRows] = useState<Record<string, MappingTableRow[]>>(() =>
    Object.fromEntries(sheets.map(s => [s.sheetName, initRows(s)]))
  );

  // Account name per sheet; defaults to sheet name
  const [accountOverrides, setAccountOverrides] = useState<Record<string, string>>(
    () => Object.fromEntries(sheets.map(s => [s.sheetName, s.sheetName]))
  );

  const sheetsNeedingMapping = sheets.filter(s => s.unknownColumns.length > 0);
  const allAssigned = sheetsNeedingMapping.every(s =>
    (sheetRows[s.sheetName] ?? []).every(r => r.targetField !== null)
  );

  const handleSave = useCallback((sheetName: string, col: string, target: ColumnMappingTarget) => {
    setSheetRows(prev => ({
      ...prev,
      [sheetName]: prev[sheetName]!.map(r =>
        r.key === col ? { ...r, targetField: target } : r
      ),
    }));
  }, []);

  function handleConfirm() {
    const mapping: ColumnMappingMap = {};
    for (const [sheetName, rows] of Object.entries(sheetRows)) {
      if (rows.length > 0) {
        mapping[sheetName] = rows
          .filter(r => r.targetField !== null)
          .map(r => ({ sourceColumn: r.sourceColumn, targetField: r.targetField! }));
      }
    }
    onConfirm(mapping, accountOverrides);
  }

  return (
    <div>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Assign each sheet to an account and, where needed, map source columns to fields.
        Mappings are saved and pre-filled on future imports for the same account.
      </Text>

      {sheets.map(sheet => (
        <div key={sheet.sheetName} style={{ marginBottom: 24 }}>
          {sheets.length > 1 && (
            <Text strong style={{ display: 'block', marginBottom: 4 }}>
              Sheet: {sheet.sheetName}
            </Text>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Text type="secondary" style={{ whiteSpace: 'nowrap' }}>Account:</Text>
            <AccountSelector
              sheetName={sheet.sheetName}
              availableAccounts={availableAccounts}
              onChange={name => setAccountOverrides(prev => ({ ...prev, [sheet.sheetName]: name }))}
            />
          </div>

          {sheet.unknownColumns.length > 0 ? (
            <MappingTable
              rows={sheetRows[sheet.sheetName] ?? []}
              onSave={(col, target) => handleSave(sheet.sheetName, col, target)}
              placeholder="— select a field —"
            />
          ) : (
            <Text type="secondary">All columns recognised — no mapping needed.</Text>
          )}
        </div>
      ))}

      <Button
        type="primary"
        disabled={!allAssigned || isLoading}
        loading={isLoading}
        onClick={handleConfirm}
      >
        Confirm &amp; Import
      </Button>
    </div>
  );
}
