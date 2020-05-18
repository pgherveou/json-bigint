module.exports = {
  testMatch: ["**/*.test.ts"],
  testEnvironment: "node",
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json",
    },
  },
};
