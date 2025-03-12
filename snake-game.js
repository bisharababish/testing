// Game constants
const GRID_SIZE = 20;
const GRID_COUNT = 20;
const INITIAL_SNAKE_LENGTH = 3;
const FOOD_TYPES = {
    REGULAR: { value: 1, color: '#FF0000' },
    BONUS: { value: 3, color: '#FFA500' },
    SPECIAL: { value: 5, color: '#FFFF00' }
};
const OBSTACLE_COLOR = '#808080';
const COIN_COLOR = '#FFD700';
const POWERUP_TYPES = {
    SPEED: { name: 'Speed Boost', icon: '⚡', duration: 5000, color: '#00FFFF' },
    SLOW: { name: 'Slow Motion', icon: '🐢', duration: 7000, color: '#9370DB' },
    GHOST: { name: 'Ghost Mode', icon: '👻', duration: 6000, color: '#FFFFFF' },
    MAGNET: { name: 'Coin Magnet', icon: '🧲', duration: 8000, color: '#FF00FF' }
};

let canvas, ctx;
let snake = [];
let direction = 'right';
let nextDirection = 'right';
let food = null;
let obstacles = [];
let coins = [];
let powerups = [];
let score = 0;
let highScore = 0;
let level = 1;
let coinsLeft = 5;
let isGameRunning = false;
let isPaused = false;
let interval;
let gameSpeed = 100;
let showGrid = true;
let gameOver = false;
let lastRenderTime = 0;
let darkMode = localStorage.getItem('darkMode') === 'true';
let isMuted = localStorage.getItem('isMuted') === 'true';
let powerupActive = null;
let powerupTimeout;
let snakeColor = localStorage.getItem('snakeColor') || '#32CD32';
let difficultyLevel = localStorage.getItem('difficulty') || 'normal';
let swipeStartX, swipeStartY;
let touchDevice = ('ontouchstart' in window);

const gameCanvas = document.getElementById('gameCanvas');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const coinsLeftElement = document.getElementById('coinsLeft');
const highScoreElement = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const darkModeToggle = document.getElementById('darkModeToggle');
const muteBtn = document.getElementById('muteBtn');
const gridToggle = document.getElementById('gridToggle');
const difficultySelect = document.getElementById('difficulty');
const snakeColorPicker = document.getElementById('snakeColorPicker');
const gameOverlay = document.getElementById('gameOverlay');
const overlayMessage = document.getElementById('overlayMessage');
const finalScore = document.getElementById('finalScore');
const restartBtn = document.getElementById('restartBtn');
const touchHint = document.getElementById('touchHint');
const mobileControls = document.getElementById('mobileControls');
const powerupIndicator = document.getElementById('powerupIndicator');
const powerupTimer = document.getElementById('powerupTimer');
const swipeFeedbacks = {
    up: document.getElementById('swipeFeedbackUp'),
    down: document.getElementById('swipeFeedbackDown'),
    left: document.getElementById('swipeFeedbackLeft'),
    right: document.getElementById('swipeFeedbackRight')
};

const upBtn = document.getElementById('upBtn');
const downBtn = document.getElementById('downBtn');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');

const sounds = {
    eat: new Audio('https://assets.codepen.io/21542/pop-up-on.mp3'),
    bonus: new Audio('https://assets.codepen.io/21542/pop-down-on.mp3'),
    gameOver: new Audio('https://assets.codepen.io/21542/whistle-start.mp3'),
    levelUp: new Audio('https://assets.codepen.io/21542/select.mp3'),
    powerup: new Audio('https://assets.codepen.io/21542/notification-up.mp3')
};


let currentUser = null;
let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];

// Login Form
const loginOverlay = document.getElementById('loginOverlay');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');

// Handle Login Form Submission
loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const username = usernameInput.value.trim();

    if (username) {
        currentUser = username;
        localStorage.setItem('currentUser', username);
        loginOverlay.style.display = 'none';
        startGame();
    }
});
window.onload = function () {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        loginOverlay.style.display = 'none';
    } else {
        loginOverlay.style.display = 'flex';
    }

    init();
    renderLeaderboard();
};

function updateLeaderboard(username, score) {
    const userIndex = leaderboard.findIndex(entry => entry.username === username);

    if (userIndex !== -1) {
        if (score > leaderboard[userIndex].score) {
            leaderboard[userIndex].score = score;
        }
    } else {
        leaderboard.push({ username, score });
    }

    // Sort by score (descending)
    leaderboard.sort((a, b) => b.score - a.score);

    // Keep only top 10 entries
    leaderboard = leaderboard.slice(0, 10);

    // Save to localStorage
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));

    // Update the leaderboard display
    renderLeaderboard();
}
async function renderLeaderboard() {
    const leaderboard = await fetchLeaderboard();
    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.innerHTML = '';

    leaderboard.forEach((entry, index) => {
        const entryElement = document.createElement('div');
        entryElement.className = 'leaderboard-entry';

        entryElement.innerHTML = `
            <span class="username">${entry.username}</span>
            <span class="score">${entry.score}</span>
        `;

        leaderboardElement.appendChild(entryElement);
    });
}
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', function () {
    localStorage.removeItem('currentUser');
    currentUser = null;
    loginOverlay.style.display = 'flex';
    logoutBtn.style.display = 'none';
});

// Show logout button if a user is logged in
if (currentUser) {
    logoutBtn.style.display = 'block';
}

const API_URL = 'https://testingsnakegame.netlify.app/'; // Replace with your backend URL

// Fetch leaderboard from the server
async function fetchLeaderboard() {
    try {
        const response = await fetch(`${API_URL}/leaderboard`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
}

// Submit score to the server
async function submitScore(username, score) {
    try {
        const response = await fetch(`${API_URL}/submit-score`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, score }),
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error submitting score:', error);
    }
}




























// Initialize the game
function init() {
    canvas = gameCanvas;
    ctx = canvas.getContext('2d');

    loadSettings();

    if (darkMode) {
        document.body.classList.add('dark-mode');
    }

    difficultySelect.value = difficultyLevel;
    updateGameSpeed();

    snakeColorPicker.value = snakeColor;

    setupEventListeners();

    render();

    highScoreElement.textContent = highScore;
}

function loadSettings() {
    highScore = parseInt(localStorage.getItem('highScore')) || 0;
    showGrid = localStorage.getItem('showGrid') !== 'false';
    gridToggle.checked = showGrid;

    updateMuteButton();
}

function updateGameSpeed() {
    switch (difficultyLevel) {
        case 'easy':
            gameSpeed = 150;
            break;
        case 'normal':
            gameSpeed = 130;
            break;
        case 'hard':
            gameSpeed = 110;
            break;
        case 'extreme':
            gameSpeed = 80;
            break;
    }
}

function setupEventListeners() {
    document.addEventListener('keydown', handleKeyPress);

    startBtn.addEventListener('click', startGame);
    settingsBtn.addEventListener('click', toggleSettings);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    muteBtn.addEventListener('click', toggleMute);
    gridToggle.addEventListener('change', toggleGrid);
    difficultySelect.addEventListener('change', changeDifficulty);
    snakeColorPicker.addEventListener('change', changeSnakeColor);
    restartBtn.addEventListener('click', startGame);

    if (touchDevice) {
        setupTouchControls();
    }

    window.addEventListener('resize', adjustCanvasSize);

    document.addEventListener('touchmove', function (e) {
        if (isGameRunning) {
            e.preventDefault();
        }
    }, { passive: false });
}

function setupTouchControls() {
    if (touchDevice) {
        touchHint.style.display = 'block';
    }

    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove, false);
    document.addEventListener('touchend', handleTouchEnd, false);
}

function adjustCanvasSize() {
    if (window.innerWidth < 500) {
        const size = Math.min(window.innerWidth - 40, 400);
        canvas.width = size;
        canvas.height = size;
    }
}

function handleKeyPress(e) {
    if (!isGameRunning && e.key !== 'p' && e.key !== 'P') {
        startGame();
        return;
    }

    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            changeDirection('up');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            changeDirection('down');
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            changeDirection('left');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            changeDirection('right');
            break;
        case 'p':
        case 'P':
            togglePause();
            break;
    }
}

function changeDirection(newDirection) {
    if (isPaused) return;

    if (
        (direction === 'up' && newDirection === 'down') ||
        (direction === 'down' && newDirection === 'up') ||
        (direction === 'left' && newDirection === 'right') ||
        (direction === 'right' && newDirection === 'left')
    ) {
        return;
    }

    nextDirection = newDirection;
}

function handleTouchStart(e) {
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;

    createTouchFeedback(swipeStartX, swipeStartY);
}

function createTouchFeedback(x, y) {
    const feedback = document.createElement('div');
    feedback.className = 'touch-feedback';
    feedback.style.left = x + 'px';
    feedback.style.top = y + 'px';
    document.body.appendChild(feedback);

    setTimeout(() => {
        document.body.removeChild(feedback);
    }, 500);
}

function handleTouchMove(e) {
    if (!swipeStartX || !swipeStartY || !isGameRunning) return;

    const touchX = e.touches[0].clientX;
    const touchY = e.touches[0].clientY;

    const diffX = touchX - swipeStartX;
    const diffY = touchY - swipeStartY;

    if (Math.max(Math.abs(diffX), Math.abs(diffY)) < 20) return;

    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
            changeDirection('right');
            showSwipeFeedback('right');
        } else {
            changeDirection('left');
            showSwipeFeedback('left');
        }
    } else {
        if (diffY > 0) {
            changeDirection('down');
            showSwipeFeedback('down');
        } else {
            changeDirection('up');
            showSwipeFeedback('up');
        }
    }

    swipeStartX = null;
    swipeStartY = null;
}

function handleTouchEnd() {
    swipeStartX = null;
    swipeStartY = null;
}

function showSwipeFeedback(direction) {
    const feedback = swipeFeedbacks[direction];
    feedback.classList.add('swipe-feedback-active');

    setTimeout(() => {
        feedback.classList.remove('swipe-feedback-active');
    }, 500);
}

function toggleSettings() {
    settingsPanel.classList.toggle('settings-open');
}

function toggleDarkMode() {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', darkMode);
}

function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem('isMuted', isMuted);
    updateMuteButton();
}

function updateMuteButton() {
    muteBtn.innerHTML = isMuted ? '🔇 Unmute' : '🔊 Mute';

    for (const sound in sounds) {
        sounds[sound].muted = isMuted;
    }
}

function toggleGrid() {
    showGrid = gridToggle.checked;
    localStorage.setItem('showGrid', showGrid);
    render();
}

function changeDifficulty() {
    difficultyLevel = difficultySelect.value;
    localStorage.setItem('difficulty', difficultyLevel);
    updateGameSpeed();
}

function changeSnakeColor() {
    snakeColor = snakeColorPicker.value;
    localStorage.setItem('snakeColor', snakeColor);
    render();
}

function togglePause() {
    if (!isGameRunning) return;

    isPaused = !isPaused;

    if (isPaused) {
        clearInterval(interval);
        drawPausedText();
    } else {
        interval = setInterval(gameLoop, gameSpeed);
    }
}

function startGame() {
    snake = [];
    direction = 'right';
    nextDirection = 'right';
    food = null;
    obstacles = [];
    coins = [];
    powerups = [];
    score = 0;
    level = 1;
    coinsLeft = 5;
    isGameRunning = true;
    isPaused = false;
    gameOver = false;

    gameOverlay.classList.remove('active');

    startBtn.style.display = 'none';

    initSnake();

    spawnFood();

    clearInterval(interval);
    interval = setInterval(gameLoop, gameSpeed);

    updateDisplay();
}

function initSnake() {
    snake = [];
    const midPoint = Math.floor(GRID_COUNT / 2);

    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
        snake.push({
            x: midPoint - i,
            y: midPoint
        });
    }
}

function spawnFood() {
    let validPosition = false;
    let newFood;

    while (!validPosition) {
        newFood = {
            x: Math.floor(Math.random() * GRID_COUNT),
            y: Math.floor(Math.random() * GRID_COUNT),
            type: getRandomFoodType()
        };

        validPosition = isValidPosition(newFood);
    }

    food = newFood;

    if (Math.random() < 0.1 && level > 1) {
        spawnPowerup();
    }

    if (level > 1 && coinsLeft > 0 && Math.random() < 0.3) {
        spawnCoin();
    }

    if (level > 2 && obstacles.length < level * 2 && Math.random() < 0.2) {
        spawnObstacle();
    }
}

function getRandomFoodType() {
    const rand = Math.random();

    if (rand < 0.1) {
        return FOOD_TYPES.SPECIAL;
    } else if (rand < 0.3) {
        return FOOD_TYPES.BONUS;
    } else {
        return FOOD_TYPES.REGULAR;
    }
}

function isValidPosition(pos) {
    for (const segment of snake) {
        if (segment.x === pos.x && segment.y === pos.y) {
            return false;
        }
    }

    for (const obstacle of obstacles) {
        if (obstacle.x === pos.x && obstacle.y === pos.y) {
            return false;
        }
    }

    for (const coin of coins) {
        if (coin.x === pos.x && coin.y === pos.y) {
            return false;
        }
    }

    for (const powerup of powerups) {
        if (powerup.x === pos.x && powerup.y === pos.y) {
            return false;
        }
    }

    return true;
}

function spawnPowerup() {
    let validPosition = false;
    let newPowerup;

    while (!validPosition) {
        newPowerup = {
            x: Math.floor(Math.random() * GRID_COUNT),
            y: Math.floor(Math.random() * GRID_COUNT),
            type: getRandomPowerupType()
        };

        validPosition = isValidPosition(newPowerup);
    }

    powerups.push(newPowerup);

    setTimeout(() => {
        const index = powerups.findIndex(p => p.x === newPowerup.x && p.y === newPowerup.y);
        if (index !== -1) {
            powerups.splice(index, 1);
        }
    }, 10000);
}

function getRandomPowerupType() {
    const types = Object.values(POWERUP_TYPES);
    return types[Math.floor(Math.random() * types.length)];
}

function spawnCoin() {
    if (coinsLeft <= 0) return;

    let validPosition = false;
    let newCoin;

    while (!validPosition) {
        newCoin = {
            x: Math.floor(Math.random() * GRID_COUNT),
            y: Math.floor(Math.random() * GRID_COUNT)
        };

        validPosition = isValidPosition(newCoin);
    }

    coins.push(newCoin);

    coinsLeft--;
    updateDisplay();
}

function spawnObstacle() {
    let validPosition = false;
    let newObstacle;

    while (!validPosition) {
        newObstacle = {
            x: Math.floor(Math.random() * GRID_COUNT),
            y: Math.floor(Math.random() * GRID_COUNT)
        };

        const head = snake[0];
        const distX = Math.abs(head.x - newObstacle.x);
        const distY = Math.abs(head.y - newObstacle.y);

        if (distX <= 2 && distY <= 2) {
            validPosition = false;
            continue;
        }

        validPosition = isValidPosition(newObstacle);
    }

    obstacles.push(newObstacle);
}

function gameLoop() {
    if (isPaused) return;

    moveSnake();

    if (checkCollisions()) {
        endGame();
        return;
    }

    checkFood();

    checkPowerups();

    checkCoins();

    render();
}

function moveSnake() {
    direction = nextDirection;

    const head = { ...snake[0] };

    switch (direction) {
        case 'up':
            head.y--;
            break;
        case 'down':
            head.y++;
            break;
        case 'left':
            head.x--;
            break;
        case 'right':
            head.x++;
            break;
    }

    if (head.x < 0) head.x = GRID_COUNT - 1;
    if (head.x >= GRID_COUNT) head.x = 0;
    if (head.y < 0) head.y = GRID_COUNT - 1;
    if (head.y >= GRID_COUNT) head.y = 0;

    snake.unshift(head);

    if (!food || head.x !== food.x || head.y !== food.y) {
        snake.pop();
    }
}

function checkCollisions() {
    const head = snake[0];

    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            if (powerupActive && powerupActive.type === POWERUP_TYPES.GHOST) {
                return false;
            }
            return true;
        }
    }

    for (const obstacle of obstacles) {
        if (head.x === obstacle.x && head.y === obstacle.y) {
            if (powerupActive && powerupActive.type === POWERUP_TYPES.GHOST) {
                return false;
            }
            return true;
        }
    }

    return false;
}

function checkFood() {
    if (!food) return;

    const head = snake[0];

    if (head.x === food.x && head.y === food.y) {
        score += food.type.value;
        animateScoreUpdate();

        playSound(food.type.value > 1 ? 'bonus' : 'eat');

        food = null;
        spawnFood();

        checkLevelUp();

        updateDisplay();
    }
}

function checkPowerups() {
    if (powerups.length === 0) return;

    const head = snake[0];

    for (let i = 0; i < powerups.length; i++) {
        const powerup = powerups[i];

        if (head.x === powerup.x && head.y === powerup.y) {
            applyPowerup(powerup.type);

            powerups.splice(i, 1);

            playSound('powerup');

            break;
        }
    }
}

function applyPowerup(type) {
    if (powerupTimeout) {
        clearTimeout(powerupTimeout);
    }

    powerupActive = type;

    powerupIndicator.style.display = 'flex';
    powerupIndicator.querySelector('.powerup-icon').textContent = type.icon;

    let timeLeft = Math.floor(type.duration / 1000);
    updatePowerupTimer(timeLeft);

    const countdownInterval = setInterval(() => {
        timeLeft--;
        updatePowerupTimer(timeLeft);

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);

    if (type === POWERUP_TYPES.SPEED) {
        const originalSpeed = gameSpeed;
        gameSpeed = gameSpeed / 2;

        clearInterval(interval);
        interval = setInterval(gameLoop, gameSpeed);

        powerupTimeout = setTimeout(() => {
            gameSpeed = originalSpeed;
            clearInterval(interval);
            if (isGameRunning && !isPaused) {
                interval = setInterval(gameLoop, gameSpeed);
            }
            powerupActive = null;
            powerupIndicator.style.display = 'none';
            clearInterval(countdownInterval);
        }, type.duration);
    } else if (type === POWERUP_TYPES.SLOW) {
        const originalSpeed = gameSpeed;
        gameSpeed = gameSpeed * 1.5;

        clearInterval(interval);
        interval = setInterval(gameLoop, gameSpeed);

        powerupTimeout = setTimeout(() => {
            gameSpeed = originalSpeed;
            clearInterval(interval);
            if (isGameRunning && !isPaused) {
                interval = setInterval(gameLoop, gameSpeed);
            }
            powerupActive = null;
            powerupIndicator.style.display = 'none';
            clearInterval(countdownInterval);
        }, type.duration);
    } else {
        powerupTimeout = setTimeout(() => {
            powerupActive = null;
            powerupIndicator.style.display = 'none';
            clearInterval(countdownInterval);
        }, type.duration);
    }
}

function updatePowerupTimer(seconds) {
    powerupTimer.textContent = `${seconds}s`;
}

function checkCoins() {
    if (coins.length === 0) return;

    const head = snake[0];

    for (let i = 0; i < coins.length; i++) {
        const coin = coins[i];

        if (powerupActive && powerupActive.type === POWERUP_TYPES.MAGNET) {
            const distX = Math.abs(head.x - coin.x);
            const distY = Math.abs(head.y - coin.y);

            if (distX <= 2 && distY <= 2) {
                score += 2;
                animateScoreUpdate();

                playSound('bonus');

                coins.splice(i, 1);

                updateDisplay();

                break;
            }
        }

        if (head.x === coin.x && head.y === coin.y) {
            score += 2;
            animateScoreUpdate();

            playSound('bonus');

            coins.splice(i, 1);
            updateDisplay();

            break;
        }
    }

    if (coins.length === 0 && coinsLeft === 0) {
        levelUp();
    }
}

function checkLevelUp() {
    if (score >= level * 10) {
        levelUp();
    }
}

function levelUp() {
    level++;
    coinsLeft = 5;

    if (level > 2) {
        spawnObstacle();
    }

    playSound('levelUp');

    updateDisplay();
}

function playSound(soundName) {
    if (isMuted) return;

    try {
        const sound = sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play();
        }
    } catch (e) {
        console.error("Error playing sound:", e);
    }
}

function animateScoreUpdate() {
    scoreElement.classList.add('score-updated');

    setTimeout(() => {
        scoreElement.classList.remove('score-updated');
    }, 500);
}

async function endGame() {
    isGameRunning = false;
    clearInterval(interval);

    playSound('gameOver');

    if (powerupTimeout) {
        clearTimeout(powerupTimeout);
        powerupActive = null;
        powerupIndicator.style.display = 'none';
    }

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = highScore;
        if (currentUser) {
            updateLeaderboard(currentUser, score);
        }
    }

    overlayMessage.textContent = 'Game Over';
    finalScore.textContent = `Score: ${score}`;
    gameOverlay.classList.add('active');
    gameOverlay.classList.add('game-over');

    startBtn.style.display = 'block';
    startBtn.textContent = 'Play Again';
    await renderLeaderboard();

}

function updateDisplay() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    coinsLeftElement.textContent = coinsLeft;
    highScoreElement.textContent = highScore;
}

function render() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (showGrid) {
        drawGrid();
    }

    drawSnake();

    if (food) {
        drawFood();
    }

    drawObstacles();

    drawCoins();

    drawPowerups();
}


function drawGrid() {
    const cellSize = canvas.width / GRID_COUNT;

    ctx.strokeStyle = '#222222';
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= GRID_COUNT; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(canvas.width, i * cellSize);
        ctx.stroke();
    }
}

function drawSnake() {
    const cellSize = canvas.width / GRID_COUNT;

    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];

        if (i === 0) {
            ctx.fillStyle = snakeColor;
        } else {
            const shade = 1 - (i / snake.length * 0.6);
            ctx.fillStyle = adjustColorBrightness(snakeColor, shade);
        }

        if (powerupActive && powerupActive.type === POWERUP_TYPES.GHOST) {
            ctx.globalAlpha = 0.6;
        }

        ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize);

        ctx.globalAlpha = 1;
    }

    if (snake.length > 0) {
        const head = snake[0];
        const eyeSize = cellSize / 5;
        const eyeOffset = cellSize / 3;

        ctx.fillStyle = '#FFFFFF';

        switch (direction) {
            case 'up':
                ctx.fillRect(head.x * cellSize + eyeOffset - eyeSize, head.y * cellSize + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(head.x * cellSize + cellSize - eyeOffset, head.y * cellSize + eyeOffset, eyeSize, eyeSize);
                break;
            case 'down':
                ctx.fillRect(head.x * cellSize + eyeOffset - eyeSize, head.y * cellSize + cellSize - eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(head.x * cellSize + cellSize - eyeOffset, head.y * cellSize + cellSize - eyeOffset, eyeSize, eyeSize);
                break;
            case 'left':
                ctx.fillRect(head.x * cellSize + eyeOffset, head.y * cellSize + eyeOffset - eyeSize, eyeSize, eyeSize);
                ctx.fillRect(head.x * cellSize + eyeOffset, head.y * cellSize + cellSize - eyeOffset, eyeSize, eyeSize);
                break;
            case 'right':
                ctx.fillRect(head.x * cellSize + cellSize - eyeOffset, head.y * cellSize + eyeOffset - eyeSize, eyeSize, eyeSize);
                ctx.fillRect(head.x * cellSize + cellSize - eyeOffset, head.y * cellSize + cellSize - eyeOffset, eyeSize, eyeSize);
                break;
        }
    }
}

function drawFood() {
    const cellSize = canvas.width / GRID_COUNT;

    ctx.fillStyle = food.type.color;

    const time = Date.now() / 500;
    const pulse = 1 + Math.sin(time) * 0.1;

    const centerX = food.x * cellSize + cellSize / 2;
    const centerY = food.y * cellSize + cellSize / 2;
    const radius = (cellSize / 2) * pulse;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawObstacles() {
    const cellSize = canvas.width / GRID_COUNT;

    ctx.fillStyle = OBSTACLE_COLOR;

    for (const obstacle of obstacles) {
        ctx.fillRect(obstacle.x * cellSize, obstacle.y * cellSize, cellSize, cellSize);

        ctx.strokeStyle = '#707070';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(obstacle.x * cellSize, obstacle.y * cellSize);
        ctx.lineTo((obstacle.x + 1) * cellSize, (obstacle.y + 1) * cellSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo((obstacle.x + 1) * cellSize, obstacle.y * cellSize);
        ctx.lineTo(obstacle.x * cellSize, (obstacle.y + 1) * cellSize);
        ctx.stroke();
    }
}

function drawCoins() {
    const cellSize = canvas.width / GRID_COUNT;

    ctx.fillStyle = COIN_COLOR;

    for (const coin of coins) {
        const centerX = coin.x * cellSize + cellSize / 2;
        const centerY = coin.y * cellSize + cellSize / 2;
        const radius = cellSize / 2.5;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFB700';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = COIN_COLOR;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(centerX - radius / 3, centerY - radius / 3, radius / 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPowerups() {
    const cellSize = canvas.width / GRID_COUNT;

    for (const powerup of powerups) {
        const centerX = powerup.x * cellSize + cellSize / 2;
        const centerY = powerup.y * cellSize + cellSize / 2;
        const size = cellSize * 0.8;

        ctx.fillStyle = powerup.type.color;

        const time = Date.now() / 300;
        const pulse = 1 + Math.sin(time) * 0.1;

        ctx.beginPath();
        ctx.arc(centerX, centerY, (size / 2) * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.font = `${cellSize * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerup.type.icon, centerX, centerY);
    }
}

function drawPausedText() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    ctx.font = '16px Arial';
    ctx.fillText('Press P to continue', canvas.width / 2, canvas.height / 2 + 40);
}

function adjustColorBrightness(hex, factor) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    r = Math.min(255, Math.floor(r * factor));
    g = Math.min(255, Math.floor(g * factor));
    b = Math.min(255, Math.floor(b * factor));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

window.onload = function () {
    init();

    overlayMessage.textContent = 'Snake Game';
    finalScore.textContent = 'Press any key or click Start to begin';
    gameOverlay.classList.add('active');

    if (touchDevice) {
        finalScore.textContent = 'Tap Start to begin';
        touchHint.style.display = 'block';
        mobileControls.style.display = 'flex';
    }

    adjustCanvasSize();
};