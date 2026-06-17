# Theme System

A **token-based design system** powers consistent styling and automatic
light/dark mode. Screens never hardcode colors or spacing — they read from the
active theme via `useTheme()`.

## Tokens (`src/theme/tokens.js`)

| Token group | Examples |
|-------------|----------|
| `colors` | `primary`, `background`, `surface`, `text`, `textSecondary`, `border`, semantic `success/warning/danger/info` ({ fg, bg, solid }) |
| `spacing` | `xs:4 … 5xl:56` (4-pt grid) |
| `radii` | `sm:8 … 2xl:28`, `full:999` |
| `typography` | `display`, `h1–h3`, `subtitle`, `body`, `caption`, `tiny` |
| `shadows` | `sm`, `md`, `lg` (elevation presets, dark-aware) |
| `gradients` | `brand`, `brandDeep`, `night`, `heroScrim` (for `expo-linear-gradient`) |

The brand is a premium **indigo** ramp (`brand.500 = #5B4CE7`). There are full
**light** and **dark** palettes; `buildTheme(mode)` assembles the active theme.

## Provider & hook

```
App.js
  └─ ThemeProvider           (src/context/ThemeProvider.js)
        resolves mode = uiStore.themeMode === 'system'
                          ? OS color scheme
                          : uiStore.themeMode
        → provides buildTheme(mode) via context

Any component:
  const theme = useTheme();
  style={{ color: theme.colors.text, padding: theme.spacing.lg }}
```

Switching modes is instant: `uiStore.setThemeMode('dark' | 'light' | 'system')`
(exposed on the **Settings** screen) re-renders the provider.

## Using the theme

```js
import { useTheme } from '../../hooks/useTheme';

function Example() {
  const theme = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg }}>
      <Text variant="h2">Hello</Text>            {/* themed Text component */}
    </View>
  );
}
```

The `Text` component takes a `variant` (typography) and a semantic `color` key,
so you rarely write raw color values at all.

## Dark mode

- Resolved from the user's choice **or** the OS setting (`system` mode).
- Persisted in `uiStore` (AsyncStorage).
- The `StatusBar` and React Navigation container theme are both synced to the
  active mode (see `ScreenContainer` and `RootNavigator`).

## Image assets

Bundled art lives in `assets/images/` and is referenced once in
`src/constants/images.js` as `IMAGES.*` (Metro needs static `require()`s). The
images are dark, indigo/blue and abstract so they sit naturally **behind the
brand gradient scrim** in `HeroBackground` without competing with foreground
text (used on auth screens, the profile header, the drawer header and About).

## Internationalization & RTL

Arabic is the **default** language (RTL); English is available. Strings come
from `src/i18n` via `useTranslation()`. `isRTL()` helps flip direction-sensitive
layouts where needed. Language is changed on the Settings screen and persisted.
