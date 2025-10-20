# Lingualay - Anki Study Chrome Extension

A modern Chrome extension that allows you to study Anki cards seamlessly while browsing the web. No need to open the Anki app - study directly in your browser with a clean, modern interface.

## Features

### 🎯 **Seamless Study Experience**
- Study Anki cards while browsing any website
- Clean, modern overlay interface
- Keyboard shortcuts for quick navigation
- Progress tracking and statistics

### 📚 **Anki Deck Integration**
- Import Anki decks (.apkg files)
- Spaced repetition algorithm
- Card difficulty rating (Again, Hard, Good, Easy)
- Automatic scheduling based on performance

### 📊 **Progress Tracking**
- Daily study statistics
- Study streaks
- Cards due counter
- Session performance metrics

### 🎨 **Modern UI**
- Beautiful gradient design
- Responsive layout
- Smooth animations
- Intuitive controls

## Installation

1. **Download the extension files** to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer mode** (toggle in top right)
4. **Click "Load unpacked"** and select the Lingualay folder
5. **Pin the extension** to your toolbar for easy access

## Usage

### Getting Started
1. Click the Lingualay extension icon in your browser toolbar
2. Click "Import Anki Deck" to upload your .apkg file
3. Click "Start Study Session" to begin studying
4. Use keyboard shortcuts for efficient studying:
   - `Space` - Show answer
   - `1` - Again (1-10 min)
   - `2` - Hard (6 min)
   - `3` - Good (1 day)
   - `4` - Easy (4 days)
   - `Esc` - Close study session

### Study Interface
- **Card Display**: Clean, readable card format
- **Progress Bar**: Visual progress through your session
- **Statistics**: Real-time tracking of correct/incorrect answers
- **Timer**: Track your study time

## File Structure

```
Lingualay/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── study-overlay.html    # Study session interface
├── study-overlay.css     # Study overlay styling
├── study-overlay.js      # Study session logic
├── content.js            # Content script for overlay
├── content.css           # Content script styles
├── background.js         # Background service worker
└── README.md             # This file
```

## Technical Features

### Spaced Repetition Algorithm
- **Again**: 1-10 minutes (immediate review)
- **Hard**: 6 minutes
- **Good**: 1 day
- **Easy**: 4 days

### Data Storage
- Local Chrome storage for privacy
- Progress tracking across sessions
- Daily statistics and streaks

### Browser Integration
- Works on any website
- Non-intrusive overlay
- Keyboard shortcuts
- Responsive design

## Development

### Prerequisites
- Chrome browser
- Basic knowledge of HTML, CSS, JavaScript

### Local Development
1. Clone or download the extension files
2. Open Chrome and go to `chrome://extensions/`
3. Enable Developer mode
4. Click "Load unpacked" and select the extension folder
5. Make changes and click the refresh button to reload

### Testing
- Test on different websites
- Verify keyboard shortcuts work
- Check responsive design on different screen sizes
- Test deck import functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues, feature requests, or questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

---

**Happy Studying! 🎓**