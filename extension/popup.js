document.addEventListener("DOMContentLoaded", async () => {
  const tokenSection = document.getElementById("token-section");
  const captureSection = document.getElementById("capture-section");
  const tokenInput = document.getElementById("token-input");
  const saveTokenBtn = document.getElementById("save-token");
  const noteInput = document.getElementById("page-note");
  const savePageBtn = document.getElementById("save-page");
  const statusEl = document.getElementById("status");
  const changeTokenBtn = document.getElementById("change-token");

  // Check for existing token
  const { recallToken } = await chrome.storage.local.get("recallToken");
  
  if (recallToken) {
    tokenSection.style.display = "none";
    captureSection.style.display = "flex";
    initCapture();
  } else {
    tokenSection.style.display = "flex";
    captureSection.style.display = "none";
  }

  saveTokenBtn.addEventListener("click", async () => {
    const token = tokenInput.value.trim();
    if (token) {
      await chrome.storage.local.set({ recallToken: token });
      tokenSection.style.display = "none";
      captureSection.style.display = "flex";
      initCapture();
    }
  });

  changeTokenBtn.addEventListener("click", async () => {
    await chrome.storage.local.remove("recallToken");
    captureSection.style.display = "none";
    tokenSection.style.display = "flex";
  });

  async function initCapture() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    savePageBtn.addEventListener("click", async () => {
      statusEl.textContent = "Saving...";
      savePageBtn.disabled = true;

      const { recallToken } = await chrome.storage.local.get("recallToken");
      const payload = {
        type: "link",
        title: tab.title || "Saved Link",
        url: tab.url,
        body: noteInput.value,
        captureSource: "extension"
      };

      try {
        const response = await fetch("https://recall-backend-9elu.onrender.com/api/extension/capture", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${recallToken}`
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) throw new Error("Server rejected capture");
        
        statusEl.textContent = "Saved to Recall!";
        statusEl.style.color = "#aed2cd";
        setTimeout(() => window.close(), 1500);
      } catch (err) {
        statusEl.textContent = "Failed to save.";
        statusEl.style.color = "#ff6b6b";
        savePageBtn.disabled = false;
      }
    });
  }
});
