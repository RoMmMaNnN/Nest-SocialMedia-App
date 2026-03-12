export const mockUsersService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findByVerificationToken: jest.fn(),
  markEmailVerified: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  removeUserAndSessions: jest.fn(),
};
