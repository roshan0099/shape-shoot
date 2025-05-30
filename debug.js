// Debug function to manually trigger checkpoint explosion
function debugTriggerCheckpoint(checkpointValue) {
    console.log("Manual checkpoint trigger:", checkpointValue);
    triggerCheckpointExplosion(checkpointValue);
}

// Add this line to expose the function globally for debugging
window.debugTriggerCheckpoint = debugTriggerCheckpoint;
