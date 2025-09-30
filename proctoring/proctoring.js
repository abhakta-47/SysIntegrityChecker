// ============ CONFIGURATION ============
const DEFAULT_PROCTORING_CONFIG = {
    // Focus Detection APIs
    focus: {
        name: 'Window Focus',
        statusId: 'focus-status',
        monitors: [
            {
                api: 'window.focus',
                event: 'focus',
                target: 'window',
                handler: () => ({ status: 'Active', isGood: true, message: 'Window gained focus' })
            },
            {
                api: 'window.blur',
                event: 'blur',
                target: 'window',
                isViolation: true,
                handler: () => ({ status: 'Lost Focus', isGood: false, message: 'Window lost focus!' })
            }
        ]
    },

    // Visibility Detection APIs
    visibility: {
        name: 'Tab Visibility',
        statusId: 'visibility-status',
        monitors: [
            {
                api: 'document.visibilitychange',
                event: 'visibilitychange',
                target: 'document',
                isViolation: true,
                handler: () => {
                    if (document.hidden) {
                        return { status: 'Hidden', isGood: false, message: 'Tab is hidden!' };
                    } else {
                        return { status: 'Visible', isGood: true, message: 'Tab is visible again' };
                    }
                }
            }
        ]
    },

    // Fullscreen Detection APIs
    fullscreen: {
        name: 'Fullscreen',
        statusId: 'fullscreen-status',
        monitors: [
            {
                api: 'document.fullscreenchange',
                event: 'fullscreenchange',
                target: 'document',
                isViolation: true,
                handler: () => {
                    if (document.fullscreenElement) {
                        return { status: 'Active', isGood: true, message: 'Entered fullscreen mode' };
                    } else {
                        return { status: 'Not Active', isGood: false, message: 'Exited fullscreen!' };
                    }
                }
            },
            {
                api: 'document.fullscreenerror',
                event: 'fullscreenerror',
                target: 'document',
                handler: () => ({ message: 'Fullscreen request failed', logOnly: true })
            }
        ]
    },

    // Mouse Detection APIs
    mouse: {
        name: 'Mouse Position',
        statusId: 'mouse-status',
        monitors: [
            {
                api: 'document.mouseenter',
                event: 'mouseenter',
                target: 'document',
                handler: () => ({ status: 'Inside Window', isGood: true, message: 'Mouse entered window' })
            },
            {
                api: 'document.mouseleave',
                event: 'mouseleave',
                target: 'document',
                isViolation: true,
                handler: () => ({ status: 'Outside Window', isGood: false, message: 'Mouse left window!' })
            }
        ]
    },

    // Keyboard Detection APIs
    keyboard: {
        name: 'Keyboard Events',
        monitors: [
            {
                api: 'document.keydown',
                event: 'keydown',
                target: 'document',
                isViolation: true,
                handler: (e) => {
                    if (e.altKey && e.key === 'Tab') {
                        return { message: 'Alt+Tab detected!', logOnly: true };
                    }
                    if (e.metaKey && e.key === 'Tab') {
                        return { message: 'Cmd/Win+Tab detected!', logOnly: true };
                    }
                    if (e.ctrlKey && e.key === 'Escape') {
                        return { message: 'Ctrl+Esc detected!', logOnly: true };
                    }
                    if (e.key === 'F11') {
                        return { message: 'F11 key pressed (fullscreen toggle)', logOnly: true, isViolation: false };
                    }
                    return null;
                }
            }
        ]
    },

    // Context Menu Detection
    contextMenu: {
        name: 'Context Menu',
        monitors: [
            {
                api: 'document.contextmenu',
                event: 'contextmenu',
                target: 'document',
                handler: () => ({ message: 'Right-click detected', logOnly: true, isViolation: false })
            }
        ]
    },

    // Clipboard Detection APIs
    clipboard: {
        name: 'Clipboard',
        monitors: [
            {
                api: 'document.copy',
                event: 'copy',
                target: 'document',
                isViolation: true,
                handler: () => ({ message: 'Copy action detected', logOnly: true })
            },
            {
                api: 'document.paste',
                event: 'paste',
                target: 'document',
                isViolation: true,
                handler: () => ({ message: 'Paste action detected', logOnly: true })
            },
            {
                api: 'document.cut',
                event: 'cut',
                target: 'document',
                isViolation: true,
                handler: () => ({ message: 'Cut action detected', logOnly: true })
            }
        ]
    },

    // Page Navigation APIs
    navigation: {
        name: 'Page Navigation',
        monitors: [
            {
                api: 'window.beforeunload',
                event: 'beforeunload',
                target: 'window',
                isViolation: true,
                handler: () => ({ message: 'Attempting to leave page!', logOnly: true })
            },
            {
                api: 'window.pagehide',
                event: 'pagehide',
                target: 'window',
                handler: () => ({ message: 'Page hidden', logOnly: true, isViolation: false })
            },
            {
                api: 'window.pageshow',
                event: 'pageshow',
                target: 'window',
                handler: () => ({ message: 'Page shown', logOnly: true, isViolation: false })
            }
        ]
    },

    // Window Resize API
    resize: {
        name: 'Window Resize',
        monitors: [
            {
                api: 'window.resize',
                event: 'resize',
                target: 'window',
                handler: () => {
                    const width = window.innerWidth;
                    const height = window.innerHeight;
                    const message = `Window resized: ${width}x${height}`;
                    
                    const isFullscreen = document.fullscreenElement !== null;
                    if (!isFullscreen && (width < screen.availWidth || height < screen.availHeight)) {
                        return { message: message + ' (NOT MAXIMIZED)', logOnly: true, isViolation: false };
                    }
                    return { message, logOnly: true, isViolation: false };
                }
            }
        ]
    }
};

// Load configuration (from localStorage or default)
let PROCTORING_CONFIG = DEFAULT_PROCTORING_CONFIG;


// ============ STATE MANAGEMENT ============
let violationCount = 0;
let mouseInside = true;
let isFullscreen = false;

// ============ UTILITY FUNCTIONS ============
function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false });
}

function addLog(message, type = 'info', apiName = null) {
    const logDisplay = document.getElementById('log-display');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    
    const apiTag = apiName ? `<strong>[${apiName}]</strong> ` : '';
    logEntry.innerHTML = `<span class="timestamp">[${getTimestamp()}]</span>${apiTag}${message}`;
    
    logDisplay.appendChild(logEntry);
    logDisplay.scrollTop = logDisplay.scrollHeight;
}

function updateStatus(elementId, text, isGood) {
    const statusElement = document.getElementById(elementId);
    const indicatorElement = document.getElementById(elementId.replace('-status', '-indicator'));
    
    if (!statusElement) return;
    
    statusElement.textContent = text;

    if(indicatorElement.textContent == '✗')
        return;
    
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

function incrementViolation() {
    violationCount++;
    document.getElementById('violation-count').textContent = violationCount;
    const violationIndicator = document.getElementById('violation-indicator');
    
    if (violationCount > 0) {
        violationIndicator.textContent = '✗';
        violationIndicator.className = 'status-indicator cross';
    }
}

function clearLogs() {
    document.getElementById('log-display').innerHTML = '';
    addLog('Logs cleared', 'info');
}

function enterFullscreen() {
    document.documentElement.requestFullscreen().catch(err => {
        addLog(`Failed to enter fullscreen: ${err.message}`, 'error', 'requestFullscreen');
    });
}

// ============ GENERIC EVENT HANDLER WRAPPER ============
function createEventHandler(monitor, categoryConfig) {
    return function(event) {
        const result = monitor.handler(event);
        
        if (!result) return; // Handler returned null (ignore)
        
        // Determine violation status
        const isViolation = result.isViolation !== undefined 
            ? result.isViolation 
            : (monitor.isViolation || false);
        
        // Determine log type
        let logType = 'info';
        if (isViolation) {
            logType = 'error';
        } else if (result.isGood === false) {
            logType = 'warning';
        } else if (result.isGood === true) {
            logType = 'success';
        }
        
        // Add violation prefix if needed
        const prefix = isViolation ? '⚠️ VIOLATION: ' : '';
        const message = prefix + result.message;
        
        // Log the event with API name
        addLog(message, logType, monitor.api);
        
        // Update status if not log-only
        if (!result.logOnly && categoryConfig.statusId) {
            updateStatus(categoryConfig.statusId, result.status, result.isGood);
        }
        
        // Increment violation count
        if (isViolation) {
            incrementViolation();
        }
    };
}

// ============ AUTOMATIC EVENT LISTENER REGISTRATION ============
function initializeMonitoring() {
    Object.entries(PROCTORING_CONFIG).forEach(([categoryKey, categoryConfig]) => {
        categoryConfig.monitors.forEach(monitor => {
            const handler = createEventHandler(monitor, categoryConfig);
            
            // Get the target element
            const target = monitor.target === 'window' ? window : 
                          monitor.target === 'document' ? document : 
                          document;
            
            // Register event listener
            target.addEventListener(monitor.event, handler);
            
            // Log registration
            console.log(`✓ Registered: ${monitor.api} on ${monitor.target}`);
        });
    });
}

// ============ MULTIPLE MONITOR DETECTION ============
async function checkMultipleMonitors() {
    try {
        if ('isExtended' in screen) {
            const isExtended = await screen.isExtended;
            if (isExtended) {
                updateStatus('monitor-status', 'Multiple Detected', false);
                addLog('Multiple monitors detected!', 'warning', 'screen.isExtended');
            } else {
                updateStatus('monitor-status', 'Single Monitor', true);
                addLog('Single monitor confirmed', 'success', 'screen.isExtended');
            }
        } else {
            const screenWidth = window.screen.width;
            const screenHeight = window.screen.height;
            const availWidth = window.screen.availWidth;
            const availHeight = window.screen.availHeight;
            
            updateStatus('monitor-status', 'Cannot Detect', null);
            addLog(`Screen info: ${screenWidth}x${screenHeight} (Available: ${availWidth}x${availHeight})`, 'info', 'screen.width/height');
        }
    } catch (error) {
        updateStatus('monitor-status', 'Check Failed', null);
        addLog(`Monitor detection error: ${error.message}`, 'warning', 'screen.isExtended');
    }
}

// ============ CONTINUOUS MONITORING ============
setInterval(() => {
    // Check focus status using document.hasFocus()
    const hasFocus = document.hasFocus();
    if (!hasFocus && document.getElementById('focus-status').textContent !== 'Lost Focus') {
        updateStatus('focus-status', 'Lost Focus', false);
    }
    
    // Check visibility using document.hidden
    if (document.hidden && document.getElementById('visibility-status').textContent !== 'Hidden') {
        updateStatus('visibility-status', 'Hidden', false);
    }
    
    // Check fullscreen using document.fullscreenElement
    if (!document.fullscreenElement && document.getElementById('fullscreen-status').textContent !== 'Not Active') {
        updateStatus('fullscreen-status', 'Not Active', false);
    }
}, 1000);

// ============ INITIALIZATION ============
window.addEventListener('load', () => {
    addLog('=== Proctoring System Initialized ===', 'success');
    
    // Initialize all monitoring from config
    initializeMonitoring();
    
    addLog('All API listeners registered successfully', 'info');
    addLog('Monitoring started...', 'info');
    
    // Initial checks
    checkMultipleMonitors();
    
    // Check initial focus using document.hasFocus()
    if (document.hasFocus()) {
        updateStatus('focus-status', 'Active', true);
        addLog('Initial focus check: Active', 'info', 'document.hasFocus()');
    } else {
        updateStatus('focus-status', 'Lost Focus', false);
        addLog('Initial focus check: Lost Focus', 'warning', 'document.hasFocus()');
    }
    
    // Check initial visibility using document.hidden
    if (!document.hidden) {
        updateStatus('visibility-status', 'Visible', true);
        addLog('Initial visibility check: Visible', 'info', 'document.hidden');
    }
    
    addLog(`Screen resolution: ${screen.width}x${screen.height}`, 'info', 'screen.width/height');
    addLog(`Window size: ${window.innerWidth}x${window.innerHeight}`, 'info', 'window.innerWidth/Height');
});
