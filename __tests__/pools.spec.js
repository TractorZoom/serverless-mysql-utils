import { Chance } from 'chance';
import { createPool } from 'mysql2/promise';
import { getPool } from '../src/pools';

const chance = new Chance();

jest.mock('mysql2/promise');

describe('pools helper', () => {
    it('should get a new pool if one doesnt exist in cache', async () => {
        const config = {
            host: chance.string(),
        };
        const mockPool = { something: chance.string() };

        createPool.mockReturnValueOnce(mockPool);

        const pool = await getPool(config);

        expect(createPool).toHaveBeenCalledWith(config);
        expect(pool).toBe(mockPool);
    });

    it('should return same pool if pool already exists', async () => {
        const config = {
            host: chance.string(),
        };

        const mockPool = { something: chance.string() };

        createPool.mockReturnValueOnce(mockPool);

        const pool1 = await getPool(config);
        const pool2 = await getPool(config);

        expect(createPool).toHaveBeenCalledTimes(1);
        expect(createPool).toHaveBeenCalledWith(config);
        expect(pool1).toBe(mockPool);
        expect(pool2).toBe(mockPool);
    });
});
