const { parentPort } = require("worker_threads");
const vm = require("vm");

parentPort.on("message", ({ code }) => {
  try {
    const logs = [];

    const context = {
      console: {
        log: (...args) => {
          logs.push(args.map((item) => String(item)).join(" "));
        },
        error: (...args) => {
          logs.push(args.map((item) => String(item)).join(" "));
        }
      },
      Math,
      Number,
      String,
      Boolean,
      Array,
      Object,
      JSON,
      Date,
      parseInt,
      parseFloat,
      isNaN,
      setTimeout: undefined,
      setInterval: undefined,
      fetch: undefined,
      require: undefined,
      process: undefined,
      module: undefined,
      exports: undefined,
      global: undefined,
      globalThis: undefined
    };

    vm.createContext(context);

    const script = new vm.Script(`"use strict";\n${code}`);

    script.runInContext(context, {
      timeout: 1000,
      displayErrors: true
    });

    parentPort.postMessage({
      ok: true,
      output: logs
    });
  } catch (error) {
    parentPort.postMessage({
      ok: false,
      error: error.message
    });
  }
});
