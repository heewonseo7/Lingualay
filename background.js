// Background Script for Lingualay Extension
class LingualayBackground {
    constructor() {
        this.init();
    }

    init() {
        // Set up extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.setupDefaultData();
            }
        });

        // Handle extension icon click
        chrome.action.onClicked.addListener((tab) => {
            // This will open the popup automatically due to manifest configuration
        });

        // Set up alarms for daily reset
        this.setupDailyReset();
    }

    async setupDefaultData() {
        const defaultData = {
            cardsDue: 0,
            cardsStudiedToday: 0,
            streak: 0,
            lastStudyDate: null,
            currentDeck: null,
            deckProgress: null
        };

        await chrome.storage.local.set(defaultData);
    }

    setupDailyReset() {
        // Check if we need to reset daily stats
        chrome.storage.local.get(['lastStudyDate'], (result) => {
            const today = new Date().toDateString();
            if (result.lastStudyDate !== today) {
                this.resetDailyStats();
            }
        });

        // Set up alarm for midnight reset
        chrome.alarms.create('dailyReset', {
            when: this.getNextMidnight(),
            periodInMinutes: 24 * 60 // 24 hours
        });

        chrome.alarms.onAlarm.addListener((alarm) => {
            if (alarm.name === 'dailyReset') {
                this.resetDailyStats();
            }
        });
    }

    getNextMidnight() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        return midnight.getTime();
    }

    async resetDailyStats() {
        const today = new Date().toDateString();
        await chrome.storage.local.set({
            cardsStudiedToday: 0,
            lastStudyDate: today
        });
    }

    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'updateStats') {
            this.updateStats(request.data);
            sendResponse({ success: true });
        }
    });

    async updateStats(data) {
        try {
            await chrome.storage.local.set(data);
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
}

// Initialize background script
new LingualayBackground();
