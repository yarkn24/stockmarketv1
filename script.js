// Stock Market Prediction Game
class StockPredictionGame {
    constructor() {
        this.API_KEY = '90DOAU73O51BZ16I';
        this.BASE_URL = 'https://www.alphavantage.co/query';
        this.stockData = [];
        this.currentDataIndex = 0;
        this.score = 0;
        this.currentSymbol = '';
        this.chart = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('stockTicker').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.startGame();
        });
        document.getElementById('predictUp').addEventListener('click', () => this.makePrediction(true));
        document.getElementById('predictDown').addEventListener('click', () => this.makePrediction(false));
        document.getElementById('continueBtn').addEventListener('click', () => this.continueGame());
        document.getElementById('newGameBtn').addEventListener('click', () => this.resetGame());
    }

    async startGame() {
        const ticker = document.getElementById('stockTicker').value.trim().toUpperCase();
        
        if (!ticker) {
            this.showError('Please enter a stock ticker symbol');
            return;
        }
        
        this.showLoading(true);
        this.clearError();
        
        try {
            const stockData = await this.fetchStockData(ticker);
            
            if (!stockData || stockData.length < 8) { // Need at least 7 historical days + 1 start day
                throw new Error('Not enough historical data to start the game.');
            }
            
            this.stockData = stockData;
            this.currentSymbol = ticker;
            this.score = 0;
            
            // New logic: Find a valid starting date from the data we actually have
            const potentialStartIndices = this.getPotentialStartIndices();

            if (potentialStartIndices.length === 0) {
                throw new Error('Not enough historical data in the last 7-100 day range for this stock.');
            }

            // Pick a random index from our list of valid indices
            const randomIndex = Math.floor(Math.random() * potentialStartIndices.length);
            this.currentDataIndex = potentialStartIndices[randomIndex];
            
            this.initializeGameInterface();
            this.createChart();
            this.showGameSection();
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async fetchStockData(symbol) {
        const url = `${this.BASE_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${this.API_KEY}&outputsize=full`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data['Error Message']) {
                throw new Error('Invalid stock ticker symbol');
            }
            
            if (data['Note']) {
                throw new Error('API rate limit exceeded. Please try again later.');
            }
            
            const timeSeries = data['Time Series (Daily)'];
            if (!timeSeries) {
                throw new Error('No stock data available');
            }
            
            // Convert to array and sort by date
            const stockArray = Object.entries(timeSeries).map(([date, values]) => ({
                date: new Date(date),
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['5. volume'])
            })).sort((a, b) => a.date - b.date);
            
            return stockArray;
            
        } catch (error) {
            console.error('Error fetching stock data:', error);
            throw error;
        }
    }

    getPotentialStartIndices() {
        const today = new Date();
        const minStartDate = new Date();
        minStartDate.setDate(today.getDate() - 100);
        const maxStartDate = new Date();
        maxStartDate.setDate(today.getDate() - 7);

        const potentialIndices = [];
        // Start from index 7 so we always have 7 days of prior data for the chart
        for (let i = 7; i < this.stockData.length; i++) {
            const date = this.stockData[i].date;
            if (date >= minStartDate && date <= maxStartDate) {
                potentialIndices.push(i);
            }
        }
        return potentialIndices;
    }

    initializeGameInterface() {
        document.getElementById('stockSymbol').textContent = this.currentSymbol;
        document.getElementById('currentDate').textContent = this.formatDate(this.stockData[this.currentDataIndex].date);
        document.getElementById('scoreValue').textContent = this.score;
        document.getElementById('resultSection').style.display = 'none';
        this.enablePredictionButtons();
    }

    createChart() {
        const ctx = document.getElementById('stockChart').getContext('2d');
        
        // Get data for chart (7 days before and including current date)
        const startIndex = Math.max(0, this.currentDataIndex - 6);
        const endIndex = this.currentDataIndex;
        const chartData = this.stockData.slice(startIndex, endIndex + 1);
        
        const labels = chartData.map(item => this.formatDate(item.date));
        const prices = chartData.map(item => item.close);
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${this.currentSymbol} Stock Price`,
                    data: prices,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Price ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                }
            }
        });
    }

    makePrediction(predictUp) {
        if (this.currentDataIndex >= this.stockData.length - 1) {
            this.showError('No more data available for predictions');
            return;
        }
        
        const currentPrice = this.stockData[this.currentDataIndex].close;
        const nextPrice = this.stockData[this.currentDataIndex + 1].close;
        const actualUp = nextPrice > currentPrice;
        const isCorrect = predictUp === actualUp;
        
        if (isCorrect) {
            this.score++;
        }
        
        this.currentDataIndex++;
        this.showResult(isCorrect, nextPrice, predictUp, actualUp);
        this.updateChart();
        this.disablePredictionButtons();
    }

    showResult(isCorrect, actualPrice, predictedUp, actualUp) {
        const resultSection = document.getElementById('resultSection');
        const resultMessage = document.getElementById('resultMessage');
        const actualPriceElement = document.getElementById('actualPrice');
        
        resultMessage.className = 'result-message ' + (isCorrect ? 'correct' : 'incorrect');
        
        if (isCorrect) {
            resultMessage.textContent = '🎉 Correct! Well done!';
        } else {
            const actualDirection = actualUp ? 'UP' : 'DOWN';
            const predictedDirection = predictedUp ? 'UP' : 'DOWN';
            resultMessage.textContent = `❌ Incorrect. You predicted ${predictedDirection}, but price went ${actualDirection}.`;
        }
        
        actualPriceElement.textContent = actualPrice.toFixed(2);
        
        // Update score display
        document.getElementById('scoreValue').textContent = this.score;
        
        // Update current date
        document.getElementById('currentDate').textContent = this.formatDate(this.stockData[this.currentDataIndex].date);
        
        resultSection.style.display = 'block';
    }

    updateChart() {
        // Add new data point to chart
        const newData = this.stockData[this.currentDataIndex];
        this.chart.data.labels.push(this.formatDate(newData.date));
        this.chart.data.datasets[0].data.push(newData.close);
        
        // Keep only last 8 points (7 historical + 1 new)
        if (this.chart.data.labels.length > 8) {
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
        }
        
        this.chart.update();
    }

    continueGame() {
        if (this.currentDataIndex >= this.stockData.length - 1) {
            alert('Game completed! No more data available.');
            this.resetGame();
            return;
        }
        
        document.getElementById('resultSection').style.display = 'none';
        this.enablePredictionButtons();
    }

    enablePredictionButtons() {
        document.getElementById('predictUp').disabled = false;
        document.getElementById('predictDown').disabled = false;
    }

    disablePredictionButtons() {
        document.getElementById('predictUp').disabled = true;
        document.getElementById('predictDown').disabled = true;
    }

    resetGame() {
        this.score = 0;
        this.stockData = [];
        this.currentDataIndex = 0;
        this.currentSymbol = '';
        
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        
        document.getElementById('tickerSection').style.display = 'block';
        document.getElementById('gameSection').style.display = 'none';
        document.getElementById('stockTicker').value = '';
        document.getElementById('stockTicker').focus();
    }

    showGameSection() {
        document.getElementById('tickerSection').style.display = 'none';
        document.getElementById('gameSection').style.display = 'block';
    }

    showLoading(show) {
        document.getElementById('loadingSection').style.display = show ? 'block' : 'none';
        document.getElementById('tickerSection').style.display = show ? 'none' : 'block';
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
    }

    clearError() {
        document.getElementById('errorMessage').textContent = '';
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new StockPredictionGame();
});
