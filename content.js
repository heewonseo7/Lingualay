// Content Script for Lingualay Extension
class LingualayContentScript {
    constructor() {
        this.overlay = null;
        this.init();
    }

    init() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'openStudyOverlay') {
                this.openStudyOverlay(request.deck);
                sendResponse({ success: true });
            }
        });
    }

    openStudyOverlay(deck) {
        // Remove existing overlay if any
        this.closeStudyOverlay();

        // Create overlay iframe
        const iframe = document.createElement('iframe');
        iframe.src = chrome.runtime.getURL('study-overlay.html');
        iframe.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            border: none;
            z-index: 2147483647;
            background: rgba(0, 0, 0, 0.8);
        `;

        // Add to page
        document.body.appendChild(iframe);
        this.overlay = iframe;

        // Handle iframe load
        iframe.onload = () => {
            // Pass deck data to iframe
            iframe.contentWindow.postMessage({
                type: 'DECK_DATA',
                deck: deck
            }, '*');
        };

        // Listen for close messages from iframe
        window.addEventListener('message', (event) => {
            if (event.data.type === 'CLOSE_OVERLAY') {
                this.closeStudyOverlay();
            }
        });
    }

    closeStudyOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
    }
}

// Initialize content script
new LingualayContentScript();
