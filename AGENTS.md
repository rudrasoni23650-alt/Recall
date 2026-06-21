# Prototype Instructions

Run the local server yourself and open the preview in the in-app browser. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

## Locked Product Direction

- Product: Second Signal, an AI-assisted second-memory MVP.
- Selected visual target: `exec-872f284a-69f3-439a-94d4-9b6d9a44dbb5.png`.
- Keep the approved editorial layout: left navigation, central resurfaced memory and timeline, right daily context rail.
- Use the same deep petrol color for both left and right rails.
- Use plain-language navigation and labels: Home, Memories, Spaces, Reminders, Ask Second Signal.
- Signed-out visitors see a focused welcome screen without app side rails.
- MVP authentication and AI behavior are simulated locally; all visible controls must still work.

## Refinement Notes

- Welcome page is a complete product site: balanced hero, richer navigation, how it works, features, about, pricing, FAQ, final CTA, and footer.
- Sign-in offers functional simulated Google, Apple, and email methods.
- Capture must validate each input type and support text, links, uploads, browser recording, and reminders with useful feedback.
- Spaces and Reminders use a strict heading and spacing hierarchy; avoid loose icon-heavy layouts.
- Reminder completion must update real state and clearly separate Today, Upcoming, and Completed.
- Source references must be clickable wherever they appear, including memory details, Ask Second Signal answers, and reminder origins, with a clear path back when following related memories.
- Space rows use an explicit, polished Open control and reveal their contents immediately in a side panel; Capture uses a compact, confident primary action rather than a dropdown-like button.
- The signed-in shell uses restrained Apple-like translucent blur on both petrol rails and key controls. Keep actions compact, hierarchy spacious, and timeline text comfortably readable.
- Search opens as a contained, polished command palette with clear result hierarchy; never leave overlay content unframed.
- Treat Memory Timeline as a complete primary module: distinct container, header, grouped dates, readable columns, generous rows, and clear interaction states.
- Page-level New actions use one shared compact glass button across Memories, Spaces, and Reminders.
- Home, Memories, Spaces, and Reminders all use a small eyebrow heading above the page title; Memories follows the same header spacing and panel rhythm as the other primary tabs.
- Home and Memories render the same shared Memory Timeline component so grouping, spacing, rows, and interactions stay identical.
- Memories is the product's visual library: render all saved types as recognizable, information-rich cards rather than a timeline. Use the same shared memory-card anatomy in compact form wherever memories appear inside Search, Spaces, and contextual rails; Home keeps its editorial resurfacing and timeline modules.
