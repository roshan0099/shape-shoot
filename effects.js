// Canvas-based visual effects
let effectsCanvas, effectsCtx;
let activeEffects = [];
let effectsLastFrameTime = 0;
let effectsAnimationId = null;

// Initialize effects canvas
function initEffects() {
    console.log("Initializing effects...");
    
    // Create canvas element
    effectsCanvas = document.createElement('canvas');
    effectsCanvas.className = 'effects-canvas';
    effectsCanvas.style.position = 'absolute';
    effectsCanvas.style.top = '0';
    effectsCanvas.style.left = '0';
    effectsCanvas.style.width = '100%';
    effectsCanvas.style.height = '100%';
    effectsCanvas.style.pointerEvents = 'none';
    effectsCanvas.style.zIndex = '10';
    
    // Add to game area
    document.getElementById('game-area').appendChild(effectsCanvas);
    
    // Get context and set size
    effectsCtx = effectsCanvas.getContext('2d');
    resizeEffectsCanvas();
    
    // Add resize listener
    window.addEventListener('resize', resizeEffectsCanvas);
    
    // Start animation loop
    effectsLastFrameTime = performance.now();
    effectsAnimationId = requestAnimationFrame(renderEffects);
    
    console.log("Effects initialized with canvas dimensions:", effectsCanvas.width, effectsCanvas.height);
}

// Resize effects canvas
function resizeEffectsCanvas() {
    if (!effectsCanvas) return;
    
    const gameArea = document.getElementById('game-area');
    const rect = gameArea.getBoundingClientRect();
    
    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    effectsCanvas.width = rect.width * dpr;
    effectsCanvas.height = rect.height * dpr;
    effectsCtx.scale(dpr, dpr);
    effectsCanvas.style.width = `${rect.width}px`;
    effectsCanvas.style.height = `${rect.height}px`;
}

// Main render loop for effects
function renderEffects(timestamp) {
    if (!effectsCtx || !effectsCanvas) return;
    
    // Calculate delta time for smooth animations
    const currentTime = timestamp || performance.now();
    const deltaTime = currentTime - effectsLastFrameTime;
    effectsLastFrameTime = currentTime;
    
    // Clear canvas
    effectsCtx.clearRect(0, 0, effectsCanvas.width, effectsCanvas.height);
    
    // Update and render all active effects
    for (let i = activeEffects.length - 1; i >= 0; i--) {
        const effect = activeEffects[i];
        
        // Update effect
        effect.update(deltaTime);
        
        // Render effect
        effect.render(effectsCtx);
        
        // Remove completed effects
        if (effect.isDone) {
            activeEffects.splice(i, 1);
        }
    }
    
    // Continue animation loop
    effectsAnimationId = requestAnimationFrame(renderEffects);
}

// Create explosion effect
function createCanvasExplosion(x, y, color) {
    // Create particles - more particles for bigger explosion
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 30 : 60; // Increased particle count
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 5; // Increased speed
        const size = 4 + Math.random() * 8; // Increased size
        const life = 40 + Math.random() * 40; // Increased life
        
        // Create particle with random color from palette
        const particleColor = color || getRandomColor();
        
        activeEffects.push(new Particle(x, y, angle, speed, size, particleColor, life));
    }
    
    // Create shockwave - bigger
    activeEffects.push(new Shockwave(x, y, color || '#ffffff', 1.8)); // Increased size
    
    // Create flash - bigger
    activeEffects.push(new Flash(x, y, 1.8)); // Increased size
    
    // Create light rays
    activeEffects.push(new LightRays(x, y, color || '#ffffff'));
}

// Create lightning effect for higher combos
function createCanvasLightning(x, y, color) {
    // Create lightning bolts
    const boltCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < boltCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const length = 80 + Math.random() * 120;
        
        activeEffects.push(new LightningBolt(x, y, angle, length, color));
    }
    
    // Create flash
    activeEffects.push(new Flash(x, y, 1.2));
}

// Create miss text effect
function createCanvasMissText(x, y) {
    activeEffects.push(new TextEffect(x, y, 'MISS!', '#ff6b6b', 32)); // Increased size
}

// Create combo text effect
function createComboText(x, y, text, color) {
    // Create a special combo text effect with animation
    const fontSize = Math.min(36 + (parseInt(text) * 2), 72); // Size increases with combo
    activeEffects.push(new ComboTextEffect(x, y - 30, text, color, fontSize));
    
    // Add some particles around the text for emphasis
    const particleCount = Math.min(parseInt(text) * 3, 20);
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        const size = 3 + Math.random() * 4;
        const life = 20 + Math.random() * 20;
        activeEffects.push(new Particle(x, y, angle, speed, size, color, life));
    }
}

// Create checkpoint explosion
function createCheckpointExplosion(x, y) {
    // Create a single wave of particles - simplified
    const particleCount = 40;
    const colors = ['#ff6b6b', '#feca57', '#54a0ff', '#1dd1a1', '#ff9ff3'];
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const speed = 5 + Math.random() * 5;
        const size = 6 + Math.random() * 10;
        const life = 40 + Math.random() * 30;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        activeEffects.push(new Particle(x, y, angle, speed, size, color, life));
    }
    
    // Create shockwave
    activeEffects.push(new Shockwave(x, y, '#ffffff', 3));
    
    // Create flash
    activeEffects.push(new Flash(x, y, 2));
    
    // Create a few lightning bolts
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const length = 100 + Math.random() * 50;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        activeEffects.push(new LightningBolt(x, y, angle, length, color));
    }
}

// Particle class
class Particle {
    constructor(x, y, angle, speed, size, color, life) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.size = size;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.isDone = false;
        this.gravity = 0.1;
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
        this.drag = 0.97;
    }
    
    update(deltaTime) {
        // Normalize speed based on frame rate
        const speedFactor = deltaTime / 16.67; // 60 FPS as baseline
        
        // Apply gravity and drag
        this.velocityX *= this.drag;
        this.velocityY *= this.drag;
        this.velocityY += this.gravity * speedFactor;
        
        // Update position
        this.x += this.velocityX * speedFactor;
        this.y += this.velocityY * speedFactor;
        
        // Decrease life
        this.life -= speedFactor;
        
        // Mark as done when life is over
        if (this.life <= 0) {
            this.isDone = true;
        }
    }
    
    render(ctx) {
        // Calculate opacity based on remaining life
        const opacity = this.life / this.maxLife;
        
        // Draw particle
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        
        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// Shockwave class
class Shockwave {
    constructor(x, y, color, intensity = 1) {
        this.x = x;
        this.y = y;
        this.radius = 1;
        this.maxRadius = 150 * intensity; // Increased max radius
        this.color = color;
        this.isDone = false;
        this.growSpeed = 6 * intensity; // Increased speed
        this.opacity = 1;
    }
    
    update(deltaTime) {
        // Normalize speed based on frame rate
        const speedFactor = deltaTime / 16.67; // 60 FPS as baseline
        
        // Increase radius
        this.radius += this.growSpeed * speedFactor;
        
        // Decrease opacity as radius increases
        this.opacity = 1 - (this.radius / this.maxRadius);
        
        // Mark as done when max radius is reached
        if (this.radius >= this.maxRadius) {
            this.isDone = true;
        }
    }
    
    render(ctx) {
        // Draw shockwave ring
        ctx.globalAlpha = this.opacity;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5; // Increased line width
        
        // Add glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// Flash class
class Flash {
    constructor(x, y, intensity = 1) {
        this.x = x;
        this.y = y;
        this.radius = 1;
        this.maxRadius = 100 * intensity; // Increased max radius
        this.isDone = false;
        this.growSpeed = 12 * intensity; // Increased speed
        this.opacity = 1;
    }
    
    update(deltaTime) {
        // Normalize speed based on frame rate
        const speedFactor = deltaTime / 16.67; // 60 FPS as baseline
        
        // Increase radius
        this.radius += this.growSpeed * speedFactor;
        
        // Decrease opacity faster than shockwave
        this.opacity = 1 - (this.radius / this.maxRadius) * 1.5;
        
        // Mark as done when max radius is reached or opacity is too low
        if (this.radius >= this.maxRadius || this.opacity <= 0) {
            this.isDone = true;
        }
    }
    
    render(ctx) {
        // Draw flash
        ctx.globalAlpha = this.opacity;
        
        // Create radial gradient for more realistic flash
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.7)');
        gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
        
        // Add glow effect
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'rgba(255, 255, 200, 0.8)';
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// Light rays class
class LightRays {
    constructor(x, y, color, intensity = 1) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.intensity = intensity;
        this.life = 60;
        this.maxLife = 60;
        this.isDone = false;
        this.rayCount = 8;
        this.rayLength = 100 * intensity;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = 0.02;
    }
    
    update(deltaTime) {
        // Normalize speed based on frame rate
        const speedFactor = deltaTime / 16.67; // 60 FPS as baseline
        
        // Rotate rays
        this.rotation += this.rotationSpeed * speedFactor;
        
        // Decrease life
        this.life -= speedFactor;
        
        // Mark as done when life is over
        if (this.life <= 0) {
            this.isDone = true;
        }
    }
    
    render(ctx) {
        // Calculate opacity based on remaining life
        const opacity = this.life / this.maxLife;
        
        ctx.globalAlpha = opacity * 0.7;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        
        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        // Draw rays
        for (let i = 0; i < this.rayCount; i++) {
            const angle = this.rotation + (i / this.rayCount) * Math.PI * 2;
            const length = this.rayLength * (0.7 + Math.sin(this.life * 0.1) * 0.3);
            
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(
                this.x + Math.cos(angle) * length,
                this.y + Math.sin(angle) * length
            );
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// Lightning bolt class
class LightningBolt {
    constructor(x, y, angle, length, color) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.length = length;
        this.color = color;
        this.life = 20;
        this.maxLife = 20;
        this.isDone = false;
        this.segments = [];
        this.generateSegments();
    }
    
    generateSegments() {
        const segmentCount = 10;
        const segmentLength = this.length / segmentCount;
        
        let currentX = this.x;
        let currentY = this.y;
        let currentAngle = this.angle;
        
        for (let i = 0; i < segmentCount; i++) {
            // Add some randomness to the angle
            currentAngle += (Math.random() - 0.5) * 1.2;
            
            // Calculate end point
            const endX = currentX + Math.cos(currentAngle) * segmentLength;
            const endY = currentY + Math.sin(currentAngle) * segmentLength;
            
            // Add segment
            this.segments.push({
                x1: currentX,
                y1: currentY,
                x2: endX,
                y2: endY
            });
            
            // Update current position
            currentX = endX;
            currentY = endY;
        }
    }
    
    update(deltaTime) {
        // Normalize speed based on frame rate
        const speedFactor = deltaTime / 16.67; // 60 FPS as baseline
        
        // Decrease life
        this.life -= speedFactor;
        
        // Mark as done when life is over
        if (this.life <= 0) {
            this.isDone = true;
        }
        
        // Occasionally regenerate segments for flickering effect
        if (Math.random() < 0.3) {
            this.generateSegments();
        }
    }
    
    render(ctx) {
        // Calculate opacity based on remaining life
        const opacity = this.life / this.maxLife;
        
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        
        // Add glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        
        // Draw lightning segments
        ctx.beginPath();
        for (const segment of this.segments) {
            ctx.moveTo(segment.x1, segment.y1);
            ctx.lineTo(segment.x2, segment.y2);
        }
        ctx.stroke();
        
        // Draw a thinner, brighter core
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        for (const segment of this.segments) {
            ctx.moveTo(segment.x1, segment.y1);
            ctx.lineTo(segment.x2, segment.y2);
        }
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// Text effect class
class TextEffect {
    constructor(x, y, text, color, size) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size;
        this.life = 60;
        this.maxLife = 60;
        this.isDone = false;
        this.offsetY = 0;
    }
    
    update(deltaTime) {
        // Normalize speed based on frame rate
        const speedFactor = deltaTime / 16.67; // 60 FPS as baseline
        
        // Move text upward
        this.offsetY -= 0.8 * speedFactor; // Increased speed
        
        // Decrease life
        this.life -= speedFactor;
        
        // Mark as done when life is over
        if (this.life <= 0) {
            this.isDone = true;
        }
    }
    
    render(ctx) {
        // Calculate opacity based on remaining life
        const opacity = this.life / this.maxLife;
        
        // Draw text with glow effect
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.fillText(this.text, this.x, this.y + this.offsetY);
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// Combo text effect class - special animated version
class ComboTextEffect {
    constructor(x, y, text, color, size) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.size = size;
        this.life = 60;
        this.maxLife = 60;
        this.isDone = false;
        this.offsetY = 0;
        this.scale = 0.5;
        this.rotation = (Math.random() - 0.5) * 0.2;
    }
    
    update(deltaTime) {
        // Normalize speed based on frame rate
        const speedFactor = deltaTime / 16.67; // 60 FPS as baseline
        
        // Move text upward
        this.offsetY -= 1.2 * speedFactor;
        
        // Scale up quickly then down slowly
        if (this.life > this.maxLife * 0.7) {
            this.scale += 0.05 * speedFactor;
            if (this.scale > 1.2) this.scale = 1.2;
        } else {
            this.scale -= 0.01 * speedFactor;
            if (this.scale < 0.8) this.scale = 0.8;
        }
        
        // Rotate slightly
        this.rotation *= 0.95;
        
        // Decrease life
        this.life -= speedFactor;
        
        // Mark as done when life is over
        if (this.life <= 0) {
            this.isDone = true;
        }
    }
    
    render(ctx) {
        // Calculate opacity based on remaining life
        const opacity = this.life / this.maxLife;
        
        ctx.save();
        
        // Translate to position
        ctx.translate(this.x, this.y + this.offsetY);
        
        // Rotate
        ctx.rotate(this.rotation);
        
        // Scale
        ctx.scale(this.scale, this.scale);
        
        // Draw text with glow effect
        ctx.globalAlpha = opacity;
        ctx.fillStyle = this.color;
        ctx.font = `bold ${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Add glow effect
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        
        // Draw text with outline
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 6;
        ctx.strokeText(this.text, 0, 0);
        ctx.fillText(this.text, 0, 0);
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        
        ctx.restore();
    }
}

// Helper function to get random color
function getRandomColor() {
    const colors = [
        '#ff6b6b', // Red
        '#feca57', // Yellow
        '#ff9ff3', // Pink
        '#54a0ff', // Blue
        '#1dd1a1', // Green
        '#ffffff'  // White
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
}

// Clean up resources
function cleanupEffects() {
    if (effectsAnimationId) {
        cancelAnimationFrame(effectsAnimationId);
        effectsAnimationId = null;
    }
    
    if (effectsCanvas && effectsCanvas.parentNode) {
        effectsCanvas.parentNode.removeChild(effectsCanvas);
    }
    
    effectsCanvas = null;
    effectsCtx = null;
    activeEffects = [];
}

// Export functions for use in other files
window.initEffects = initEffects;
window.cleanupEffects = cleanupEffects;
window.createCanvasExplosion = createCanvasExplosion;
window.createCanvasLightning = createCanvasLightning;
window.createCanvasMissText = createCanvasMissText;
window.createComboText = createComboText;
window.createCheckpointExplosion = createCheckpointExplosion;
