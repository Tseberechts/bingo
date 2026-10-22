const api = window.bingo;

const params = new URLSearchParams(window.location.search);
const isAcceptMode = params.get('mode') === 'accept';
const from = params.get('from') || 'about';

const eulaBody = document.getElementById('eulaBody');
const acceptBar = document.getElementById('acceptBar');
const reacceptNotice = document.getElementById('reacceptNotice');
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

/** Escape-free inline formatting: **bold** only, as text nodes + <strong>. */
const appendInline = (parent, text) => {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  parts.forEach((part) => {
    if (!part) return;
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      const strong = document.createElement('strong');
      strong.textContent = bold[1];
      parent.appendChild(strong);
      return;
    }
    parent.appendChild(document.createTextNode(part));
  });
};

const isBlank = (line) => !line.trim();
const isHeading = (line) => /^#{1,2}\s/.test(line.trim());
const isListItem = (line) => line.trim().startsWith('- ');
const isVersion = (line) => /^Versie:\s*/i.test(line.trim());
const hasSoftBreak = (line) => / {2}$/.test(line);

/**
 * Minimal Markdown → DOM for EULA.md (h1/h2, paragraphs, lists, bold, soft breaks).
 * Trusted local file; built with DOM APIs (no HTML injection).
 */
const renderMarkdown = (markdown) => {
  const root = document.createDocumentFragment();
  const lines = String(markdown).replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  let skippedTitle = false;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (isBlank(line)) {
      i += 1;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      // Page chrome already shows the main title.
      if (!skippedTitle) {
        skippedTitle = true;
        i += 1;
        continue;
      }
      const h1 = document.createElement('h1');
      h1.className = 'eula-h1';
      appendInline(h1, trimmed.slice(2));
      root.appendChild(h1);
      i += 1;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const h2 = document.createElement('h2');
      h2.className = 'eula-h2';
      appendInline(h2, trimmed.slice(3));
      root.appendChild(h2);
      i += 1;
      continue;
    }

    if (isVersion(line)) {
      const meta = document.createElement('p');
      meta.className = 'eula-meta';
      meta.textContent = trimmed;
      root.appendChild(meta);
      i += 1;
      continue;
    }

    if (isListItem(line)) {
      const ul = document.createElement('ul');
      ul.className = 'eula-list';
      while (i < lines.length && isListItem(lines[i])) {
        const li = document.createElement('li');
        appendInline(li, lines[i].trim().slice(2));
        ul.appendChild(li);
        i += 1;
      }
      root.appendChild(ul);
      continue;
    }

    // Soft-break block (e.g. company address) or normal paragraph.
    if (hasSoftBreak(line)) {
      const block = document.createElement('p');
      block.className = 'eula-address';
      while (i < lines.length && !isBlank(lines[i]) && !isHeading(lines[i]) && !isListItem(lines[i])) {
        if (block.childNodes.length) block.appendChild(document.createElement('br'));
        appendInline(block, lines[i].trim());
        const wasSoft = hasSoftBreak(lines[i]);
        i += 1;
        if (!wasSoft) break;
      }
      root.appendChild(block);
      continue;
    }

    const parts = [];
    while (
      i < lines.length
      && !isBlank(lines[i])
      && !isHeading(lines[i])
      && !isListItem(lines[i])
      && !isVersion(lines[i])
      && !hasSoftBreak(lines[i])
    ) {
      parts.push(lines[i].trim());
      i += 1;
    }
    if (parts.length) {
      const p = document.createElement('p');
      appendInline(p, parts.join(' '));
      root.appendChild(p);
    }
  }

  return root;
};

const loadEula = async () => {
  if (!eulaBody) return;
  eulaBody.replaceChildren();
  const loading = document.createElement('p');
  loading.className = 'eula-loading';
  loading.textContent = 'Laden…';
  eulaBody.appendChild(loading);

  if (!api?.getEula) {
    eulaBody.textContent = 'Kon de gebruiksvoorwaarden niet laden.';
    return;
  }
  const result = await api.getEula();
  if (!result?.ok || typeof result.text !== 'string') {
    eulaBody.textContent = result?.error || 'Kon de gebruiksvoorwaarden niet laden.';
    return;
  }
  eulaBody.replaceChildren(renderMarkdown(result.text));
  if (reacceptNotice) {
    const showReaccept = Boolean(isAcceptMode && result.reaccept);
    reacceptNotice.classList.toggle('hidden', !showReaccept);
  }
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
  });
}

setupMode();
loadEula();
