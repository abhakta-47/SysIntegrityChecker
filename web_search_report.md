# **Building a Client-Side Proctoring Framework: A Technical Deep Dive into Browser-Based Cheating Detection**

## **Section 1: The Modern Cheating Landscape: A Taxonomy of Threats**

### **1.1 The Evolution from Low-Tech to High-Tech Cheating**

The challenge of maintaining academic integrity has evolved from a matter of classroom supervision to a complex technological arms race. Historically, cheating was constrained by physical proximity, involving methods like copying from a neighbor or using concealed notes.1 The transition to online assessments has fundamentally altered this landscape. The test-taker's environment is no longer a controlled room but their entire digital ecosystem, which presents a vastly expanded surface for potential misconduct.  
Modern cheating methods leverage the very technologies that enable remote learning. Students may employ a range of high-tech solutions, from storing notes on smartwatches and calculators to looking up answers on a secondary smartphone.1 The problem extends beyond simple information retrieval. Sophisticated users can employ screen-sharing software like Zoom or Google Meet to collaborate with external helpers in real-time, use virtual machines to operate an unmonitored operating system in parallel with the exam, or connect external projectors to mirror their screen for an accomplice.2 This technological escalation necessitates an equally sophisticated, client-side detection framework capable of identifying and mitigating these digital threats. The browser, designed as a gateway to information, becomes a potential vector for cheating, and securing it is the primary objective.

### **1.2 A Taxonomy of Digital Cheating Vectors**

To effectively build a detection system, it is essential to first categorize the threats it must address. These "bad behaviours" can be classified into two primary domains: manipulation of the environment external to the browser and deceptive actions performed within the browser itself.

#### **Domain 1: Environment Manipulation**

This category includes any cheating method that involves resources or actions outside the primary browser window where the assessment is being conducted.

* **Impersonation:** This is one of the most direct forms of cheating, where an individual other than the registered student takes the exam.2 This can occur from the outset, with the impersonator completing the identity verification process using altered documents, or via a mid-exam swap after the legitimate student has already authenticated. This vector exploits proctoring systems that only perform identity verification at the beginning of a session.2  
* **Unauthorized Collaboration:** A student may receive assistance from another person, who could be physically present in the room or collaborating remotely.3 Remote collaboration is often facilitated by screen-sharing software or by mirroring the desktop to an external display that a helper can see.2 The helper can then signal or dictate answers to the test-taker.4  
* **Use of Secondary Hardware:** This involves the use of any device other than the primary computer being used for the exam. Common examples include using smartphones or tablets to search for information, accessing pre-stored notes on smartwatches, or listening to recorded answers on an MP3 player.1  
* **Virtualized Environments:** A technically proficient user can run a virtual machine (VM) on their computer. This creates a separate, fully functional operating system that runs in the background. While the proctoring software monitors the main OS, the user can switch to the undetectable VM to access the internet, notes, or other unauthorized resources.2

#### **Domain 2: In-Browser Deception**

This category covers cheating methods that occur within the browser or involve the direct manipulation of the assessment's web content.

* **Content Exfiltration and Manipulation:** Early methods of online cheating involved using the browser's built-in developer tools. By using the "Inspect Element" feature, a user could potentially view the website's source code and find correct answers embedded within the HTML or JavaScript.4 Modern variations include using the copy-paste functionality to exfiltrate exam questions for distribution or to paste in pre-written answers.5  
* **Unauthorized Information Access:** The most straightforward form of in-browser cheating involves navigating away from the exam tab to search for answers using a search engine or to access online resources. This is typically done by switching to another browser tab or opening a new window.2  
* **Plagiarism and Content Masking:** For written assessments, students may use sophisticated techniques to disguise plagiarism. "Article spinning" involves using software to replace words with synonyms to evade basic plagiarism checkers. Another method is to construct an essay by piecing together paragraphs from multiple sources.1 Students may also purchase custom-written papers from "paper mills" or download pre-written essays from "essay banks".1

The core challenge in detecting these behaviors is that many of them, in isolation, resemble normal computer usage. A user switching tabs, receiving a system notification, or having an unusual hardware setup is not definitive proof of cheating. Therefore, a successful detection system cannot rely on simple, deterministic rules. It must instead function as a data aggregation and analysis platform, collecting signals from multiple sources to build a probabilistic assessment of user intent. The goal is not to catch a single action but to identify a pattern of correlated, suspicious events that, taken together, strongly indicate academic dishonesty. This principle informs the entire architecture of a modern proctoring framework, leading to concepts like the "Suspicion Score" model.

### **1.3 Table 1: Cheating Vectors and Corresponding Detection APIs**

The following table provides a high-level map of the cheating vectors discussed and the primary client-side APIs and techniques that can be used for their detection or mitigation. This serves as a roadmap for the technical deep dive in the subsequent sections of this report.

| Cheating Vector | Primary Detection Method/API | Report Section |
| :---- | :---- | :---- |
| Impersonation | Webcam Face Detection/Recognition (MediaDevices API) | Section 3.1 |
| Unauthorized Collaboration (In-Room) | Microphone Noise/Voice Detection (MediaDevices API) | Section 3.1 |
| Unauthorized Collaboration (Remote) | Screen Sharing Detection (Screen Capture API) | Section 3.1 |
| Using a Second Monitor/Projector | Window Management API (window.getScreenDetails()) | Section 3.2 |
| Using a Virtual Machine (VM) | WebGL Renderer Analysis | Section 4.1 |
| Searching in Another Tab/Window | Page Visibility API | Section 2.2 |
| Copying Questions / Pasting Answers | Clipboard API | Section 2.3 |
| Using Browser Developer Tools | debugger Timing Checks / devtools-detect Library | Section 4.3 |
| Hiding Location with VPN/Proxy | Timezone vs. IP Geolocation Mismatch / WebRTC Leaks | Section 3.3 |
| Environment Change Mid-Exam | Browser Fingerprinting Anomaly Detection | Section 4.2 |

## **Section 2: Architecting a Secure Assessment Environment: Foundational Lockdown and Monitoring**

The first layer of a client-side proctoring system involves transforming the general-purpose web browser into a controlled, single-purpose assessment environment. These foundational lockdown and monitoring features are designed to limit a user's ability to access unauthorized resources and, critically, to generate detectable signals if they attempt to circumvent these restrictions.

### **2.1 Browser Lockdown Mechanisms: Creating a Digital "Walled Garden"**

The concept of a "lockdown browser" is not a monolithic application but rather a suite of client-side controls that collectively restrict browser functionality.3 These features are standard in commercial solutions like Proctorio and ExamSoft and form the baseline for a secure testing environment.5

* **Forcing Full-Screen Mode:** The Element.requestFullscreen() method can be invoked to render the web app over the entire screen. This obscures the operating system's desktop, taskbar, and other applications, reducing the ease with which a user can multitask. An event listener for the fullscreenchange event should be implemented to detect if the user exits full-screen mode, which can be logged as a suspicious event.5  
* **Disabling Navigation and New Tabs:** JavaScript can be used to capture and prevent the default actions of keyboard shortcuts commonly used for navigation and tab management, such as Ctrl+T (New Tab), Ctrl+N (New Window), Ctrl+W (Close Tab), and F5 (Refresh). Furthermore, upon exam initiation, the application should programmatically close all other open tabs to create a clean environment.5  
* **Context Menu and Right-Click Control:** Disabling the right-click context menu is a simple but effective measure to prevent users from accessing options like "Inspect Element," "View Page Source," or "Save Page As." This is achieved by adding an event listener to the contextmenu event and calling event.preventDefault().  
* **Printing and Caching:** To prevent the exfiltration of exam content, the browser's printing functionality can be disabled. This can be done by overriding the window.print() function or by capturing print-related keyboard shortcuts (Ctrl+P). Additionally, clearing the browser cache before the exam begins ensures that no previously stored information is accessible and that all resources are fetched fresh from the server.5

These lockdown features serve a dual purpose. Primarily, they raise the barrier to entry for casual, low-effort cheating. A student cannot simply open a new tab and search for an answer. More importantly, however, they establish a baseline of expected behavior. Any deviation from this locked-down state—such as an unexpected exit from full-screen mode or a blocked attempt to open a new tab—is no longer an ambiguous user action but a clear, recordable signal of a potential integrity violation. The lockdown environment is designed to make it impossible to cheat *silently*; any attempt to break out of the "walled garden" creates forensic data that can be fed into a broader analysis model.

### **2.2 Monitoring User Focus and Engagement with the Page Visibility API**

The Page Visibility API is the primary client-side tool for detecting when a user has navigated away from the active exam tab. It provides a more reliable mechanism than older methods like listening for blur and focus events, as those events only indicate if the window has lost focus, not necessarily if it is hidden from the user.7  
The API exposes two key properties on the document object: Document.hidden and Document.visibilityState.7

* Document.hidden: A read-only boolean property that returns true if the page is considered hidden and false otherwise.  
* Document.visibilityState: A read-only string property that provides more granular information. Its value can be visible (the page is the foreground tab of a non-minimized window) or hidden (the page is a background tab, the window is minimized, or the device's screen is off).8

The most effective way to use this API is to listen for the visibilitychange event, which fires whenever the visibility state of the document changes.9  
**Code Example and Analysis:**

JavaScript

document.addEventListener('visibilitychange', () \=\> {  
  if (document.visibilityState \=== 'hidden') {  
    // The user has navigated away from the exam tab.  
    // Log this event with a timestamp.  
    console.log(\`Page hidden at: ${new Date().toISOString()}\`);  
    // This is a flaggable event for the suspicion score.  
  } else {  
    // The user has returned to the exam tab.  
    console.log(\`Page became visible at: ${new Date().toISOString()}\`);  
  }  
});

While powerful, it is crucial to understand the API's limitations. The visibilityState changing to hidden is an ambiguous signal. It can be triggered by several user actions: switching to another tab, switching to another application, minimizing the browser window, or the operating system's screen lock activating.10 The API does not provide a way to distinguish between these causes. Therefore, a  
visibilitychange event should be treated as a data point to be correlated with other signals, rather than as definitive proof of cheating on its own.

### **2.3 Controlling Data Exfiltration with the Clipboard API**

The Clipboard API is essential for preventing users from copying exam questions to share with others or pasting in answers from an external source. Modern browsers provide the asynchronous navigator.clipboard API, which is more secure and capable than the deprecated document.execCommand() method.11  
The primary strategy for proctoring is not to read the clipboard's content—which involves complex permissions—but to block the actions entirely. This can be accomplished by listening for the cut, copy, and paste events on the document and preventing their default behavior.  
**Code Example: Blocking Clipboard Actions**

JavaScript

const blockClipboard \= (event) \=\> {  
  event.preventDefault();  
  // Log the blocked attempt as a suspicious event.  
  console.log(\`Blocked clipboard action: ${event.type}\`);  
  // Optionally, display a warning to the user.  
  alert('Copying and pasting are disabled during the exam.');  
};

document.addEventListener('copy', blockClipboard);  
document.addEventListener('cut', blockClipboard);  
document.addEventListener('paste', blockClipboard);

Implementing this requires a deep understanding of the API's security model, which varies significantly between browsers. The specification requires "transient user activation"—meaning the user must have recently interacted with the page (e.g., via a click or keypress)—for clipboard access.11 However, browser implementations differ:

* **Chromium-based browsers** (Chrome, Edge) require the clipboard-read and clipboard-write permissions to be granted via the Permissions API for programmatic access without user activation. These permissions can also be controlled via the HTTP Permissions-Policy header for \<iframe\> elements.11  
* **Firefox and Safari** do not support these persistent permissions. They strictly require transient user activation for any clipboard operation, making programmatic access more constrained.11

For a proctoring application, the event-blocking approach is generally the most robust and cross-browser compatible, as it relies on intercepting the user's *intent* (the keypress or menu selection) rather than dealing with the complexities of reading the clipboard data itself.

## **Section 3: Advanced Environment Sensing: Hardware and System Interrogation APIs**

Beyond locking down the browser, a robust proctoring system must be able to sense the test-taker's physical and digital environment. This involves interrogating hardware devices and system configurations to detect common cheating vectors like impersonation, collaboration, and the use of secondary displays. These powerful APIs are gated by strict user permission models, making the user experience of requesting access a critical component of the implementation.

### **3.1 Visual and Auditory Monitoring: The Media and Screen Capture APIs**

These APIs provide the core functionality for live proctoring by accessing the user's camera, microphone, and screen. All operations require a secure context (HTTPS).12

* **Webcam and Microphone Access:** The navigator.mediaDevices.getUserMedia() method is the entry point for requesting access to media input devices. It takes a constraints object specifying the desired media types (audio: true, video: true) and returns a Promise that resolves with a MediaStream object if the user grants permission.12 This stream can then be attached to a  
  \<video\> element for display, recorded, or processed by machine learning models for real-time analysis (e.g., face detection, voice detection). The permission prompt is a non-bypassable browser UI element, meaning the user must explicitly consent.  
* **Device Enumeration:** Before requesting access, or to provide users with device selection options, the navigator.mediaDevices.enumerateDevices() method can be used. It returns a Promise that resolves with an array of MediaDeviceInfo objects, detailing all available media devices.14 Each object includes properties like  
  kind ('audioinput', 'videoinput'), label (e.g., "FaceTime HD Camera"), and a unique deviceId.15 This is particularly useful for identifying suspicious virtual devices. For example, the presence of a "OBS Virtual Camera" could indicate an attempt to pipe a pre-recorded or manipulated video feed into the proctoring session, which should be flagged.  
* **Screen Sharing and Recording:** The Screen Capture API, via the navigator.mediaDevices.getDisplayMedia() method, allows the application to request that the user share their screen.16 Similar to  
  getUserMedia(), it returns a Promise that resolves with a MediaStream. When invoked, the browser presents a dialog asking the user to choose what to share: an entire screen, a specific application window, or a single browser tab. This functionality is essential for verifying that the user is not accessing unauthorized applications or websites during the exam. The user's choice to share only the exam window while having other applications open could itself be a flaggable event.

The design of the permission flow for these APIs is paramount. A user who is surprised by a sudden permission prompt is likely to deny it. Therefore, the application's user interface should "prime" the user by explaining why camera, microphone, or screen access is required *before* the native browser prompt is triggered. This transparency increases the likelihood of consent and reduces user friction. The application must also gracefully handle permission denial, providing clear instructions on how to proceed.

### **3.2 Detecting Screen Duplication and Extension: The Window Management API**

A common method for remote collaboration involves mirroring or extending the desktop to a second monitor or projector, allowing a helper to see the exam questions.2 The experimental Window Management API provides a modern, reliable way to detect such setups.

* **The Modern Approach:** The core of this API is the window.getScreenDetails() method. When called, it prompts the user for the window-management permission. If granted, it returns a Promise that resolves to a ScreenDetails object.17 This object contains an  
  screens array, which holds detailed information about every display connected to the system. By simply checking screenDetails.screens.length, the application can determine if more than one monitor is active.18 The API also includes a  
  screenschange event, allowing the application to react in real-time if a monitor is connected or disconnected mid-exam.

**Code Example: Detecting Multiple Monitors**

JavaScript

async function checkScreenConfiguration() {  
  if ('getScreenDetails' in window) {  
    try {  
      const screenDetails \= await window.getScreenDetails();  
      if (screenDetails.screens.length \> 1\) {  
        console.warn('Multiple screens detected.');  
        // Flag this as a high-severity event.  
      }  
      screenDetails.addEventListener('screenschange', () \=\> {  
        console.warn('Screen configuration changed mid-exam.');  
        // Flag this as a critical event.  
      });  
    } catch (err) {  
      console.error('Permission to manage windows was denied.', err);  
    }  
  } else {  
    console.log('Window Management API not supported. Using fallback heuristics.');  
    // Implement legacy checks here.  
  }  
}

* **Legacy Heuristics:** In browsers that do not support the Window Management API, less reliable heuristics can be used as a fallback. These include checking if window.screen.isExtended is true (a newer Chromium property), or comparing screen.availWidth to window.screen.width.17 These methods are prone to false positives and negatives and should be considered low-confidence signals.

### **3.3 Identifying Evasive Network Setups: VPN and Proxy Detection**

While there is no direct browser API to detect VPNs or proxies, several client-side techniques can infer their use by identifying discrepancies between different sources of location and network information.

* **Timezone vs. IP Geolocation Mismatch:** This is the most common and effective client-side method. The script first obtains the browser's configured timezone using Intl.DateTimeFormat().resolvedOptions().timeZone. It then makes an asynchronous call to a third-party IP geolocation API (like ipinfo.io or ipgeolocation.io) to get the geographical location associated with the user's public IP address.20 The server for this API will also return the expected timezone for that location. If the browser's timezone significantly differs from the IP-based timezone (e.g., a browser set to  
  America/New\_York connecting from an IP in Eastern Europe), it is a strong indication that the user's location is being masked by a VPN or proxy.20  
* **WebRTC IP Leaks:** Web Real-Time Communication (WebRTC) is a browser feature used for peer-to-peer connections. A known side effect is that, during the connection setup process (using STUN servers), WebRTC can reveal a user's true local and public IP addresses, even if they are behind a VPN.23 A client-side script can initiate a WebRTC peer connection and inspect the connection candidates to discover these IPs. If the IP address revealed by WebRTC differs from the public IP address seen by the application's server, it confirms the use of a network anonymizer.22  
* **Latency Analysis:** This is a more advanced technique that typically requires server-side participation. It works by comparing two latency measurements: the round-trip time of a WebSocket message from the browser to the server and back, and the latency of the initial TCP handshake between the server and the client's IP address. A significant discrepancy, where the WebSocket latency is much higher, suggests the presence of an intermediate proxy server that adds application-level delay.25

## **Section 4: Covert Threat Detection: Fingerprinting and Evasion Techniques**

This section delves into more subtle detection methods that focus on identifying the underlying technology stack of the user's environment. These techniques are designed to uncover sophisticated evasion attempts, such as the use of virtual machines and developer tools, by analyzing low-level system characteristics that are not easily spoofed. This represents a strategic shift from monitoring overt user *behavior* to interrogating the user's *technology*, a powerful but delicate approach that requires careful handling to avoid false positives.

### **4.1 Detecting Virtualized and Headless Environments**

A determined cheater might use a virtual machine (VM) to run an unmonitored operating system alongside the exam, or an automated script might use a headless browser to attempt to scrape exam content.2 Several client-side techniques can detect these non-standard environments.

* **WebGL Renderer Analysis:** This is the most reliable method for detecting VMs from within a browser. The WebGL API allows JavaScript to access the computer's graphics processing unit (GPU) for hardware-accelerated rendering. Every GPU identifies itself with a specific string. A script can create a WebGL context and query the UNMASKED\_RENDERER\_WEBGL parameter to get this string.26  
  * **Physical Hardware:** On a standard machine, this will return the name of the physical GPU, such as "ANGLE (Intel(R) HD Graphics 530 Direct3D11 vs\_5\_0 ps\_5\_0)".  
  * **Virtual Machine:** VMs typically lack direct GPU access and rely on software-based renderers. The presence of strings like "Google SwiftShader", "LLVMpipe", or "VirtualBox" is a nearly definitive indicator that the browser is running inside a virtualized environment.26 Phishing sites actively use this technique to evade analysis by security researchers.28

**Code Example: Checking the WebGL Renderer**

JavaScript

function getWebGLRenderer() {  
  const canvas \= document.createElement('canvas');  
  const gl \= canvas.getContext('webgl') |

| canvas.getContext('experimental-webgl');  
  if (gl && gl.getExtension('WEBGL\_debug\_renderer\_info')) {  
    return gl.getParameter(gl.getExtension('WEBGL\_debug\_renderer\_info').UNMASKED\_RENDERER\_WEBGL);  
  }  
  return 'N/A';  
}

const renderer \= getWebGLRenderer().toLowerCase();  
const vmRenderers \= \['swiftshader', 'llvmpipe', 'virtualbox'\];  
if (vmRenderers.some(vm \=\> renderer.includes(vm))) {  
  console.warn('Virtual Machine environment detected. Renderer:', renderer);  
  // Flag this as a high-severity event.  
}

* **Secondary Heuristics:** Additional data points can corroborate the presence of a VM or detect a headless browser. These are less definitive but useful as part of a scoring system.  
  * **Screen Properties:** Automated or poorly configured virtual environments often report unusual screen dimensions (e.g., width and height less than 100 pixels) or a low color depth (less than 24-bit).26  
  * **Device Memory:** The navigator.deviceMemory property reports the approximate amount of RAM on the device. While this value is capped at 8GB by browsers for privacy reasons, a very low reported value (e.g., 1 or 2 GB) is characteristic of a minimally configured VM.27

### **4.2 Browser and Device Fingerprinting for Anomaly Detection**

Browser fingerprinting is a technique that combines numerous semi-unique attributes of a user's browser and operating system to create a single, highly unique identifier or "fingerprint".31 While often discussed in the context of user tracking, its application in proctoring is different: its primary value is in establishing a stable environmental baseline and detecting anomalous changes.

* **Key Fingerprinting Vectors:** A comprehensive fingerprint is generated by collecting and hashing data from various browser APIs:  
  * **Canvas Fingerprinting:** An off-screen HTML5 \<canvas\> element is used to render specific text and graphics. The resulting image data is then converted to a hash. Because rendering is affected by the OS, GPU, graphics drivers, and installed fonts, this hash is highly unique to the specific machine.31  
  * **AudioContext Fingerprinting:** The Web Audio API is used to process a standardized oscillator wave. The resulting audio buffer is hashed. Variations in audio hardware and drivers cause subtle differences in the output, creating another unique identifier.33  
  * **Font Fingerprinting:** The list of installed fonts on a system can be enumerated, providing another source of entropy.34  
  * **Other Data Points:** A multitude of other properties are aggregated, including the User-Agent string, browser plugins, screen resolution, color depth, timezone, and language settings (navigator.platform, navigator.plugins, screen.width, etc.).31  
* **Strategic Application for Proctoring:** The goal is not to persistently track a user across sessions. Instead, a fingerprint should be generated at the beginning of an exam and stored. The fingerprinting process can be run again periodically throughout the exam. If the resulting fingerprint hash changes significantly mid-assessment, it is a critical red flag. Such a change is nearly impossible under normal circumstances and could indicate that the user has switched from their host machine to a virtual machine or is employing sophisticated anti-fingerprinting tools to evade detection.

### **4.3 Detecting Debugging and Reverse Engineering Attempts**

A user attempting to manipulate the exam's client-side code will almost certainly use the browser's developer tools. Detecting when these tools are open is a key part of preventing such tampering.

* **The debugger Statement Timing Trick:** This is the most common and widely understood method. The JavaScript debugger; statement programmatically triggers a breakpoint. If the developer tools are closed, the browser's JavaScript engine ignores this statement, and execution continues instantly. However, if the tools are open, execution pauses on that line. By measuring the time elapsed across the debugger; statement, the application can infer whether the tools are open.36

**Code Example:**

JavaScript

setInterval(() \=\> {  
  const startTime \= new Date();  
  debugger;  
  const endTime \= new Date();  
  if (endTime \- startTime \> 100\) { // Threshold of 100ms  
    console.warn('Developer Tools are open\!');  
    // Flag this event.  
  }  
}, 1000);

This method's primary weakness is that a user can disable all breakpoints in the developer tools, rendering the check ineffective.36

* **Property Getter Tricks:** More subtle techniques exploit how the console inspects objects. One method involves defining a custom getter on an object's property (e.g., id). The application then periodically calls console.log() on this object. The getter function is only executed when the console is open and attempts to read the property for display. The execution of the getter thus serves as a positive signal that the console is active.37  
* **Using Libraries:** Given the cat-and-mouse nature of devtools detection, with browsers frequently changing behaviors, it is often more practical to use a specialized, well-maintained library. The devtools-detect library is a popular choice that abstracts these browser-specific hacks into a simple, event-based API. It emits a devtoolschange event whenever the state or orientation of the developer tools changes, providing a clean and reliable implementation path.39  
* **Server-Side Detection:** An alternative approach involves server-side logic. When minified JavaScript files are served, they often include a special comment pointing to a source map (.map) file. Browsers typically only request this .map file when the developer tools are open. By monitoring server logs for requests to these files, an application can detect devtools usage without any client-side code.41

## **Section 5: Strategic Implementation and Synthesis: Building a Robust Detection Framework**

Having explored the granular technical details of various detection APIs, this final section synthesizes these components into a cohesive, high-level strategy for building a complete and effective proctoring application. It addresses architectural patterns, the build-versus-buy dilemma, and the critical ethical considerations inherent in this domain.

### **5.1 The "Suspicion Score" Architecture: A Layered Security Model**

A proctoring system that relies on binary, rule-based triggers (e.g., "if tab switch, then fail exam") is brittle and prone to false positives. A more resilient and nuanced approach is to implement a "Suspicion Score" architecture, a model used by leading commercial platforms like Proctorio.5  
In this model, each potential cheating event does not result in an immediate punitive action. Instead, it contributes a weighted value to a cumulative score for the exam session.

* **Low-Severity Events (+5 points):** A brief instance of background noise, a momentary loss of face detection.  
* **Medium-Severity Events (+20 points):** Navigating away from the exam tab (visibilitychange event), a blocked copy/paste attempt, exiting full-screen mode.  
* **High-Severity Events (+50 points):** Detection of a second monitor, detection of a virtual machine via WebGL renderer, multiple faces detected on camera.  
* **Critical Events (+100 points):** A change in browser fingerprint mid-exam, a live proctor intervention.

This scoring system provides immense flexibility. Exam administrators can set different thresholds for review based on the stakes of the assessment. A low-stakes quiz might only flag scores above 150, while a high-stakes final exam might trigger a manual review for any score above 50\.5 The system moves from making definitive judgments to providing data-driven recommendations for human review, which is a more defensible and fair approach.

### **5.2 Build vs. Buy: Third-Party SDKs vs. In-House Development**

A fundamental strategic decision is whether to build a proctoring solution from the ground up or integrate a pre-built third-party SDK.

* **The "Buy" Argument (Using SDKs):** Companies like Constructor Proctor, AutoProctor, and BlinkExam offer JavaScript SDKs that allow for the rapid integration of proctoring features into an existing platform.42 The advantages are significant:  
  * **Speed to Market:** A functional proctoring system can be implemented in days rather than months or years.43  
  * **Reduced Development Cost:** Avoids the need for a dedicated team of engineers with specialized knowledge in browser APIs, security, and machine learning.  
  * **Maintenance and Updates:** The SDK provider is responsible for keeping up with the rapid pace of browser updates and the evolving landscape of cheating techniques.  
* **The "Build" Argument (In-House Development):** Building a custom solution is a massive undertaking, as evidenced by open-source projects like "Aankh," which required a full-stack team to develop a frontend (React), backend (Node.js), browser extension, and machine learning model (TensorFlow).40 However, this path offers key advantages for well-resourced organizations:  
  * **Total Control:** Complete ownership over the user experience, feature set, and data privacy policies.  
  * **Deep Integration:** The ability to seamlessly integrate the proctoring logic with the core learning management system (LMS).  
  * **Strategic Asset:** A proprietary proctoring system can become a key competitive differentiator.

The choice depends on resources, timeline, and strategic goals. For most projects, integrating an SDK is the more pragmatic option, while building in-house is a long-term strategic investment.

### **5.3 Lessons from Commercial Platforms: A Competitive Analysis**

Analyzing the architecture and feature sets of market leaders like Proctorio, Honorlock, and ExamSoft provides a validated blueprint for a comprehensive proctoring product.

* **Architectural Philosophies:** A key distinction lies in the delivery model. Proctorio and Honorlock primarily operate as browser extensions for Google Chrome.5 This model offers deep integration with the browser, allowing for robust features like web traffic monitoring and keystroke analysis. In contrast, ExamSoft uses a native, installable application (Examplify) that takes over the entire device.6 This provides the highest level of security, including the ability to function offline and block all other applications at the operating system level, but comes at the cost of a more cumbersome installation process for the user. This represents a fundamental trade-off between accessibility (web-based) and maximum security (native application).  
* **Feature Set as a Blueprint:** The detailed settings offered by these platforms serve as a mature product roadmap. Proctorio's three pillars—**Recording** (video, audio, screen), **Lockdown** (full screen, disable tabs), and **Verification** (ID check, signature)—provide a clear and effective categorization of features.5 Similarly, Honorlock's features like  
  **BrowserGuard™** (browser lockdown) and **Live Pop-in™** (human intervention on AI flags) highlight the importance of a hybrid AI-plus-human approach.45

### **5.4 Ethical Considerations, Privacy, and Minimizing False Positives**

Building a proctoring system carries significant ethical responsibilities. The goal is to ensure academic integrity, but this must be balanced with respect for user privacy and a commitment to fairness.

* **Transparency and Consent:** Users must be clearly and explicitly informed about what data is being collected (e.g., video, screen recording, system information), why it is being collected, and who will have access to it. Consent should be obtained through clear, unavoidable user interface elements.  
* **Data Security:** The system will handle highly sensitive personal data. It is imperative to implement robust security measures, such as end-to-end encryption for all stored recordings and data in transit, as emphasized by platforms like Proctorio.5 Access to this data should be strictly controlled and limited to authorized institutional personnel.  
* **Algorithmic Fairness and Human Oversight:** AI-driven analysis, such as face detection or voice analysis, can have inherent biases that may perform differently across demographic groups. Relying solely on automated flagging can lead to unfair outcomes. Therefore, it is critical that any automated flag is subject to review by a trained human proctor or administrator. The AI should serve to highlight potential issues, but the final judgment should rest with a person who can apply context and nuance.6 Building a system that is not only effective but also trustworthy is the ultimate measure of success.

---

## **Appendix A: Client-Side Proctoring API Reference**

The following table provides a consolidated technical reference for the key client-side APIs and techniques discussed in this report.

| API / Technique | Core Method(s) | Proctoring Use Case | Permission Required | Key Considerations |
| :---- | :---- | :---- | :---- | :---- |
| **Page Visibility API** | document.addEventListener('visibilitychange',...) document.visibilityState | Detect tab/window switching. | None | Does not distinguish between minimize, tab switch, or OS lock screen. Highly reliable signal for loss of focus.7 |
| **Clipboard API** | document.addEventListener('copy', event.preventDefault()) | Monitor/block copy-paste actions. | Transient user activation. clipboard-read/clipboard-write permissions for programmatic access in Chromium.11 | Browser permission models differ significantly. Blocking events is more reliable than reading content. |
| **Screen Capture API** | navigator.mediaDevices.getDisplayMedia() | Request screen share for live monitoring or recording. | User consent via non-bypassable browser prompt.16 | User can choose to share any window or tab, not necessarily the entire screen. Requires secure context (HTTPS). |
| **MediaDevices API** | navigator.mediaDevices.getUserMedia() navigator.mediaDevices.enumerateDevices() | Access webcam/microphone. List all media devices. | User consent via prompt for getUserMedia. enumerateDevices labels require active stream or permission.12 | Essential for identity verification and monitoring. enumerateDevices can detect suspicious virtual devices. |
| **Window Management API** | window.getScreenDetails() | Detect if multiple monitors are connected. | window-management permission via prompt.17 | Experimental API; requires feature detection. The most reliable method for multi-monitor detection. |
| **WebGL Renderer Check** | gl.getParameter(gl.UNMASKED\_RENDERER\_WEBGL) | Detect Virtual Machines (VMs) and headless browsers. | None | Highly reliable signal. Detects software renderers (e.g., SwiftShader, LLVMpipe) common in VMs.26 |
| **DevTools Detection** | debugger; statement timing. devtools-detect library. | Detect if browser developer tools are open to prevent code tampering. | None | Timing trick can be defeated by disabling breakpoints. Using a library is recommended for robustness.36 |
| **IP Geolocation** | fetch('https://ipinfo.io/json') | Part of VPN/proxy detection. | None (for the API call). Requires a third-party service. | Compare IP-based timezone with browser's local timezone. A mismatch is a strong indicator of a VPN.20 |
| **WebRTC IP Leak** | new RTCPeerConnection() | Detect real IP address behind a VPN/proxy. | None | Can reveal user's true public and local IP addresses, bypassing some VPNs. A more advanced detection method.22 |
| **Browser Fingerprinting** | Canvas, AudioContext, Fonts, Navigator properties. | Establish a baseline environment; detect anomalous changes mid-exam. | None | Not for identifying users, but for detecting environmental instability which may signal evasion tactics.31 |

#### **Works cited**

1. How Students Cheat | Academic Integrity | RIT, accessed August 28, 2025, [https://www.rit.edu/academicintegrity/how-students-cheat](https://www.rit.edu/academicintegrity/how-students-cheat)  
2. Top 10 Innovative Strategies for Cheating on Proctored Exams | OctoProctor, accessed August 28, 2025, [https://octoproctor.com/blog/how-to-cheat-on-a-proctored-exam-top-10](https://octoproctor.com/blog/how-to-cheat-on-a-proctored-exam-top-10)  
3. How to Limit Cheating on Online Examinations \- Kritik, accessed August 28, 2025, [https://www.kritik.io/blog-post/how-to-limit-cheating-on-online-examinations](https://www.kritik.io/blog-post/how-to-limit-cheating-on-online-examinations)  
4. Different ways to cheat on an online test | Guides \- Testportal, accessed August 28, 2025, [https://www.testportal.net/en/guides/online-test-cheating/ways-to-cheat-on-an-online-test/](https://www.testportal.net/en/guides/online-test-cheating/ways-to-cheat-on-an-online-test/)  
5. Online Proctoring | Proctorio, accessed August 28, 2025, [https://proctorio.com/products/online-proctoring](https://proctorio.com/products/online-proctoring)  
6. Secure Exam Software | More Than a Locked Down Browser, accessed August 28, 2025, [https://examsoft.com/benefits/exam-security/](https://examsoft.com/benefits/exam-security/)  
7. Page Visibility API \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Page\_Visibility\_API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)  
8. Document: visibilityState property \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState)  
9. Document: visibilitychange event \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange\_event](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event)  
10. Using the Page Visibility API \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/blog/using-the-page-visibility-api/](https://developer.mozilla.org/en-US/blog/using-the-page-visibility-api/)  
11. Clipboard API \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Clipboard\_API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)  
12. MediaDevices: getUserMedia() method \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)  
13. Navigator: getUserMedia() method \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getUserMedia)  
14. MediaDevices: enumerateDevices() method \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices)  
15. Choose cameras, microphones and speakers from your web app | Blog, accessed August 28, 2025, [https://developer.chrome.com/blog/media-devices](https://developer.chrome.com/blog/media-devices)  
16. Using the Screen Capture API \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Screen\_Capture\_API/Using\_Screen\_Capture](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API/Using_Screen_Capture)  
17. Using the Window Management API \- MDN, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Window\_Management\_API/Using](https://developer.mozilla.org/en-US/docs/Web/API/Window_Management_API/Using)  
18. How to use multiple screens | Web apps patterns | web.dev, accessed August 28, 2025, [https://web.dev/patterns/web-apps/multiple-screens](https://web.dev/patterns/web-apps/multiple-screens)  
19. machirajusaisandeep/detect-multiple-monitor \- GitHub, accessed August 28, 2025, [https://github.com/machirajusaisandeep/detect-multiple-monitor](https://github.com/machirajusaisandeep/detect-multiple-monitor)  
20. dubniczky/VPN-Detect: VPN Detection in the browser using ... \- GitHub, accessed August 28, 2025, [https://github.com/dubniczky/VPN-Detect](https://github.com/dubniczky/VPN-Detect)  
21. How to Detect If a User Is Using a VPN with JavaScript \- DEV Community, accessed August 28, 2025, [https://dev.to/jenueldev/how-to-detect-if-a-user-is-using-a-vpn-with-javascript-4nam](https://dev.to/jenueldev/how-to-detect-if-a-user-is-using-a-vpn-with-javascript-4nam)  
22. How to Detect VPN Users on Your Website \- Codersera, accessed August 28, 2025, [https://codersera.com/blog/how-to-detect-vpn-users-on-your-website](https://codersera.com/blog/how-to-detect-vpn-users-on-your-website)  
23. browserleaks.com, accessed August 28, 2025, [https://browserleaks.com/\#:\~:text=The%20WebRTC%20Leak%20Test%20is,public%20IP%20is%20being%20leaked.](https://browserleaks.com/#:~:text=The%20WebRTC%20Leak%20Test%20is,public%20IP%20is%20being%20leaked.)  
24. WebRTC Leak Test \- BrowserLeaks, accessed August 28, 2025, [https://browserleaks.com/webrtc](https://browserleaks.com/webrtc)  
25. 7 different ways to detect Proxies \- incolumitas.com, accessed August 28, 2025, [https://incolumitas.com/2021/10/16/7-different-ways-to-detect-proxies/](https://incolumitas.com/2021/10/16/7-different-ways-to-detect-proxies/)  
26. Phishing sites now detect virtual machines to bypass detection, accessed August 28, 2025, [https://www.bleepingcomputer.com/news/security/phishing-sites-now-detect-virtual-machines-to-bypass-detection/](https://www.bleepingcomputer.com/news/security/phishing-sites-now-detect-virtual-machines-to-bypass-detection/)  
27. Windows Sandbox against JavaScript VM Detection \- CatchingPhish, accessed August 28, 2025, [https://catchingphish.com/posts/f/windows-sandbox-against-browser-vm-detection](https://catchingphish.com/posts/f/windows-sandbox-against-browser-vm-detection)  
28. Phishing Sites Now Detect Virtual Machines Using JavaScript to Bypass Detection, accessed August 28, 2025, [https://social.cyware.com/news/phishing-sites-now-detect-virtual-machines-using-javascript-to-bypass-detection-29c44a7d](https://social.cyware.com/news/phishing-sites-now-detect-virtual-machines-using-javascript-to-bypass-detection-29c44a7d)  
29. JavaScript Spots Virtual Machines on Phishing Sites | Integris, accessed August 28, 2025, [https://integrisit.com/new-javascript-trick-allows-phishing-sites-to-detect-virtual-machines/](https://integrisit.com/new-javascript-trick-allows-phishing-sites-to-detect-virtual-machines/)  
30. Can the accessed website detect if i'm using a Virtualized like machine vmware, vbox, etc?, accessed August 28, 2025, [https://stackoverflow.com/questions/5643014/can-the-accessed-website-detect-if-im-using-a-virtualized-like-machine-vmware](https://stackoverflow.com/questions/5643014/can-the-accessed-website-detect-if-im-using-a-virtualized-like-machine-vmware)  
31. What Is Browser Fingerprinting and How to Bypass it? \- ZenRows, accessed August 28, 2025, [https://www.zenrows.com/blog/browser-fingerprinting](https://www.zenrows.com/blog/browser-fingerprinting)  
32. Fingerprinting | web.dev, accessed August 28, 2025, [https://web.dev/learn/privacy/fingerprinting](https://web.dev/learn/privacy/fingerprinting)  
33. What is Browser Fingerprinting \- How Does It Work? \- SEON, accessed August 28, 2025, [https://seon.io/resources/browser-fingerprinting/](https://seon.io/resources/browser-fingerprinting/)  
34. Fingerprinting \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Glossary/Fingerprinting](https://developer.mozilla.org/en-US/docs/Glossary/Fingerprinting)  
35. What is CreepJS Browser Fingerprint and How to Bypass It \- Scrapfly, accessed August 28, 2025, [https://scrapfly.io/blog/posts/browser-fingerprinting-with-creepjs](https://scrapfly.io/blog/posts/browser-fingerprinting-with-creepjs)  
36. Using debugger to tell if DevTools is open \- ardislu.dev, accessed August 28, 2025, [https://ardislu.dev/devtools-detection](https://ardislu.dev/devtools-detection)  
37. Avoid the detection of "whether Chrome DevTools(console) is open" \- Stack Overflow, accessed August 28, 2025, [https://stackoverflow.com/questions/38910904/avoid-the-detection-of-whether-chrome-devtoolsconsole-is-open](https://stackoverflow.com/questions/38910904/avoid-the-detection-of-whether-chrome-devtoolsconsole-is-open)  
38. Find out whether Chrome console is open \- Stack Overflow, accessed August 28, 2025, [https://stackoverflow.com/questions/7798748/find-out-whether-chrome-console-is-open](https://stackoverflow.com/questions/7798748/find-out-whether-chrome-console-is-open)  
39. sindresorhus/devtools-detect: Detect if DevTools is open ... \- GitHub, accessed August 28, 2025, [https://github.com/sindresorhus/devtools-detect](https://github.com/sindresorhus/devtools-detect)  
40. Aankh \- A real time proctoring solution \- Tushar Nankani, accessed August 28, 2025, [https://tusharnankani.github.io/Aankh/](https://tusharnankani.github.io/Aankh/)  
41. How can a website detect if your chrome devtools is open? \- Reddit, accessed August 28, 2025, [https://www.reddit.com/r/webdev/comments/1jxx5if/how\_can\_a\_website\_detect\_if\_your\_chrome\_devtools/](https://www.reddit.com/r/webdev/comments/1jxx5if/how_can_a_website_detect_if_your_chrome_devtools/)  
42. Constructor Proctor SDK, accessed August 28, 2025, [https://docs.constructor.tech/articles/proctor-developer-guide/constructor-proctor-sdk](https://docs.constructor.tech/articles/proctor-developer-guide/constructor-proctor-sdk)  
43. AutoProctor: Automated Online Test Proctoring, accessed August 28, 2025, [https://www.autoproctor.co/](https://www.autoproctor.co/)  
44. Api Integration \- BlinkExam, accessed August 28, 2025, [https://blinkexam.com/api-integration/](https://blinkexam.com/api-integration/)  
45. Honorlock | IT@UMN | The people behind the technology, accessed August 28, 2025, [https://it.umn.edu/services-technologies/honorlock](https://it.umn.edu/services-technologies/honorlock)  
46. Solutions | All-in-One Assessment Software \- ExamSoft, accessed August 28, 2025, [https://examsoft.com/solutions/](https://examsoft.com/solutions/)  
47. utsa.screenstepslive.com, accessed August 28, 2025, [https://utsa.screenstepslive.com/a/1927250-getting-started-with-honorlock-faculty\#:\~:text=Flexible%2C%20Multi%2DTiered%20Proctoring%20with,time%20intervention%20when%20AI%20flags](https://utsa.screenstepslive.com/a/1927250-getting-started-with-honorlock-faculty#:~:text=Flexible%2C%20Multi%2DTiered%20Proctoring%20with,time%20intervention%20when%20AI%20flags)