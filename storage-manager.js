// Enhanced Storage Manager for Lingualay Extension
class StorageManager {
    constructor() {
        this.storage = chrome.storage.local;
        this.syncStorage = chrome.storage.sync;
        this.maxSyncItems = chrome.storage.sync.QUOTA_BYTES_PER_ITEM;
    }

    // Save deck with enhanced metadata
    async saveDeck(deck) {
        try {
            const deckData = {
                ...deck,
                lastAccessed: new Date().toISOString(),
                studyCount: (deck.studyCount || 0) + 1,
                version: '1.0'
            };

            await this.storage.set({
                currentDeck: deckData,
                lastDeckName: deck.name,
                lastDeckImport: new Date().toISOString()
            });

            // Also save to sync storage for cross-device access (if small enough)
            if (this.isDeckSmallEnough(deckData)) {
                await this.syncStorage.set({
                    [`deck_${deck.name.replace(/\s+/g, '_')}`]: deckData
                });
            }

            return true;
        } catch (error) {
            console.error('Error saving deck:', error);
            return false;
        }
    }

    // Load deck with fallback
    async loadDeck() {
        try {
            const data = await this.storage.get(['currentDeck', 'lastDeckName']);
            return data.currentDeck || null;
        } catch (error) {
            console.error('Error loading deck:', error);
            return null;
        }
    }

    // Save study progress
    async saveProgress(progress) {
        try {
            const today = new Date().toDateString();
            const existingData = await this.storage.get(['studyHistory', 'cardsStudiedToday']);
            
            const studyHistory = existingData.studyHistory || {};
            const todayHistory = studyHistory[today] || { cardsStudied: 0, timeSpent: 0, correct: 0, incorrect: 0 };
            
            todayHistory.cardsStudied += progress.cardsStudied || 0;
            todayHistory.timeSpent += progress.timeSpent || 0;
            todayHistory.correct += progress.correct || 0;
            todayHistory.incorrect += progress.incorrect || 0;
            
            studyHistory[today] = todayHistory;
            
            await this.storage.set({
                studyHistory,
                cardsStudiedToday: (existingData.cardsStudiedToday || 0) + (progress.cardsStudied || 0),
                lastStudyDate: today
            });

            return true;
        } catch (error) {
            console.error('Error saving progress:', error);
            return false;
        }
    }

    // Get study statistics
    async getStudyStats() {
        try {
            const data = await this.storage.get([
                'cardsDue',
                'cardsStudiedToday',
                'streak',
                'lastStudyDate',
                'studyHistory'
            ]);

            return {
                cardsDue: data.cardsDue || 0,
                cardsStudiedToday: data.cardsStudiedToday || 0,
                streak: data.streak || 0,
                lastStudyDate: data.lastStudyDate,
                studyHistory: data.studyHistory || {}
            };
        } catch (error) {
            console.error('Error getting study stats:', error);
            return null;
        }
    }

    // Export all data
    async exportAllData() {
        try {
            const allData = await this.storage.get(null);
            return {
                exportDate: new Date().toISOString(),
                version: '1.0',
                data: allData
            };
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    // Import data
    async importData(importData) {
        try {
            if (importData.version && importData.data) {
                await this.storage.set(importData.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data
    async clearAllData() {
        try {
            await this.storage.clear();
            await this.syncStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    // Check if deck is small enough for sync storage
    isDeckSmallEnough(deck) {
        const size = JSON.stringify(deck).length;
        return size < this.maxSyncItems;
    }

    // Get available decks from sync storage
    async getSyncedDecks() {
        try {
            const syncData = await this.syncStorage.get(null);
            const decks = [];
            
            for (const [key, value] of Object.entries(syncData)) {
                if (key.startsWith('deck_') && value.name) {
                    decks.push({
                        name: value.name,
                        totalCards: value.totalCards,
                        lastAccessed: value.lastAccessed,
                        studyCount: value.studyCount
                    });
                }
            }
            
            return decks;
        } catch (error) {
            console.error('Error getting synced decks:', error);
            return [];
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
