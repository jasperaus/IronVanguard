## 2026-05-15 - Focus and Accessibility on Buttons\n**Learning:** Implementing `focus-visible` class styles, `aria-label` and `title` to interactive buttons like on `src/components/HUD.tsx`, `src/components/Dialogue.tsx`, `src/components/PreGameLobby.tsx` and `src/App.tsx` can dramatically increase accessbility and the keyboard-based user experience when navigating the UI.\n**Action:** Whenever adding new buttons, or updating existing ones to a design system that might lack them, ensure proper keyboard `focus-visible` behaviors are in place with accompanying ARIA attributes for screen reader support.

## 2026-05-15 - ARIA Roles for Custom Keyboard Interaction
**Learning:** When implementing custom keyboard shortcuts (like Space/Enter to advance dialogs) on non-native, overlay UI components, pairing them with the `role="dialog"` attribute and `aria-labelledby`/`aria-describedby` is crucial. It ensures the content and interactions are explicitly announced by screen readers when the component becomes visible.
**Action:** Always add dialog-related ARIA roles and associated text IDs when constructing custom modals or dialog overlays, particularly when binding global keyboard event listeners for quick-action shortcuts.

## 2026-05-15 - ARIA Keyboard Shortcuts
**Learning:** Adding custom keyboard shortcuts improves power-user experience, but it's important that screen reader users know about them.
**Action:** When adding keyboard shortcuts via global event listeners to buttons or actions, always remember to add the `aria-keyshortcuts` attribute (e.g., `aria-keyshortcuts="e"`) to the relevant element and update its `aria-label`/`title` so the shortcut is fully discoverable by all users.
