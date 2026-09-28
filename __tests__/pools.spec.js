import { Chance } from 'chance';
import { createPool } from 'mysql2';
import { getPool } from '../src/pools';

const chance = new Chance();

jest.mock('mysql2', () => ({
    createPool: jest.fn(),
}));

describe('pools helper', () => {
    it('should get a new pool if one doesnt exist in cache', async () => {
        const config = {
            host: chance.string(),
        };
        const mockPool = { something: chance.string() };

        createPool.mockReturnValueOnce({ promise: () => mockPool });

        const pool = await getPool(config);

        expect(createPool).toHaveBeenCalledTimes(1);
        expect(pool).toBe(mockPool);
    });

    it('should return same pool if pool already exists', async () => {
        const config = {
            host: chance.string(),
        };

        const mockPool = { something: chance.string() };

        createPool.mockReturnValueOnce({ promise: () => mockPool });

        const pool1 = await getPool(config);
        const pool2 = await getPool(config);

        expect(createPool).toHaveBeenCalledTimes(1);
        expect(pool1).toBe(mockPool);
        expect(pool2).toBe(mockPool);
    });

    it('should create separate pools for the same host and database on different ports', async () => {
        const host = chance.string();
        const database = chance.word();
        const poolA = { something: chance.string() };
        const poolB = { something: chance.string() };

        createPool.mockReturnValueOnce({ promise: () => poolA }).mockReturnValueOnce({ promise: () => poolB });

        const pool1 = await getPool({ host, database, port: 3306 });
        const pool2 = await getPool({ host, database, port: 3307 });

        expect(pool1).toBe(poolA);
        expect(pool2).toBe(poolB);
    });
});
