export const createMockJwtHelper = () => ({
  signAccess: jest.fn().mockReturnValue('access_token'),
  signRefresh: jest.fn().mockReturnValue('refresh_token'),
  verifyRefresh: jest.fn().mockReturnValue({ sub: 1, jti: 'uuid' }),
});
