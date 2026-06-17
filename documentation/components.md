# Reusable Components

All UI is composed from a small, theme-driven kit in `src/components`, imported
through the barrel:

```js
import { Button, Card, Input, EmptyState, ProjectCard } from '../../components';
```

## UI primitives (`components/ui`)

| Component | Purpose | Key props |
|-----------|---------|-----------|
| `Text` | Themed text | `variant`, `color`, `align`, `weight` |
| `Button` | Actions | `variant` (primary/secondary/ghost/outline/danger), `size`, `loading`, `icon` |
| `Input` | Text field | `label`, `icon`, `error`, `secureTextEntry`, `multiline` |
| `Card` | Elevated surface | `onPress`, `elevation`, `padded` |
| `Badge` | Status pill | `status` (auto-tones) or `tone`, `label` |
| `Avatar` | User image / initials | `uri`, `name`, `size` |
| `Chip` | Selectable filter | `label`, `selected`, `icon`, `onPress` |
| `Divider` | Separator line | `spacing` |
| `ProgressBar` | Animated 0–100 bar | `percent`, `height`, `color` |
| `IconButton` | Round icon button | `icon`, `badge`, `variant` |
| `Logo` | SVG brand mark | `size`, `showWordmark` |
| `PressableScale` | Spring-on-press wrapper | `scaleTo`, `onPress` |
| `HeroBackground` | Branded banner: photo + gradient scrim + content | `image`, `height`, `colors`, `radius` |
| `SectionHeader` | Title + "See all" | `title`, `actionLabel`, `onAction` |
| `StatTile` | Metric card | `icon`, `value`, `label`, `tone` |
| `ListRow` | Settings/menu row | `icon`, `title`, `subtitle`, `value`, `right` |

## Feedback components (`components/feedback`)

| Component | Purpose |
|-----------|---------|
| `Skeleton`, `SkeletonText`, `SkeletonCard` | Shimmering loading placeholders |
| `EmptyState` | Friendly "nothing here" with optional action |
| `ErrorState` | Standardized error + retry (reads `ApiError.message`) |
| `Spinner` | Centered loading indicator |
| `ToastProvider` / `toast` | Global toasts: `toast.success/error/info(msg)` |

The `toast` helper works **outside React too** (e.g. inside mutation
`onError`), via an imperative bridge set up by `ToastProvider`.

## Domain components (`components/project`)

- `ProjectCard` — the project tile (`full` vertical / `wide` carousel layouts),
  composed of `Card` + `Image` + `Badge` + `FundingProgress`.
- `FundingProgress` — animated funding bar with raised/goal/percentage.

## Layouts (`src/layouts`)

- `ScreenContainer` — the base every screen uses: safe-area insets, themed
  background, status-bar style, optional scroll + keyboard avoidance, consistent
  horizontal padding.
- `AppHeader` — title/subtitle, optional back button and a right action slot.
- `AuthHero` (`screens/auth/AuthHero.js`) — compact branded header (back button +
  title/subtitle over `HeroBackground`) shared by the secondary auth screens
  (Register, ForgotPassword, VerifyCode, ResetPassword).

## The "states" contract

Every data-driven screen renders four states, so the experience is always
polished:

1. **Loading** → `Skeleton*` / `Spinner`
2. **Error** → `ErrorState` with retry
3. **Empty** → `EmptyState`
4. **Data** → the real content

## Building a new screen (template)

```js
export default function ExampleScreen() {
  const { data, isLoading, isError, error, refetch } = useSomething();
  if (isError) return <ErrorState error={error} onRetry={refetch} />;
  return (
    <ScreenContainer scroll>
      <AppHeader title="Example" showBack />
      {isLoading ? <SkeletonCard /> :
        data?.length ? data.map(...) : <EmptyState title="Nothing yet" />}
    </ScreenContainer>
  );
}
```
