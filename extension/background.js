chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-recall",
    title: "Save to Recall",
    contexts: ["selection", "page", "link", "image"]
  });
});

async function saveToRecall(data) {
  const { recallToken } = await chrome.storage.local.get("recallToken");
  if (!recallToken) {
    console.error("No Recall token found. Please sign in via the extension popup.");
    return false;
  }

  try {
    const response = await fetch("https://recall-backend-9elu.onrender.com/api/extension/capture", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${recallToken}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) throw new Error("Server rejected capture");
    return true;
  } catch (err) {
    console.error("Save to Recall failed:", err);
    return false;
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-recall") {
    let payload = {
      type: "note",
      title: tab.title,
      url: tab.url,
      captureSource: "extension"
    };

    if (info.selectionText) {
      payload.type = "highlight";
      payload.excerpt = info.selectionText;
    } else if (info.srcUrl) {
      payload.type = "image";
      payload.url = info.srcUrl;
      payload.title = "Image from " + tab.title;
    } else if (info.linkUrl) {
      payload.type = "link";
      payload.url = info.linkUrl;
      payload.title = "Saved Link";
    } else {
      payload.type = "link";
    }

    const success = await saveToRecall(payload);
    // Ideally, we show a notification or inject a toast here
    if (success) {
      // Execute small script to show toast if we have permissions
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => alert("Saved to Recall!")
        });
      } catch(e) {}
    }
  }
});
