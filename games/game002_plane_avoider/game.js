import { setupCanvas, startAnimation, stopAnimation, getCanvasContext } from '../../common/js/canvasManager.js';
import { Particle } from '../../common/js/particle.js'; // We'll use Particle for balls
import { getRandom, distance } from '../../common/js/utils.js';
// import { showMessage } from '../../common/js/ui.js'; // Optional
import { GAME_CONFIG } from './config.js';

const startGameBtn = document.getElementById('startGameBtn');
const restartGameBtn = document.getElementById('restartGameBtn');
const gameOverMessageEl = document.getElementById('gameOverMessage');
const scoreDisplayEl = document.getElementById('scoreDisplay');

let plane = {};
let balls = [];
let keysPressed = {};
let score = 0;
let gameStartTime = 0;
let lastSplitTime = 0;
let isGameOver = false;
let isGameRunning = false;

let currentCanvas, currentCtx;

// --- Plane Logic ---
function initPlane() {
    const { canvas } = getCanvasContext();
    plane = {
        x: canvas.width / 2 - GAME_CONFIG.PLANE_WIDTH / 2,
        y: canvas.height - GAME_CONFIG.PLANE_HEIGHT - 10,
        width: GAME_CONFIG.PLANE_WIDTH,
        height: GAME_CONFIG.PLANE_HEIGHT,
        color: GAME_CONFIG.PLANE_COLOR,
        speed: GAME_CONFIG.PLANE_SPEED
    };
}

function drawPlane(ctx) {
    ctx.fillStyle = plane.color;
    ctx.fillRect(plane.x, plane.y, plane.width, plane.height);
    // Could draw a more complex plane shape here
}

function updatePlane() {
    const { canvas } = getCanvasContext();
    if (keysPressed['ArrowUp'] || keysPressed['w']) {
        plane.y -= plane.speed;
    }
    if (keysPressed['ArrowDown'] || keysPressed['s']) {
        plane.y += plane.speed;
    }
    if (keysPressed['ArrowLeft'] || keysPressed['a']) {
        plane.x -= plane.speed;
    }
    if (keysPressed['ArrowRight'] || keysPressed['d']) {
        plane.x += plane.speed;
    }

    // Keep plane within canvas bounds
    plane.x = Math.max(0, Math.min(plane.x, canvas.width - plane.width));
    plane.y = Math.max(0, Math.min(plane.y, canvas.height - plane.height));
}

// --- Ball Logic ---
function createBall(x, y, vx, vy) {
    const { canvas } = getCanvasContext();
    const particleConfig = {
        NORMAL_SPEED_MIN: GAME_CONFIG.BALL_SPEED_MIN,
        NORMAL_SPEED_MAX: GAME_CONFIG.BALL_SPEED_MAX,
        // We don't use the slow-down features of Particle for this game
    };
    let newBall = new Particle(
        x || getRandom(GAME_CONFIG.BALL_RADIUS, canvas.width - GAME_CONFIG.BALL_RADIUS),
        y || getRandom(GAME_CONFIG.BALL_RADIUS, canvas.height / 2), // Start balls in upper half
        GAME_CONFIG.BALL_RADIUS,
        GAME_CONFIG.BALL_COLOR,
        particleConfig
    );
    if (vx !== undefined) newBall.vx = vx;
    if (vy !== undefined) newBall.vy = vy;
    return newBall;
}

function initBalls() {
    balls = [];
    for (let i = 0; i < GAME_CONFIG.INITIAL_BALL_COUNT; i++) {
        balls.push(createBall());
    }
}

function updateBalls() {
    const { canvas } = getCanvasContext();
    balls.forEach(ball => {
        ball.update(canvas.width, canvas.height, null); // No stillRootEffect
    });
}

function handleBallSplitting() {
    const currentTime = Date.now();
    if (currentTime - lastSplitTime > GAME_CONFIG.BALL_SPLIT_INTERVAL) {
        lastSplitTime = currentTime;
        const ballsToSplit = [...balls]; // Iterate over a copy
        ballsToSplit.forEach(originalBall => {
            if (balls.includes(originalBall)) { // Check if original ball still exists
                // Remove original ball
                balls = balls.filter(b => b !== originalBall);

                // Create two new balls
                const angle1 = Math.random() * Math.PI * 2;
                const angle2 = Math.random() * Math.PI * 2;
                const speed = Math.sqrt(originalBall.vx**2 + originalBall.vy**2) || getRandom(GAME_CONFIG.BALL_SPEED_MIN, GAME_CONFIG.BALL_SPEED_MAX);

                balls.push(createBall(originalBall.x, originalBall.y, Math.cos(angle1) * speed, Math.sin(angle1) * speed));
                balls.push(createBall(originalBall.x, originalBall.y, Math.cos(angle2) * speed, Math.sin(angle2) * speed));
            }
        });
    }
}

// --- Collision Detection ---
function checkCollisions() {
    for (const ball of balls) {
        // Simple AABB collision for rectangle (plane) and circle (ball)
        // Find closest point on rect to circle center
        let testX = ball.x;
        let testY = ball.y;

        if (ball.x < plane.x) testX = plane.x; // left edge
        else if (ball.x > plane.x + plane.width) testX = plane.x + plane.width; // right edge
        if (ball.y < plane.y) testY = plane.y; // top edge
        else if (ball.y > plane.y + plane.height) testY = plane.y + plane.height; // bottom edge

        const distX = ball.x - testX;
        const distY = ball.y - testY;
        const distanceSq = (distX * distX) + (distY * distY);

        if (distanceSq <= ball.radius * ball.radius) {
            return true; // Collision
        }
    }
    return false; // No collision
}


// --- Game State & Loop ---
function initGame() {
    const { canvas, ctx } = getCanvasContext();
    currentCanvas = canvas;
    currentCtx = ctx;

    initPlane();
    initBalls();
    score = 0;
    gameStartTime = Date.now();
    lastSplitTime = Date.now(); // Initialize split timer
    isGameOver = false;
    isGameRunning = true;

    gameOverMessageEl.style.display = 'none';
    scoreDisplayEl.style.display = 'block';
    startGameBtn.style.display = 'none'; // Hide start button
    updateScoreDisplay();
}

function updateGame() {
    if (isGameOver || !isGameRunning) return;

    updatePlane();
    updateBalls();
    handleBallSplitting();

    if (checkCollisions()) {
        gameOver();
        return;
    }

    // Update score based on time survived
    const elapsedTime = (Date.now() - gameStartTime) / 1000; // in seconds
    score = Math.floor(elapsedTime * GAME_CONFIG.SCORE_MULTIPLIER);
    updateScoreDisplay();
}

function drawGame(ctx) {
    if (!isGameRunning && !isGameOver) { // Before game starts
        ctx.font = "20px 'Inter', sans-serif";
        ctx.fillStyle = "#334155"; // slate-700
        ctx.textAlign = "center";
        ctx.fillText("Press 'Start Game' to begin!", currentCanvas.width / 2, currentCanvas.height / 2);
        return;
    }

    drawPlane(ctx);
    balls.forEach(ball => ball.draw(ctx));
    // Score is drawn via HTML overlay
}

function updateScoreDisplay() {
    scoreDisplayEl.textContent = `Score: ${score}`;
}

function gameOver() {
    isGameOver = true;
    isGameRunning = false;
    stopAnimation(); // Stop the canvasManager's animation loop
    gameOverMessageEl.style.display = 'flex'; // Show game over message
    console.log("Game Over! Score:", score);
}

function handlePostResize(canvas, ctx) {
    // If game is running, might need to adjust plane position or re-evaluate ball positions
    if (isGameRunning || isGameOver) {
        initPlane(); // Re-center plane, or adjust based on new size
        // Balls will adjust via their own update logic and canvas bounds
    }
}

// --- Event Listeners ---
window.addEventListener('keydown', (e) => {
    keysPressed[e.key] = true;
    // Prevent page scroll for arrow keys
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }
});
window.addEventListener('keyup', (e) => {
    keysPressed[e.key] = false;
});

startGameBtn.addEventListener('click', () => {
    if (!isGameRunning) {
        initGame();
        startAnimation(); // Start the canvasManager's animation loop
    }
});

restartGameBtn.addEventListener('click', () => {
    gameOverMessageEl.style.display = 'none';
    initGame();
    startAnimation();
});


// --- Initial Load ---
window.onload = () => {
    const canvasSetupResult = setupCanvas('gameCanvas', updateGame, drawGame, handlePostResize);
    if (!canvasSetupResult || !canvasSetupResult.canvas) {
        console.error("setupCanvas failed. Aborting game init.");
        return;
    }
    currentCanvas = canvasSetupResult.canvas;
    currentCtx = canvasSetupResult.ctx;
    // Don't start game immediately, wait for button click
    // Draw initial "Press Start" message
    if (currentCtx) {
        currentCtx.clearRect(0,0, currentCanvas.width, currentCanvas.height);
        currentCtx.font = "20px 'Inter', sans-serif";
        currentCtx.fillStyle = "#334155"; // slate-700
        currentCtx.textAlign = "center";
        currentCtx.fillText("Press 'Start Game' to begin!", currentCanvas.width / 2, currentCanvas.height / 2);
    }
}; 