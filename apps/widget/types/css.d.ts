// Ambient declarations for side-effect CSS imports (e.g. `@repo/ui/globals.css`).
// TypeScript's Bundler module resolution otherwise reports ts(2882) because the
// package `exports` map resolves these imports to real `.css` files that have
// no type declarations of their own.
declare module "*.css";
