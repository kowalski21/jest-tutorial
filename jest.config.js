/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["./src/singleton.ts"],
  transform: {
    "^.+.tsx?$": ["ts-jest", {}],
  },
};
