# 🚀 Deployment Guide

## GitHub Pages Deployment

### Quick Setup
1. **Create a new GitHub repository**
   - Go to GitHub and create a new repository
   - Name it something like `stock-prediction-game`
   - Make it public (required for free GitHub Pages)

2. **Upload the files**
   - Upload all files from this project to your repository
   - Make sure `index.html` is in the root directory

3. **Enable GitHub Pages**
   - Go to your repository settings
   - Scroll down to "Pages" section
   - Under "Source", select "Deploy from a branch"
   - Choose "main" branch and "/ (root)" folder
   - Click "Save"

4. **Access your game**
   - Your game will be available at: `https://yourusername.github.io/repository-name`
   - It may take a few minutes for the site to become available

### Files Structure
```
/
├── index.html          # Main HTML file
├── styles.css          # Styling
├── script.js           # Game logic
├── README.md           # Documentation
├── DEPLOYMENT.md       # This file
├── _config.yml         # GitHub Pages config
└── .gitignore         # Git ignore rules
```

### Important Notes
- The Alpha Vantage API key is embedded in the code for demo purposes
- For production use, consider implementing proper API key management
- The game works entirely client-side, no server required
- All API calls are made directly from the browser to Alpha Vantage

### Troubleshooting
- If the game doesn't load, check browser console for errors
- API rate limits: Alpha Vantage has rate limits (5 calls per minute, 500 per day for free tier)
- CORS issues: Alpha Vantage supports CORS, so the game should work from any domain

### Custom Domain (Optional)
If you want to use a custom domain:
1. Add a `CNAME` file to your repository root
2. Put your domain name in the file (e.g., `stockgame.yourdomain.com`)
3. Configure your DNS to point to GitHub Pages

### Performance Tips
- The game caches stock data during gameplay
- Charts are optimized to show only the last 10 data points for better performance
- All assets are loaded from CDNs for faster loading