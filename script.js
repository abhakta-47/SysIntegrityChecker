// --- DOM Elements ---
const startBtn = document.getElementById('start-check-btn');
const startContainer = document.getElementById('start-container');
const reportContainer = document.getElementById('report-container');

// --- State Tracking for Browser Environment ---
let focusLossCount = 0;
let pasteCount = 0;

// --- Definitions for all checks ---
const ALL_CHECKS = [
    { tableId: 'virtualization-report', checkName: 'WebGL Renderer', checkId: 'webgl-renderer', checkFunction: checkWebGL },
    // { tableId: 'virtualization-report', checkName: 'CPU Performance', checkId: 'cpu-performance', checkFunction: checkCPUPerformance },
    { tableId: 'virtualization-report', checkName: 'Hardware Concurrency', checkId: 'hardware-concurrency', checkFunction: checkHardwareConcurrency },
    { tableId: 'virtualization-report', checkName: 'Estimated System RAM', checkId: 'cpu-ram', checkFunction: checkRAM },
    { tableId: 'virtualization-report', checkName: 'Battery Status', checkId: 'battery-status', checkFunction: checkBattery },
    { tableId: 'hardware-report', checkName: 'Display Setup', checkId: 'display-setup', checkFunction: checkDisplay },
    { tableId: 'hardware-report', checkName: 'Connected Cameras', checkId: 'connected-cameras', checkFunction: checkMediaDevices },
    { tableId: 'hardware-report', checkName: 'Connected Microphones', checkId: 'connected-mics', checkFunction: checkMediaDevices },
    { tableId: 'browser-report', checkName: 'Developer Tools', checkId: 'dev-tools', checkFunction: checkDevTools },
    { tableId: 'browser-report', checkName: 'Window Focus', checkId: 'window-focus', checkFunction: checkWindowFocus },
    { tableId: 'browser-report', checkName: 'Clipboard Activity', checkId: 'clipboard-activity', checkFunction: checkClipboard },
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
    if (document.getElementById(checkId)) return;
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

            // Dumps all raw WebGL data
            rendererData = `Vendor: ${vendor}\nRenderer: ${renderer}`;

            const suspiciousKeywords = ['vmware', 'virtualbox', 'swiftshader', 'llvmpipe', 'parallels'];
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

function checkCPUPerformance() {
    return new Promise(resolve => {
        setTimeout(() => {
            let perfStatus = 'pass', perfData = '';
            try {
                const startTime = performance.now();
                let result = 0;
                for (let i = 0; i < 200000000; i++) { result += Math.sqrt(i) * Math.sin(i); }
                const endTime = performance.now();
                const executionTime = endTime - startTime;
                perfData = `Benchmark completed in ${executionTime.toFixed(2)} ms.`;
                if (executionTime > 1500) {
                    perfStatus = 'flagged';
                }
            } catch (e) {
                perfStatus = 'flagged';
                perfData = 'Performance benchmark failed to run.';
            }
            resolve({ status: perfStatus, data: perfData });
        }, 0);
    });
}

function checkHardwareConcurrency() {
    return new Promise(resolve => {
        let coreStatus = 'pass';
        const coreCount = navigator.hardwareConcurrency || 0;
        let coreData = `Logical Cores reported: ${coreCount}`;
        if (coreCount <= 2) {
            coreStatus = 'flagged';
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
            batteryData = `Charging: ${battery.charging}\nLevel: ${battery.level * 100}%\nCharging Time: ${battery.chargingTime}s\nDischarging Time: ${battery.dischargingTime}s`;
            if (battery.charging && battery.level === 1) {
                batteryStatus = 'flagged';
            }
        } else {
            batteryData = 'Battery API not supported (typical for desktops).';
        }
    } catch (e) {
        batteryData = 'Could not access Battery API.';
    }
    return { status: batteryStatus, data: batteryData };
}

async function checkDisplay() {
    let displayStatus = 'pass';
    let displayData = `Resolution: ${window.screen.width}x${window.screen.height}\nAvailable Resolution: ${window.screen.availWidth}x${window.screen.availHeight}\nColor Depth: ${window.screen.colorDepth}-bit\nPixel Depth: ${window.screen.pixelDepth}-bit\nExtended Display: ${window.screen.isExtended || false}`;
    if (window.screen.isExtended) {
        displayStatus = 'flagged';
    }
    return { status: displayStatus, data: displayData };
}

async function checkMediaDevices() {
    let cameraData = 'No cameras found.', cameraStatus = 'pass';
    let micData = 'No microphones found.', micStatus = 'pass';
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(d => d.kind === 'videoinput');
        const microphones = devices.filter(d => d.kind === 'audioinput');
        const suspiciousKeywords = ['virtual', 'obs', 'droidcam', 'splitcam', 'dummy', 'vcam'];
        if (cameras.length > 0) {
            cameraData = cameras.map((cam, i) => `[${i + 1}] Label: ${cam.label}\n    ID: ${cam.deviceId}\n    Group ID: ${cam.groupId}`).join('\n\n');
            if (cameras.some(c => suspiciousKeywords.some(k => c.label.toLowerCase().includes(k)))) {
                cameraStatus = 'flagged';
            }
        }
        if (microphones.length > 0) {
            micData = microphones.map((mic, i) => `[${i + 1}] Label: ${mic.label}\n    ID: ${mic.deviceId}\n    Group ID: ${mic.groupId}`).join('\n\n');
            if (microphones.some(m => suspiciousKeywords.some(k => m.label.toLowerCase().includes(k)))) {
                micStatus = 'flagged';
            }
        }
        stream.getTracks().forEach(track => track.stop());
    } catch (err) {
        const errorMsg = `Error: ${err.name} - ${err.message}`;
        cameraData = micData = errorMsg;
        cameraStatus = micStatus = 'flagged';
    }
    return {
        'connected-cameras': { status: cameraStatus, data: cameraData },
        'connected-mics': { status: micStatus, data: micData }
    };
}

function checkDevTools() {
    return new Promise(resolve => {
        let devToolsStatus = 'pass';
        let detectionMethod = 'Not Detected';
        const threshold = 160;
        if ((window.outerWidth - window.innerWidth > threshold) || (window.outerHeight - window.innerHeight > threshold)) {
            devToolsStatus = 'flagged';
            detectionMethod = 'Window dimension difference';
        }

        const element = new Image();
        Object.defineProperty(element, 'id', {
            get: () => {
                devToolsStatus = 'flagged';
                detectionMethod = 'Console object inspection';
            }
        });
        console.log(element);

        resolve({ status: devToolsStatus, data: `Detection Method: ${detectionMethod}` });
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
        let pasteStatus = 'pass';
        if (pasteCount > 5) pasteStatus = 'flagged';
        resolve({ status: pasteStatus, data: `Content pasted ${pasteCount} time(s).` });
    });
}

// --- Main Application Logic ---

/**
 * Sets up the entire UI with "Pending" rows before checks begin.
 */
function initializeReportUI() {
    ALL_CHECKS.forEach(check => {
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
    document.addEventListener('paste', () => { pasteCount++; });
}

/**
 * Orchestrates the entire system check process.
 */
async function runSystemCheck() {
    startBtn.disabled = true;
    startBtn.innerHTML = 'Running Checks...';
    reportContainer.classList.remove('hidden');

    initializeReportUI();

    const promises = ALL_CHECKS.map(async (check) => {
        try {
            const result = await check.checkFunction();
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
