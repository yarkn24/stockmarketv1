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
        this.gameStartDate = null;
        
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
            
            if (!stockData || stockData.length === 0) {
                throw new Error('Invalid stock ticker or no data available');
            }
            
            this.stockData = stockData;
            this.currentSymbol = ticker;
            this.score = 0;
            
            // Generate random starting date (7-100 days ago, weekdays only)
            this.gameStartDate = this.generateRandomTradingDate();
            this.currentDataIndex = this.findDataIndexForDate(this.gameStartDate);
            
            if (this.currentDataIndex === -1) {
                throw new Error('No data available for the selected date range');
            }
            
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

    generateRandomTradingDate() {
        const today = new Date();
        const minDaysAgo = 7;
        const maxDaysAgo = 100;
        
        let attempts = 0;
        const maxAttempts = 50;
        
        while (attempts < maxAttempts) {
            const daysAgo = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo + 1)) + minDaysAgo;
            const candidateDate = new Date(today);
            candidateDate.setDate(today.getDate() - daysAgo);
            
            // Check if it's a weekday (Monday = 1, Friday = 5)
            const dayOfWeek = candidateDate.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                // Check if it's not a major US holiday (simplified check)
                if (!this.isHoliday(candidateDate)) {
                    return candidateDate;
                }
            }
            attempts++;
        }
        
        // Fallback: return a date that's 30 days ago if no valid date found
        const fallbackDate = new Date(today);
        fallbackDate.setDate(today.getDate() - 30);
        return fallbackDate;
    }

    isHoliday(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        
        // Simplified holiday check (major US market holidays)
        // New Year's Day
        if (month === 0 && day === 1) return true;
        
        // Independence Day
        if (month === 6 && day === 4) return true;
        
        // Christmas
        if (month === 11 && day === 25) return true;
        
        // Thanksgiving (4th Thursday in November) - simplified
        if (month === 10 && day >= 22 && day <= 28 && date.getDay() === 4) return true;
        
        return false;
    }

    findDataIndexForDate(targetDate) {
        const targetDateStr = targetDate.toISOString().split('T')[0];
        
        for (let i = 0; i < this.stockData.length; i++) {
            const dataDateStr = this.stockData[i].date.toISOString().split('T')[0];
            if (dataDateStr === targetDateStr) {
                return i;
            }
        }
        
        // If exact match not found, find closest earlier date
        for (let i = this.stockData.length - 1; i >= 0; i--) {
            if (this.stockData[i].date <= targetDate) {
                return i;
            }
        }
        
        return -1;
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