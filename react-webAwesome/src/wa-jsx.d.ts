import type { DetailedHTMLProps, HTMLAttributes } from 'react'

// React 19 resolves JSX through `React.JSX`, not the global `JSX` namespace,
// so we augment the `react` module rather than `declare global`.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [tag: `wa-${string}`]: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        [attr: string]: unknown
      }
    }
  }
}

export {}
