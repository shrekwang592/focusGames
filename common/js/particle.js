import { getRandom, distance } from './utils.js'; // Relative to particle.js (i.e., utils.js is in the same common/js/ folder)

// --- Configuration (can be overridden by game-specific configs) ---
const DEFAULT_PARTICLE_RADIUS = 5;
const DEFAULT_PARTICLE_COLOR = '#3b82f6';
const DEFAULT_PARTICLE_SLOW_COLOR = '#60a5fa';
const DEFAULT_NORMAL_SPEED_MIN = 0.5;
const DEFAULT_NORMAL_SPEED_MAX = 1.5;
const DEFAULT_SLOWED_SPEED_FACTOR = 0.1;

export class Particle {
    constructor(x, y, radius = DEFAULT_PARTICLE_RADIUS, color = DEFAULT_PARTICLE_COLOR, config = {}) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;

        const speedMin = config.NORMAL_SPEED_MIN || DEFAULT_NORMAL_SPEED_MIN;
        const speedMax = config.NORMAL_SPEED_MAX || DEFAULT_NORMAL_SPEED_MAX;
        this.slowedSpeedFactor = config.SLOWED_SPEED_FACTOR || DEFAULT_SLOWED_SPEED_FACTOR;
        this.slowColor = config.PARTICLE_SLOW_COLOR || DEFAULT_PARTICLE_SLOW_COLOR;


        this.originalSpeedX = getRandom(speedMin, speedMax) * (Math.random() < 0.5 ? 1 : -1);
        this.originalSpeedY = getRandom(speedMin, speedMax) * (Math.random() < 0.5 ? 1 : -1);
        this.vx = this.originalSpeedX;
        this.vy = this.originalSpeedY;
        this.isSlowed = false;
    }

    draw(ctx) { // Pass context
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isSlowed ? this.slowColor : this.color;
        ctx.fill();
        ctx.closePath();
    }

    // Basic update - game-specific logic might extend or override this
    update(canvasWidth, canvasHeight, stillRootEffect = null) {
        // Example: Check for Still-Root effect (if stillRootEffect is provided)
        if (stillRootEffect && stillRootEffect.isActive) {
            const distToEffectCenter = distance(this.x, this.y, stillRootEffect.x, stillRootEffect.y);
            if (distToEffectCenter < stillRootEffect.radius + this.radius) {
                if (!this.isSlowed) {
                    this.vx *= this.slowedSpeedFactor;
                    this.vy *= this.slowedSpeedFactor;
                    this.isSlowed = true;
                }
            } else {
                if (this.isSlowed) {
                    this.vx = this.originalSpeedX;
                    this.vy = this.originalSpeedY;
                    this.isSlowed = false;
                }
            }
        } else if (this.isSlowed) { // Ensure it speeds up if effect becomes inactive
             this.vx = this.originalSpeedX;
             this.vy = this.originalSpeedY;
             this.isSlowed = false;
        }


        this.x += this.vx;
        this.y += this.vy;

        if (this.x - this.radius < 0 || this.x + this.radius > canvasWidth) {
            this.vx *= -1;
            this.x = Math.max(this.radius, Math.min(this.x, canvasWidth - this.radius));
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvasHeight) {
            this.vy *= -1;
            this.y = Math.max(this.radius, Math.min(this.y, canvasHeight - this.radius));
        }
    }
} 