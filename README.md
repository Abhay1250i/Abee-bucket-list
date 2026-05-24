#  Abee Bucket List

A visual bookmark manager that replaces your Chrome New Tab page with a stunning, high-performance, glassmorphic dashboard. Organize your links using interactive Kanban boards, customize your environment with a live wallpaper engine, and manage your daily bookmarks in style.

This is the **clean edition** configured with default layout boards and no preseeded personal bookmarks, making it perfect for custom setups.

![Abee saale Bucket List](icon128.png)

---

## ✨ Features

- **Glassmorphic Kanban Canvas:** Drag-and-drop links vertically or rearrange entire columns to create your perfect workspace layout.
- **Dynamic Live Wallpaper Engine:** Select from beautiful pre-compiled hardware-accelerated shaders or set custom streaming video backgrounds:
  - 🌌 *Deep Space* (twinkling stars and shooting stars)
  - 🎨 *Aurora* (slow color shifting gradients)
  - 🟢 *Matrix Rain* (digital rain falling code)
  - 🕸 *Neural Mesh* (interconnected particle web)
  - 🌇 *Synthwave* (retro neon sun & scrolling wireframe grid)
  - 🎞 *Custom* (upload your own local MP4/GIF wallpapers or supply streaming video URLs)
- **Privacy Mode:** Fast-blur all bookmark cards with one click (`Hidden` status) for screen sharing or public viewing.
- **Controls Pinning:** Pin edit/delete cards permanently or keep them hidden until hover.
- **Data Portability:** Export your entire setup into a standard portable JSON file with one click, or completely reset everything to clean slate.
- **Quick-Save Keyboard Shortcuts:** 
  - `Ctrl + Shift + Y` (Windows) / `Cmd + Shift + Y` (Mac): Quick-save your currently active tab directly into your active workspace board.
  - `Ctrl + N`: Open the manual "Add Link" bookmark window.
  - `Ctrl + K`: Open and slide out the real-time title search box.
  - `Escape`: Instantly close any open modals or settings panels.

---

## 🚀 Installation Instructions

Since this is a custom extension, you can install it manually in less than a minute:

1. **Download / Copy** this folder (`ani Bucket list - Friends`) to a permanent folder on your computer.
2. Open your Google Chrome browser and navigate to **`chrome://extensions/`** (or click the Extensions puzzle icon -> *Manage Extensions*).
3. Toggle the **Developer mode** switch in the top right-hand corner of the page to **ON**.
4. Click on the **Load unpacked** button in the top-left corner.
5. Select the `ani Bucket list - Friends` folder that you copied.
6. Open a new tab to see your brand new personalized glassmorphic dashboard! 🪣

---

## 🛠 Tech Stack

- **Frontend & Layout:** Semantic HTML5, CSS Variables, and custom Vanilla CSS glassmorphism overlayed with TailwindCSS utility framework.
- **Graphics Engine:** HTML5 Canvas API (2D Context) running real-time animators and custom mathematical visualizers at 60 FPS.
- **Extension API:** Manifest V3 API using `chrome.storage.local` persistent state synchronization and background service workers (`background.js`) to capture keyboard hotkeys.
- **Icon Assets:** Sleek vector-compatible custom graphics formats (`icon16`, `icon32`, `icon48`, `icon128`).

---

## 📂 File Directory Structure

```text
├── manifest.json       # Chrome Extension Manifest V3 configuration
├── background.js       # Background worker catching global save shortcut keys
├── newtab.html         # Base template and layout interface (Tailwind & custom UI)
├── newtab.js           # Core canvas physics, state management, drag/drop & UI logic
├── README.md           # Project documentation and setup guide
└── icon*.png           # Dynamic extension icon size variations
```

---

## 🛡 License & Customization

Created by **Abhay1250i** (`ani19992024@gmail.com`). Feel free to fork, customize the default boards array in `newtab.js`, or bundle new shader patterns into the live wallpaper engine. Enjoy!
