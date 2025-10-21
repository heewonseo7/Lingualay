// Study Overlay Script
class StudySession {
    constructor() {
        this.currentCardIndex = 0;
        this.cards = [];
        this.sessionStats = {
            correct: 0,
            incorrect: 0,
            startTime: Date.now()
        };
        this.isAnswerShown = false;
        this.init();
    }

    async init() {
        await this.loadDeck();
        this.setupEventListeners();
        this.startTimer();
        this.showCurrentCard();
    }

    async loadDeck() {
        try {
            // Listen for deck data from content script
            window.addEventListener('message', (event) => {
                if (event.data.type === 'DECK_DATA' && event.data.deck) {
                    console.log('Received deck data:', event.data.deck);
                    this.cards = event.data.deck.cards || [];
                    this.updateProgress();
                    this.showCurrentCard();
                }
            });
            
            // Also try to get from storage as fallback
            const result = await chrome.storage.local.get(['currentDeck']);
            if (result.currentDeck && result.currentDeck.cards) {
                console.log('Loaded deck from storage:', result.currentDeck);
                this.cards = result.currentDeck.cards;
                this.updateProgress();
            } else if (this.cards.length === 0) {
                this.showError('No deck loaded. Please import a deck first.');
            }
        } catch (error) {
            console.error('Error loading deck:', error);
            this.showError('Error loading deck');
        }
    }

    setupEventListeners() {
        // Close button
        document.getElementById('closeBtn').addEventListener('click', () => {
            this.endSession();
        });

        // Show answer button
        document.getElementById('showAnswerBtn').addEventListener('click', () => {
            this.showAnswer();
        });

        // Difficulty buttons
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const difficulty = e.currentTarget.dataset.difficulty;
                this.rateCard(difficulty);
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.endSession();
            } else if (e.key === ' ' && !this.isAnswerShown) {
                e.preventDefault();
                this.showAnswer();
            } else if (this.isAnswerShown) {
                switch(e.key) {
                    case '1': this.rateCard('again'); break;
                    case '2': this.rateCard('hard'); break;
                    case '3': this.rateCard('good'); break;
                    case '4': this.rateCard('easy'); break;
                }
            }
        });
    }

    showCurrentCard() {
        if (this.currentCardIndex >= this.cards.length) {
            this.completeSession();
            return;
        }

        const card = this.cards[this.currentCardIndex];
        document.getElementById('frontText').textContent = card.front;
        document.getElementById('backText').textContent = card.back;
        
        // Reset card state
        document.getElementById('cardBack').style.display = 'none';
        document.getElementById('showAnswerBtn').style.display = 'flex';
        document.getElementById('answerButtons').style.display = 'none';
        this.isAnswerShown = false;

        this.updateProgress();
    }

    showAnswer() {
        document.getElementById('cardBack').style.display = 'block';
        document.getElementById('showAnswerBtn').style.display = 'none';
        document.getElementById('answerButtons').style.display = 'block';
        this.isAnswerShown = true;

        // Add flip animation
        document.getElementById('studyCard').classList.add('card-flip');
        setTimeout(() => {
            document.getElementById('studyCard').classList.remove('card-flip');
        }, 600);
    }

    rateCard(difficulty) {
        const card = this.cards[this.currentCardIndex];
        
        // Update card based on difficulty
        this.updateCardDifficulty(card, difficulty);
        
        // Update session stats
        if (difficulty === 'again' || difficulty === 'hard') {
            this.sessionStats.incorrect++;
        } else {
            this.sessionStats.correct++;
        }

        this.updateSessionStats();
        this.nextCard();
    }

    updateCardDifficulty(card, difficulty) {
        const now = new Date();
        const intervals = {
            'again': 1, // 1 minute
            'hard': 6,  // 6 minutes
            'good': 1,  // 1 day
            'easy': 4   // 4 days
        };

        const interval = intervals[difficulty];
        card.interval = interval;
        card.repetitions = (card.repetitions || 0) + 1;
        
        if (difficulty === 'again') {
            card.dueDate = new Date(now.getTime() + 1 * 60 * 1000).toISOString(); // 1 minute
        } else if (difficulty === 'hard') {
            card.dueDate = new Date(now.getTime() + 6 * 60 * 1000).toISOString(); // 6 minutes
        } else if (difficulty === 'good') {
            card.dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 1 day
        } else if (difficulty === 'easy') {
            card.dueDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(); // 4 days
        }
    }

    nextCard() {
        this.currentCardIndex++;
        if (this.currentCardIndex < this.cards.length) {
            this.showCurrentCard();
        } else {
            this.completeSession();
        }
    }

    updateProgress() {
        const progress = ((this.currentCardIndex + 1) / this.cards.length) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        document.getElementById('cardCounter').textContent = 
            `${this.currentCardIndex + 1} / ${this.cards.length}`;
    }

    updateSessionStats() {
        document.getElementById('correctCount').textContent = this.sessionStats.correct;
        document.getElementById('incorrectCount').textContent = this.sessionStats.incorrect;
    }

    startTimer() {
        setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.sessionStats.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('timeSpent').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    async completeSession() {
        // Save progress
        await this.saveProgress();
        
        // Show completion message
        this.showCompletionMessage();
        
        // Close after delay
        setTimeout(() => {
            this.endSession();
        }, 3000);
    }

    async saveProgress() {
        try {
            // Update storage with new card data
            const result = await chrome.storage.local.get(['currentDeck']);
            if (result.currentDeck) {
                result.currentDeck.cards = this.cards;
                await chrome.storage.local.set({ currentDeck: result.currentDeck });
            }

            // Update daily stats
            const today = new Date().toDateString();
            const stats = await chrome.storage.local.get(['cardsStudiedToday', 'lastStudyDate']);
            
            if (stats.lastStudyDate === today) {
                await chrome.storage.local.set({
                    cardsStudiedToday: (stats.cardsStudiedToday || 0) + this.cards.length
                });
            } else {
                await chrome.storage.local.set({
                    cardsStudiedToday: this.cards.length,
                    lastStudyDate: today
                });
            }

        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    showCompletionMessage() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        `;
        
        const message = document.createElement('div');
        message.style.cssText = `
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;
        
        message.innerHTML = `
            <h2 style="color: #667eea; margin-bottom: 16px;">Session Complete! 🎉</h2>
            <p style="color: #666; margin-bottom: 8px;">Cards studied: ${this.cards.length}</p>
            <p style="color: #666; margin-bottom: 8px;">Correct: ${this.sessionStats.correct}</p>
            <p style="color: #666;">Time: ${document.getElementById('timeSpent').textContent}</p>
        `;
        
        overlay.appendChild(message);
        document.body.appendChild(overlay);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #f44336;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 10001;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    endSession() {
        // Remove overlay
        const overlay = document.getElementById('studyOverlay');
        if (overlay) {
            overlay.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
    }
}

// Initialize study session when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StudySession();
});

// Add slide out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        to {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
        }
    }
`;
document.head.appendChild(style);
