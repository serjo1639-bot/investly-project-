/**
 * images.js — central registry of bundled image assets.
 *
 * Metro requires static `require()` paths, so every image is referenced here
 * once and consumed elsewhere as `IMAGES.<key>`. All art is dark, indigo/blue
 * and abstract so it sits naturally behind the brand gradient overlay used by
 * <HeroBackground/> — never competing with foreground text.
 */
export const IMAGES = {
  authBg: require('../../assets/images/auth-bg.jpg'),
  heroCosmos: require('../../assets/images/hero-cosmos.jpg'),
  heroBeam: require('../../assets/images/hero-beam.jpg'),
  heroGlow: require('../../assets/images/hero-glow.jpg'),
  heroSmoke: require('../../assets/images/hero-smoke.jpg'),
  heroStage: require('../../assets/images/hero-stage.jpg'),
};
