// Ani Bucket List - Background Service Worker
// Handles the quick-save keyboard shortcut (Ctrl+Shift+Y)

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "quick-save-bookmark") return;

  try {
    // Get the currently active tab in the focused window
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab) return;

    const url = activeTab.url || "";
    const title = activeTab.title || "";

    // Guard against chrome:// pages and extension pages
    const isRestrictedPage =
      url.startsWith("chrome://") ||
      url.startsWith("chrome-extension://") ||
      url.startsWith("edge://") ||
      url.startsWith("about:") ||
      url === "";

    if (isRestrictedPage) {
      // Silently ignore — we can't save system pages
      console.warn("[Ani Bucket List] Cannot save restricted page:", url);
      return;
    }

    // Sanitize helper — strips tags from raw text
    const sanitize = (str) => {
      return (str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const safeTitle = sanitize(title) || sanitize(url);
    const safeUrl = sanitize(url);

    // Load existing data from storage
    const data = await chrome.storage.local.get(["bookmarks", "boards", "settings"]);
    const bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];
    let boards = Array.isArray(data.boards) ? data.boards : [];
    const settings = data.settings || {};

    let targetBoardId = settings.activeBoardId;

    // Ensure at least one board exists
    if (boards.length === 0) {
      boards = [
        { id: "entertainment", name: "🎬 Entertainment" },
        { id: "social-media",  name: "👥 Social Media" },
        { id: "ai",            name: "🤖 A I" },
        { id: "notes",         name: "📝 Notes" },
        { id: "projects",      name: "💻 Projects" },
        { id: "reviews",       name: "🍿 Reviews" },
        { id: "live",          name: "⚽ Live" },
        { id: "cr9",           name: "🏏 Cr9" }
      ];
      await chrome.storage.local.set({ boards });
      targetBoardId = "entertainment";
    } else if (!targetBoardId || !boards.some(b => b.id === targetBoardId)) {
      targetBoardId = boards[0].id;
    }

    // Check for duplicate URL in the target board
    const existingIndex = bookmarks.findIndex(
      (b) => b.url === safeUrl && b.boardId === targetBoardId
    );

    if (existingIndex !== -1) {
      // Update timestamp of existing bookmark instead of duplicating
      bookmarks[existingIndex].createdAt = Date.now();
      await chrome.storage.local.set({ bookmarks });
      console.log("[Ani Bucket List] Updated existing bookmark:", safeTitle);
    } else {
      // Append new bookmark to the target board
      const newBookmark = {
        id: crypto.randomUUID(),
        boardId: targetBoardId,
        title: safeTitle,
        url: safeUrl,
        createdAt: Date.now(),
      };
      bookmarks.push(newBookmark);
      await chrome.storage.local.set({ bookmarks });
      console.log("[Ani Bucket List] Saved new bookmark:", safeTitle);
    }
  } catch (err) {
    console.error("[Ani Bucket List] Error saving bookmark:", err);
  }
});
