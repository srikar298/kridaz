import { createRequire } from "module";
const require = createRequire(import.meta.url);

export default {
  testEnvironment: "node",
  transform: {},
  moduleNameMapper: {
    "^uuid$": require.resolve("uuid"),
    "^@kridaz/db$": "<rootDir>/../packages/db/src/index.js",
    "^@kridaz/backend-common$":
      "<rootDir>/../packages/backend-common/src/index.js",
    "^@kridaz/shared-constants$":
      "<rootDir>/../packages/shared-constants/src/index.js",
    "^@kridaz/common$": "<rootDir>/../packages/common/dist/index.js",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  verbose: true,
  setupFilesAfterEnv: ["./tests/setup.js"],
};
