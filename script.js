// --- DOM Elements ---
const startBtn = document.getElementById('start-check-btn');
const startContainer = document.getElementById('start-container');
const reportContainer = document.getElementById('report-container');

// --- UI Update Functions ---

/**
 * Creates and inserts a placeholder row into a report table.
 * @param {string} tableId - The ID of the tbody element.
 * @param {string} checkName - The name of the check being performed.
 * @param {string} checkId - A unique ID for the table row to be created.
 */
function createPendingRow(tableId, checkName, checkId) {
    const tableBody = document.getElementById(tableId);
    const row = document.createElement('tr');
    row.id = checkId;
    row.innerHTML = `
                <td class="p-3 font-medium text-white">${checkName}</td>
                <td class="p-3">
                    <div class="flex items-center">
                        <div class="loader"></div>
                        <span class="ml-2 text-gray-400">Checking...</span>
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
        ? `<div class="flex items-center"><div class="status-icon rounded-full status-pass"></div><span class="text-green-400 font-semibold">Clear</span></div>`
        : `<div class="flex items-center"><div class="status-icon rounded-full status-flagged"></div><span class="text-amber-400 font-semibold">Flagged</span></div>`;

    row.cells[1].innerHTML = statusHtml;
    row.cells[2].textContent = data;
    row.cells[2].classList.remove('text-gray-500');
    row.cells[2].classList.add(status === 'pass' ? 'text-gray-300' : 'text-amber-300');
}

// --- Placeholder Detection Functions ---
// These functions simulate async data fetching.
// In a real application, they would contain the actual detection logic.

/**
 * PLACEHOLDER: Simulates checking for virtualization.
 * @returns {Promise<Array<Object>>} A promise that resolves with a report array.
 */
async function getVirtualizationReport() {
    // In a real scenario, you would implement WebGL fingerprinting here.
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
    return [
        {
            checkName: 'WebGL Renderer',
            checkId: 'webgl-renderer',
            status: 'flagged',
            data: 'Google SwiftShader (Software Renderer)'
        },
        {
            checkName: 'CPU & RAM',
            checkId: 'cpu-ram',
            status: 'pass',
            data: 'Performance metrics are within normal hardware range.'
        }
    ];
}

/**
 * PLACEHOLDER: Simulates checking hardware and media devices.
 * @returns {Promise<Array<Object>>} A promise that resolves with a report array.
 */
async function getHardwareReport() {
    // In a real scenario, you would use navigator.mediaDevices.enumerateDevices()
    // and window.screen.isExtended here.
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
    return [
        {
            checkName: 'Display Setup',
            checkId: 'display-setup',
            status: 'pass',
            data: 'Single display detected (isExtended: false).'
        },
        {
            checkName: 'Connected Cameras',
            checkId: 'connected-cameras',
            status: 'flagged',
            data: '1. FaceTime HD Camera\n2. OBS Virtual Camera'
        },
        {
            checkName: 'Connected Microphones',
            checkId: 'connected-mics',
            status: 'pass',
            data: '1. MacBook Pro Microphone'
        }
    ];
}

/**
 * PLACEHOLDER: Simulates checking the browser environment.
 * @returns {Promise<Array<Object>>} A promise that resolves with a report array.
 */
async function getBrowserReport() {
    // In a real scenario, you would implement dev tools detection,
    // focus listeners, and DOM integrity checks.
    await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate delay
    return [
        {
            checkName: 'Developer Tools',
            checkId: 'dev-tools',
            status: 'pass',
            data: 'Not detected.'
        },
        {
            checkName: 'Window Focus',
            checkId: 'window-focus',
            status: 'pass',
            data: 'Focus has not left the page.'
        }
    ];
}

// --- Main Application Logic ---

/**
 * Runs a single category of checks and updates the UI.
 * @param {string} tableId - The ID of the tbody element for this category.
 * @param {Function} reportFunction - The async function that performs the checks.
 */
async function runCheckCategory(tableId, reportFunction) {
    // Get the report structure (with check names and IDs)
    const reportItems = await reportFunction();

    // Create pending rows for all checks in this category
    reportItems.forEach(item => {
        createPendingRow(tableId, item.checkName, item.checkId);
    });

    // Now, update each row with its final data.
    // This is done after creating all pending rows to simulate a parallel check appearance.
    reportItems.forEach(item => {
        updateRow(item.checkId, item.status, item.data);
    });
}

/**
 * Orchestrates the entire system check process.
 */
async function runSystemCheck() {
    // 1. Update UI to show the report and hide the button
    startBtn.disabled = true;
    startBtn.innerHTML = '<div class="loader mx-auto"></div>';
    reportContainer.classList.remove('hidden');

    // 2. Run all check categories in sequence
    await runCheckCategory('virtualization-report', getVirtualizationReport);
    await runCheckCategory('hardware-report', getHardwareReport);
    await runCheckCategory('browser-report', getBrowserReport);

    // 3. Finalize the UI state
    startBtn.textContent = 'Check Complete';
}

// --- Event Listener ---
startBtn.addEventListener('click', runSystemCheck);