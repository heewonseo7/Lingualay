// Anki Account Integration for Lingualay Extension
class AnkiIntegration {
    constructor() {
        this.ankiConnectUrl = 'http://localhost:8765'; // AnkiConnect default URL
        this.isConnected = false;
        this.apiKey = null;
    }

    // Check if AnkiConnect is available
    async checkAnkiConnect() {
        try {
            const response = await fetch(this.ankiConnectUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'version',
                    version: 6
                })
            });

            if (response.ok) {
                const result = await response.json();
                this.isConnected = true;
                return {
                    success: true,
                    version: result.result,
                    message: 'Connected to AnkiConnect'
                };
            }
        } catch (error) {
            console.log('AnkiConnect not available:', error.message);
        }

        return {
            success: false,
            message: 'AnkiConnect not available. Please install AnkiConnect add-on in Anki.'
        };
    }

    // Get deck list from Anki
    async getAnkiDecks() {
        try {
            const response = await fetch(this.ankiConnectUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'deckNames',
                    version: 6
                })
            });

            if (response.ok) {
                const result = await response.json();
                return {
                    success: true,
                    decks: result.result
                };
            }
        } catch (error) {
            console.error('Error getting Anki decks:', error);
        }

        return {
            success: false,
            decks: []
        };
    }

    // Get cards from a specific deck
    async getDeckCards(deckName, limit = null) {
        try {
            const response = await fetch(this.ankiConnectUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'findCards',
                    version: 6,
                    params: {
                        query: `deck:"${deckName}"`
                    }
                })
            });

            if (response.ok) {
                const cardIds = await response.json();
                const cardLimit = limit ? Math.min(limit, cardIds.result.length) : cardIds.result.length;
                const limitedCardIds = cardIds.result.slice(0, cardLimit);

                // Get card details
                const cardDetails = await this.getCardDetails(limitedCardIds);
                return {
                    success: true,
                    cards: cardDetails
                };
            }
        } catch (error) {
            console.error('Error getting deck cards:', error);
        }

        return {
            success: false,
            cards: []
        };
    }

    // Get detailed card information
    async getCardDetails(cardIds) {
        try {
            const response = await fetch(this.ankiConnectUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'cardsInfo',
                    version: 6,
                    params: {
                        cards: cardIds
                    }
                })
            });

            if (response.ok) {
                const result = await response.json();
                return result.result.map(card => ({
                    id: card.cardId,
                    front: this.processCardContent(card.fields.Front?.value || ''),
                    back: this.processCardContent(card.fields.Back?.value || ''),
                    deck: card.deckName,
                    due: card.due,
                    interval: card.interval,
                    repetitions: card.reps,
                    difficulty: this.getDifficultyFromInterval(card.interval)
                }));
            }
        } catch (error) {
            console.error('Error getting card details:', error);
        }

        return [];
    }

    // Process card content (handle HTML, media, etc.)
    processCardContent(content) {
        if (!content) return '';
        
        // Convert Anki media references to proper URLs
        let processedContent = content;
        
        // Handle sound files
        processedContent = processedContent.replace(/\[sound:([^\]]+)\]/g, 
            '<audio controls><source src="anki://$1" type="audio/mpeg"></audio>');
        
        // Handle images
        processedContent = processedContent.replace(/<img[^>]*src="([^"]*)"[^>]*>/g, 
            (match, src) => {
                if (src.startsWith('anki://')) {
                    return match;
                }
                return match.replace(src, `anki://${src}`);
            });
        
        return processedContent;
    }

    // Convert interval to difficulty level
    getDifficultyFromInterval(interval) {
        if (interval <= 1) return 'again';
        if (interval <= 6) return 'hard';
        if (interval <= 30) return 'good';
        return 'easy';
    }

    // Sync study progress back to Anki
    async syncProgressToAnki(cardId, rating) {
        try {
            const response = await fetch(this.ankiConnectUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'answerCard',
                    version: 6,
                    params: {
                        cardId: cardId,
                        ease: this.ratingToEase(rating)
                    }
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Error syncing progress to Anki:', error);
            return false;
        }
    }

    // Convert rating to Anki ease
    ratingToEase(rating) {
        const ratingMap = {
            'again': 1,
            'hard': 2,
            'good': 3,
            'easy': 4
        };
        return ratingMap[rating] || 3;
    }

    // Setup instructions for users
    getSetupInstructions() {
        return {
            title: 'Connect to Anki',
            steps: [
                '1. Install AnkiConnect add-on in Anki',
                '2. Open Anki and go to Tools > Add-ons',
                '3. Click "Get Add-ons" and search for "AnkiConnect"',
                '4. Install the add-on and restart Anki',
                '5. Make sure Anki is running when using Lingualay',
                '6. Click "Connect to Anki" below'
            ],
            benefits: [
                'Sync your study progress with Anki',
                'Access all your Anki decks',
                'Study cards directly from Anki',
                'Automatic progress tracking'
            ]
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnkiIntegration;
}
