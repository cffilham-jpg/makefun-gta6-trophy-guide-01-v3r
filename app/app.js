import { emptyJournal, loadJournal, saveJournal, validateBackup, downloadJournal } from './storage.js';
import { isMasked, renderProgressByGradeAndKind, renderTrophyChecklist, renderDeepGuide, renderNextTrophy } from './render.js';
import { renderSixStageRoadmap } from './roadmap.js';

const $ = selector => document.querySelector(selector);
let trophies = [];
let journal = emptyJournal();
let selected = 28;
let kind = 'all';
let view = 'ledger';
let toastTimer;

function announce(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
}

function persist() {
  const saved = saveJournal(journal);
  $('#saveState').textContent = saved ? '✓ Saved on this device' : 'Storage unavailable · export to keep progress';
  return saved;
}

function filteredTrophies() {
  const query = $('#search').value.trim().toLocaleLowerCase();
  const grades = { platinum:0, gold:1, silver:2, bronze:3 };
  const results = trophies.filter(t => {
    if (kind !== 'all' && t.kind !== kind) return false;
    if ($('#remaining').checked && journal.earned.includes(t.id)) return false;
    const haystack = isMasked(t,journal) ? `hidden trophy ${t.grade} stage ${t.stage}` : `${t.name} ${t.description} ${t.guide} ${t.kind}`;
    return !query || haystack.toLocaleLowerCase().includes(query);
  });
  const comparators = {
    grade: (a,b) => grades[a.grade]-grades[b.grade] || a.id-b.id,
    difficulty: (a,b) => a.difficulty-b.difficulty || a.stage-b.stage || a.id-b.id,
    time: (a,b) => (a.hours ?? Infinity)-(b.hours ?? Infinity) || a.id-b.id,
    name: (a,b) => (isMasked(a,journal) ? 'Hidden trophy' : a.name).localeCompare(isMasked(b,journal) ? 'Hidden trophy' : b.name) || a.id-b.id,
  };
  return results.sort(comparators[$('#sort').value]);
}

function renderAll({ detail = true } = {}) {
  renderProgressByGradeAndKind(trophies,journal);
  renderNextTrophy(trophies,journal);
  const list = filteredTrophies();
  renderTrophyChecklist(list,journal,selected);
  if (detail) renderDeepGuide(trophies.find(t=>t.id===selected),journal);
  renderSixStageRoadmap(trophies,journal);
  $('#spoilers').checked = journal.spoilers;
  document.querySelectorAll('[data-kind]').forEach(button => button.classList.toggle('active',button.dataset.kind===kind));
}

function changeView(next) {
  view = next;
  $('main').classList.toggle('roadmap-active',view === 'roadmap');
  $('#ledgerView').hidden = view !== 'ledger';
  $('#roadmapView').hidden = view !== 'roadmap';
  document.querySelectorAll('[data-view]').forEach(button => {
    button.classList.toggle('active',button.dataset.view===view);
    button.setAttribute('aria-current',button.dataset.view===view ? 'page' : 'false');
  });
}

function openTrophy(id, clearFilters = false) {
  selected = Number(id);
  changeView('ledger');
  if (clearFilters) { kind='all'; $('#search').value=''; $('#remaining').checked=false; }
  renderAll();
  const row = document.querySelector(`[data-row="${selected}"]`);
  if (row) $('#trophyList').scrollTop = row.offsetTop - $('#trophyList').offsetTop;
}

function toggleEarned(id) {
  id = Number(id);
  const done = journal.earned.includes(id);
  journal.earned = done ? journal.earned.filter(value=>value!==id) : [...journal.earned,id];
  if (!done && trophies.find(t=>t.id===id)?.count) journal.counters[id] = trophies.find(t=>t.id===id).count;
  persist();
  renderAll();
  announce(done ? 'Trophy marked unearned.' : 'Trophy earned. Your ledger is saved.');
}

function bindTrackerControls() {
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.view) changeView(button.dataset.view);
    if (button.dataset.kind) { kind=button.dataset.kind; renderAll({detail:false}); $('#trophyList').scrollTop=0; }
    if (button.dataset.open) openTrophy(button.dataset.open);
    if (button.dataset.route) openTrophy(button.dataset.route,true);
    if (button.dataset.toggle) toggleEarned(button.dataset.toggle);
    if (button.dataset.next) openTrophy(button.dataset.next,true);
    if (button.hasAttribute('data-reader')) {
      $('main').classList.toggle('reading');
      renderDeepGuide(trophies.find(t=>t.id===selected),journal);
    }
  });
  $('#trophyList').addEventListener('change', event => { if (event.target.dataset.check) toggleEarned(event.target.dataset.check); });
  $('#search').addEventListener('input',()=>{ renderAll({detail:false}); $('#trophyList').scrollTop=0; });
  $('#sort').addEventListener('change',()=>{ renderAll({detail:false}); $('#trophyList').scrollTop=0; });
  $('#remaining').addEventListener('change',()=>renderAll({detail:false}));
  $('#spoilers').addEventListener('change',()=>{ journal.spoilers=$('#spoilers').checked; persist(); renderAll(); });
  $('#missableLink').addEventListener('click',()=>{ kind='missable'; $('#search').value=''; $('#remaining').checked=false; openTrophy(28); });
  $('#detail').addEventListener('input', event => {
    if (event.target.id === 'note') { journal.notes[selected] = event.target.value; persist(); }
  });
  $('#detail').addEventListener('change', event => {
    if (event.target.id === 'counter') {
      const max = trophies.find(t=>t.id===selected).count;
      journal.counters[selected] = Math.min(max,Math.max(0,Math.floor(Number(event.target.value)||0)));
      event.target.value = journal.counters[selected];
      persist(); renderAll({detail:false});
    }
  });
  $('#export').addEventListener('click',()=>{ downloadJournal(journal); announce('JSON backup exported: trophies, counters, notes & spoiler setting.'); });
  $('#import').addEventListener('click',()=>$('#importFile').click());
  $('#importFile').addEventListener('change',async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 500000) throw new Error('Backup is too large (maximum 500 KB).');
      const next = validateBackup(JSON.parse(await file.text()),trophies);
      if (!confirm(`Replace this ledger with ${next.earned.length} earned trophies from your backup? Export first if you want to keep the current version.`)) return;
      journal = next; persist(); renderAll(); announce('Backup restored.');
    } catch (error) { announce(error instanceof SyntaxError ? 'This file is not valid JSON. Your ledger was not changed.' : error.message); }
    finally { event.target.value=''; }
  });
  $('#reset').addEventListener('click',()=>{
    if (!confirm('Reset earned trophies, counters and notes? Export a backup first to keep them.')) return;
    const spoilers = journal.spoilers;
    journal = { ...emptyJournal(), spoilers };
    persist(); renderAll(); announce('Ledger reset. Spoiler preference kept.');
  });
}

async function initializeOfflineLedger() {
  try {
    const response = await fetch('./data/trophies.json');
    if (!response.ok) throw new Error('The local trophy file could not be loaded.');
    trophies = (await response.json()).trophies;
    const loaded = loadJournal(trophies);
    journal = loaded.journal;
    bindTrackerControls();
    renderAll();
    if (loaded.warning) announce(loaded.warning);
    requestAnimationFrame(()=>{ window.__shotReady = true; });
  } catch (error) {
    $('#trophyList').textContent = 'Unable to load local data. Serve the app folder with node serve.ts and reload.';
    announce(error.message);
  }
}

initializeOfflineLedger();
