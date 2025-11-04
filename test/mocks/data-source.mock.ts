export const createMockDataSource = () => ({
  transaction: jest.fn().mockImplementation(async (cb) =>
    cb({
      increment: jest.fn(),
      delete: jest.fn(),
    }),
  ),
  createQueryRunner: jest.fn(),
});
