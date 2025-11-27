const { ipcRenderer } = require('electron');
const path = require('path');

// Main settings
const gameTitleInput = document.getElementById('gameTitle');
const tabs = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Display settings
const inGameDisplayModeSelect = document.getElementById('inGameDisplayMode');
const pauseDisplayModeSelect = document.getElementById('pauseDisplayMode');
const mainLogoInput = document.getElementById('mainLogo');
const mainLogoPreview = document.getElementById('mainLogoPreview');
const noLogoText = document.getElementById('noLogoText');
const deleteMainLogoButton = document.getElementById('deleteMainLogo');

// Sponsor tab elements
const sponsorList = document.getElementById('sponsorList');
const sponsorNameInput = document.getElementById('sponsorName');
const sponsorLogoInput = document.getElementById('sponsorLogo');
const sponsorLogoLabel = document.querySelector('label[for="sponsorLogo"]');
const sponsorLogoPreview = document.getElementById('sponsorLogoPreview');
const addSponsorButton = document.getElementById('addSponsorButton');

// Toast element
const toast = document.getElementById('toast');

// --- Toast Functionality ---
const showToast = (message = 'Instellingen opgeslagen!') => {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000); // Hide after 3 seconds
};

// --- UI Update Functions ---
const updateMainLogoUI = (logoPath) => {
    if (logoPath) {
        mainLogoPreview.src = logoPath.replace(/\\/g, '/');
        mainLogoPreview.classList.remove('hidden');
        noLogoText.classList.add('hidden');
        deleteMainLogoButton.classList.remove('hidden');
        document.querySelector('label[for="mainLogo"]').textContent = path.basename(logoPath);
    } else {
        mainLogoPreview.classList.add('hidden');
        noLogoText.classList.remove('hidden');
        deleteMainLogoButton.classList.add('hidden');
        mainLogoInput.value = '';
        document.querySelector('label[for="mainLogo"]').textContent = 'Kies bestand...';
    }
};

// --- Auto-saving Logic ---
const saveSetting = (key, value) => {
    ipcRenderer.send('save-settings', { [key]: value });
    showToast(); // Show toast on successful save
};

const setupAutoSave = () => {
    gameTitleInput.addEventListener('change', () => saveSetting('gameTitle', gameTitleInput.value));
    inGameDisplayModeSelect.addEventListener('change', () => saveSetting('inGameDisplayMode', inGameDisplayModeSelect.value));
    pauseDisplayModeSelect.addEventListener('change', () => saveSetting('pauseDisplayMode', pauseDisplayModeSelect.value));
    
    mainLogoInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            const buffer = await file.arrayBuffer();
            const newPath = await ipcRenderer.invoke('upload-main-logo', { buffer: Buffer.from(buffer), originalName: file.name });
            updateMainLogoUI(newPath);
            showToast('Hoofdlogo geüpload!');
        }
    });
};

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
            if (preview) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        }
    });
};
setupFileInput(sponsorLogoInput, sponsorLogoLabel, sponsorLogoPreview);
setupFileInput(mainLogoInput, document.querySelector('label[for="mainLogo"]'), null); // Preview is handled by updateMainLogoUI

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

addSponsorButton.addEventListener('click', async () => {
    const name = sponsorNameInput.value;
    const logoFile = sponsorLogoInput.files[0];
    if (!name || !logoFile) return alert('Vul een naam in en selecteer een logo.');

    const buffer = await logoFile.arrayBuffer();
    await ipcRenderer.invoke('add-sponsor', { name, buffer: Buffer.from(buffer), originalName: logoFile.name });
    
    const settings = await ipcRenderer.invoke('get-settings');
    renderSponsors(settings.sponsors);
    
    sponsorNameInput.value = '';
    sponsorLogoInput.value = '';
    sponsorLogoLabel.textContent = 'Kies bestand...';
    sponsorLogoPreview.classList.add('hidden');
    showToast('Sponsor toegevoegd!');
});

sponsorList.addEventListener('click', async (e) => {
    const deleteButton = e.target.closest('.delete-sponsor-btn');
    if (deleteButton && deleteButton.dataset.id) {
        const sponsorId = parseInt(deleteButton.dataset.id, 10);
        await ipcRenderer.invoke('delete-sponsor', sponsorId);
        
        const settings = await ipcRenderer.invoke('get-settings');
        renderSponsors(settings.sponsors);
        showToast('Sponsor verwijderd!');
    }
});

deleteMainLogoButton.addEventListener('click', async () => {
    await ipcRenderer.invoke('delete-main-logo');
    updateMainLogoUI(null);
    showToast('Hoofdlogo verwijderd!');
});

// --- Load ---
window.onload = async () => {
    const settings = await ipcRenderer.invoke('get-settings');
    gameTitleInput.value = settings.gameTitle || 'ROZENSTRAAT BINGO';
    
    // Display settings
    inGameDisplayModeSelect.value = settings.inGameDisplayMode;
    pauseDisplayModeSelect.value = settings.pauseDisplayMode;

    updateMainLogoUI(settings.mainLogoPath);
    renderSponsors(settings.sponsors);
    setupAutoSave();
};

// Listen for settings changes from other processes (e.g., after upload)
ipcRenderer.on('settings-updated', (event, settings) => {
    updateMainLogoUI(settings.mainLogoPath);
});