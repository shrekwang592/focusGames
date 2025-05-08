let canvas, ctx;
let animationFrameId = null;
let gameUpdateCallback = null; // Function to be called each frame by the specific game
let gameDrawCallback = null;   // Function to be called each frame for drawing by the specific game
let gamePostResizeCallback = null; // Function to be called after canvas resize

function gameLoop() {
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameUpdateCallback) {
        gameUpdateCallback();
    }
    if (gameDrawCallback) {
        gameDrawCallback(ctx); // Pass context for drawing
    }

    animationFrameId = requestAnimationFrame(gameLoop);
}

export function setupCanvas(canvasId, updateCb, drawCb, postResizeCb) {
    canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with ID "${canvasId}" not found.`);
        return null;
    }
    ctx = canvas.getContext('2d');
    gameUpdateCallback = updateCb;
    gameDrawCallback = drawCb;
    gamePostResizeCallback = postResizeCb;

    resizeCanvas(); // Initial size
    window.addEventListener('resize', () => {
        resizeCanvas();
        if (gamePostResizeCallback) {
            gamePostResizeCallback(canvas, ctx);
        }
    });
    return { canvas, ctx };
}

export function startAnimation() {
    if (!animationFrameId && gameUpdateCallback && gameDrawCallback) {
        gameLoop();
    }
}

export function stopAnimation() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

export function resizeCanvas() {
    if (!canvas) return;
    const container = canvas.parentElement;
    let newWidth = container.clientWidth - (parseInt(getComputedStyle(container).paddingLeft) + parseInt(getComputedStyle(container).paddingRight));
    let newHeight = newWidth * (3/4);
    const maxCanvasHeight = window.innerHeight * 0.6;
    if (newHeight > maxCanvasHeight) {
        newHeight = maxCanvasHeight;
        newWidth = newHeight * (4/3);
    }
    canvas.width = newWidth;
    canvas.height = newHeight;
}

export function getCanvasContext() {
    return { canvas, ctx };
} 