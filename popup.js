// Popup script for Lingualay Chrome Extension
class LingualayPopup {
    constructor() {
        this.storage = chrome.storage.local;
        this.init();
    }

    async init() {
        await this.loadStats();
        this.setupEventListeners();
        await this.checkForDeck();
    }

    setupEventListeners() {
        document.getElementById('startStudy').addEventListener('click', () => {
            this.startStudySession();
        });

        document.getElementById('importDeck').addEventListener('click', () => {
            this.importAnkiDeck();
        });

        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });
    }

    async loadStats() {
        try {
            const data = await this.storage.get([
                'cardsDue',
                'cardsStudiedToday',
                'streak',
                'lastStudyDate'
            ]);

            document.getElementById('cardsDue').textContent = data.cardsDue || 0;
            document.getElementById('cardsStudied').textContent = data.cardsStudiedToday || 0;
            document.getElementById('streak').textContent = data.streak || 0;

            // Update streak if needed
            await this.updateStreak();
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    async updateStreak() {
        const today = new Date().toDateString();
        const data = await this.storage.get(['lastStudyDate', 'streak']);
        
        if (data.lastStudyDate !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (data.lastStudyDate === yesterday.toDateString()) {
                // Continue streak
                await this.storage.set({ 
                    lastStudyDate: today,
                    streak: (data.streak || 0) + 1
                });
            } else if (data.lastStudyDate !== today) {
                // Reset streak
                await this.storage.set({ 
                    lastStudyDate: today,
                    streak: 1
                });
            }
        }
    }

    async checkForDeck() {
        const data = await this.storage.get(['currentDeck', 'deckProgress']);
        
        if (data.currentDeck) {
            document.getElementById('deckInfo').style.display = 'block';
            document.getElementById('deckName').textContent = data.currentDeck.name;
            document.getElementById('deckProgress').textContent = 
                `${data.deckProgress?.studied || 0}/${data.currentDeck.totalCards || 0} cards`;
        }
    }

    async startStudySession() {
        const data = await this.storage.get(['currentDeck', 'cardsDue']);
        
        if (!data.currentDeck) {
            this.showNotification('Please import an Anki deck first!', 'warning');
            return;
        }

        if (data.cardsDue === 0) {
            this.showNotification('No cards due for review!', 'info');
            return;
        }

        // Open study overlay
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, { 
                action: 'openStudyOverlay',
                deck: data.currentDeck
            });
            
            // Close popup
            window.close();
        } catch (error) {
            console.error('Error opening study overlay:', error);
            this.showNotification('Error opening study session', 'error');
        }
    }

    async importAnkiDeck() {
        // Create file input for .apkg files
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.apkg,.anki2,.txt,.csv,.json';
        input.style.display = 'none';
        
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (file) {
                await this.processAnkiFile(file);
            }
        };
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    async processAnkiFile(file) {
        try {
            this.showNotification('Processing Anki deck...', 'info');
            
            // Load the Anki parser script
            const parser = new AnkiParser();
            
            let deck;
            if (file.name.endsWith('.apkg')) {
                // Parse actual .apkg file
                deck = await parser.parseApkgFile(file);
            } else {
                // Create a simple deck from other formats
                const cards = await this.parseSimpleDeck(file);
                deck = parser.createSimpleDeck(file.name.replace(/\.[^/.]+$/, ""), cards);
            }

            await this.storage.set({
                currentDeck: deck,
                cardsDue: Math.min(25, deck.totalCards), // Limit to 25 cards for first session
                deckProgress: { studied: 0, total: deck.totalCards }
            });

            this.showNotification(`Deck "${deck.name}" imported successfully! ${deck.totalCards} cards loaded.`, 'success');
            await this.loadStats();
            await this.checkForDeck();
            
        } catch (error) {
            console.error('Error processing Anki file:', error);
            this.showNotification(`Error processing deck file: ${error.message}`, 'error');
        }
    }

    generateSampleCards(count) {
        const cards = [];
        const languages = ['Spanish', 'French', 'German', 'Italian', 'Portuguese'];
        const topics = ['Greetings', 'Numbers', 'Colors', 'Food', 'Travel', 'Family'];
        
        for (let i = 0; i < count; i++) {
            const language = languages[Math.floor(Math.random() * languages.length)];
            const topic = topics[Math.floor(Math.random() * topics.length)];
            
            cards.push({
                id: `card_${i}`,
                front: `What is "Hello" in ${language}?`,
                back: `Hola (${language})`,
                difficulty: Math.random() > 0.5 ? 'medium' : 'easy',
                interval: 1,
                repetitions: 0,
                dueDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
            });
        }
        
        return cards;
    }

    openSettings() {
        // Open settings page
        chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    }

    async parseSimpleDeck(file) {
        // Parse simple text-based deck formats
        const text = await this.readFileAsText(file);
        const lines = text.split('\n').filter(line => line.trim());
        const cards = [];
        
        for (let i = 0; i < lines.length; i += 2) {
            if (lines[i] && lines[i + 1]) {
                cards.push({
                    front: lines[i].trim(),
                    back: lines[i + 1].trim()
                });
            }
        }
        
        return cards;
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#4CAF50' : type === 'warning' ? '#FF9800' : type === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LingualayPopup();
});
