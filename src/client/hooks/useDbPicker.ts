import { useCallback, useEffect, useState } from 'react';
import { databasesApi } from '../httpClient/client.js';
import type { DbEntry } from '../../shared/types.js';

interface UseDbPickerOptions {
  onSwitched: () => void;
}

export function useDbPicker({ onSwitched }: UseDbPickerOptions) {
  const [dbs, setDbs] = useState<DbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingFilename, setEditingFilename] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const loadDbs = useCallback(async () => {
    setLoading(true);
    try { setDbs(await databasesApi.list()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDbs(); }, [loadDbs]);

  const activeDb = dbs.find(d => d.isActive);

  async function handleSwitch(filename: string) {
    setSwitching(filename);
    try {
      await databasesApi.switch(filename);
      await loadDbs();
      onSwitched();
    } finally { setSwitching(null); }
  }

  async function handleDelete(filename: string) {
    setDeleting(filename);
    try {
      await databasesApi.delete(filename);
      await loadDbs();
    } finally { setDeleting(null); }
  }

  function startEdit(db: DbEntry) {
    setEditingFilename(db.filename);
    setEditValue(db.name);
  }

  async function commitEdit(filename: string) {
    if (!editValue.trim()) { cancelEdit(); return; }
    try {
      await databasesApi.rename(filename, editValue.trim());
      await loadDbs();
      // If we renamed the active db, notify parent to refresh
      const wasActive = dbs.find(d => d.filename === filename)?.isActive;
      if (wasActive) onSwitched();
    } finally { cancelEdit(); }
  }

  function cancelEdit() {
    setEditingFilename(null);
    setEditValue('');
  }

  async function handleCreate() {
    setCreating(true);
    try {
      await databasesApi.create(newName.trim());
      setNewName('');
      await loadDbs();
      onSwitched();
    } finally { setCreating(false); }
  }

  return {
    dbs,
    loading,
    newName,
    setNewName,
    creating,
    switching,
    deleting,
    editingFilename,
    editValue,
    setEditValue,
    activeDb,
    handleSwitch,
    handleDelete,
    startEdit,
    commitEdit,
    cancelEdit,
    handleCreate,
  };
}
