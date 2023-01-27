module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    "no-console": 0,
    "no-empty": 0,
    "no-irregular-whitespace":0,
    "no-underscore-dangle": 0,
    "no-unused-vars": ["error", { "argsIgnorePattern": "next" }],
    "no-use-before-define": ["error", { "variables": false }],
    "no-multi-str": 0,
    "no-else-return": 0,
    "no-plusplus": 0,
    "no-await-in-loop": 0,
    // "max-len": 120
  },
};
