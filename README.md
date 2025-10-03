# 📈 Stock Market Prediction Game

A fun and interactive web-based game that tests your ability to predict stock market movements using real-time stock data from Alpha Vantage API.

## 🎮 How to Play

1. **Enter a Stock Ticker**: Input any valid stock ticker symbol (e.g., MSFT, AAPL, GOOGL, TSLA)
2. **View Historical Data**: The game shows you 7 days of historical stock price data on an interactive chart
3. **Make Predictions**: Predict whether the stock price will go up or down the next day
4. **Track Your Score**: Earn points for correct predictions and see how well you can read the market
5. **Continue Playing**: Keep making predictions as new data points are revealed

## 🚀 Features

- **Real Stock Data**: Uses Alpha Vantage API for authentic market data
- **Interactive Charts**: Beautiful line charts powered by Chart.js
- **Smart Date Selection**: Randomly selects weekday start dates (avoiding weekends and holidays)
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Score Tracking**: Keep track of your prediction accuracy
- **Error Handling**: Validates stock tickers and provides helpful error messages

## 🛠️ Technical Details

### APIs Used
- **Alpha Vantage API**: For real-time stock market data
- **Chart.js**: For interactive data visualization

### Technologies
- HTML5
- CSS3 (with modern gradients and animations)
- Vanilla JavaScript (ES6+)
- Responsive design principles

### Game Logic
- Randomly generates start dates between 7-100 days ago
- Excludes weekends and major holidays
- Shows 7 days of historical data before prediction starts
- Updates chart in real-time as predictions are made
- Maintains current date tracking throughout the game

## 📱 Deployment

This game is designed to be deployed on GitHub Pages:

1. Fork or clone this repository
2. Enable GitHub Pages in repository settings
3. The game will be available at `https://yourusername.github.io/repository-name`

## 🔧 Setup for Development

1. Clone the repository
2. Open `index.html` in a web browser
3. No build process required - it's a pure client-side application

## 📊 API Information

The game uses the Alpha Vantage API with the following endpoints:
- Company Overview: For ticker validation
- Daily Time Series: For historical stock price data

API Key is embedded in the application for demo purposes. For production use, consider implementing proper API key management.

## 🎯 Game Rules

- Predictions are based on closing prices
- Score increases by 1 for each correct prediction
- Game continues until no more data is available
- You can start a new game at any time with a different stock

## 🔮 Future Enhancements

- Multiple difficulty levels
- Leaderboard system
- More prediction options (percentage changes, specific price targets)
- Portfolio simulation mode
- Social sharing of scores

## 📄 License

This project is open source and available under the MIT License.

---

**Disclaimer**: This game is for educational and entertainment purposes only. It should not be used as the basis for actual investment decisions.
