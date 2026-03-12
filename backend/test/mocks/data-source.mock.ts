export const createMockQueryBuilder = () => {
  const qb: Record<string, jest.Mock> = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    loadRelationCountAndMap: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getOne: jest.fn().mockResolvedValue(null),
    getMany: jest.fn().mockResolvedValue([]),
  };
  // Return itself from all chain methods
  Object.keys(qb).forEach((key) => {
    if (key !== 'getManyAndCount' && key !== 'getOne' && key !== 'getMany') {
      qb[key].mockReturnThis();
    }
  });
  return qb;
};

export const createMockDataSource = () => {
  const qb = createMockQueryBuilder();
  return {
    transaction: jest.fn().mockImplementation(async (cb: (m: object) => void) =>
      cb({ increment: jest.fn(), delete: jest.fn() }),
    ),
    createQueryRunner: jest.fn().mockReturnValue({
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        increment: jest.fn(),
        delete: jest.fn(),
      },
    }),
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    query: jest.fn().mockResolvedValue([]),
    _qb: qb,
  };
};
