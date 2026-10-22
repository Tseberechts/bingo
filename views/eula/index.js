const api = window.bingo;

const params = new URLSearchParams(window.location.search);
const isAcceptMode = params.get('mode') === 'accept';
const from = params.get('from') || 'about';

const eulaText = document.getElementById('eulaText');
const acceptBar = document.getElementById('acceptBar');
const backBar = document.getElementById('backBar');
const backLink = document.getElementById('backLink');
const eulaCheckbox = document.getElementById('eulaCheckbox');
const acceptButton = document.getElementById('acceptButton');
const acceptError = document.getElementById('acceptError');

const showAcceptError = (message) => {
  if (!acceptError) return;
  acceptError.textContent = message || '';
  acceptError.classList.toggle('hidden', !message);
};

const loadEula = async () => {
  if (!api?.getEula) {
    eulaText.textContent = 'Kon de gebruiksvoorwaarden niet laden.';
    return;
  }
  const result = await api.getEula();
  if (!result?.ok || typeof result.text !== 'string') {
    eulaText.textContent = result?.error || 'Kon de gebruiksvoorwaarden niet laden.';
    return;
  }
  eulaText.textContent = result.text;
};

const setupMode = () => {
  if (isAcceptMode) {
    acceptBar?.classList.remove('hidden');
    backBar?.classList.add('hidden');
  } else {
    acceptBar?.classList.add('hidden');
    backBar?.classList.remove('hidden');
    if (backLink) {
      backLink.href = from === 'about'
        ? '../settings/index.html#about'
        : '../menu/index.html';
    }
  }
};

if (eulaCheckbox && acceptButton) {
  eulaCheckbox.addEventListener('change', () => {
    acceptButton.disabled = !eulaCheckbox.checked;
    showAcceptError('');
  });
}

if (acceptButton) {
  acceptButton.addEventListener('click', async () => {
    if (!eulaCheckbox?.checked) {
      showAcceptError('Bevestig dat je akkoord gaat.');
      return;
    }
    acceptButton.disabled = true;
    const result = await api.acceptEula();
    if (!result?.ok) {
      acceptButton.disabled = false;
      showAcceptError(result?.error || 'Akkoord opslaan mislukt');
    }
    // Navigation is handled by the main process after accept.
  });
}

setupMode();
loadEula();
