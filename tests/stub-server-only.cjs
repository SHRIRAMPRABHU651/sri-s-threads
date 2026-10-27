// `server-only` throws outside Next's server bundle; tests run the server modules directly, so make it a no-op.
const Module = require("module");
const orig = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "server-only") return require.resolve("./empty.cjs");
  return orig.call(this, request, ...rest);
};
