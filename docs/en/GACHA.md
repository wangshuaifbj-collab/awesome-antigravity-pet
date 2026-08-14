# Random Discovery (Pet Gacha)

## Goal

Help visitors discover pets they did not search for, without leaving the gallery. This is a free discovery tool: it has no coins, paid draws, rarity tiers, cash rewards, or gambling mechanics.

## Entry And Interaction

- Place a “Random discovery” action next to the gallery sort control.
- Open a centered dialog on desktop and a bottom sheet on mobile. Do not add a sidebar or a standalone navigation page.
- Offer “Single draw” and “Three draws”.
- After the draw, show the pet image, name, creator, category, and “View”, “Install”, and “Draw again” actions.
- Closing the dialog returns visitors to the same gallery position without changing search or category filters.

## Draw Rules

The pool comes from build-time `pets.generated.json`. It does not call live stats and adds no Worker request.

1. Only pets with usable preview assets enter the pool.
2. Group pets by `canonical_key`, then choose character groups randomly. One draw cannot show two variants of the same character.
3. Choose an author variant randomly inside each selected group, so independent versions of one character remain discoverable.
4. A three-draw result contains at most three distinct character groups, or fewer when the pool is smaller.
5. Use the browser random source for ordinary random selection. This is not a secure lottery and does not promise a prize value or fixed odds.

## Accessibility And Experience

- Use `role="dialog"`, an associated title, Escape-to-close, and focus restoration.
- Lock background scrolling while open and allow clicking the backdrop to close.
- Skip delayed reveal motion when `prefers-reduced-motion: reduce` is enabled.
- Give every control a localized accessible name and use the pet's localized name for image alt text.

## Internationalization

Gacha copy follows the existing five locales: English, Simplified Chinese, Korean, Japanese, and Spanish. Pet names, creators, and submission descriptions continue to follow catalog-provided localization fields; missing translations fall back to the original content instead of inventing creator text.

## Acceptance Criteria

- Desktop and mobile visitors can open the gacha from the gallery toolbar.
- A single draw or three-draw result never repeats a `canonical_key` within that round.
- Result cards open the pet detail page and reuse the existing installation menu.
- Close, Escape, backdrop click, and reduced-motion behavior work correctly.
- No new live stats request is created, and existing filtering, sorting, installation, and likes remain unchanged.
