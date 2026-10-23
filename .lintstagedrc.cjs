module.exports = {
  'apps/gatsby-glass/**/*.{ts,tsx}': () => 'pnpm --filter gatsby-glass exec next lint',
};
