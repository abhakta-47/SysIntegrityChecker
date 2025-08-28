// --- DOM Elements ---
const startBtn = document.getElementById('start-check-btn');
const startContainer = document.getElementById('start-container');
const reportContainer = document.getElementById('report-container');

// --- State Tracking for Browser Environment ---
let focusLossCount = 0;
let copyCount = 0;
let cutCount = 0;
let pasteCount = 0;

// --- Helper Functions ---

/**
 * A simple async hashing function to generate SHA-256 hashes for fingerprinting.
 * @param {string} message - The string to hash.
 * @returns {Promise<string>} The hex-encoded SHA-256 hash.
 */
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}


// --- Definitions for all checks ---
const ALL_CHECKS = [
    // --- Virtualization & Emulation Section ---
    { tableId: 'virtualization-report', checkName: 'WebGL Renderer', checkId: 'webgl-renderer', checkFunction: checkWebGL },
    { tableId: 'virtualization-report', checkName: 'Automation Flags', checkId: 'automation-flags', checkFunction: checkAutomationFlags },
    { tableId: 'virtualization-report', checkName: 'Hardware Concurrency', checkId: 'hardware-concurrency', checkFunction: checkHardwareConcurrency },
    { tableId: 'virtualization-report', checkName: 'Estimated System RAM', checkId: 'cpu-ram', checkFunction: checkRAM },
    { tableId: 'virtualization-report', checkName: 'Battery Status', checkId: 'battery-status', checkFunction: checkBattery },
    { tableId: 'virtualization-report', checkName: 'Device Sensors (Motion/Orientation)', checkId: 'device-sensors', checkFunction: checkDeviceSensors },


    // --- Hardware Profile Section ---
    { tableId: 'hardware-report', checkName: 'Display Setup', checkId: 'display-setup', checkFunction: checkDisplay },
    { tableId: 'hardware-report', checkName: 'Connected Cameras', checkId: 'connected-cameras', checkFunction: checkMediaDevices },
    { tableId: 'hardware-report', checkName: 'Connected Microphones', checkId: 'connected-mics', checkFunction: checkMediaDevices },
    { tableId: 'hardware-report', checkName: 'Screen Properties', checkId: 'screen-properties', checkFunction: checkScreenProperties },

    // --- Browser Integrity Section ---
    { tableId: 'browser-report', checkName: 'Developer Tools', checkId: 'dev-tools', checkFunction: checkDevTools },
    { tableId: 'browser-report', checkName: 'Window Focus', checkId: 'window-focus', checkFunction: checkWindowFocus },
    { tableId: 'browser-report', checkName: 'Clipboard Activity', checkId: 'clipboard-activity', checkFunction: checkClipboard },

    // --- Network & Anonymity Section ---
    { tableId: 'network-report', checkName: 'VPN / Proxy Detection', checkId: 'vpn-proxy', checkFunction: checkVPNProxy },
    { tableId: 'network-report', checkName: 'Network Information', checkId: 'network-info', checkFunction: checkNetworkInfo },

    // --- Fingerprinting Section ---
    { tableId: 'fingerprint-report', checkName: 'Canvas Fingerprint', checkId: 'canvas-fingerprint', checkFunction: checkCanvasFingerprint },
    { tableId: 'fingerprint-report', checkName: 'Audio Fingerprint', checkId: 'audio-fingerprint', checkFunction: checkAudioFingerprint },

];


// --- UI Update Functions ---

/**
 * Creates and inserts a placeholder row with a "Pending" status.
 * @param {string} tableId - The ID of the tbody element.
 * @param {string} checkName - The name of the check being performed.
 * @param {string} checkId - A unique ID for the table row to be created.
 */
function createPendingRow(tableId, checkName, checkId) {
    const tableBody = document.getElementById(tableId);
    if (!tableBody || document.getElementById(checkId)) return;
    const row = document.createElement('tr');
    row.id = checkId;
    row.innerHTML = `
        <td class="p-3 font-medium text-white">${checkName}</td>
        <td class="p-3">
            <div class="flex items-center">
                <div class="status-icon status-pending"></div>
                <span class="text-yellow-400 font-semibold">Pending</span>
            </div>
        </td>
        <td class="p-3 text-gray-500 table-cell-data">Awaiting data...</td>
    `;
    tableBody.appendChild(row);
}

/**
 * Updates a specific row in the report with the final status and data.
 * @param {string} checkId - The unique ID of the table row to update.
 * @param {string} status - The result status ('pass' or 'flagged').
 * @param {string} data - The collected data to display.
 */
function updateRow(checkId, status, data) {
    const row = document.getElementById(checkId);
    if (!row) return;

    const statusHtml = status === 'pass'
        ? `<div class="flex items-center"><div class="status-icon status-pass"></div><span class="text-green-400 font-semibold">Clear</span></div>`
        : `<div class="flex items-center"><div class="status-icon status-flagged"></div><span class="text-red-400 font-semibold">Flagged</span></div>`;

    row.cells[1].innerHTML = statusHtml;
    row.cells[2].textContent = data;
    row.cells[2].classList.remove('text-gray-500');
    row.cells[2].classList.add(status === 'pass' ? 'text-gray-300' : 'text-red-300');
}

// --- Individual Check Functions (Each returns a Promise) ---

function checkWebGL() {
    return new Promise(resolve => {
        let rendererStatus = 'pass', rendererData = 'N/A';
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);

            rendererData = `Vendor: ${vendor}\nRenderer: ${renderer}`;

            const suspiciousKeywords = ['vmware', 'virtualbox', 'swiftshader', 'llvmpipe', 'parallels', 'mesa'];
            if (suspiciousKeywords.some(keyword => renderer.toLowerCase().includes(keyword))) {
                rendererStatus = 'flagged';
            }
        } catch (e) {
            rendererData = 'Could not retrieve WebGL renderer info.';
            rendererStatus = 'flagged';
        }
        resolve({ status: rendererStatus, data: rendererData });
    });
}

function checkAutomationFlags() {
    return new Promise(resolve => {
        let status = 'pass';
        let data = 'No automation flags detected.';
        if (navigator.webdriver) {
            status = 'flagged';
            data = 'navigator.webdriver flag is TRUE. Browser is likely controlled by automation.';
        }
        resolve({ status, data });
    });
}

function checkHardwareConcurrency() {
    return new Promise(resolve => {
        let coreStatus = 'pass';
        const coreCount = navigator.hardwareConcurrency || 0;
        let coreData = `Logical Cores reported: ${coreCount}.`;
        if (coreCount <= 2) {
            coreStatus = 'flagged';
            coreData += ' (Low core count may indicate a VM).';
        }
        resolve({ status: coreStatus, data: coreData });
    });
}

function checkRAM() {
    return new Promise(resolve => {
        let ramStatus = 'pass', ramData = 'N/A';
        if (navigator.deviceMemory) {
            ramData = `Estimated system RAM: ${navigator.deviceMemory} GB.`;
            if (navigator.deviceMemory <= 4) {
                ramStatus = 'flagged';
                ramData += ' (Low RAM may indicate a VM).';
            }
        } else {
            ramData = 'Browser does not support deviceMemory API.';
        }
        resolve({ status: ramStatus, data: ramData });
    });
}

async function checkBattery() {
    let batteryStatus = 'pass', batteryData = 'N/A';
    try {
        if (navigator.getBattery) {
            const battery = await navigator.getBattery();
            batteryData = `Charging: ${battery.charging}\nLevel: ${battery.level * 100}%`;
            // A common VM indicator is a fully charged, non-discharging battery state.
            if (battery.charging && battery.level === 1 && battery.dischargingTime === Infinity) {
                batteryStatus = 'flagged';
                batteryData += '\n(State is consistent with some virtual machines).';
            }
        } else {
            batteryData = 'Battery API not supported (typical for desktops).';
        }
    } catch (e) {
        batteryData = 'Could not access Battery API.';
    }
    return { status: batteryStatus, data: batteryData };
}

async function checkDeviceSensors() {
    let status = 'pass';
    let data = 'Device motion sensors are available.';
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
            const permissionState = await DeviceMotionEvent.requestPermission();
            if (permissionState !== 'granted') {
                status = 'flagged';
                data = 'Permission to access motion sensors was denied.';
            }
        } catch (error) {
            status = 'flagged';
            data = `Error accessing motion sensors: ${error.name}`;
        }
    } else if (!('ondevicemotion' in window)) {
        status = 'flagged';
        data = 'Device does not report motion sensors (may indicate an emulator).';
    }
    return { status, data };
}

async function checkDisplay() {
    let displayStatus = 'pass';
    let displayData = '';

    // Modern API: getScreenDetails()
    if ('getScreenDetails' in window) {
        try {
            const screenDetails = await window.getScreenDetails();
            const screenCount = screenDetails.screens.length;
            displayData = `Detected ${screenCount} screen(s) via Window Management API.\n`;
            displayData += screenDetails.screens.map((s, i) =>
                `[Screen ${i + 1}]: ${s.width}x${s.height} @ (${s.left}, ${s.top})`
            ).join('\n');
            if (screenCount > 1) {
                displayStatus = 'flagged';
            }
        } catch (err) {
            displayData = 'Permission for Window Management API denied. Using fallback.';
            displayStatus = 'flagged';
        }
    } else {
        // Legacy fallback
        const screenCount = window.screen.isExtended ? '2+' : '1';
        displayData = `Detected ${screenCount} screen(s) via legacy properties.\nResolution: ${window.screen.width}x${window.screen.height}`;
        if (window.screen.isExtended) {
            displayStatus = 'flagged';
        }
    }
    return { status: displayStatus, data: displayData };
}

async function checkMediaDevices() {
    let cameraData = 'No cameras found.', cameraStatus = 'pass';
    let micData = 'No microphones found.', micStatus = 'pass';
    try {
        // Request permission
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput');
        const microphones = devices.filter(d => d.kind === 'audioinput');
        const suspiciousKeywords = ['virtual', 'obs', 'droidcam', 'splitcam', 'dummy', 'vcam', 'xsplit'];

        if (cameras.length > 0) {
            cameraData = cameras.map((cam, i) => `[${i + 1}] ${cam.label}`).join('\n');
            if (cameras.some(c => suspiciousKeywords.some(k => c.label.toLowerCase().includes(k)))) {
                cameraStatus = 'flagged';
            }
        }

        if (microphones.length > 0) {
            micData = microphones.map((mic, i) => `[${i + 1}] ${mic.label}`).join('\n');
            if (microphones.some(m => suspiciousKeywords.some(k => m.label.toLowerCase().includes(k)))) {
                micStatus = 'flagged';
            }
        }
        // Stop the tracks to turn off the camera/mic light
        stream.getTracks().forEach(track => track.stop());
    } catch (err) {
        const errorMsg = `Error: ${err.name}. Permission may have been denied.`;
        cameraData = micData = errorMsg;
        cameraStatus = micStatus = 'flagged';
    }
    return {
        'connected-cameras': { status: cameraStatus, data: cameraData },
        'connected-mics': { status: micStatus, data: micData }
    };
}

function checkScreenProperties() {
    return new Promise(resolve => {
        let status = 'pass';
        const { width, height, colorDepth } = window.screen;
        let data = `Resolution: ${width}x${height}, Color Depth: ${colorDepth}-bit`;

        if (width < 800 || height < 600 || colorDepth < 24) {
            status = 'flagged';
            data += ' (Uncommon screen properties may indicate a VM).';
        }
        resolve({ status, data });
    });
}

function checkDevTools() {
    return new Promise(resolve => {
        let devToolsStatus = 'pass';
        let detectionMethod = 'Not Detected';
        const threshold = 100; // ms

        const check = () => {
            const startTime = performance.now();
            // This statement will cause a pause if devtools is open
            // eslint-disable-next-line no-debugger
            debugger;
            const endTime = performance.now();

            if (endTime - startTime > threshold) {
                devToolsStatus = 'flagged';
                detectionMethod = 'Debugger timing check';
            }
            resolve({ status: devToolsStatus, data: `Detection Method: ${detectionMethod}` });
        };

        // Run the check after a short delay to ensure the page is responsive
        setTimeout(check, 500);
    });
}

function checkWindowFocus() {
    return new Promise(resolve => {
        let focusStatus = 'pass';
        if (focusLossCount > 0) focusStatus = 'flagged';
        resolve({ status: focusStatus, data: `Window lost focus ${focusLossCount} time(s).` });
    });
}

function checkClipboard() {
    return new Promise(resolve => {
        let clipboardStatus = 'pass';
        const totalActions = copyCount + cutCount + pasteCount;
        if (totalActions > 5) clipboardStatus = 'flagged';
        const data = `Clipboard Actions: ${copyCount} copies, ${cutCount} cuts, ${pasteCount} pastes.`;
        resolve({ status: clipboardStatus, data });
    });
}

async function checkVPNProxy() {
    let status = 'pass';
    let data = 'No timezone mismatch detected.';
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error('API request failed');

        const ipData = await response.json();
        const ipTimezone = ipData.timezone;
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        data = `Browser Timezone: ${browserTimezone}\nIP-based Timezone: ${ipTimezone}`;

        if (browserTimezone !== ipTimezone) {
            status = 'flagged';
            data += '\n(Mismatch suggests use of a VPN or proxy).';
        }
    } catch (e) {
        status = 'flagged';
        data = `Could not perform IP geolocation check. Error: ${e.message}`;
    }
    return { status, data };
}

function checkNetworkInfo() {
    return new Promise(resolve => {
        let status = 'pass';
        let data = 'Network information not available.';
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
            data = `Effective Type: ${conn.effectiveType}\nDownlink Speed: ${conn.downlink} Mbps\nRound-Trip Time: ${conn.rtt} ms`;
            if (conn.effectiveType === 'slow-2g' || conn.saveData) {
                status = 'flagged';
                data += '\n(Connection is very slow or in data-saving mode).';
            }
        }
        resolve({ status, data });
    });
}

async function checkCanvasFingerprint() {
    let status = 'pass';
    let data = '';
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const txt = 'Browser Integrity Check 🧐';
        ctx.textBaseline = 'top';
        ctx.font = '14px "Arial"';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText(txt, 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText(txt, 4, 17);
        const dataUrl = canvas.toDataURL();
        const hash = await sha256(dataUrl);
        data = `Canvas Hash: ${hash}`;
    } catch (e) {
        status = 'flagged';
        data = 'Could not generate canvas fingerprint.';
    }
    return { status, data };
}

async function checkAudioFingerprint() {
    let status = 'pass';
    let data = '';
    try {
        const audioCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(10000, audioCtx.currentTime);

        const compressor = audioCtx.createDynamicsCompressor();
        // Configure compressor with specific values
        compressor.threshold.setValueAtTime(-50, audioCtx.currentTime);
        compressor.knee.setValueAtTime(40, audioCtx.currentTime);
        compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
        compressor.attack.setValueAtTime(0, audioCtx.currentTime);
        compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

        oscillator.connect(compressor);
        compressor.connect(audioCtx.destination);
        oscillator.start(0);

        const renderedBuffer = await audioCtx.startRendering();
        const bufferData = renderedBuffer.getChannelData(0);
        let fingerprint = 0;
        for (let i = 0; i < bufferData.length; i++) {
            fingerprint += Math.abs(bufferData[i]);
        }

        const hash = await sha256(fingerprint.toString());
        data = `Audio Hash: ${hash}`;

    } catch (e) {
        status = 'flagged';
        data = 'Could not generate audio fingerprint.';
    }
    return { status, data };
}


// --- Main Application Logic ---

/**
 * Sets up the entire UI with "Pending" rows before checks begin.
 */
function initializeReportUI() {
    ALL_CHECKS.forEach(check => {
        // Special handling for the multi-output media check
        if (check.checkId === 'connected-cameras') {
            createPendingRow(check.tableId, 'Connected Cameras', 'connected-cameras');
            createPendingRow(check.tableId, 'Connected Microphones', 'connected-mics');
        } else if (check.checkId !== 'connected-mics') {
            createPendingRow(check.tableId, check.checkName, check.checkId);
        }
    });
}

/**
 * Sets up event listeners to monitor browser behavior.
 */
function setupGlobalListeners() {
    window.addEventListener('blur', () => { focusLossCount++; });
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') focusLossCount++;
    });
    document.addEventListener('copy', () => { copyCount++; });
    document.addEventListener('cut', () => { cutCount++; });
    document.addEventListener('paste', () => { pasteCount++; });
}

/**
 * Orchestrates the entire system check process.
 */
async function runSystemCheck() {
    startBtn.disabled = true;
    startBtn.innerHTML = 'Running Checks...';
    startContainer.classList.add('hidden');
    reportContainer.classList.remove('hidden');

    initializeReportUI();

    const promises = ALL_CHECKS.map(async (check) => {
        try {
            const result = await check.checkFunction();
            // Handle multi-output checks like media devices
            if (check.checkId === 'connected-cameras' || check.checkId === 'connected-mics') {
                if (result['connected-cameras']) {
                    updateRow('connected-cameras', result['connected-cameras'].status, result['connected-cameras'].data);
                }
                if (result['connected-mics']) {
                    updateRow('connected-mics', result['connected-mics'].status, result['connected-mics'].data);
                }
            } else {
                updateRow(check.checkId, result.status, result.data);
            }
        } catch (error) {
            updateRow(check.checkId, 'flagged', 'Error during check.');
            console.error(`Error in check ${check.checkName}:`, error);
        }
    });

    await Promise.all(promises);

    startBtn.textContent = 'Check Complete';
    startBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
    startBtn.classList.add('bg-gray-600');
}

// --- Event Listener ---
startBtn.addEventListener('click', runSystemCheck);

// --- Initial Setup ---
setupGlobalListeners();
