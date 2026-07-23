// Type-only shim for editors that do not follow pnpm's Emotion symlink.
// Experience Builder resolves the real module at build time.
declare module '@emotion/react/jsx-runtime' {
  export * from 'react/jsx-runtime';
}
