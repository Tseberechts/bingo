const DUTCH_MONTHS = [
  'jan', 'feb', 'mrt', 'apr', 'mei', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
];

const formatDutchDateTime = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const day = date.getDate();
  const month = DUTCH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

const dateFromSaveFileName = (fileName) => {
  // game-2026-10-22T19-41-05-123Z.json (colons/dots replaced)
  const match = /^game-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})/.exec(fileName);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match;
  const iso = `${y}-${mo}-${d}T${h}:${mi}:${s}.000Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildSaveLabelParts = ({ fileName, round, calledCount, when }) => {
  const label = formatDutchDateTime(when) || String(fileName || '').replace(/\.json$/, '');
  const metaParts = [];
  if (Number.isInteger(round)) metaParts.push(`Ronde ${round}`);
  if (Number.isInteger(calledCount)) metaParts.push(`${calledCount} nummers`);
  return { label, meta: metaParts.join(' · ') };
};

module.exports = {
  formatDutchDateTime,
  dateFromSaveFileName,
  buildSaveLabelParts,
};
