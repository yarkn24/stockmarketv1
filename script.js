class StockPredictionGame {
    constructor() {
        this.apiKey = '90DOAU73O51BZ16I';
        this.baseUrl = 'https://www.alphavantage.co/query';
        this.stockData = null;
        this.currentStock = '';
        this.gameData = [];
        this.currentDateIndex = 0;
        this.score = 0;
        this.chart = null;
        this.startDate = null;
        this.currentDate = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('submitTicker').addEventListener('click', () => this.handleStockSubmit());
        document.getElementById('stockTicker').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleStockSubmit();
        });
        document.getElementById('predictUp').addEventListener('click', () => this.makePrediction('up'));
        document.getElementById('predictDown').addEventListener('click', () => this.makePrediction('down'));
        document.getElementById('continueGame').addEventListener('click', () => this.continueGame());
        document.getElementById('newGame').addEventListener('click', () => this.resetGame());
    }

    async handleStockSubmit() {
        const ticker = document.getElementById('stockTicker').value.trim().toUpperCase();
        if (!ticker) {
            this.showError('Please enter a stock ticker symbol');
            return;
        }

        this.showLoading(true);
        this.clearError();

        try {
            await this.fetchStockData(ticker);
            this.initializeGame();
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async fetchStockData(ticker) {
        try {
            // First, try to get company overview to validate ticker
            const overviewUrl = `${this.baseUrl}?function=OVERVIEW&symbol=${ticker}&apikey=${this.apiKey}`;
            const overviewResponse = await fetch(overviewUrl);
            const overviewData = await overviewResponse.json();

            if (overviewData['Error Message'] || !overviewData.Symbol) {
                throw new Error(`Invalid stock ticker: ${ticker}. Please enter a valid stock symbol.`);
            }

            // Get daily time series data
            const timeSeriesUrl = `${this.baseUrl}?function=TIME_SERIES_DAILY&symbol=${ticker}&apikey=${this.apiKey}&outputsize=full`;
            const timeSeriesResponse = await fetch(timeSeriesUrl);
            const timeSeriesData = await timeSeriesResponse.json();

            if (timeSeriesData['Error Message']) {
                throw new Error(timeSeriesData['Error Message']);
            }

            if (timeSeriesData['Note']) {
                throw new Error('API call frequency limit reached. Please try again in a minute.');
            }

            const timeSeries = timeSeriesData['Time Series (Daily)'];
            if (!timeSeries) {
                throw new Error('No stock data available for this ticker.');
            }

            this.stockData = {
                symbol: ticker,
                name: overviewData.Name || ticker,
                timeSeries: timeSeries
            };

            this.currentStock = ticker;
        } catch (error) {
            throw new Error(error.message || 'Failed to fetch stock data. Please try again.');
        }
    }

    generateRandomStartDate() {
        const today = new Date();
        const minDaysAgo = 7; // At least 1 week ago
        const maxDaysAgo = 100; // Not more than 100 days ago
        
        let attempts = 0;
        let randomDate;
        
        do {
            const daysAgo = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo + 1)) + minDaysAgo;
            randomDate = new Date(today);
            randomDate.setDate(today.getDate() - daysAgo);
            attempts++;
        } while (this.isWeekendOrHoliday(randomDate) && attempts < 50);
        
        return randomDate;
    }

    isWeekendOrHoliday(date) {
        const dayOfWeek = date.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return true;
        }
        
        // Basic holiday check (you could expand this)
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // New Year's Day
        if (month === 1 && day === 1) return true;
        // Independence Day
        if (month === 7 && day === 4) return true;
        // Christmas
        if (month === 12 && day === 25) return true;
        
        return false;
    }

    prepareGameData() {
        const timeSeries = this.stockData.timeSeries;
        const dates = Object.keys(timeSeries).sort();
        
        // Find the start date in our data
        const startDateStr = this.formatDateForAPI(this.startDate);
        let startIndex = dates.findIndex(date => date <= startDateStr);
        
        if (startIndex === -1) {
            // If exact date not found, find the closest earlier date
            startIndex = 0;
        }
        
        // We need 7 days before the start date for initial display
        const requiredDays = 8; // 7 days before + start date
        if (startIndex < requiredDays - 1) {
            throw new Error('Not enough historical data for this date range.');
        }
        
        // Get the data we need
        this.gameData = [];
        for (let i = startIndex - 7; i <= startIndex; i++) {
            const date = dates[i];
            const data = timeSeries[date];
            this.gameData.push({
                date: date,
                open: parseFloat(data['1. open']),
                high: parseFloat(data['2. high']),
                low: parseFloat(data['3. low']),
                close: parseFloat(data['4. close']),
                volume: parseInt(data['5. volume'])
            });
        }
        
        // Set current date index to the last item (start date)
        this.currentDateIndex = this.gameData.length - 1;
        this.currentDate = new Date(this.gameData[this.currentDateIndex].date);
        
        // Prepare additional data for future predictions
        this.futureData = [];
        for (let i = startIndex + 1; i < Math.min(startIndex + 31, dates.length); i++) {
            const date = dates[i];
            const data = timeSeries[date];
            this.futureData.push({
                date: date,
                open: parseFloat(data['1. open']),
                high: parseFloat(data['2. high']),
                low: parseFloat(data['3. low']),
                close: parseFloat(data['4. close']),
                volume: parseInt(data['5. volume'])
            });
        }
    }

    formatDateForAPI(date) {
        return date.toISOString().split('T')[0];
    }

    initializeGame() {
        this.startDate = this.generateRandomStartDate();
        this.prepareGameData();
        
        // Update UI
        document.getElementById('stockInputSection').style.display = 'none';
        document.getElementById('gameInterface').style.display = 'block';
        document.getElementById('stockSymbol').textContent = this.stockData.symbol;
        document.getElementById('stockName').textContent = this.stockData.name;
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('currentDate').textContent = this.formatDisplayDate(this.currentDate);
        
        this.createChart();
        this.showPredictionSection();
    }

    createChart() {
        const ctx = document.getElementById('stockChart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        const labels = this.gameData.map(item => this.formatDisplayDate(new Date(item.date)));
        const data = this.gameData.map(item => item.close);
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${this.stockData.symbol} Stock Price`,
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: `Stock Price History - Current Date: ${this.formatDisplayDate(this.currentDate)}`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Price ($)'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    formatDisplayDate(date) {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    showPredictionSection() {
        document.getElementById('predictionSection').style.display = 'block';
        document.getElementById('resultSection').style.display = 'none';
    }

    async makePrediction(direction) {
        if (this.futureData.length === 0) {
            this.showError('No more data available for predictions.');
            return;
        }

        const currentPrice = this.gameData[this.currentDateIndex].close;
        const nextDayData = this.futureData[0];
        const nextPrice = nextDayData.close;
        
        const actualDirection = nextPrice > currentPrice ? 'up' : 'down';
        const isCorrect = direction === actualDirection;
        
        if (isCorrect) {
            this.score++;
        }
        
        // Update game data with next day
        this.gameData.push(nextDayData);
        this.futureData.shift();
        this.currentDateIndex++;
        this.currentDate = new Date(nextDayData.date);
        
        // Update UI
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('currentDate').textContent = this.formatDisplayDate(this.currentDate);
        
        // Update chart
        this.updateChart();
        
        // Show result
        this.showResult(isCorrect, currentPrice, nextPrice, actualDirection);
    }

    updateChart() {
        const newLabel = this.formatDisplayDate(new Date(this.gameData[this.currentDateIndex].date));
        const newPrice = this.gameData[this.currentDateIndex].close;
        
        this.chart.data.labels.push(newLabel);
        this.chart.data.datasets[0].data.push(newPrice);
        
        // Keep only last 10 data points for better visibility
        if (this.chart.data.labels.length > 10) {
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
        }
        
        this.chart.options.plugins.title.text = `Stock Price History - Current Date: ${this.formatDisplayDate(this.currentDate)}`;
        this.chart.update();
    }

    showResult(isCorrect, oldPrice, newPrice, actualDirection) {
        const resultMessage = document.getElementById('resultMessage');
        const priceChange = ((newPrice - oldPrice) / oldPrice * 100).toFixed(2);
        const priceChangeText = priceChange >= 0 ? `+${priceChange}%` : `${priceChange}%`;
        
        if (isCorrect) {
            resultMessage.innerHTML = `
                <div class="correct">✅ Correct!</div>
                <p>The stock price ${actualDirection === 'up' ? 'increased' : 'decreased'} from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)} (${priceChangeText})</p>
                <p>Your score: ${this.score}</p>
            `;
            resultMessage.className = 'result-message correct';
        } else {
            resultMessage.innerHTML = `
                <div class="incorrect">❌ Incorrect!</div>
                <p>The stock price ${actualDirection === 'up' ? 'increased' : 'decreased'} from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)} (${priceChangeText})</p>
                <p>Your score: ${this.score}</p>
            `;
            resultMessage.className = 'result-message incorrect';
        }
        
        document.getElementById('predictionSection').style.display = 'none';
        document.getElementById('resultSection').style.display = 'block';
        
        // Hide continue button if no more data
        if (this.futureData.length === 0) {
            document.getElementById('continueGame').style.display = 'none';
            resultMessage.innerHTML += '<p><strong>Game Over!</strong> No more data available.</p>';
        }
    }

    continueGame() {
        this.showPredictionSection();
    }

    resetGame() {
        this.score = 0;
        this.gameData = [];
        this.futureData = [];
        this.currentDateIndex = 0;
        this.startDate = null;
        this.currentDate = null;
        
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        document.getElementById('gameInterface').style.display = 'none';
        document.getElementById('stockInputSection').style.display = 'block';
        document.getElementById('stockTicker').value = '';
        this.clearError();
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
        document.getElementById('submitTicker').disabled = show;
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
    }

    clearError() {
        document.getElementById('errorMessage').textContent = '';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new StockPredictionGame();
});
