// Settings Script for Lingualay Extension
class LingualaySettings {
    constructor() {
        this.storage = chrome.storage.local;
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            window.close();
        });

        // Save settings
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Export data
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        // Clear data
        document.getElementById('clearData').addEventListener('click', () => {
            this.clearData();
        });
    }

    async loadSettings() {
        try {
            const settings = await this.storage.get([
                'newCardsPerDay',
                'maxReviewTime',
                'showTimer',
                'cardFontSize',
                'theme'
            ]);

            // Set form values
            document.getElementById('newCardsPerDay').value = settings.newCardsPerDay || 20;
            document.getElementById('maxReviewTime').value = settings.maxReviewTime || 30;
            document.getElementById('showTimer').checked = settings.showTimer !== false;
            document.getElementById('cardFontSize').value = settings.cardFontSize || 'medium';
            document.getElementById('theme').value = settings.theme || 'light';
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async saveSettings() {
        try {
            const settings = {
                newCardsPerDay: parseInt(document.getElementById('newCardsPerDay').value),
                maxReviewTime: parseInt(document.getElementById('maxReviewTime').value),
                showTimer: document.getElementById('showTimer').checked,
                cardFontSize: document.getElementById('cardFontSize').value,
                theme: document.getElementById('theme').value
            };

            await this.storage.set(settings);
            this.showNotification('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showNotification('Error saving settings', 'error');
        }
    }

    async exportData() {
        try {
            const data = await this.storage.get(null);
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `lingualay-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showNotification('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('Error exporting data', 'error');
        }
    }

    async clearData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            try {
                await this.storage.clear();
                this.showNotification('All data cleared successfully!', 'success');
                // Reload settings to show defaults
                setTimeout(() => {
                    this.loadSettings();
                }, 1000);
            } catch (error) {
                console.error('Error clearing data:', error);
                this.showNotification('Error clearing data', 'error');
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LingualaySettings();
});
