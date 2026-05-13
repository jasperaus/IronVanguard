## 2024-05-13 - [Focus States and Disabled Contexts]
**Learning:** Adding screen reader context like `title` and `aria-label` to disabled buttons (like "End Turn") explains *why* the button is disabled, rather than just being unclickable. Consistently applying focus outlines (`focus-visible:ring-2`) allows keyboard-only users to navigate the game's core UI elements properly.
**Action:** Always implement `focus-visible` classes on interactive buttons in game interfaces and add ARIA attributes to context-dependent buttons.
