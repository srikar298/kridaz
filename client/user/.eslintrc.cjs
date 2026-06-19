module.exports = {
  extends: ["../../.eslintrc.json"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: [
              "@features/*/*/**",
              "src/features/*/*/**",
              "../features/*/*/**",
              "../../features/*/*/**",
              "**/features/*/*/**",
            ],
            message:
              "Deep cross-feature imports are not allowed. Only import from the feature's root index or use shared components.",
          },
        ],
      },
    ],
    "react/no-unescaped-entities": "warn",
  },
};
