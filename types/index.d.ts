// Re-export the application's shared types so imports like `~/types` resolve to
// the comprehensive type definitions in `app/types/index.d.ts` used by the UI
// code. This keeps the TS imports consistent for both server and client code.
export * from '../app/types/index'
