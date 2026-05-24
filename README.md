#  Abee Bucket List

A premium, feature-rich, and visually stunning bookmark manager that replaces your Chrome New Tab page with an ultra-cool glassmorphic dashboard. Organize your links using interactive Kanban boards, customize your workspace with static or live wallpaper engines, and save active web pages with a single click.

> [!NOTE]
> This is the **clean edition** configured with default layout boards and no preseeded personal bookmarks, making it perfect for custom setups.

---

## 🎨 Aesthetics & Wallpaper Qualities

This dashboard is built from the ground up to feel extremely premium, responsive, and alive:
- **Ultra-Modern Glassmorphism:** Enjoy frosted-glass panels, smooth hover interactions, and sleek animations that make your start page look like a state-of-the-art desktop workspace.
- **Dual Wallpaper Engine:** 
  - **Static Wallpapers:** Upload any local image file (JPG, PNG, WebP up to 4MB) to set as a high-definition background.
  - **Dynamic Live Wallpapers:** Choose from hardware-accelerated shader presets like **Aurora** (shifting gradients), **Deep Space** (twinkling & shooting stars), **Matrix Rain** (falling digital glyphs), **Neural Mesh** (interactive particle webs), or **Synthwave** (retro neon sun & scrolling wireframe grid).
  - **Custom Video Streams & Uploads:** Upload your own local MP4/GIF file or paste any live streaming video URL to run in the background!

---

## 🎁 Built-in User Benefits (A Pre-Created Boon!)

To save you time and help you get started immediately, the extension comes with **8 pre-configured lanes (boards)**:
* 🎬 Entertainment
* 👥 Social Media
* 🤖 A I
* 📝 Notes
* 💻 Projects
* 🍿 Reviews
* ⚽ Live
* 🏏 Cr9

> [!TIP]
> **Total Control:** While these pre-created boards are there for your convenience, they are **fully customizable**. If you don't need a board, simply click the **Trash/Delete icon** next to the board's title to remove it instantly along with its content!

---

## 🚀 How to Add & Run the Extension in Chrome

Since this is a custom extension, you can install it manually in less than a minute:

1. **Download/Copy** this entire folder (`Abee`) to a permanent folder on your computer.
2. Open your Google Chrome browser and navigate to **`chrome://extensions/`** (or click the Extensions puzzle icon in the toolbar -> *Manage Extensions*).
3. Toggle the **Developer mode** switch in the top-right corner to **ON**.
4. Click on the **Load unpacked** button in the top-left corner.
5. Select the `Abee` folder.
6. Open a new tab to see your brand new personalized glassmorphic dashboard! 🪣

---

## 💡 How to Build Your Workspace (Step-by-Step)

When you launch the extension for the first time, your boards will be empty and ready for your own links. Here is how to make it fully functional:

### 1. Creating a New Board
If you want to add a custom category beyond the default ones:
- **Option A:** Click the **`＋` (Plus) icon** located directly to the right of the **Home** button in the top bar.
- **Option B:** Scroll to the far right of your dashboard canvas and click **`＋ Create Board`**.
- Type in your new board name, press Enter, and watch your new column snap beautifully into place!

### 2. Adding Bookmarks & Links
To populate your workspace and make it fully functional:
- Click the blue **`Add Link`** button in the top-right corner (or press **`Ctrl + N`** on your keyboard).
- Paste the URL (include `https://`), type in a custom title, select which board it should go to, and click **Save Bookmark**.
- **Alternative:** Click the little link icon inside the header of any specific board column to quick-add a link directly to that board.

### 3. Rearranging Your Workspace
- **Drag & Drop Links:** Simply click and drag any bookmark card to move it up or down, or drop it into a completely different board column.
- **Drag & Drop Columns:** Grab the header of any board column to slide it left or right, rearranging the order of your entire dashboard.

---

## ⌨️ Quick Keyboard Shortcuts

- **`Ctrl + Shift + Y`** (Mac: `Cmd + Shift + Y`): **Quick-Save Tool**. Instantly saves the active tab you are currently browsing on the web directly into your active workspace board.
- **`Ctrl + N`**: Opens the manual "Add Link" popup.
- **`Ctrl + K`**: Slides out the real-time title search box to filter your bookmarks in a flash.
- **`Escape`**: Instantly closes any open manual modal or wallpaper settings panel.

---

## 🛠 Active Maintenance & Upcoming Improvements

> [!IMPORTANT]
> **Under Active Maintenance:** This extension is actively being supported, and **many exciting, high-quality updates are currently in development**! Expect new wallpaper shaders, advanced customization features, and deeper browser integrations in upcoming releases.

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

Created with 💙 by **Abhay1250i** (`ani19992024@gmail.com`). Feel free to fork, customize the default boards array in `newtab.js`, or bundle new shader patterns into the live wallpaper engine. Enjoy!
