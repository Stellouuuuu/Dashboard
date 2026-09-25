# Accessibility / Accessibilité

← [Back to README](../README.md) · [Retour au README](../README.md)

[English](#english) · [Français](#français)

---

<a id="english"></a>

## English

### Goals

- Keyboard-reachable primary flows (login, register, dashboard actions, modals)
- Visible focus states on interactive controls
- Meaningful labels on icon-only buttons (`aria-label`)
- Skip link to main content on public and auth layouts
- Status messages exposed with `role="alert"` where appropriate (form errors)

### Current practices

- Semantic landmarks: `header` / `main` / `nav` / `aside`
- Auth and landing stay in a forced dark “brand” shell for contrast of white text on imagery
- Motion: Ken Burns / image fade respect `prefers-reduced-motion` where implemented
- Language: UI strings via i18next (`fr` / `en`); `html[lang]` should follow the active locale

### Known gaps / follow-ups

- Full WCAG audit not completed
- Some decorative images use empty `alt=""`; ensure informative images always have text alternatives
- Drag-and-drop reordering has limited touch / keyboard parity (desktop-oriented)

---

<a id="français"></a>

## Français

### Objectifs

- Parcours principaux accessibles au clavier (login, inscription, actions dashboard, modales)
- États de focus visibles sur les contrôles interactifs
- Libellés significatifs sur les boutons icône seule (`aria-label`)
- Lien d’évitement vers le contenu principal sur les layouts publics et auth
- Messages d’état exposés avec `role="alert"` quand c’est pertinent (erreurs de formulaire)

### Pratiques actuelles

- Landmarks sémantiques : `header` / `main` / `nav` / `aside`
- Auth et landing restent dans une coque « brand » sombre forcée pour le contraste du texte blanc sur les images
- Motion : Ken Burns / fondu d’image respectent `prefers-reduced-motion` là où c’est implémenté
- Langue : chaînes UI via i18next (`fr` / `en`) ; `html[lang]` doit suivre la locale active

### Écarts connus / suites

- Audit WCAG complet non réalisé
- Certaines images décoratives utilisent `alt=""` vide ; s’assurer que les images informatives ont toujours une alternative textuelle
- Le réordonnancement drag-and-drop a une parité tactile / clavier limitée (orienté desktop)
