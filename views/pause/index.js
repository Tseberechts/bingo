const { ipcRenderer } = require('electron');

const pauseContent = document.getElementById('pauseContent');
let sponsorInterval;

const displayLogo = (logoPath) => {
    pauseContent.innerHTML = `<img src="${logoPath}" class="main-logo fade-in" alt="Logo">`;
};

const displaySponsors = (sponsors) => {
    if (!sponsors || sponsors.length === 0) return;

    let currentIndex = 0;
    const showNextImage = () => {
        const currentImage = pauseContent.firstElementChild;
        if (currentImage) currentImage.classList.remove('fade-in');

        setTimeout(() => {
            if (pauseContent.firstElementChild) pauseContent.removeChild(pauseContent.firstElementChild);
            
            const img = document.createElement('img');
            img.src = sponsors[currentIndex].logo.replace(/\\/g, '/');
            img.className = 'sponsor-logo';
            pauseContent.appendChild(img);
            
            requestAnimationFrame(() => img.classList.add('fade-in'));
            
            currentIndex = (currentIndex + 1) % sponsors.length;
        }, 1000);
    };

    showNextImage();
    sponsorInterval = setInterval(showNextImage, 5000);
};

ipcRenderer.on('pause-data', (event, { settings }) => {
    clearInterval(sponsorInterval);
    pauseContent.innerHTML = '';

    if (settings.displayMode === 'logo' && settings.mainLogoPath) {
        displayLogo(settings.mainLogoPath.replace(/\\/g, '/'));
    } else if (settings.displayMode === 'sponsors' && settings.showSponsorsOnPause) {
        displaySponsors(settings.sponsors);
    }
});
