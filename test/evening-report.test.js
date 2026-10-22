const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildEveningReportHtml, escapeHtml } = require('../game/evening-report-html');

describe('evening-report', () => {
  it('escapes HTML entities', () => {
    assert.equal(escapeHtml('<b>&"'), '&lt;b&gt;&amp;&quot;');
  });

  it('builds an HTML report with called numbers', () => {
    const html = buildEveningReportHtml({
      state: {
        calledNumbers: [1, 15, 42],
        round: 2,
        lastCalled: 42,
      },
      settings: { gameTitle: 'Test Bingo' },
      generatedAt: new Date('2026-01-15T18:00:00Z'),
    });
    assert.match(html, /Test Bingo/);
    assert.match(html, /Avondrapport/);
    assert.match(html, /<li>1<\/li>/);
    assert.match(html, /<li>42<\/li>/);
    assert.match(html, /Ronde<\/span><strong>2<\/strong>/);
  });
});
