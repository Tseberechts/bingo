/** Apply paid brand colour overrides (or defaults) onto :root CSS variables. */
window.applyBrandColors = (colors) => {
  if (!colors || typeof colors !== 'object') return;
  const root = document.documentElement;
  if (colors.accent) {
    root.style.setProperty('--color-bingo-orange', colors.accent);
    root.style.setProperty('--color-bingo-yellow', colors.accent);
  }
  if (colors.bg) {
    root.style.setProperty('--color-dark-bg', colors.bg);
  }
  if (colors.bgActive) {
    root.style.setProperty('--color-main-bg-active', colors.bgActive);
  }
};
