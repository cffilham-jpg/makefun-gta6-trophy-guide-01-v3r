export const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const isMasked = (trophy, journal) => journal.spoilers && trophy.hidden && !journal.earned.includes(trophy.id);
export const safeName = (trophy, journal) => isMasked(trophy, journal) ? 'Hidden trophy · earn to reveal' : trophy.name;
const tierSymbol = grade => ({ platinum: '✧', gold: '◆', silver: '◇', bronze: '◈' }[grade]);

export function renderProgressByGradeAndKind(trophies, journal) {
  const earned = journal.earned.length;
  document.querySelector('#earned').textContent = earned;
  document.querySelector('#overall').value = earned;
  document.querySelector('#percent').textContent = Math.round(earned / 55 * 100) + '%';
  const meter = (label, group, tier = '') => {
    const done = group.filter(t => journal.earned.includes(t.id)).length;
    return `<div class="meter-row ${tier}"><div class="meter-label"><span>${tier ? '<i class="grade-dot"></i>' : ''}${label}</span><small>${done} / ${group.length}</small></div><progress value="${done}" max="${group.length || 1}" aria-label="${label}: ${done} of ${group.length}"></progress></div>`;
  };
  document.querySelector('#gradeProgress').innerHTML = ['platinum','gold','silver','bronze'].map(grade => meter(grade, trophies.filter(t => t.grade === grade), grade)).join('');
  document.querySelector('#kindProgress').innerHTML = ['story','missable','collectibles','activities','online'].map(kind => meter(kind, trophies.filter(t => t.kind === kind))).join('');
}

export function renderTrophyChecklist(trophies, journal, selected) {
  document.querySelector('#resultCount').textContent = `${trophies.length} ${trophies.length === 1 ? 'ENTRY' : 'ENTRIES'}`;
  document.querySelector('#trophyList').innerHTML = trophies.length ? trophies.map(t => {
    const done = journal.earned.includes(t.id);
    const masked = isMasked(t, journal);
    return `<div class="trophy-row ${t.grade} ${selected === t.id ? 'selected' : ''} ${done ? 'earned' : ''}" data-row="${t.id}">
      <input type="checkbox" data-check="${t.id}" aria-label="Mark ${escapeHTML(safeName(t,journal))} earned" ${done ? 'checked' : ''}>
      <button class="row-open" data-open="${t.id}" aria-pressed="${selected === t.id}"><span class="row-name">${escapeHTML(safeName(t,journal))}</span><span class="row-desc">${masked ? 'Story or secret details protected until earned.' : escapeHTML(t.description)}</span><span class="row-meta"><span>STAGE ${t.stage}</span><span class="${t.missable ? 'flag' : ''}">${t.missable ? '⚑ POSSIBLY MISSABLE' : escapeHTML(t.kind.toUpperCase())}</span>${t.count && !masked ? `<span>${journal.counters[t.id] || 0}/${t.count.toLocaleString()}</span>` : ''}</span></button>
      <span class="row-grade"><span class="grade-symbol">${tierSymbol(t.grade)}</span>${t.grade}</span>
    </div>`;
  }).join('') : '<p class="empty">No matching trophies. Try another search or filter. There are no online trophies in this set.</p>';
}

export function renderDeepGuide(t, journal) {
  const detail = document.querySelector('#detail');
  if (!t) { detail.innerHTML = '<p class="empty">Select a trophy to open its field notes.</p>'; return; }
  const masked = isMasked(t, journal);
  const done = journal.earned.includes(t.id);
  detail.className = `detail ${t.grade}`;
  detail.innerHTML = `<div class="detail-top"><span>FIELD NOTE / ${String(t.id).padStart(2,'0')}</span><button class="reader-button" data-reader>${document.querySelector('main').classList.contains('reading') ? '← Back to checklist' : 'Expand note ↗'}</button><span class="grade-badge">${tierSymbol(t.grade)} ${t.grade}</span></div>
    <h2>${escapeHTML(safeName(t,journal))}</h2><p class="official-description">${masked ? 'Spoiler protection is on. Earn this trophy or turn off Hide spoilers to read the entry.' : escapeHTML(t.description)}</p>
    ${masked ? '<p class="guide-copy">The name, description, method, sources and personal notes are concealed together so the guide cannot spoil this secret indirectly.</p>' : `
    <div class="facts"><div><small>DIFFICULTY</small><strong>${t.difficulty} / 10</strong></div><div><small>TIME ESTIMATE</small><strong>${escapeHTML(t.time)}</strong></div><div><small>ROADMAP</small><strong>Stage ${t.stage} / 6</strong></div></div>
    ${t.missable ? '<p class="source-note flag">⚑ POTENTIALLY MISSABLE · protect the Chapter 1 opportunity</p>' : ''}
    <div class="sources source-credit"><b>SOURCE NOTES / CHECKED 20 NOV 2026</b><br>${t.source.map(s => `<a href="${escapeHTML(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(s.name)} ↗</a>`).join('')}</div>
    <p class="guide-copy">${escapeHTML(t.guide)}</p><div class="section-label">THE ROUTE</div><ol class="steps">${t.steps.map(step => `<li>${escapeHTML(step)}</li>`).join('')}</ol>
    <div class="tip"><b>LEDGER TIP</b> / ${escapeHTML(t.tip)}</div>
    <p class="source-note">${escapeHTML(t.status)}. Difficulty & cleanup time: editorial estimates.</p>
    <div class="track-tools">${t.count ? `<label>Personal counter <input id="counter" type="number" min="0" max="${t.count}" step="1" value="${journal.counters[t.id] || 0}"> / ${t.count.toLocaleString()} <span>(does not auto-earn)</span></label>` : ''}<label for="note">YOUR FIELD NOTES · saved locally</label><textarea id="note" maxlength="2000" placeholder="Missing spots, next stop, save slot…">${escapeHTML(journal.notes[t.id] || '')}</textarea></div>`}
    <button class="earned-button" data-toggle="${t.id}">${done ? '✓ Earned — mark as unearned' : 'Mark trophy as earned'}</button>`;
  detail.scrollTop = 0;
}

export function renderNextTrophy(trophies, journal) {
  const next = trophies.filter(t => !journal.earned.includes(t.id)).sort((a,b) => a.stage-b.stage || a.difficulty-b.difficulty || (a.hours ?? Infinity)-(b.hours ?? Infinity) || a.id-b.id)[0];
  const button = document.querySelector('#nextUp');
  button.disabled = !next;
  button.dataset.next = next?.id || '';
  button.innerHTML = next ? `<small>STAGE ${next.stage} · ${next.difficulty}/10 DIFFICULTY</small><b>${escapeHTML(safeName(next,journal))}</b><span>Open the field note →</span>` : '<b>Leonida Legend.</b><small>ALL 55 TROPHIES EARNED</small>';
}
