// AscendAwesome main entry point.
// Utilities only — importing this does NOT register any components.
// Components are cherry-picked: import '@ascend/ascendawesome/components/button'

// Re-export Web Awesome utilities clients need at runtime.
// setBasePath tells Web Awesome where runtime assets (icons, etc.) are served from.
export { setBasePath } from '@awesome.me/webawesome/dist/webawesome.js';

export const version = '4.2.0';
