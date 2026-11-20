import { escapeHTML, safeName } from './render.js';

const stages = [
  { title: 'Start with a safety net', time: 'CHAPTER 1', body: 'Finish Gone Fishing. After Down to Earth, accept Lucia’s morning balcony meditation at Jason’s house before Chapter 1 ends. Keep cheats off and rotate chapter saves.', links: [2,28] },
  { title: 'See the story through', time: '≈ 60–80 H TOTAL', body: 'Complete Chapters 1–4 and the final mission. Follow Breakfast Run, The Cartel Heist, Child’s Play, Headliners, VCIA Takedown and Operation Savage Glory. Scan vehicles and study animals as you go.', links: [7,13] },
  { title: 'Follow the people', time: 'SIDE STRANDS', body: 'Finish Andy, Kenton, Billy, Randy, Tyrone and Bret’s jobs. Complete 8 qualifying stranger strands; not every named contact counts. Revisit meditations with both characters after Coffee Break.', links: [25,29] },
  { title: 'Work the whole state', time: 'COLLECT & PRACTICE', body: '250 stunts, 42 range golds, 20 different race wins, 3 card sets, 100 WAiNK locations, 100 vehicle discoveries and 5 vault escapes. Buy garages, register 10 vehicles and finish partner feats.', links: [15,40] },
  { title: 'Close the long road', time: '≈ 100 H CHECKLIST', body: 'After the story: Progress > Stats > 100% Completion. Push to 300 stunts, 70 challenges, 200 base-model scans and 100 animal studies. Finish all required robberies, 8 vaults and 39 gang operations.', links: [14,49] },
  { title: 'Become a legend', time: '≈ 200 H WHOLE RUN', body: 'Audit remaining trophy entries, including secrets awaiting corroboration. The checklist and the trophy list are different: finish both, verify the other 54 trophies, then claim your platinum.', links: [1] },
];

export function renderSixStageRoadmap(trophies, journal) {
  document.querySelector('#roadmapView').innerHTML = `<div class="roadmap-heading"><div><h2>The long road, made manageable.</h2><p>A suggested order, with early safeguards and clear cleanup targets.</p></div><span>6 STAGES / 1 PLAYTHROUGH</span></div><div class="roadmap-grid">${stages.map((stage,index) => {
    const group = trophies.filter(t => t.stage === index+1);
    const done = group.filter(t => journal.earned.includes(t.id)).length;
    const protectedBody = journal.spoilers && index < 3 ? [
      'Play the opening. Protect the early optional meditation before leaving Chapter 1; keep chapter saves and cheats off. Turn off Hide spoilers in the ledger to read the precise mission trigger.',
      'Finish all story chapters and the final mission. Keep scanning vehicles and studying animals. Names and mission details are concealed while spoiler protection is enabled.',
      'Finish the named character questlines and 8 qualifying stranger strands. Return to meditation spots with both characters once joint free-roam opens. Secret character names stay concealed.'
    ][index] : stage.body;
    return `<article class="stage-card"><div class="stage-top"><b>${String(index+1).padStart(2,'0')}</b><span>${stage.time}</span></div><h3>${stage.title}</h3><p>${protectedBody}</p>${stage.links.map(id => { const t=trophies.find(t=>t.id===id);return `<button data-route="${id}" class="${t.missable ? 'flag' : ''}">${t.missable ? '⚑ ' : '↗ '}${escapeHTML(safeName(t,journal))}</button>`; }).join('')}<progress max="${group.length}" value="${done}" aria-label="Stage ${index+1} progress"></progress><small class="source-note">${done} / ${group.length} assigned trophies earned</small></article>`;
  }).join('')}</div><div class="roadmap-note"><b>⚑ One potentially missable:</b> Positive Mental Attitude’s Chapter 1 meditation is still under confirmation. Do it early to be safe. <br>Route adapted from <a href="https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/" target="_blank" rel="noopener noreferrer">PowerPyx</a> and <a href="https://www.gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series" target="_blank" rel="noopener noreferrer">GTABase</a>. All 55 are offline; remaining content is available in free-roam.</div>`;
}
