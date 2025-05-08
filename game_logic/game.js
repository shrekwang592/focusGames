import { setupCanvas, startAnimation, getCanvasContext } from '../common/js/canvasManager.js';
import { Particle } from '../common/js/particle.js';
import { getRandom, distance } from '../common/js/utils.js';
import { showMessage } from '../common/js/ui.js';
import { GAME_CONFIG } from './config.js';

const toggleStillRootBtn = document.getElementById('toggleStillRootBtn');
console.log('[DEBUG] toggleStillRootBtn element:', toggleStillRootBtn); // Check if button is found

let particles = [];
let stillRoot = {
    x: 0,
    y: 0,
    radius: GAME_CONFIG.STILL_ROOT_RADIUS,
    plantRadius: GAME_CONFIG.STILL_ROOT_PLANT_RADIUS,
    isActive: false,
    colorEffect: GAME_CONFIG.STILL_ROOT_COLOR_EFFECT,
    colorPlant: GAME_CONFIG.STILL_ROOT_COLOR_PLANT,
    colorPlantBorder: GAME_CONFIG.STILL_ROOT_PLANT_BORDER_COLOR
};
console.log('[DEBUG] Initial stillRoot state:', JSON.parse(JSON.stringify(stillRoot)));

let currentCanvas, currentCtx;

function initGame() {
    console.log('[DEBUG] initGame called');
    const canvasContext = getCanvasContext(); // Get canvas and context from canvasManager
    if (!canvasContext || !canvasContext.canvas) {
        console.error('[DEBUG] Canvas not found in initGame via getCanvasContext!');
        return;
    }
    currentCanvas = canvasContext.canvas;
    currentCtx = canvasContext.ctx;

    stillRoot.x = currentCanvas.width / 2;
    stillRoot.y = currentCanvas.height / 2;
    resetParticles();
}

function resetParticles() {
    console.log('[DEBUG] resetParticles called');
    const canvasContext = getCanvasContext();
    if (!canvasContext || !canvasContext.canvas) {
        console.error('[DEBUG] Canvas not found in resetParticles via getCanvasContext!');
        particles = [];
        return;
    }
    const canvas = canvasContext.canvas;
    particles = [];
    for (let i = 0; i < GAME_CONFIG.PARTICLE_COUNT; i++) {
        const x = getRandom(GAME_CONFIG.PARTICLE_RADIUS, canvas.width - GAME_CONFIG.PARTICLE_RADIUS);
        const y = getRandom(GAME_CONFIG.PARTICLE_RADIUS, canvas.height - GAME_CONFIG.PARTICLE_RADIUS);
        if (stillRoot.isActive && distance(x, y, stillRoot.x, stillRoot.y) < stillRoot.radius + GAME_CONFIG.PARTICLE_RADIUS) {
            i--;
            continue;
        }
        particles.push(new Particle(x, y, GAME_CONFIG.PARTICLE_RADIUS, GAME_CONFIG.PARTICLE_COLOR, GAME_CONFIG));
    }
    console.log(`[DEBUG] ${particles.length} particles created.`);
}

function updateGame() {
    const canvasContext = getCanvasContext();
    if (!canvasContext || !canvasContext.canvas) return;
    const canvas = canvasContext.canvas;

    particles.forEach(particle => {
        particle.update(canvas.width, canvas.height, stillRoot);
    });
}

function drawGame(ctx) { // ctx is passed by canvasManager
    if (!ctx) {
        console.error('[DEBUG] Context not available in drawGame!');
        return;
    }
    if (stillRoot.isActive) {
        ctx.beginPath();
        ctx.arc(stillRoot.x, stillRoot.y, stillRoot.radius, 0, Math.PI * 2);
        ctx.fillStyle = stillRoot.colorEffect;
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.arc(stillRoot.x, stillRoot.y, stillRoot.plantRadius, 0, Math.PI * 2);
        ctx.fillStyle = stillRoot.colorPlant;
        ctx.fill();
        ctx.strokeStyle = stillRoot.colorPlantBorder;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }
    particles.forEach(particle => {
        particle.draw(ctx);
    });
}

function handlePostResize(canvas, ctx) { // canvas and ctx are passed by canvasManager
    console.log('[DEBUG] handlePostResize called');
    if (!canvas || !ctx) {
        console.error('[DEBUG] Canvas or context not available in handlePostResize');
        return;
    }
    stillRoot.x = canvas.width / 2;
    stillRoot.y = canvas.height / 2;
    resetParticles();
}

if (toggleStillRootBtn) {
    toggleStillRootBtn.addEventListener('click', () => {
        console.log('[DEBUG] Toggle Still-Root button clicked. Current isActive before change:', stillRoot.isActive);
        stillRoot.isActive = !stillRoot.isActive;
        console.log('[DEBUG] New stillRoot.isActive state:', stillRoot.isActive);
        if (stillRoot.isActive) {
            toggleStillRootBtn.textContent = 'Deactivate Still-Root';
            toggleStillRootBtn.classList.add('btn-active');
            showMessage('messageBox', 'Still-Root Activated!', 1500);
            console.log('[DEBUG] Still-Root activated visuals attempted.');
        } else {
            toggleStillRootBtn.textContent = 'Activate Still-Root';
            toggleStillRootBtn.classList.remove('btn-active');
            showMessage('messageBox', 'Still-Root Deactivated!', 1500);
            console.log('[DEBUG] Still-Root deactivated visuals attempted.');
        }
    });
} else {
    console.error('[DEBUG] toggleStillRootBtn was not found. Event listener NOT attached.');
}

// --- Initial Load ---
// For popups, DOM is usually ready immediately, but window.onload is safe.
window.onload = () => {
    console.log('[DEBUG] popup window.onload triggered.');
    const canvasSetupResult = setupCanvas('gameCanvas', updateGame, drawGame, handlePostResize);
    if (!canvasSetupResult || !canvasSetupResult.canvas) {
        console.error("[DEBUG] setupCanvas failed or didn't return a canvas. Aborting init.");
        return;
    }
    console.log('[DEBUG] Canvas setup complete.');
    initGame(); // Initialize game state after canvas is ready
    console.log('[DEBUG] Game initialized. Starting animation.');
    startAnimation();
}; 