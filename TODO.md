# TODO (Playwright E2E “thorough” UI testing)

- [ ] Add Playwright E2E test setup (dev dependency + config)
- [ ] Add deterministic API mocking for all `/api/*` routes during tests
- [ ] Add E2E spec(s) covering:
  - [ ] WelcomeScreen: “Explore the demo” flow and empty/demo paths
  - [ ] Workspace navigation (Home/Memories/Spaces/Reminders/Profile/Account)
  - [ ] CaptureModal: capture a note (title/excerpt) and verify it appears
  - [ ] MemoryDrawer: archive a memory and verify it disappears from active list
  - [ ] AskPanel: submit a question and verify answer + referenced sources chips
  - [ ] CommandPalette: open via search and select a memory to open MemoryDrawer
  - [ ] DemoTourModal: open/close
  - [ ] MobileNav: verify tab switching + capture button behavior at mobile viewport
- [ ] Add `pnpm test:e2e` script
- [ ] Run `pnpm test:e2e` and fix selectors/flakiness until green
