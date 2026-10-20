import { defineConfig } from 'vitest/config';

/**
 * Vitest configuration for the core package.
 *
 * Run tests in forked child processes instead of worker threads. Node 24.14+
 * can abort with `v8::ToLocalChecked Empty MaybeLocal` inside the CJS lexer
 * while worker threads link modules (nodejs/node#63323). Forks avoid that
 * worker-thread loader path and keep the otherwise passing test run stable.
 */
export default defineConfig({
  test: {
    pool: 'forks',
  },
});
