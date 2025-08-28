# Browser-Based System Integrity Checker

This project is a lightweight, front-end web application designed to analyze a user's browser and system environment to detect potential signs of cheating or environmental manipulation common in online assessments. It runs entirely in the browser using standard JavaScript APIs, requiring no installation.

The tool collects data from various sources, presents it in a clear report, and flags any suspicious findings for review.

---

## 🚀 Features

The checker is divided into three main analysis categories:

### 1. System & Virtualization Analysis
- **CPU Performance Benchmark**: Runs a CPU-intensive task to flag systems that are performing significantly slower than expected for native hardware.
- **Hardware Concurrency**: Checks the number of logical CPU cores, flagging unusually low counts.
- **Estimated System RAM**: Reports the estimated system RAM, flagging low amounts that are common in VM configurations.
- **Battery Status API**: Checks for anomalous battery states (e.g., a perpetually full and charging battery), which is a common artifact of a VM.

### 2. Hardware & Media Devices
- **Display Setup**: Detects if multiple monitors are connected to the system.
- **Connected Cameras & Microphones**: Lists all media devices and scans their names for keywords associated with virtual or dummy drivers (e.g., "OBS Virtual Camera", "DroidCam").

### 3. Browser Environment
- **Developer Tools Detection**: Checks if the browser's developer tools (F12) are open.
- **Window Focus Tracking**: Monitors and reports if the user navigates away from the page or switches to another application.
- **Clipboard Monitoring**: Counts the number of paste events on the page.

---

## 🛠️ How to Use

1.  Place the three files (`index.html`, `style.css`, and `script.js`) in the same directory.
2.  Open `index.html` in a modern web browser (like Chrome, Firefox, or Edge).
3.  Click the "Start System Check" button.
4.  The application will request permissions for your camera and microphone (this is necessary to get accurate device names).
5.  The report will populate in real-time, showing the status of each check.

---

## 📁 File Structure

-   **`index.html`**: Contains the main HTML structure for the report page.
-   **`style.css`**: Provides the styling for the user interface, including the dark theme and status indicators (Pending, Clear, Flagged).
-   **`script.js`**: Holds all the application logic, including the detection functions, UI update handlers, and event listeners.

---

## ⚠️ Limitations

This tool is powerful but operates entirely within the browser's security sandbox. Due to this, it **cannot** detect:

-   **Hardware-level cheating** like HDMI splitters or KVM switches.
-   **Hidden background processes** or applications running on the user's machine.
-   **A comprehensive list of all installed browser extensions**. It can only infer their presence if they manipulate the page's HTML.
-   Cheating methods that involve **external devices** (like a separate laptop or phone) or other people in the room.

For more robust detection, a native application (a downloadable "secure browser" or agent) would be required to break out of the browser sandbox and perform deeper system-level checks.