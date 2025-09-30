// State tracking
let violationCount = 0;
let mouseInside = true;
let isFullscreen = false;

// Helper function to get timestamp
function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false });
}

// Logging function
function addLog(message, type = 'info') {
    const logDisplay = document.getElementById('log-display');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.innerHTML = `<span class="timestamp">[${getTimestamp()}]</span>${message}`;
    
    logDisplay.appendChild(logEntry);
    logDisplay.scrollTop = logDisplay.scrollHeight;
}

// Update status card
function updateStatus(elementId, text, isGood) {
    const statusElement = document.getElementById(elementId);
    const indicatorElement = document.getElementById(elementId.replace('-status', '-indicator'));
    
    statusElement.textContent = text;
    
    if (isGood === null) {
        indicatorElement.textContent = '-';
        indicatorElement.className = 'status-indicator';
    } else if (isGood) {
        indicatorElement.textContent = '✓';
        indicatorElement.className = 'status-indicator check';
    } else {
        indicatorElement.textContent = '✗';
        indicatorElement.className = 'status-indicator cross';
    }
}

// Update violation count
function incrementViolation() {
    violationCount++;
    document.getElementById('violation-count').textContent = violationCount;
    const violationIndicator = document.getElementById('violation-indicator');
    
    if (violationCount > 0) {
        violationIndicator.textContent = '✗';
        violationIndicator.className = 'status-indicator cross';
    }
}

// Clear logs
function clearLogs() {
    document.getElementById('log-display').innerHTML = '';
    addLog('Logs cleared', 'info');
}

// Enter fullscreen
function enterFullscreen() {
    document.documentElement.requestFullscreen().catch(err => {
        addLog(`Failed to enter fullscreen: ${err.message}`, 'error');
    });
}

// ============ FOCUS DETECTION ============
window.addEventListener('focus', () => {
    updateStatus('focus-status', 'Active', true);
    addLog('Window gained focus', 'success');
});

window.addEventListener('blur', () => {
    updateStatus('focus-status', 'Lost Focus', false);
    addLog('⚠️ VIOLATION: Window lost focus!', 'error');
    incrementViolation();
});

// ============ VISIBILITY DETECTION ============
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        updateStatus('visibility-status', 'Hidden', false);
        addLog('⚠️ VIOLATION: Tab is hidden!', 'error');
        incrementViolation();
    } else {
        updateStatus('visibility-status', 'Visible', true);
        addLog('Tab is visible again', 'success');
    }
});

// ============ FULLSCREEN DETECTION ============
document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
        isFullscreen = true;
        updateStatus('fullscreen-status', 'Active', true);
        addLog('Entered fullscreen mode', 'success');
    } else {
        isFullscreen = false;
        updateStatus('fullscreen-status', 'Not Active', false);
        addLog('⚠️ VIOLATION: Exited fullscreen!', 'warning');
        incrementViolation();
    }
});

document.addEventListener('fullscreenerror', () => {
    addLog('Fullscreen request failed', 'error');
});

// ============ MOUSE DETECTION ============
document.addEventListener('mouseenter', () => {
    mouseInside = true;
    updateStatus('mouse-status', 'Inside Window', true);
    addLog('Mouse entered window', 'info');
});

document.addEventListener('mouseleave', () => {
    mouseInside = false;
    updateStatus('mouse-status', 'Outside Window', false);
    addLog('⚠️ VIOLATION: Mouse left window!', 'warning');
    incrementViolation();
});

// Track mouse movement
document.addEventListener('mousemove', (e) => {
    // Silent tracking - only log if needed for debugging
});

// ============ KEYBOARD DETECTION ============
document.addEventListener('keydown', (e) => {
    // Detect suspicious key combinations
    if (e.altKey && e.key === 'Tab') {
        addLog('⚠️ VIOLATION: Alt+Tab detected!', 'error');
        incrementViolation();
    }
    if (e.metaKey && e.key === 'Tab') {
        addLog('⚠️ VIOLATION: Cmd/Win+Tab detected!', 'error');
        incrementViolation();
    }
    if (e.ctrlKey && e.key === 'Escape') {
        addLog('⚠️ VIOLATION: Ctrl+Esc detected!', 'error');
        incrementViolation();
    }
    if (e.key === 'F11') {
        addLog('F11 key pressed (fullscreen toggle)', 'warning');
    }
});

// ============ CONTEXT MENU DETECTION ============
document.addEventListener('contextmenu', (e) => {
    addLog('⚠️ Right-click detected', 'warning');
    // Uncomment to prevent right-click
    // e.preventDefault();
});

// ============ COPY/PASTE DETECTION ============
document.addEventListener('copy', () => {
    addLog('⚠️ Copy action detected', 'warning');
    incrementViolation();
});

document.addEventListener('paste', () => {
    addLog('⚠️ Paste action detected', 'warning');
    incrementViolation();
});

document.addEventListener('cut', () => {
    addLog('⚠️ Cut action detected', 'warning');
    incrementViolation();
});

// ============ PAGE NAVIGATION DETECTION ============
window.addEventListener('beforeunload', (e) => {
    addLog('⚠️ VIOLATION: Attempting to leave page!', 'error');
    incrementViolation();
});

window.addEventListener('pagehide', () => {
    addLog('Page hidden', 'warning');
});

window.addEventListener('pageshow', () => {
    addLog('Page shown', 'info');
});

// ============ MULTIPLE MONITOR DETECTION ============
async function checkMultipleMonitors() {
    try {
        // Check if screen.isExtended is available
        if ('isExtended' in screen) {
            const isExtended = await screen.isExtended;
            if (isExtended) {
                updateStatus('monitor-status', 'Multiple Detected', false);
                addLog('⚠️ WARNING: Multiple monitors detected!', 'warning');
            } else {
                updateStatus('monitor-status', 'Single Monitor', true);
                addLog('Single monitor confirmed', 'success');
            }
        } else {
            // Fallback: Check if window can be moved off-screen
            const screenWidth = window.screen.width;
            const screenHeight = window.screen.height;
            const availWidth = window.screen.availWidth;
            const availHeight = window.screen.availHeight;
            
            updateStatus('monitor-status', 'Cannot Detect', null);
            addLog(`Screen info: ${screenWidth}x${screenHeight} (Available: ${availWidth}x${availHeight})`, 'info');
        }
    } catch (error) {
        updateStatus('monitor-status', 'Check Failed', null);
        addLog(`Monitor detection error: ${error.message}`, 'warning');
    }
}

// ============ WINDOW RESIZE DETECTION ============
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    addLog(`Window resized: ${width}x${height}`, 'info');
    
    // Check if not maximized
    if (!isFullscreen && (width < screen.availWidth || height < screen.availHeight)) {
        addLog('⚠️ WARNING: Window not maximized!', 'warning');
    }
});

// ============ USER ACTIVATION TRACKING ============
setInterval(() => {
    if (!navigator.userActivation.isActive && document.hasFocus()) {
        // User hasn't interacted recently while focused - possible idle or automation
        // Uncomment for debugging
        // addLog('User inactive while focused', 'info');
    }
}, 30000); // Check every 30 seconds

// ============ CONTINUOUS MONITORING ============
setInterval(() => {
    // Check focus status
    const hasFocus = document.hasFocus();
    if (!hasFocus) {
        updateStatus('focus-status', 'Lost Focus', false);
    }
    
    // Check visibility
    if (document.hidden) {
        updateStatus('visibility-status', 'Hidden', false);
    }
    
    // Check fullscreen
    if (!document.fullscreenElement) {
        updateStatus('fullscreen-status', 'Not Active', false);
    }
    
    // Check mouse position
    if (!mouseInside) {
        updateStatus('mouse-status', 'Outside Window', false);
    }
}, 1000); // Check every second

// ============ INITIALIZATION ============
window.addEventListener('load', () => {
    addLog('=== Proctoring System Initialized ===', 'success');
    addLog('Monitoring started...', 'info');
    
    // Initial checks
    checkMultipleMonitors();
    
    // Check initial focus
    if (document.hasFocus()) {
        updateStatus('focus-status', 'Active', true);
    } else {
        updateStatus('focus-status', 'Lost Focus', false);
    }
    
    // Check initial visibility
    if (!document.hidden) {
        updateStatus('visibility-status', 'Visible', true);
    }
    
    addLog(`Screen resolution: ${screen.width}x${screen.height}`, 'info');
    addLog(`Window size: ${window.innerWidth}x${window.innerHeight}`, 'info');
});
