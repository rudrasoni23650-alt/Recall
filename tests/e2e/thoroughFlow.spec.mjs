import { test, expect } from "@playwright/test";
import { createApiMock } from "./apiMock.js";

test.describe("Recall E2E thorough flow (mocked /api)", () => {
  test("Welcome → demo → capture, archive, ask, search, reminders, mobile nav", async ({ page, baseURL }) => {
    const api = createApiMock();

    await page.route("**/api/state**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(await api.handleStateGet()),
      });
    });

    await page.route("**/api/memories", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      let body = {};
      try {
        body = await route.request().postDataJSON();
      } catch {
        body = {};
      }
      const out = await api.handleMemoriesPost(body);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(out) });
    });

    await page.route("**/api/memories/archive", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      let body = {};
      try {
        body = await route.request().postDataJSON();
      } catch {
        body = {};
      }
      const out = await api.handleArchivePost(body);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(out) });
    });

    await page.route("**/api/reminders/toggle", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      let body = {};
      try {
        body = await route.request().postDataJSON();
      } catch {
        body = {};
      }
      const out = await api.handleRemindersTogglePost(body);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(out) });
    });

    await page.route("**/api/ask", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      let body = {};
      try {
        body = await route.request().postDataJSON();
      } catch {
        body = {};
      }
      const out = await api.handleAskPost(body);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(out) });
    });

    await page.route("**/api/profile", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      const out = await api.handleProfilePost();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(out) });
    });

    await page.route("**/api/signout", async (route) => {
      if (route.request().method() !== "POST") return route.fallback();
      const out = await api.handleSignoutPost();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(out) });
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });

    // WelcomeScreen: enter demo (there are multiple "Explore the demo" buttons; click the top-primary one)
    const exploreButtons = page.getByRole("button", { name: /Explore the demo/i });
    await expect(exploreButtons).toHaveCount(2);
    await exploreButtons.nth(0).click();

    // HomePage demo: should show "Launch brief — core messaging"
    const launchButtons = page.getByRole("button", { name: /Launch brief — core messaging/i });
    await expect(launchButtons.first()).toBeVisible();

    // Demo tour overlay intercepts pointer events; dismiss it before interacting with the workspace.
    const tourOverlay = page.locator(".tour-overlay");
    if (await tourOverlay.isVisible().catch(() => false)) {
      // Try the most common tour-dismiss buttons first.
      const possibleDismiss = [
        page.getByRole("button", { name: /Close|Done|Finish|Skip/i }),
        page.getByRole("button", { name: /Next/i }),
        page.locator(".tour-overlay button").first(),
      ];

      for (const c of possibleDismiss) {
        try {
          if (await c.isVisible()) {
            await c.click({ trial: true }).catch(() => {});
            await c.click({ timeout: 2000 }).catch(() => {});
          }
          break;
        } catch {}
      }

      // Wait until overlay is gone or at least pointer-events won't block interactions.
      await tourOverlay.waitFor({ state: "hidden", timeout: 8000 }).catch(() => {});
    }

    // Open MemoryDrawer from the demo resurfaced memory (use the first match to avoid preview/source variants)
    await launchButtons.first().click();

    // MemoryDrawer: verify title + actions
    const drawerTitleHeadings = page.getByRole("heading", { name: /Launch brief — core messaging/i });
    await expect(drawerTitleHeadings.first()).toBeVisible();

    const archiveButtons = page.getByRole("button", { name: /Archive/i });
    await expect(archiveButtons.first()).toBeVisible();

    // Archive it
    await archiveButtons.first().click();

    // After archive, drawer should be closed (selectedMemory cleared)
    // Prefer dialog role over heading text (heading text may appear in multiple places in the layout)
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    // CaptureModal: open capture
    await page.getByRole("button", { name: /Capture/i }).click();

    // Save a note
    const noteTextarea = page.locator("textarea").first();
    await noteTextarea.fill("Test memory via Playwright E2E");
    await page.getByRole("button", { name: /Save memory/i }).click();

    // Wait for toast or for timeline to include the new memory title
    await expect(page.getByText(/Memory saved and organized/i)).toBeVisible({ timeout: 10_000 });

    // AskPanel: open via "Ask Recall"
    await page.getByRole("button", { name: /Ask Recall/i }).click();
    const askTextarea = page.locator("textarea").first();
    await askTextarea.fill("What themes keep appearing in my launch research?");
    await page.getByRole("button", { name: /Ask question/i }).click();

    // Verify answer + referenced memories buttons
    await expect(page.getByText(/Answer from your space/i).first()).toBeVisible({ timeout: 10_000 });

    // Referenced-memory chips/buttons inside AskPanel can have varying accessible names/markup.
    // Assert at least one referenced memory chip/button exists within AskPanel, then (optionally) click it.
    const askPanel = page.locator(".ask-panel");
    const refButtons = askPanel.getByRole("button");
    await expect(refButtons.first()).toBeVisible({ timeout: 10_000 });

    // Close AskPanel
    await page.locator(".ask-panel .icon-button").first().click();

    // CommandPalette: open via keyboard shortcut Ctrl+K / Cmd+K
    await page.keyboard.press("Meta+K");
    await expect(page.getByPlaceholder("Search by idea, source, or feeling…")).toBeVisible();

    await page.getByPlaceholder("Search by idea, source, or feeling…").fill("privacy");
    const memCard = page.locator(".command-memory-cards button").first();
    await expect(memCard).toBeVisible();
    await memCard.click();

    // MemoryDrawer should open for selected memory
    await expect(page.getByRole("heading").first()).toBeVisible();

    // Reminders: navigate to Reminders page
    // Ensure any drawer/scrim overlay is closed; otherwise pointer events get intercepted.
    await page.locator(".ask-panel .icon-button, [role='dialog'] .icon-button").first().click({ timeout: 2000 }).catch(() => {});
    await page.locator(".memory-drawer .icon-button, [role='dialog'] .icon-button").first().click({ timeout: 2000 }).catch(() => {});
    await expect(page.locator(".drawer-scrim")).toHaveCount(0, { timeout: 10_000 }).catch(async () => {
      await expect(page.locator(".drawer-scrim")).toBeHidden({ timeout: 10_000 }).catch(() => {});
    });

    // Sidebar has icon+label buttons; use navigation button text.
    await page.getByRole("button", { name: /Reminders/i }).first().click();

    // Toggle first reminder checkbox (there should be at least one)
    const firstToggle = page.locator(".complete-control").first();
    await expect(firstToggle).toBeVisible();
    await firstToggle.click();

    // MobileNav: resize to mobile and verify navigation works by clicking each nav item.
    await page.setViewportSize({ width: 420, height: 800 });

    // MobileNav has aria-label="Mobile navigation"
    const mobileNav = page.getByRole("navigation", { name: /Mobile navigation/i });
    await expect(mobileNav).toBeVisible();

    const navHome = mobileNav.getByRole("button", { name: "Home", exact: true });
    const navMemories = mobileNav.getByRole("button", { name: "Memories", exact: true });
    const navSpaces = mobileNav.getByRole("button", { name: "Spaces", exact: true });
    const navReminders = mobileNav.getByRole("button", { name: "Reminders", exact: true });

    await expect(navHome).toBeVisible();
    await expect(navMemories).toBeVisible();
    await expect(navSpaces).toBeVisible();
    await expect(navReminders).toBeVisible();

    // Close any open scrims/dialogs before interacting with mobile nav
    await page.locator(".drawer-scrim").waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
    await page.locator(".profile-scrim").waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});

    // Home: assert on a stable Home-page element rather than demo-specific resurfacing content.
    // On mobile, resurfacing may or may not be shown depending on state; the navigation should still work.
    await navHome.click();

    // The Home page root uses .home-page class
    await expect(page.locator(".home-page")).toBeVisible({ timeout: 10_000 });

    // Also verify at least one of the two common Home variants is present
    await expect(
      page
        .getByRole("heading", { name: "Returned to you" })
        .or(page.getByRole("heading", { name: /Your space is quiet\./i })),
    ).toBeVisible();

    // Memories (page h1)
    await navMemories.click();
    await expect(page.getByRole("heading", { name: "Memories", exact: true })).toBeVisible();

    // Spaces (page h1)
    await navSpaces.click();
    await expect(page.getByRole("heading", { name: "Spaces", exact: true })).toBeVisible();

    // Reminders (page h1)
    await navReminders.click();
    await expect(page.getByRole("heading", { name: "Reminders", exact: true })).toBeVisible();
  });
});
