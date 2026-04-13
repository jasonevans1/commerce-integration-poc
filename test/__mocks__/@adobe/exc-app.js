const mockRuntime = {
  on: jest.fn(),
  done: jest.fn(),
  solution: null,
  title: "",
};

const Runtime = jest.fn(() => mockRuntime);
const init = jest.fn((_callback) => {
  // intentionally empty — callback not invoked in tests
});

module.exports = { default: Runtime, init, __esModule: true };
