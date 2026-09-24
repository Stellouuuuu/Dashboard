# Accessibility

← [Back to README](../README.md)

## Goals

- Keyboard-reachable primary flows (login, register, dashboard actions, modals)
- Visible focus states on interactive controls
- Meaningful labels on icon-only buttons (`aria-label`)
- Skip link to main content on public and auth layouts
- Status messages exposed with `role="alert"` where appropriate (form errors)

## Current practices

- Semantic landmarks: `header` / `main` / `nav` / `aside`
- Auth and landing stay in a forced dark “brand” shell for contrast of white text on imagery
- Motion: Ken Burns / image fade respect `prefers-reduced-motion` where implemented
- Language: UI strings via i18next (`fr` / `en`); `html[lang]` should follow the active locale

## Known gaps / follow-ups

- Full WCAG audit not completed
- Some decorative images use empty `alt=""`; ensure informative images always have text alternatives
- Drag-and-drop reordering has limited touch / keyboard parity (desktop-oriented)
