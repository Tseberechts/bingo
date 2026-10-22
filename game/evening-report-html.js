const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const buildEveningReportHtml = ({ state, settings, generatedAt = new Date() }) => {
  const title = settings?.gameTitle || 'BINGO';
  const called = Array.isArray(state?.calledNumbers) ? state.calledNumbers : [];
  const round = Number.isInteger(state?.round) ? state.round : 1;
  const lastCalled = state?.lastCalled ?? null;
  const when = new Intl.DateTimeFormat('nl-BE', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(generatedAt);

  const numbersList = called.length
    ? called.map((n) => `<li>${escapeHtml(n)}</li>`).join('')
    : '<li><em>Geen nummers opgeroepen</em></li>';

  return `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Avondrapport — ${escapeHtml(title)}</title>
  <style>
    body { font-family: Georgia, serif; color: #111; max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
    .meta { color: #555; margin-bottom: 1.5rem; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat { border: 1px solid #ddd; padding: 0.75rem 1rem; border-radius: 6px; }
    .stat strong { display: block; font-size: 1.5rem; }
    ol { columns: 3; column-gap: 1.5rem; }
    li { margin: 0.15rem 0; }
    footer { margin-top: 2rem; color: #777; font-size: 0.85rem; }
  </style>
</head>
<body>
  <h1>Avondrapport — ${escapeHtml(title)}</h1>
  <p class="meta">Gegenereerd op ${escapeHtml(when)}</p>
  <div class="stats">
    <div class="stat"><span>Ronde</span><strong>${escapeHtml(round)}</strong></div>
    <div class="stat"><span>Opgeroepen</span><strong>${escapeHtml(called.length)}</strong></div>
    <div class="stat"><span>Laatste nummer</span><strong>${escapeHtml(lastCalled ?? '—')}</strong></div>
  </div>
  <h2>Opgeroepen nummers (volgorde)</h2>
  <ol>${numbersList}</ol>
  <footer>Bingo door Arkastro BV</footer>
</body>
</html>`;
};

module.exports = {
  escapeHtml,
  buildEveningReportHtml,
};
