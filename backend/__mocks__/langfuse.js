// Jest manual mock for langfuse — used in tests to avoid dynamic import incompatibility.
// The services use: langfuse.trace(...).generation(...).end(...)
// All calls are no-ops; no data is sent to Langfuse in the test environment.

const noop = () => {};
const generation = { end: noop };
const trace = { generation: () => generation };

class Langfuse {
  trace() {
    return trace;
  }
}

module.exports = { Langfuse };
