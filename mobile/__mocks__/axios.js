// Mock for axios
const axios = {
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  create: () => axios,
};
export default axios;
