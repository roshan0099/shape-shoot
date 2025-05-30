// Trigger checkpoint explosion when reaching 100, 200, 300, etc.
function triggerCheckpointExplosion(checkpoint) {
    console.log("Checkpoint reached:", checkpoint);
    
    // Pause the game briefly
    const wasGameRunning = gameRunning;
    gameRunning = false;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.classList.add('checkpoint-overlay');
    gameArea.appendChild(overlay);
    
    // Create checkpoint text
    const checkpointText = document.createElement('div');
    checkpointText.classList.add('checkpoint-text');
    checkpointText.textContent = checkpoint;
    overlay.appendChild(checkpointText);
    
    // Create mega explosion effect
    const megaExplosion = document.createElement('div');
    megaExplosion.classList.add('mega-explosion');
    gameArea.appendChild(megaExplosion);
    
    // Create multiple explosion rings
    for (let i = 0; i < 3; i++) {
        const ring = document.createElement('div');
        ring.classList.add('mega-explosion-ring');
        ring.style.animationDelay = `${i * 0.2}s`;
        megaExplosion.appendChild(ring);
    }
    
    // Explode all shapes on screen
    const allShapes = [...clickableElements]; // Create a copy to avoid modification issues
    
    // Explode shapes with a slight delay between each
    allShapes.forEach((shape, index) => {
        setTimeout(() => {
            if (gameArea.contains(shape)) {
                // Get shape position
                const rect = shape.getBoundingClientRect();
                const gameAreaRect = gameArea.getBoundingClientRect();
                const x = rect.left + rect.width / 2 - gameAreaRect.left;
                const y = rect.top + rect.height / 2 - gameAreaRect.top;
                
                // Only explode non-dangerous shapes
                if (!shape.classList.contains('dangerous')) {
                    // Create explosion effect
                    createBurstEffect(shape, x, y);
                    
                    // Remove from clickable elements
                    const index = clickableElements.indexOf(shape);
                    if (index > -1) {
                        clickableElements.splice(index, 1);
                    }
                    
                    // Remove shape
                    cancelAnimationFrame(shape.animationId);
                    shape.remove();
                }
            }
        }, index * 100); // Stagger explosions for visual effect
    });
    
    // Play explosion sound
    playExplosionSound();
    
    // Remove overlay and resume game after animation
    setTimeout(() => {
        if (gameArea.contains(overlay)) {
            overlay.remove();
        }
        if (gameArea.contains(megaExplosion)) {
            megaExplosion.remove();
        }
        gameRunning = wasGameRunning;
    }, 1500);
}
