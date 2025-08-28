# **The Browser as a Sensor: Leveraging Web APIs for Device Fingerprinting and Behavioral Anomaly Detection**

## **Introduction**

### **The Modern Browser: From Document Viewer to Instrumented Sensor Array**

The contemporary web browser has undergone a profound transformation, evolving from its origins as a passive renderer of static documents into a sophisticated, high-performance application runtime. This evolution has been driven by a suite of powerful Web Application Programming Interfaces (APIs) designed to enable rich, interactive, and near-native application experiences directly within the browser.1 These APIs grant web applications unprecedented access to the underlying client system, exposing everything from the device's core hardware capabilities to its real-time physical orientation and user interaction patterns. This report posits that the modern browser can be conceptualized as an instrumented sensor array, a platform that provides a continuous stream of data about its host environment and operator.  
This advanced capability, however, presents a fundamental duality. While APIs for GPU acceleration, device motion, and network status are engineered to enhance functionality and user experience, they simultaneously create a vast and detailed surface for device profiling and behavioral monitoring.2 Every piece of information exposed to improve application performance or responsiveness can also be collected, aggregated, and analyzed to construct a unique digital identity for the browser and, by extension, its user. This dual-use nature of modern Web APIs is the central theme of this analysis.

### **Client-Side vs. Server-Side Intelligence**

Understanding the architecture of data collection and analysis requires a clear distinction between client-side and server-side processes. Client-side APIs, the primary focus of this report, execute directly within the user's web browser.4 They are the data acquisition layer, providing immediate, low-level access to the local device environment. This includes querying hardware specifications, monitoring sensor inputs, and capturing user interactions. The code for these APIs is delivered to and runs on the user's machine, making it inherently untrusted and susceptible to inspection or manipulation.4  
Conversely, server-side APIs operate on remote servers controlled by the application provider.4 Their role is to receive the telemetry collected by client-side scripts and perform the heavy lifting of analysis, correlation, and decision-making. This includes executing complex business logic, running machine learning models for anomaly detection, storing and comparing device fingerprints, and ultimately enforcing security policies.5 The client-server model is foundational: the client gathers raw signals from its environment, and the server interprets these signals to derive security intelligence.5 The veracity and quality of the signals gathered on the client-side are therefore of paramount importance to the integrity of the entire security posture.

### **The Nexus of Security, Privacy, and Functionality**

The capabilities afforded by these browser APIs exist at the nexus of three competing interests: functionality, security, and privacy. The legitimate and critical need for robust security measures—such as preventing financial fraud, mitigating automated bot attacks, and ensuring the integrity of user accounts—drives the adoption of sophisticated device identification and behavioral analysis techniques.7 These systems rely on the very data that browser APIs expose to distinguish legitimate human users from malicious actors.  
However, the same mechanisms that enable this security also facilitate persistent, non-consensual user tracking, posing a significant threat to individual privacy.3 The ability to create a stable and unique identifier for a user's device without their knowledge or consent is a powerful tool for cross-site tracking, targeted advertising, and the construction of detailed behavioral profiles. This report will navigate this inherent tension, providing a deep technical analysis of the APIs and techniques employed, their application in modern security frameworks, and a critical evaluation of their profound limitations and ethical implications.

## **Part I: The Data Collection Layer: An Inventory of Browser-Based Information APIs**

This section provides a granular, technical inventory of the principal browser APIs that serve as the foundation for device profiling and behavioral analysis. For each API, the analysis details the specific information it exposes, its intended purpose, its utility as a profiling vector, and the countermeasures deployed by browser vendors to mitigate its privacy risks.

### **1.1 Core System Profiling: CPU and Memory**

The central processing unit (CPU) and system memory (RAM) are fundamental components of any computing device. Browser APIs provide a limited, and increasingly restricted, window into these core hardware attributes.

#### **navigator.hardwareConcurrency**

The navigator.hardwareConcurrency property is a read-only attribute that returns the number of logical processor cores available to run threads on the user's computer.11 Its primary, legitimate purpose is performance optimization; for example, a web application can use this value to determine the optimal number of Web Workers to spawn for parallel processing tasks, thereby maximizing throughput without over-saturating the CPU.11  
From a device profiling perspective, the number of logical cores serves as a hardware attribute that contributes to a device's fingerprint. However, its utility for creating a highly unique identifier is deliberately constrained by browser vendors. Recognizing that a precise core count can be a strong identifying signal (e.g., distinguishing a high-end 16-core workstation from a standard 4-core laptop), major browsers actively clamp the value returned by this API. For instance, Safari may clamp the value to 2 on iOS devices and 8 on other systems, while other browsers may also cap it at a low number like 4 or 8\.11 This act of clamping is a direct and important example of a browser-level countermeasure against fingerprinting. It demonstrates a conscious design choice to sacrifice a degree of informational precision to enhance user privacy. Despite this limitation, the API is widely supported across all major browsers, making it a common, albeit low-entropy, signal in fingerprinting scripts.13

#### **navigator.deviceMemory**

The navigator.deviceMemory API provides a mechanism for web applications to ascertain the approximate amount of RAM on the user's device, reported in gigabytes.12 The intended use case is adaptive content delivery. A website can query this value and serve a "lite" version of its application—with lower-resolution images, simpler animations, or fewer features—to users on low-memory devices, thereby improving performance and user experience.16  
This information can be accessed client-side via JavaScript or, more efficiently, communicated to the server via the Device-Memory HTTP request header. For the header to be sent, the server must first opt-in by sending an Accept-CH: Device-Memory response header, a mechanism known as Client Hints.17 Like  
hardwareConcurrency, the value returned by navigator.deviceMemory is intentionally coarsened to mitigate fingerprinting risks. The API does not return the precise amount of RAM; instead, it rounds the value down to the nearest power of two, resulting in a limited set of possible values such as 0.25, 0.5, 1, 2, 4, or 8\.16 This generalization significantly reduces the entropy of the signal, making it less useful for uniquely identifying a user while still being sufficient for its primary goal of performance tuning. Browser support for this API is largely confined to Chromium-based browsers (like Chrome and Edge), with notable absence in Firefox and Safari, which limits its utility for universal device profiling.18  
The deliberate clamping and coarsening of these core hardware APIs are not isolated incidents. They represent a broader strategy by browser vendors to manage a "privacy budget." This concept involves actively limiting the total amount of potentially identifying information that web APIs can reveal. As vendors close off these direct, high-precision information channels, they force trackers and security analysts to pivot towards more indirect, inferential methods of profiling, such as analyzing the output of complex rendering operations. This dynamic creates a continuous technological arms race between those seeking to profile devices and those seeking to protect user privacy.

### **1.2 Graphics Subsystem Analysis via WebGL and WebGPU**

While direct queries for CPU and RAM are restricted, the graphics subsystem offers a much richer and more revealing source of device-specific information. The WebGL (Web Graphics Library) and its successor, WebGPU, are low-level JavaScript APIs that grant web applications direct access to the device's Graphics Processing Unit (GPU) for hardware-accelerated 2D and 3D rendering.20 This access, essential for modern gaming, data visualization, and other graphically intensive applications, inadvertently exposes a wealth of highly specific details about the underlying graphics hardware and software stack.  
Through the WebGL rendering context, a script can programmatically query a variety of parameters that are extremely valuable for fingerprinting:

* **Vendor and Renderer Strings:** These are arguably the most potent data points. A call to gl.getParameter(gl.RENDERER) and gl.getParameter(gl.VENDOR) can return precise strings identifying the GPU hardware. Examples include "ANGLE (NVIDIA, NVIDIA GeForce RTX 2060 SUPER Direct3D11 vs\_5\_0 ps\_5\_0, D3D11)" on a Windows machine or "Apple GPU" on a macOS device.23 These strings provide a high-entropy signal that can often uniquely identify the specific GPU model.  
* **The Role of ANGLE:** On the Windows operating system, browsers like Chrome and Firefox often utilize the ANGLE (Almost Native Graphics Layer Engine) as a translation layer. ANGLE converts WebGL's OpenGL ES calls into the platform's native Direct3D calls, which generally have better driver support.22 The presence of "ANGLE" in the renderer string, along with details about the Direct3D version, adds another layer of specificity that further increases the fingerprint's uniqueness.  
* **Driver and Shader Information:** Scripts can also query for the version of the GLSL (OpenGL Shading Language) supported, as well as a list of all supported WebGL extensions. The exact combination of supported extensions and the reported shader precision can vary significantly between different GPU models, driver versions, and operating systems, providing further identifying characteristics.24  
* **Hardware Limits:** WebGL exposes numerous parameters that reflect the physical capabilities and limits of the GPU. These include values like MAX\_TEXTURE\_SIZE, MAX\_VIEWPORT\_DIMS, MAX\_VERTEX\_UNIFORM\_VECTORS, and various buffer size limits.26 The specific combination of these dozens of numerical limits creates a detailed and highly characteristic hardware profile.

The sheer volume and specificity of the data exposed by the WebGL API make it one of the most powerful vectors for device fingerprinting currently available.

### **1.3 Sensing the Device's State and Environment**

Beyond static hardware specifications, browsers can also provide real-time information about the device's current state and operating environment, such as its network connection, battery status, and screen orientation.

#### **Network Information API (navigator.connection)**

This API offers insights into the user's network connection, enabling applications to adapt their behavior accordingly.27 The  
navigator.connection object exposes several useful properties:

* effectiveType: An estimation of the connection quality, returning strings like 'slow-2g', '2g', '3g', or '4g'.29  
* downlink: An estimated download bandwidth in megabits per second (Mbps).29  
* rtt: The estimated effective round-trip time in milliseconds.29  
* saveData: A boolean indicating if the user has enabled a data-saving mode in their browser.29

The primary use case is to optimize content delivery—for instance, serving lower-quality video or deferring non-critical asset loading on a slow or metered connection. For security analysis, these properties provide valuable context. A sudden, drastic change in effectiveType or rtt during a user session could be an indicator of suspicious activity, such as a session being relayed through a different network. It is important to distinguish this API from the older navigator.onLine property, which is a simple boolean that is widely considered unreliable, as it can return true even if the device is connected to a LAN without actual internet access.30

#### **Battery Status API (navigator.getBattery())**

The Battery Status API was designed to allow web applications to conserve energy by, for example, reducing background activity when the device's battery is low.31 It returns a  
Promise that resolves with a BatteryManager object, which exposes properties such as:

* charging: A boolean indicating if the device is currently plugged in and charging.31  
* level: The battery charge level, represented as a floating-point number between 0.0 (empty) and 1.0 (full).31  
* chargingTime: The estimated time in seconds until the battery is fully charged.31  
* dischargingTime: The estimated time in seconds until the battery is depleted.31

While useful for power management, this API became a subject of significant privacy concerns. Researchers demonstrated that the combination of the highly precise level value and the dischargingTime could be used as a powerful, short-term, cross-site tracking identifier. Because these values are unique to a device at a specific moment, they could be used to link a user's activity across different websites visited within a short time frame. Due to these privacy risks, the API has been deprecated and removed by some major browsers, most notably Firefox.33 Its current support is limited, making it an unreliable signal for any system requiring universal applicability.35

#### **Screen Orientation API (screen.orientation)**

This API provides information about the current orientation of the device's screen and allows an application to lock the orientation to a specific state.38 The primary property is  
screen.orientation.type, which returns a string such as 'portrait-primary', 'portrait-secondary', 'landscape-primary', or 'landscape-secondary'.38 Applications can also listen for the  
change event to react dynamically when the user rotates their device.  
The intended purpose is to enable responsive web design, allowing layouts to adapt seamlessly between portrait and landscape modes. From a behavioral analysis perspective, it provides a clear signal of device type; frequent orientation changes are characteristic of handheld mobile devices. For Progressive Web Apps (PWAs), a default orientation can be specified in the web app manifest file.39 The API enjoys wide and stable support across modern browsers, making it a reliable contextual signal.40

### **1.4 Accessing Physical Motion and Orientation**

For devices equipped with accelerometers, gyroscopes, and magnetometers—primarily smartphones and tablets—browsers can expose detailed data about physical motion and orientation. This creates a dichotomy between stable, low-entropy APIs like screen.orientation and these more powerful, high-entropy sensor APIs. The latter pose greater privacy risks and are consequently placed behind stricter security barriers by browser vendors, such as requiring a secure (HTTPS) context and, increasingly, explicit user permission before activation.

#### **DeviceOrientationEvent**

This event is fired when the device's physical orientation changes relative to the Earth's coordinate frame.43 The data is derived from the device's magnetometer and accelerometer and provides three key values:

* alpha: The rotation around the z-axis (compass direction), from 0 to 360 degrees.43  
* beta: The front-to-back tilt around the x-axis, from \-180 to 180 degrees.43  
* gamma: The left-to-right tilt around the y-axis, from \-90 to 90 degrees.43

This allows for the creation of web experiences that react to how the user is holding and moving their device, such as in mobile games or augmented reality applications. While it is supported on most mobile browsers, its use for passive data collection is limited because modern browsers, particularly Safari on iOS, now require the website to explicitly request permission from the user before it can receive these events.46

#### **DeviceMotionEvent**

This event provides information about the acceleration and rotation rate of the device, firing when motion is detected.44 The event object contains several properties:

* acceleration: An object with x, y, and z properties representing acceleration in meters per second squared (m/s2), excluding the force of gravity.49  
* accelerationIncludingGravity: Similar to acceleration, but it includes the effect of gravity. This is useful for determining a baseline orientation.49  
* rotationRate: An object with alpha, beta, and gamma properties representing the rate of rotation in degrees per second around the respective axes.45  
* interval: The time interval in milliseconds at which the data is being sampled from the device's sensors.49

This API can provide rich contextual data for behavioral analysis. For example, it can be used to determine if a device is being held and moved by a human, is sitting stationary on a desk, or is subject to the kind of perfectly stable, motionless state characteristic of an emulator running in a data center. Similar to DeviceOrientationEvent, its use is often gated by user permissions, making it less reliable for covert, large-scale data gathering.51  
**Table 1: Summary of Key Browser APIs for Device Profiling**

| API / Property | Information Provided | Fingerprinting Utility (Entropy/Stability) | Browser Support & Limitations |
| :---- | :---- | :---- | :---- |
| navigator.hardwareConcurrency | Number of logical CPU cores | Low Entropy (clamped), High Stability | Widely supported, but value is capped by browsers to prevent tracking.11 |
| navigator.deviceMemory | Approximate device RAM (GB) | Low Entropy (coarsened), High Stability | Chromium-based browsers only. Value is rounded to nearest power of two.17 |
| WebGL getParameter(RENDERER) | GPU vendor and model string | Very High Entropy, Medium Stability (driver updates) | Widely supported. A primary vector for hardware identification.22 |
| navigator.connection.effectiveType | Effective network connection type ('4g', '3g', etc.) | Low Entropy, Low Stability (dynamic) | Widely supported. Provides contextual rather than identifying information.29 |
| BatteryManager.level | Precise battery charge level (0.0-1.0) | High Entropy (transient), Low Stability | Deprecated/removed in some browsers (e.g., Firefox) due to privacy risks.33 |
| screen.orientation.type | Screen orientation ('portrait-primary', etc.) | Low Entropy, Low Stability (dynamic) | Widely supported. Indicates device type and usage context.40 |
| DeviceMotionEvent.acceleration | Device acceleration (m/s2) on 3 axes | High Entropy (dynamic), Low Stability | Widely supported on mobile, but requires explicit user permission in many browsers.52 |
| DeviceOrientationEvent.alpha | Device compass heading (0-360°) | High Entropy (dynamic), Low Stability | Widely supported on mobile, but requires explicit user permission in many browsers.43 |

## **Part II: Constructing the Digital Identity: From Data Points to Fingerprints**

The raw data points collected via the APIs described in Part I are the building blocks of a more cohesive and persistent identifier known as a browser fingerprint. This section explores the principles behind fingerprinting and details the most advanced techniques used to create high-entropy digital identities that can track users across the web.

### **2.1 Principles of Browser Fingerprinting**

Browser fingerprinting is a stateless technique used to identify a particular browser or device by collecting a multitude of its configuration attributes and characteristics.2 Unlike cookies, which are stateful identifiers stored on the client's machine and can be easily viewed or deleted, a fingerprint is generated dynamically based on the inherent properties of the system itself. This makes it a far more persistent and covert method of tracking.3  
The effectiveness of any fingerprinting signal is measured by two key metrics:

* **Entropy:** This is a measure of the signal's uniqueness or diversity across a population. A high-entropy signal (like a specific GPU renderer string) can take on many different values, making it highly effective at distinguishing one user from another. A low-entropy signal (like the browser language) is shared by many users and is less useful for unique identification.54  
* **Stability:** This refers to the consistency of a signal over time for a single user. A stable signal (like the number of CPU cores) rarely changes, allowing a user to be reliably re-identified across multiple sessions. An unstable signal (like the browser window size) can change frequently and is less reliable for long-term tracking.55

The ideal fingerprinting vector is one that exhibits both high entropy and high stability. The methodology involves a script collecting as many of these data points as possible—ranging from the User-Agent string, screen resolution, and installed fonts to the more advanced hardware signals from Part I—and then combining them into a single string. This string is then passed through a cryptographic hash function (such as SHA-256) to produce a fixed-length, unique identifier: the browser fingerprint.56 This hash can be stored on a server and used to recognize the user on subsequent visits, even if they have cleared their cookies or are using a private browsing mode.

### **2.2 High-Entropy Fingerprinting Vectors**

While a basic fingerprint can be constructed from simple browser attributes, the most robust and difficult-to-evade techniques rely on more sophisticated, indirect methods of probing the client system. These methods have evolved from collecting a simple list of "what you have" to a more nuanced analysis of "how you do things." Instead of directly querying a hardware specification, which a browser might lie about to protect privacy, these advanced techniques assign the browser a complex task and then analyze the unique characteristics of the result. This form of "digital ballistics" reveals subtle, hardware-level idiosyncrasies that are extremely difficult to spoof without breaking the underlying API's functionality.

#### **Canvas Fingerprinting**

Canvas fingerprinting is a seminal technique that leverages the HTML5 \<canvas\> element. The process works as follows:

1. A script instructs the browser to draw a specific piece of content to a hidden \<canvas\> element. This content typically includes text with specific fonts and sizes, as well as various geometric shapes and colors.54  
2. The final rendered image is influenced by a combination of factors unique to the client system: the operating system, the graphics hardware (GPU), the graphics driver, and the browser's specific rendering engine. Subtle differences in font rendering, anti-aliasing algorithms, and color processing cause minute, pixel-level variations in the output image.58  
3. The script then calls the toDataURL() method on the canvas. This returns a Base64-encoded string representation of the canvas's binary pixel data.54  
4. This data URL string, which will be slightly different for each unique rendering stack, is then hashed to produce the final fingerprint.54

While the rendered images may appear identical to the human eye, the underlying pixel data is sufficiently diverse to serve as a high-entropy identifier.58 This technique effectively fingerprints the entire graphics stack of the device.

#### **WebGL Fingerprinting**

WebGL fingerprinting is a more advanced and powerful evolution of the canvas technique. Instead of rendering a simple 2D image, it utilizes the WebGL API to render a complex 3D scene within a hidden canvas.24 This process exercises the GPU much more rigorously and exposes a richer set of hardware-specific characteristics.  
The resulting fingerprint is a composite of multiple data sources, making it exceptionally robust:

* **Explicit Parameters:** As detailed in section 1.2, the script directly queries the WebGL context for a long list of parameters. This includes the highly identifying vendor and renderer strings, the list of supported extensions, shader language versions, and dozens of hardware capability limits.24  
* **Rendered Image Hash:** After rendering the 3D scene (which often involves complex shaders and textures designed to elicit unique hardware behaviors), the script uses the readPixels() method to extract the pixel data from the resulting image. This data is then hashed, just as in canvas fingerprinting.25

WebGL fingerprinting is superior to its 2D canvas counterpart because it probes the hardware at a much deeper level and combines both explicit configuration data and implicit rendering output. This makes it extremely difficult to spoof. For example, an automated bot running in a virtualized environment might be able to fake its User-Agent string, but it cannot easily fake the WebGL renderer string, which will often reveal the underlying virtualized GPU (e.g., "Google SwiftShader") or a generic Mesa driver.23 This inconsistency between claimed identity and actual hardware signature is a powerful signal for detecting bots and other fraudulent activity.

#### **Audio Fingerprinting**

Audio fingerprinting introduces another independent vector for device identification by leveraging the Web Audio API. The technique works by generating a standardized audio signal (such as a low-frequency oscillator) and processing it through an AudioContext or, more commonly, an OfflineAudioContext to ensure consistent, clock-independent processing.59 The script applies various audio processing nodes (e.g., dynamics compressors, filters) to the signal.  
Subtle variations in the device's audio hardware (sound card, digital-to-analog converter) and the software stack (OS audio libraries, drivers) cause unique, measurable distortions and modifications to the output audio signal. The script extracts features from this processed signal—such as the amplitudes of specific frequency bins—and hashes them to create the fingerprint.59  
The power of modern fingerprinting lies not in any single technique, but in the strategic combination of multiple, independent—or "orthogonal"—vectors. A user might employ a browser extension designed to spoof their canvas fingerprint by adding random noise to the image data.58 However, it is highly unlikely that the same extension will also consistently spoof their WebGL renderer string and their AudioContext output. A sophisticated security system will collect fingerprints from all three orthogonal sources. An inconsistency among these signals—for instance, a canvas fingerprint that changes with every page load while the WebGL and audio fingerprints remain stable—is itself a powerful meta-signal indicating an attempt at evasion. By combining multiple independent vectors, the composite fingerprint becomes exponentially more robust and difficult for a malicious actor to defeat.  
**Table 2: Comparative Analysis of Advanced Fingerprinting Techniques**

| Technique | Principle of Operation | Key Data Sources | Relative Uniqueness (Entropy) | Relative Stability | Common Mitigation Strategies |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **Canvas Fingerprinting** | Hashing pixel data from a rendered 2D canvas image. | Browser rendering engine, OS font rendering, anti-aliasing algorithms, GPU/driver stack. | High | High | Browser privacy settings (e.g., Tor Browser), canvas-blocking extensions that add noise or return blank data.54 |
| **WebGL Fingerprinting** | Hashing rendered 3D scene data combined with explicit GPU parameters. | GPU vendor/renderer strings, supported extensions, shader precision, driver stack, hardware limits. | Very High | Medium to High | Disabling WebGL, using generic or software-based drivers (which is itself a signal), spoofing renderer strings (difficult to do consistently).23 |
| **Audio Fingerprinting** | Analyzing the output of a standardized audio signal processed through the Web Audio API. | Audio hardware (sound card), OS audio libraries, driver stack. | Medium to High | Very High | Browser features that introduce randomization into the Audio API's output. Less common than canvas/WebGL mitigation. |

## **Part III: Behavioral Biometrics: Analyzing the Human-Device Interaction Layer**

While static device fingerprints are powerful for identifying a specific machine, they cannot distinguish between different users of that machine or detect when a legitimate user's session has been hijacked. To address this, security systems employ behavioral biometrics, which analyze the dynamic patterns of user interaction. This represents a fundamental shift in focus from "what the device is" to "how the user acts," moving from static identification to dynamic, continuous verification.

### **3.1 Pointer and Mouse Dynamics**

The PointerEvent interface provides a modern, hardware-agnostic model for handling input from pointing devices, including mice, pens/styli, and touchscreens.61 It subsumes and extends the older  
MouseEvent interface, which captures traditional mouse interactions.63 By capturing a continuous time-series stream of these events, systems can build a detailed biometric profile of a user's motor skills.  
Key behavioral metrics derived from pointer events include:

* **Movement Patterns:** A stream of pointermove or mousemove events can be analyzed to calculate kinematic properties such as velocity, acceleration, and jerk (the rate of change of acceleration). The geometric properties of the cursor's path, such as its straightness or curvature, and the frequency and duration of pauses are also strong indicators. Human mouse movements are typically characterized by subconscious, curved trajectories and non-uniform speed profiles described by Fitts's Law, whereas automated bots often exhibit unnaturally perfect straight-line movements and constant velocity.63  
* **Click Characteristics:** The time elapsed between a pointerdown and a pointerup event on the same target element provides the click duration. For more advanced input devices like styli or certain touchscreens, the PointerEvent interface also provides properties like pressure (the normalized force of the contact) and tiltX/tiltY (the angle of the stylus), which add further dimensions to the behavioral profile.66  
* **Interaction Anomalies:** The detection of anomalous pointer behavior is fundamentally a time-series analysis problem. The raw stream of event data (coordinates, timestamps, pressure values) is fed into anomaly detection models. These models are trained on large datasets of legitimate human behavior to establish a baseline "norm".67 Deviations from this norm, such as impossibly fast movements between two points on the screen, a series of clicks with perfectly identical timing, or programmatic, repetitive patterns, can be flagged as non-human.68

### **3.2 Keystroke Dynamics**

Keystroke dynamics, or typing biometrics, is a behavioral biometric that analyzes the manner and rhythm in which an individual types.69 The foundational data is captured using the  
KeyboardEvent interface, specifically the keydown and keyup events. The older keypress event is deprecated and should not be used for modern applications.71  
The core biometric timings extracted from the event stream are:

* **Dwell Time:** The duration a key is held down, measured as the time between the keydown event and the corresponding keyup event for a single key.70  
* **Flight Time:** The time between releasing one key and pressing the next, measured as the time between the keyup of the first key and the keydown of the second key. This is often analyzed for specific key pairs (digraphs) or triplets (trigraphs).70

The unique cadence of a user's typing—the combination of their dwell and flight times for various letter combinations—forms a distinctive biometric template. This template can be used in several security applications:

* **One-Time and Two-Factor Authentication (2FA):** At the point of login, a user's typing pattern as they enter their password or a passphrase can be compared against a pre-enrolled template. A successful match can serve as a passive, frictionless second authentication factor.70  
* **Continuous Authentication:** Throughout a user's session, the system can passively monitor their typing in text fields (e.g., composing an email, filling out a form). If the typing rhythm deviates significantly from the user's established baseline, it could indicate that the session has been hijacked by another individual. The system can then trigger a security response, such as forcing re-authentication or terminating the session.70

Research has shown that machine learning models, particularly ensemble methods like Random Forest, can achieve high accuracy in distinguishing users based on their keystroke patterns.73 The primary challenge, however, is intra-user variability. A single user's typing rhythm can be affected by numerous factors, including fatigue, mood, posture, distractions, or switching between different keyboards (e.g., a mechanical desktop keyboard versus a laptop keyboard).69 Robust systems must be able to account for this natural variation to avoid high false rejection rates.

### **3.3 Correlating Sensor Data with User Behavior**

The rich data streams from device sensors, such as those provided by DeviceMotionEvent and DeviceOrientationEvent, can provide crucial context for interpreting user interaction data. By correlating physical motion with on-screen actions, a system can build a more holistic and reliable picture of the user's context, making it easier to spot anomalies.  
For example:

* **Legitimate Mobile User:** A session with a mobile User-Agent string, frequent pointermove events generated by touch, and a continuous stream of subtle, low-amplitude data from DeviceMotionEvent is highly consistent with a human user holding and interacting with a smartphone.  
* **Stationary Desktop User:** A session with a desktop User-Agent, mouse-based pointermove events, and a complete absence of any DeviceMotionEvent data is consistent with a user working at a desk.  
* **Anomalous Emulator:** A session that reports a mobile User-Agent but shows perfectly stable, zero-value data from DeviceMotionEvent for the entire session duration is a strong indicator of an Android emulator running in a stationary server environment. The lack of "human noise" from the sensors contradicts the claimed device type.

This cross-correlation of interaction data and physical sensor data allows security systems to move beyond analyzing individual signals in isolation and instead look for logical inconsistencies in the overall device and user profile.

## **Part IV: Applications in Security and Risk Management**

The synthesis of static device fingerprinting and dynamic behavioral biometrics provides a powerful toolkit for addressing a range of critical security challenges. This section details the practical application of these techniques in advanced bot detection, proactive fraud prevention, and the emerging paradigm of continuous authentication.

### **4.1 Advanced Bot and Emulator Detection**

Modern bot detection has evolved beyond simple IP blacklisting or User-Agent string validation. It employs a multi-layered approach that seeks to find logical inconsistencies across the full spectrum of a device's profile.8 The core principle is that while bots can easily spoof high-level identifiers, it is exceedingly difficult for them to perfectly emulate the complex, low-level interactions between hardware, drivers, the operating system, and the browser.  
Key detection vectors include:

* **Fingerprint Inconsistencies:** This is the most powerful technique for unmasking sophisticated bots. A security system "triangulates" data from multiple sources and looks for contradictions. The classic example is a mismatch between the User-Agent string, which might claim the user is on "Chrome on Android," and the WebGL renderer string, which reveals a desktop-class GPU like an "NVIDIA GeForce RTX" or a known software renderer like "Google SwiftShader" or "Mesa/X11" used in virtualized environments.23 Such a contradiction is a near-definitive indicator of a spoofed environment.  
* **Automation Tool Signatures:** Widely used browser automation frameworks like Selenium, Puppeteer, and Playwright, which are popular for web scraping and other bot activities, often leave tell-tale artifacts in the browser's JavaScript environment. For example, they may add specific properties to the navigator object (e.g., navigator.webdriver) or exhibit characteristic timing patterns that can be detected by specialized scripts.74  
* **Behavioral Deficiencies:** Many bots, particularly those designed for speed and scale, fail to generate plausible human-like interaction data. They may not produce any pointermove events between clicks, or their mouse movements may be perfectly linear. They lack the natural rhythm of human typing and fail to generate the subtle "human noise" from device sensors. The complete absence of these expected behavioral signals is a strong indicator of automation.57  
* **Environmental Anomalies:** Bots often run in headless browsers or virtualized environments. These environments may lack support for certain browser APIs, return generic or default values for hardware queries, or exhibit performance characteristics that are inconsistent with the claimed device type.7

### **4.2 Proactive Fraud Prevention**

In the domains of e-commerce and financial services, device intelligence derived from fingerprinting and behavioral analysis is a cornerstone of modern fraud prevention. Third-party fraud detection APIs and platforms heavily rely on these signals to generate real-time risk scores for user actions like logins, account creation, and transactions.75  
This intelligence is applied to detect various fraud scenarios:

* **Account Takeover (ATO):** When a user attempts to log in, the system generates a fingerprint of their device and compares it to a list of known, trusted devices for that account. If a login attempt comes from a completely new and unrecognized device fingerprint, especially when combined with other risk factors like an unusual geographic location, the risk score is significantly elevated. This can trigger a step-up authentication challenge, such as requiring a one-time password (OTP), before granting access.74  
* **Carding and Payment Fraud:** In a carding attack, fraudsters use bots to test thousands of stolen credit card numbers on a merchant's website. These attacks are often characterized by a single device (and thus a single, stable device fingerprint) rapidly cycling through many different user accounts or payment credentials. The system can identify this one-to-many relationship and block the device fingerprint after a certain threshold of failed attempts, mitigating the attack.74  
* **New Account Fraud:** Fraudsters often create large numbers of fake accounts for purposes like bonus abuse or spreading spam. These activities can be detected by identifying high-risk signals at the point of registration. Such signals include the use of a disposable email address domain, an IP address from a data center, and a device fingerprint that has been previously associated with fraudulent activity or that exhibits signs of being a virtualized environment.76

### **4.3 Continuous and Passive Authentication**

The traditional model of security, which relies on a single authentication event at the beginning of a session, is increasingly seen as insufficient. Continuous authentication is an emerging paradigm that aims to verify a user's identity passively and persistently throughout their entire session.70  
This is achieved primarily through behavioral biometrics. The system first builds a baseline profile of a legitimate user's typical interaction patterns, such as their typing rhythm and mouse movement dynamics. It then continuously monitors their behavior in the background. If, at any point during the session, the observed behavior deviates significantly from the established baseline—for instance, the typing speed and cadence suddenly change, or the mouse movements become robotic—it suggests that the session may have been hijacked. The system can then automatically intervene by logging the user out, locking the session, or requiring them to re-authenticate.69 This approach provides a higher level of security against threats like session hijacking or walk-up attacks (where an attacker gains access to an already logged-in but unattended machine), while offering a more seamless user experience than traditional methods like short session timeouts.  
The evolution of these security applications highlights a broader trend: the move away from static, binary security checks toward a dynamic, probabilistic model of risk assessment. A new device fingerprint or a slightly altered typing pattern does not result in a simple "allow" or "deny" decision. Instead, each signal, positive or negative, contributes to a continuously updated risk score for the session.76 Security actions are then triggered based on this fluid, context-aware score, allowing for a more nuanced and effective response to potential threats.68

## **Part V: The Broader Context: Limitations, Evasion, and Ethical Imperatives**

While the techniques of device fingerprinting and behavioral analysis offer powerful security benefits, their implementation is fraught with technical challenges, an ongoing battle against evasion, and profound ethical and regulatory questions. This final section provides a critical analysis of these broader contextual factors.

### **5.1 The Cat-and-Mouse Game: Evasion and Mitigation**

The ecosystem of device fingerprinting is a dynamic arms race between those seeking to identify devices and those seeking to evade identification. The effectiveness of fingerprinting is constrained by several inherent limitations.

* **Limitations of Fingerprinting:**  
  * **Stability:** A device fingerprint is not immutable. Software updates to the browser or operating system, updates to graphics drivers, or even changes to user-level settings can alter one or more attributes of the fingerprint. This can cause a legitimate returning user to appear as a new user, leading to false negatives and potential friction, such as unnecessary security challenges.55  
  * **Uniqueness:** While high-entropy fingerprints can distinguish between a vast number of devices, they are not guaranteed to be globally unique. Fingerprint collisions can and do occur, particularly among users who have very common hardware and software configurations (e.g., identical models of a popular laptop running the latest version of Windows and Chrome).54  
* **Browser-Level Countermeasures:** Browser vendors are actively involved in this arms race and have implemented several countermeasures to thwart fingerprinting:  
  * **Value Clamping and Generalization:** As previously discussed, browsers intentionally reduce the precision of certain APIs. They clamp the value of navigator.hardwareConcurrency, coarsen the value of navigator.deviceMemory, and have deprecated the high-precision Battery Status API entirely.11 This is a deliberate strategy to reduce the entropy of easily accessible signals.  
  * **Privacy-Preserving Browsers:** Specialized browsers like the Tor Browser are designed with fingerprinting resistance as a core principle. They attempt to standardize the configuration of all users to make them look as similar as possible. This includes using standardized screen resolutions, font lists, and actively blocking or providing blank data for fingerprinting vectors like the \<canvas\> element.54  
* **User-Level Evasion:** Technically savvy users can also take steps to evade fingerprinting. This includes using browser extensions like CanvasBlocker, which adds random noise to canvas data to prevent a stable fingerprint from being generated, or disabling JavaScript entirely, though the latter will break most modern websites.55 However, sophisticated detection systems can often identify the presence of these tools, and the act of tampering with a fingerprint can itself be treated as a high-risk signal.

### **5.2 The Privacy Paradox: Security vs. Pervasive Surveillance**

The central ethical dilemma of device fingerprinting is that the same techniques that provide robust security are also perfect tools for pervasive, non-consensual surveillance.3 The ability to uniquely and persistently identify a user's device without storing anything on it (like a cookie) allows advertising networks and data brokers to track users across different websites, building detailed profiles of their browsing habits, interests, and personal lives.  
This creates a significant privacy paradox:

* **Lack of Transparency and Consent:** Unlike cookies, which are now widely governed by consent banners under regulations like the GDPR and e-Privacy Directive, fingerprinting often occurs covertly, without the user's knowledge or explicit consent.10 The user is typically not informed that their hardware is being profiled, nor are they given a simple mechanism to opt-out.  
* **Building Detailed Profiles:** The persistence of fingerprints allows for the aggregation of data over long periods and across different contexts. This can be used to infer sensitive information about an individual, including their political leanings, health conditions, or financial status. This data can be used for hyper-targeted advertising, but also raises concerns about potential discrimination or manipulation.3

The proliferation of these techniques signals a fundamental shift in the default state of the web. In the past, a user could reasonably expect a degree of anonymity by clearing their cookies or using a new browser session. Fingerprinting erodes this expectation. The default state is becoming one of inherent identifiability, where every device carries an invisible, persistent "passport" tied to its fundamental characteristics. Anonymity is no longer the default but an exceptional state that must be actively pursued through specialized tools and technical expertise.

### **5.3 Regulatory Landscape and Ethical Best Practices**

The covert and powerful nature of fingerprinting places it on a direct collision course with modern data protection regulations.

* **Applicability of GDPR and CCPA:** Major privacy laws like Europe's General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA) have broad definitions of personal data. A browser fingerprint, because it can be used to single out and re-identify an individual, is widely considered to fall under the category of personally identifiable information (PII).3 This means that its collection and processing require a legitimate legal basis. While "legitimate interest" (such as fraud prevention) can be a basis under GDPR, the bar is high, and it is legally ambiguous whether this justifies the large-scale, silent collection of fingerprints without explicit user consent.  
* **Ethical Imperatives for Implementation:** Given the significant privacy implications, any organization that implements fingerprinting or behavioral analysis, even for legitimate security purposes, must adhere to a strict set of ethical principles 78:  
  * **Transparency:** Organizations must be transparent with users about the data they collect. Privacy policies should clearly and explicitly state that device and behavioral characteristics are being collected for security and fraud prevention purposes.  
  * **Purpose Limitation:** The data collected must be used strictly for the stated security purpose. Using this data for secondary purposes, such as marketing or user profiling, without separate and explicit consent is unethical and likely illegal under regulations like GDPR.  
  * **Data Minimization:** Only the minimum amount of data necessary to achieve the security objective should be collected. Systems should not engage in a "collect everything" approach.  
  * **Accountability and Security:** The organization is fully responsible for protecting the collected fingerprint and behavioral data from breaches. This sensitive data must be secured with the highest standards of care.

## **Conclusion and Future Outlook**

The modern web browser has become a powerful, dual-use instrument. Its rich set of APIs enables unprecedented application functionality while simultaneously providing a deep and detailed view into the user's hardware, software, and behavioral patterns. This report has demonstrated how these client-side signals, ranging from GPU renderer strings to the subtle rhythms of a user's typing, can be synthesized to construct robust device fingerprints and behavioral profiles. When applied judiciously, these techniques are indispensable tools for modern cybersecurity, forming the bedrock of advanced bot detection, proactive fraud prevention, and continuous authentication systems. The ability to detect anomalies and inconsistencies across multiple layers of a device's identity provides a formidable defense against a wide array of automated and human-driven threats.  
However, this power comes at a significant and unavoidable cost to user privacy. The very persistence and covertness that make fingerprinting effective for security also make it an ideal tool for pervasive surveillance. The ongoing technological arms race between fingerprinting techniques and browser-level privacy mitigations is set to continue, with security systems likely relying on increasingly sophisticated server-side machine learning to detect ever more subtle anomalies, while browser vendors work to further generalize API outputs and enforce stricter permission models.  
The future of this technology lies at the intersection of technical innovation, regulatory pressure, and ethical responsibility. The legal and ethical frameworks governing data privacy are still catching up to the capabilities of fingerprinting. Moving forward, a balanced approach is imperative. This will require a collaborative effort between security professionals, browser vendors, privacy advocates, and regulators to establish clear standards and ethical guardrails. The goal must be to harness the undeniable security benefits of this technology while ensuring that the web does not devolve into a space of default identifiability, thereby preserving the principles of privacy, autonomy, and consent that are fundamental to an open and trustworthy digital society.

#### **Works cited**

1. API \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Glossary/API](https://developer.mozilla.org/en-US/docs/Glossary/API)  
2. Fingerprinting \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Glossary/Fingerprinting](https://developer.mozilla.org/en-US/docs/Glossary/Fingerprinting)  
3. Stop Browser Fingerprinting: Prevent Tracking and Protect Your Privacy \- Freemindtronic, accessed August 28, 2025, [https://freemindtronic.com/stop-browser-fingerprinting-prevent-tracking-privacy/](https://freemindtronic.com/stop-browser-fingerprinting-prevent-tracking-privacy/)  
4. Client Side APIs VS. Server Side APIs | A Clear Comparison \- Apidog, accessed August 28, 2025, [https://apidog.com/blog/api-client-side-vs-api-server-side/](https://apidog.com/blog/api-client-side-vs-api-server-side/)  
5. What do client side and server side mean? \- Cloudflare, accessed August 28, 2025, [https://www.cloudflare.com/learning/serverless/glossary/client-side-vs-server-side/](https://www.cloudflare.com/learning/serverless/glossary/client-side-vs-server-side/)  
6. Web API \- Wikipedia, accessed August 28, 2025, [https://en.wikipedia.org/wiki/Web\_API](https://en.wikipedia.org/wiki/Web_API)  
7. What Is Browser Fingerprinting and How Does It Work? \- NordLayer, accessed August 28, 2025, [https://nordlayer.com/learn/browser-security/browser-fingerprinting/](https://nordlayer.com/learn/browser-security/browser-fingerprinting/)  
8. What Is Bot Fingerprinting? | Prophaze Learning Center, accessed August 28, 2025, [https://prophaze.com/learn/bots/what-is-bot-fingerprinting/](https://prophaze.com/learn/bots/what-is-bot-fingerprinting/)  
9. Why browser fingerprinting could be messing with your data \- RedTrack, accessed August 28, 2025, [https://www.redtrack.io/blog/why-browser-fingerprinting-could-be-messing-with-your-data/](https://www.redtrack.io/blog/why-browser-fingerprinting-could-be-messing-with-your-data/)  
10. What is browser fingerprinting? 7 ways to stop it (2025 guide) \- ExpressVPN, accessed August 28, 2025, [https://www.expressvpn.com/blog/browser-fingerprints/](https://www.expressvpn.com/blog/browser-fingerprints/)  
11. Navigator: hardwareConcurrency property \- MDN, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/hardwareConcurrency)  
12. Navigator \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Navigator](https://developer.mozilla.org/en-US/docs/Web/API/Navigator)  
13. Navigator API: hardwareConcurrency | Can I use... Support tables for HTML5, CSS3, etc, accessed August 28, 2025, [https://caniuse.com/mdn-api\_navigator\_hardwareconcurrency](https://caniuse.com/mdn-api_navigator_hardwareconcurrency)  
14. "navigator.hardwareConcurrency" | Can I use... Support tables for HTML5, CSS3, etc \- CanIUse, accessed August 28, 2025, [https://caniuse.com/\#search=navigator.hardwareConcurrency](https://caniuse.com/#search=navigator.hardwareConcurrency)  
15. navigator.hardwareConcurrency | Can I use... Support tables for HTML5, CSS3, etc, accessed August 28, 2025, [https://caniuse.com/hardwareconcurrency](https://caniuse.com/hardwareconcurrency)  
16. The Device Memory API | Blog \- Chrome for Developers, accessed August 28, 2025, [https://developer.chrome.com/blog/device-memory](https://developer.chrome.com/blog/device-memory)  
17. Device-Memory header \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Device-Memory](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Device-Memory)  
18. Navigator API: deviceMemory | Can I use... Support tables for HTML5, CSS3, etc \- CanIUse, accessed August 28, 2025, [https://caniuse.com/mdn-api\_navigator\_devicememory](https://caniuse.com/mdn-api_navigator_devicememory)  
19. "memory" | Can I use... Support tables for HTML5, CSS3, etc \- CanIUse, accessed August 28, 2025, [https://caniuse.com/\#search=memory](https://caniuse.com/#search=memory)  
20. WebGPU API \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/WebGPU\_API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)  
21. WebGL: 2D and 3D graphics for the web \- MDN, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/WebGL\_API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)  
22. en.wikipedia.org, accessed August 28, 2025, [https://en.wikipedia.org/wiki/WebGL](https://en.wikipedia.org/wiki/WebGL)  
23. The role of WebGL renderer in browser fingerprinting \- The Castle blog, accessed August 28, 2025, [https://blog.castle.io/the-role-of-webgl-renderer-in-browser-fingerprinting/](https://blog.castle.io/the-role-of-webgl-renderer-in-browser-fingerprinting/)  
24. What Is WebGL Fingerprinting and How to Bypass It \- ZenRows, accessed August 28, 2025, [https://www.zenrows.com/blog/webgl-fingerprinting](https://www.zenrows.com/blog/webgl-fingerprinting)  
25. What is WebGL Fingerprinting and How to Bypass It \- Medium, accessed August 28, 2025, [https://medium.com/@datajournal/webgl-fingerprinting-60893a9ca382](https://medium.com/@datajournal/webgl-fingerprinting-60893a9ca382)  
26. WebGL Browser Report \- WebGL Fingerprinting \- BrowserLeaks, accessed August 28, 2025, [https://browserleaks.com/webgl](https://browserleaks.com/webgl)  
27. Navigator.connection \- Web APIs | MDN, accessed August 28, 2025, [https://developer.mozilla.org.cach3.com/en-US/docs/Web/API/Navigator/connection](https://developer.mozilla.org.cach3.com/en-US/docs/Web/API/Navigator/connection)  
28. Navigator.connection \- Web APIs, accessed August 28, 2025, [https://udn.realityripple.com/docs/Web/API/Navigator/connection](https://udn.realityripple.com/docs/Web/API/Navigator/connection)  
29. NetworkInformation \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation)  
30. Navigator: onLine property \- MDN, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine)  
31. Battery Status \- What Web Can Do Today, accessed August 28, 2025, [https://whatwebcando.today/battery-status.html](https://whatwebcando.today/battery-status.html)  
32. Navigator: getBattery() method \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getBattery](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/getBattery)  
33. Exploring the Battery Status API in JavaScript \- DEV Community, accessed August 28, 2025, [https://dev.to/free\_programmers/exploring-the-battery-status-api-in-javascript-318f](https://dev.to/free_programmers/exploring-the-battery-status-api-in-javascript-318f)  
34. BatteryManager: level property \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/BatteryManager/level](https://developer.mozilla.org/en-US/docs/Web/API/BatteryManager/level)  
35. Battery Status API | Can I use... Support tables for HTML5, CSS3, etc \- CanIUse, accessed August 28, 2025, [https://caniuse.com/battery-status](https://caniuse.com/battery-status)  
36. "battery status api" | Can I use... Support tables for HTML5, CSS3, etc \- CanIUse, accessed August 28, 2025, [https://caniuse.com/\#search=battery%20status%20api](https://caniuse.com/#search=battery%20status%20api)  
37. "battery" | Can I use... Support tables for HTML5, CSS3, etc \- CanIUse, accessed August 28, 2025, [https://caniuse.com/\#search=battery](https://caniuse.com/#search=battery)  
38. Screen Orientation & Lock \- What Web Can Do Today, accessed August 28, 2025, [https://whatwebcando.today/screen-orientation.html](https://whatwebcando.today/screen-orientation.html)  
39. orientation \- Web app manifest \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/Progressive\_web\_apps/Manifest/Reference/orientation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/orientation)  
40. "screenorientation" | Can I use... Support tables for HTML5, CSS3, etc \- CanIUse, accessed August 28, 2025, [https://caniuse.com/\#search=screenorientation](https://caniuse.com/#search=screenorientation)  
41. "Screen Orientation" | Can I use... Support tables for HTML5, CSS3, etc \- CanIUse, accessed August 28, 2025, [https://caniuse.com/\#search=Screen%20Orientation](https://caniuse.com/#search=Screen%20Orientation)  
42. Screen Orientation | Can I use... Support tables for HTML5, CSS3, etc \- CanIUse, accessed August 28, 2025, [https://caniuse.com/screen-orientation](https://caniuse.com/screen-orientation)  
43. Window: deviceorientation event \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Window/deviceorientation\_event](https://developer.mozilla.org/en-US/docs/Web/API/Window/deviceorientation_event)  
44. Device Orientation and Motion \- W3C, accessed August 28, 2025, [https://www.w3.org/TR/orientation-event/](https://www.w3.org/TR/orientation-event/)  
45. Detecting device orientation \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Device\_orientation\_events/Detecting\_device\_orientation](https://developer.mozilla.org/en-US/docs/Web/API/Device_orientation_events/Detecting_device_orientation)  
46. DeviceOrientationEvent API | Can I use... Support tables for HTML5, CSS3, etc \- CanIUse, accessed August 28, 2025, [https://caniuse.com/mdn-api\_deviceorientationevent](https://caniuse.com/mdn-api_deviceorientationevent)  
47. Compass | ArcGIS API for JavaScript \- Forms & Applications, accessed August 28, 2025, [https://programs.iowadnr.gov/maps/apis/esri/library/arcgis\_js\_v36\_sdk/arcgis\_js\_v36\_sdk/arcgis\_js\_api/sdk/jssamples/mobile\_compass.html](https://programs.iowadnr.gov/maps/apis/esri/library/arcgis_js_v36_sdk/arcgis_js_v36_sdk/arcgis_js_api/sdk/jssamples/mobile_compass.html)  
48. DeviceOrientationEvent() constructor \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/DeviceOrientationEvent](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent/DeviceOrientationEvent)  
49. DeviceMotionEvent \- Web APIs, accessed August 28, 2025, [https://udn.realityripple.com/docs/Web/API/DeviceMotionEvent](https://udn.realityripple.com/docs/Web/API/DeviceMotionEvent)  
50. DeviceMotionEvent: acceleration property \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/acceleration](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/acceleration)  
51. DeviceMotionEvent API: \`requestPermission()\` static method | Can I use... Support tables for HTML5, CSS3, etc \- CanIUse, accessed August 28, 2025, [https://caniuse.com/mdn-api\_devicemotionevent\_requestpermission\_static](https://caniuse.com/mdn-api_devicemotionevent_requestpermission_static)  
52. DeviceMotionEvent API | Can I use... Support tables for HTML5, CSS3, etc \- CanIUse, accessed August 28, 2025, [https://caniuse.com/mdn-api\_devicemotionevent](https://caniuse.com/mdn-api_devicemotionevent)  
53. "devicemotion" | Can I use... Support tables for HTML5, CSS3, etc \- CanIUse, accessed August 28, 2025, [https://caniuse.com/\#search=devicemotion](https://caniuse.com/#search=devicemotion)  
54. Canvas fingerprinting \- Wikipedia, accessed August 28, 2025, [https://en.wikipedia.org/wiki/Canvas\_fingerprinting](https://en.wikipedia.org/wiki/Canvas_fingerprinting)  
55. Device fingerprint \- Wikipedia, accessed August 28, 2025, [https://en.wikipedia.org/wiki/Device\_fingerprint](https://en.wikipedia.org/wiki/Device_fingerprint)  
56. Canvas Fingerprinting: What Is It and How to Bypass It \- ZenRows, accessed August 28, 2025, [https://www.zenrows.com/blog/canvas-fingerprinting](https://www.zenrows.com/blog/canvas-fingerprinting)  
57. What is Device Fingerprinting and How Does it Contribute to Internet Security? \- Radware, accessed August 28, 2025, [https://www.radware.com/cyberpedia/bot-management/device-fingerprinting/](https://www.radware.com/cyberpedia/bot-management/device-fingerprinting/)  
58. Canvas Fingerprinting \- BrowserLeaks, accessed August 28, 2025, [https://browserleaks.com/canvas](https://browserleaks.com/canvas)  
59. Web Browser Fingerprinting Method Based on the Web Audio API \- Oxford Academic, accessed August 28, 2025, [https://academic.oup.com/comjnl/article/62/8/1106/5298776](https://academic.oup.com/comjnl/article/62/8/1106/5298776)  
60. How the Web Audio API is used for browser fingerprinting, accessed August 28, 2025, [https://fingerprint.com/blog/audio-fingerprinting/](https://fingerprint.com/blog/audio-fingerprinting/)  
61. Pointer events \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Pointer\_events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)  
62. Pointer Events in JavaScript \- DEV Community, accessed August 28, 2025, [https://dev.to/supminn/pointer-events-in-javascript-1lol](https://dev.to/supminn/pointer-events-in-javascript-1lol)  
63. Element: mousemove event \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove\_event](https://developer.mozilla.org/en-US/docs/Web/API/Element/mousemove_event)  
64. Element: mouseover event \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseover\_event](https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseover_event)  
65. Element: mousedown event \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Element/mousedown\_event](https://developer.mozilla.org/en-US/docs/Web/API/Element/mousedown_event)  
66. PointerEvent \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)  
67. Anomaly Detection in Time Series \- Neptune.ai, accessed August 28, 2025, [https://neptune.ai/blog/anomaly-detection-in-time-series](https://neptune.ai/blog/anomaly-detection-in-time-series)  
68. Creating an anomaly detection rule \- IBM, accessed August 28, 2025, [https://www.ibm.com/docs/en/qradar-on-cloud?topic=rules-creating-anomaly-detection-rule](https://www.ibm.com/docs/en/qradar-on-cloud?topic=rules-creating-anomaly-detection-rule)  
69. Keystroke dynamics \- Wikipedia, accessed August 28, 2025, [https://en.wikipedia.org/wiki/Keystroke\_dynamics](https://en.wikipedia.org/wiki/Keystroke_dynamics)  
70. Keystroke Dynamics \- Biometrics Solutions, accessed August 28, 2025, [https://www.biometric-solutions.com/keystroke-dynamics.html](https://www.biometric-solutions.com/keystroke-dynamics.html)  
71. KeyboardEvent \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)  
72. Element: keypress event \- MDN \- Mozilla, accessed August 28, 2025, [https://developer.mozilla.org/en-US/docs/Web/API/Element/keypress\_event](https://developer.mozilla.org/en-US/docs/Web/API/Element/keypress_event)  
73. Dynamic Keystroke for Authentication with Machine Learning Algorithms \- IEEE SecDev 2025, accessed August 28, 2025, [https://secdev.ieee.org/wp-content/uploads/2019/09/Final-Poster-COE-Final.pdf](https://secdev.ieee.org/wp-content/uploads/2019/09/Final-Poster-COE-Final.pdf)  
74. Browser Bot Detection Software \- Fingerprint, accessed August 28, 2025, [https://fingerprint.com/products/bot-detection/](https://fingerprint.com/products/bot-detection/)  
75. Payments API and fraud API to build your business \- Cybersource, accessed August 28, 2025, [https://www.cybersource.com/en-us/why-cybersource/developers.html](https://www.cybersource.com/en-us/why-cybersource/developers.html)  
76. Fraud Detection API: How It Works & Key Benefits for Your Business \- SEON, accessed August 28, 2025, [https://seon.io/resources/key-benefits-of-a-fraud-detection-api/](https://seon.io/resources/key-benefits-of-a-fraud-detection-api/)  
77. Top 13 Fraud Detection APIs for Digital Onboarding, accessed August 28, 2025, [https://www.transactionlink.io/blog/fraud-detection-apis-to-use](https://www.transactionlink.io/blog/fraud-detection-apis-to-use)  
78. Understanding the Ethics of Data Collection and Responsible Data Usage, accessed August 28, 2025, [https://www.ucumberlands.edu/blog/understanding-the-ethics-of-data-collection](https://www.ucumberlands.edu/blog/understanding-the-ethics-of-data-collection)  
79. Ethical Use of Tracking Software \- Public Relations Ethics \- Page Center Training, accessed August 28, 2025, [https://archive.pagecentertraining.psu.edu/public-relations-ethics/digital-ethics/lesson-2-digital-tools-and-ethics/ethical-use-of-tracking-software/](https://archive.pagecentertraining.psu.edu/public-relations-ethics/digital-ethics/lesson-2-digital-tools-and-ethics/ethical-use-of-tracking-software/)