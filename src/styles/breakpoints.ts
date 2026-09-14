/**
 * The breakpoints behind the `mobile` / `tablet` / `not_desktop` / `desktop`
 * mixins in legacy/style.scss. CSS files spell the media queries out; this
 * module exists for the handful of places that need them in JS.
 */
export const MOBILE_MAX = 600;
export const NOT_DESKTOP_MAX = 768;

export const mediaQueries = {
  mobile: `screen and (max-width: ${MOBILE_MAX}px)`,
  tablet: `screen and (min-width: ${MOBILE_MAX + 1}px) and (max-width: ${NOT_DESKTOP_MAX}px)`,
  notDesktop: `screen and (max-width: ${NOT_DESKTOP_MAX}px)`,
  desktop: `screen and (min-width: ${NOT_DESKTOP_MAX + 1}px)`,
} as const;
