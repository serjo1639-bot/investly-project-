# Clean-Code Guidelines

These are the conventions the codebase follows. Keep them in mind when adding
features so the project stays consistent and maintainable.

## 1. Respect the layers

```
screens → hooks → api modules → http client → backend
screens → components (UI only)
```

- A **screen** decides *what* to show; it must not contain `fetch`, axios, or
  business rules beyond rendering.
- A **component** is pure presentation, driven by props + the theme.
- A **hook** owns data + side effects (React Query, mutations).
- The **api layer** is the only code that knows about HTTP.

## 2. Single source of truth

- Endpoints → `api/endpoints.js`
- Enums (must match backend) → `constants/enums.js`
- Query keys → `constants/queryKeys.js`
- Config / storage keys → `constants/config.js`
- Route names → `navigation/routes.js`
- Design values → `theme/tokens.js`

No magic strings or duplicated literals scattered across files.

## 3. Naming

- `PascalCase` components, `useCamelCase` hooks, `camelCase` everything else.
- Screens are `XxxScreen.js` with a **default export**.
- Boolean props read as questions/states: `loading`, `disabled`, `selected`.

## 4. Reuse before you write

Check `components/` and `hooks/` first. Most UI is already covered by `Button`,
`Card`, `Input`, `ListRow`, `EmptyState`, `ErrorState`, `Skeleton`,
`ScreenContainer`, `AppHeader`. New shared UI goes in the kit, not inline.

## 5. Always handle the four states

Loading (skeleton), error (ErrorState + retry), empty (EmptyState), data.
This is non-negotiable for any screen that fetches.

## 6. Errors

- Throw/normalize to `ApiError` (handled centrally in `client.js`).
- Show failures with `toast.error(e.message)` or an `ErrorState`.
- Never swallow an error silently (except best-effort logout).

## 7. Styling

- Use `theme.colors/spacing/radii/typography/shadows` — no hardcoded hex or
  arbitrary numbers.
- Co-locate `StyleSheet.create` at the bottom of the component file.
- Memoize list items and pure components with `React.memo`.

## 8. Performance

- Lists use `FlatList` with `keyExtractor`; long lists use infinite scroll.
- Images use `expo-image` (caching + transitions + blurhash placeholders).
- Debounce text-driven queries (`useDebounce`).
- Animations use the RN `Animated` API with `useNativeDriver` where possible.

## 9. Comments

- A short file-header comment explaining the file's responsibility.
- Comment the *why*, not the obvious *what*. Avoid noise.

## 10. Internationalization

User-facing text goes through `t('…')` (i18n), not hardcoded strings, so the
app stays Arabic/English-ready.
