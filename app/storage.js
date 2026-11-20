export const STORAGE_KEY = 'leonida-ledger-v1';
export const emptyJournal = () => ({ version: 1, earned: [], counters: {}, notes: {}, spoilers: false });

export function validateBackup(value, trophies) {
  if (!value || value.version !== 1 || !Array.isArray(value.earned)) throw new Error('Choose a Leonida Ledger version 1 backup.');
  const ids = new Set(trophies.map(t => t.id));
  if (value.earned.some(id => !Number.isInteger(id) || !ids.has(id))) throw new Error('Backup contains an unknown trophy ID.');
  const result = emptyJournal();
  result.earned = [...new Set(value.earned)];
  result.spoilers = value.spoilers === true;
  for (const [id, count] of Object.entries(value.counters || {})) {
    const trophy = trophies.find(t => t.id === Number(id));
    if (!trophy?.count || !Number.isFinite(count) || count < 0 || count > trophy.count) throw new Error('Backup contains an invalid counter.');
    result.counters[id] = Math.floor(count);
  }
  for (const [id, note] of Object.entries(value.notes || {})) {
    if (!ids.has(Number(id)) || typeof note !== 'string' || note.length > 2000) throw new Error('Backup contains an invalid note.');
    result.notes[id] = note;
  }
  return result;
}

export function loadJournal(trophies) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return { journal: raw ? validateBackup(JSON.parse(raw), trophies) : emptyJournal(), warning: '' };
  } catch {
    return { journal: emptyJournal(), warning: 'Saved data could not be read. Export a backup if this browser restricts storage.' };
  }
}

export function saveJournal(journal) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(journal)); return true; }
  catch { return false; }
}

export function downloadJournal(journal) {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ app: 'Leonida Ledger', ...journal }, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-ledger-backup.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
