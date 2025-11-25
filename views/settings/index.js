const { ipcRenderer } = require('electron');
const path = require('path');

// Main settings
const gameTitleInput = document.getElementById('gameTitle');
const saveButton = document.getElementById('saveButton');
const tabs = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Display settings
const showInGameCheckbox = document.getElementById('showInGame');
const inGameDisplayModeSelect = document.getElementById('inGameDisplayMode');
const showOnPauseCheckbox = document.getElementById('showOnPause');
const pauseDisplayModeSelect = document.getElementById('pauseDisplayMode');
const mainLogoInput = document.getElementById('mainLogo');
const mainLogoPreview = document.getElementById('mainLogoPreview');
const deleteMainLogoButton = document.getElementById('deleteMainLogo');

// Sponsor tab elements
const sponsorList = document.getElementById('sponsorList');
const sponsorNameInput = document.getElementById('sponsorName');
const sponsorLogoInput = document.getElementById('sponsorLogo');
const sponsorLogoLabel = document.querySelector('label[for="sponsorLogo"]');
const sponsorLogoPreview = document.getElementById('sponsorLogoPreview');
const addSponsorButton = document.getElementById('addSponsorButton');

// --- Tab Navigation ---
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.add('hidden'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.remove('hidden');
    });
});

// --- File Input Handlers ---
const setupFileInput = (input, label, preview) => {
    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            label.textContent = file.name;
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });
};
setupFileInput(sponsorLogoInput, sponsorLogoLabel, sponsorLogoPreview);
setupFileInput(mainLogoInput, document.querySelector('label[for="mainLogo"]'), mainLogoPreview);


// --- Sponsor Logic ---
const renderSponsors = (sponsors) => {
    sponsorList.innerHTML = '';
    if (!sponsors || sponsors.length === 0) {
        sponsorList.innerHTML = '<p class="text-gray-400 col-span-full">Geen sponsors gevonden.</p>';
        return;
    }
    sponsors.forEach(sponsor => {
        const sponsorEl = document.createElement('div');
        sponsorEl.className = 'sponsor-item';
        sponsorEl.innerHTML = `
            <img src="${sponsor.logo.replace(/\\/g, '/')}" alt="${sponsor.name}">
            <span class="name">${sponsor.name}</span>
            <svg class="delete-sponsor-btn" data-id="${sponsor.id}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        `;
        sponsorList.appendChild(sponsorEl);
    });
};

addSponsorButton.addEventListener('click', () => {
    const name = sponsorNameInput.value;
    const logoFile = sponsorLogoInput.files[0];
    if (!name || !logoFile) return alert('Vul een naam in en selecteer een logo.');

    const reader = new FileReader();
    reader.onload = async (e) => {
        const buffer = Buffer.from(e.target.result);
        await ipcRenderer.invoke('add-sponsor', { name, buffer, originalName: logoFile.name });
        const settings = await ipcRenderer.invoke('get-settings');
        renderSponsors(settings.sponsors);
        sponsorNameInput.value = '';
        sponsorLogoInput.value = '';
        sponsorLogoLabel.textContent = 'Kies bestand...';
        sponsorLogoPreview.classList.add('hidden');
    };
    reader.readAsArrayBuffer(logoFile);
});

sponsorList.addEventListener('click', async (e) => {
    const deleteButton = e.target.closest('.delete-sponsor-btn');
    if (deleteButton && deleteButton.dataset.id) {
        const sponsorId = parseInt(deleteButton.dataset.id, 10);
        ipcRenderer.send('delete-sponsor', sponsorId);
        const settings = await ipcRenderer.invoke('get-settings');
        renderSponsors(settings.sponsors);
    }
});

deleteMainLogoButton.addEventListener('click', () => {
    ipcRenderer.send('delete-main-logo');
    mainLogoInput.value = '';
    document.querySelector('label[for="mainLogo"]').textContent = 'Kies bestand...';
    mainLogoPreview.classList.add('hidden');
});

// --- Load and Save ---
window.onload = async () => {
    const settings = await ipcRenderer.invoke('get-settings');
    gameTitleInput.value = settings.gameTitle || 'ROZENSTRAAT BINGO';
    
    // Display settings
    showInGameCheckbox.checked = settings.showInGame;
    inGameDisplayModeSelect.value = settings.inGameDisplayMode;
    showOnPauseCheckbox.checked = settings.showOnPause;
    pauseDisplayModeSelect.value = settings.pauseDisplayMode;

    if (settings.mainLogoPath) {
        mainLogoPreview.src = settings.mainLogoPath.replace(/\\/g, '/');
        mainLogoPreview.classList.remove('hidden');
        document.querySelector('label[for="mainLogo"]').textContent = path.basename(settings.mainLogoPath);
    }

    renderSponsors(settings.sponsors);
};

saveButton.addEventListener('click', async () => {
    const mainLogoFile = mainLogoInput.files[0];
    if (mainLogoFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const buffer = Buffer.from(e.target.result);
            await ipcRenderer.invoke('upload-main-logo', { buffer, originalName: mainLogoFile.name });
            saveAllSettings();
        };
        reader.readAsArrayBuffer(mainLogoFile);
    } else {
        saveAllSettings();
    }
});

function saveAllSettings() {
    const settings = {
        gameTitle: gameTitleInput.value,
        showInGame: showInGameCheckbox.checked,
        inGameDisplayMode: inGameDisplayModeSelect.value,
        showOnPause: showOnPauseCheckbox.checked,
        pauseDisplayMode: pauseDisplayModeSelect.value,
    };
    ipcRenderer.send('save-settings', settings);
    alert('Instellingen opgeslagen!');
}
