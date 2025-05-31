// Screen shake effect
let shakeIntensity = 0;
let shakeDecay = 0.85; // Slower decay for longer shake
let shakeX = 0;
let shakeY = 0;

// Apply screen shake to game area
function applyScreenShake() {
    if (shakeIntensity > 0.1) {
        // Calculate random shake offset with higher values
        shakeX = (Math.random() - 0.5) * shakeIntensity * 2; // Doubled intensity
        shakeY = (Math.random() - 0.5) * shakeIntensity * 2; // Doubled intensity
        
        // Apply transform to game area
        const gameArea = document.getElementById('game-area');
        gameArea.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
        
        // Apply to game header as well for more visible effect
        const gameHeader = document.querySelector('.game-header');
        if (gameHeader) {
            gameHeader.style.transform = `translate(${shakeX * 0.7}px, ${shakeY * 0.7}px)`;
        }
        
        // Apply to timer bar for more visible effect
        const timerBar = document.getElementById('timer-bar-container');
        if (timerBar) {
            timerBar.style.transform = `translate(${shakeX * 0.5}px, ${shakeY * 0.5}px)`;
        }
        
        // Decay shake intensity
        shakeIntensity *= shakeDecay;
    } else {
        // Reset transform when shake is done
        const gameArea = document.getElementById('game-area');
        gameArea.style.transform = 'translate(0, 0)';
        
        const gameHeader = document.querySelector('.game-header');
        if (gameHeader) {
            gameHeader.style.transform = 'translate(0, 0)';
        }
        
        const timerBar = document.getElementById('timer-bar-container');
        if (timerBar) {
            timerBar.style.transform = 'translate(0, 0)';
        }
        
        shakeIntensity = 0;
    }
}

// Trigger screen shake with given intensity
function triggerScreenShake(intensity = 10) {
    // Increase base intensity
    shakeIntensity = intensity * 1.5;
}

// Export functions for use in other files
window.applyScreenShake = applyScreenShake;
window.triggerScreenShake = triggerScreenShake;
