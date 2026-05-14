const path = require("path");
const { Worker } = require("worker_threads");

function runJavaScriptCode(code) {
  return new Promise((resolve) => {
    const workerPath = path.join(__dirname, "../workers/jsProgramWorker.js");
    const worker = new Worker(workerPath);

    const timer = setTimeout(() => {
      worker.terminate();
      resolve({
        ok: false,
        error: "El código tardó demasiado en ejecutarse. Puede que tenga un ciclo infinito."
      });
    }, 1500);

    worker.on("message", (message) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(message);
    });

    worker.on("error", (error) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, error: error.message });
    });

    worker.postMessage({ code });
  });
}

module.exports = {
  runJavaScriptCode
};
