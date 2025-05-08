import { setupCanvas, startAnimation, getCanvasContext } from '../../common/js/canvasManager.js';
import { Particle } from '../../common/js/particle.js';
import { getRandom, distance } from '../../common/js/utils.js';
import { showMessage } from '../../common/js/ui.js';
import { GAME_CONFIG } from './config.js'; // Import game-specific config

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
    const { canvas, ctx } = getCanvasContext();
    currentCanvas = canvas;
    currentCtx = ctx;

    if (!currentCanvas) {
        console.error('[DEBUG] Canvas not found in initGame!');
        return;
    }

    stillRoot.x = currentCanvas.width / 2;
    stillRoot.y = currentCanvas.height / 2;
    resetParticles();
}

function resetParticles() {
    console.log('[DEBUG] resetParticles called');
    const { canvas } = getCanvasContext();
    if (!canvas) {
        console.error('[DEBUG] Canvas not found in resetParticles!');
        particles = [];
        return;
    }
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
    // console.log('[DEBUG] updateGame called'); // This can be very noisy
    const { canvas } = getCanvasContext();
    if (!canvas) return; // Should not happen if initGame worked

    particles.forEach(particle => {
        particle.update(canvas.width, canvas.height, stillRoot);
    });
}

function drawGame(ctx) {
    // console.log('[DEBUG] drawGame called. stillRoot.isActive:', stillRoot.isActive); // Can be noisy
    if (!ctx) {
        console.error('[DEBUG] Context not available in drawGame!');
        return;
    }
    // Draw Still-Root first
    if (stillRoot.isActive) {
        // Draw effect area
        ctx.beginPath();
        ctx.arc(stillRoot.x, stillRoot.y, stillRoot.radius, 0, Math.PI * 2);
        ctx.fillStyle = stillRoot.colorEffect;
        ctx.fill();
        ctx.closePath();

        // Draw plant core
        ctx.beginPath();
        ctx.arc(stillRoot.x, stillRoot.y, stillRoot.plantRadius, 0, Math.PI * 2);
        ctx.fillStyle = stillRoot.colorPlant;
        ctx.fill();
        ctx.strokeStyle = stillRoot.colorPlantBorder;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    // Update and draw particles
    particles.forEach(particle => {
        particle.draw(ctx);
    });
}

function handlePostResize(canvas, ctx) {
    console.log('[DEBUG] handlePostResize called');
    if (!canvas || !ctx) {
        console.error('[DEBUG] Canvas or context not available in handlePostResize');
        return;
    }
    stillRoot.x = canvas.width / 2;
    stillRoot.y = canvas.height / 2;
    resetParticles();
}

// --- Event Listeners ---
if (toggleStillRootBtn) { // Make sure the button exists before adding listener
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
window.onload = () => {
    console.log('[DEBUG] window.onload triggered.');
    const canvasSetupResult = setupCanvas('gameCanvas', updateGame, drawGame, handlePostResize);
    if (!canvasSetupResult || !canvasSetupResult.canvas) {
        console.error("[DEBUG] setupCanvas failed or didn't return a canvas. Aborting init.");
        return;
    }
    console.log('[DEBUG] Canvas setup complete.');
    initGame();
    console.log('[DEBUG] Game initialized. Starting animation.');
    startAnimation();
}; 