const config = {
  '*.{js,jsx,mjs,cjs,ts,tsx}': [
    'eslint --fix --max-warnings=0 --no-warn-ignored',
    'prettier --write',
  ],
  '*.{json,jsonc,css,md,mdx,yaml,yml}': ['prettier --write'],
};

export default config;
