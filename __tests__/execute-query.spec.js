import { executeQuery, executeQueryWithParams } from '../src/execute-query';
import Chance from 'chance';
import { getPool } from '../src/pools';

const chance = new Chance();

jest.mock('../src/pools');

describe('serverless mysql utility', () => {
    describe('executeQuery', () => {
        let mockPool = {};

        beforeEach(() => {
            getPool.mockResolvedValue(mockPool);
        });

        it('should successfully query mysql on the first try', async () => {
            const dbConfig = {
                database: chance.word(),
                host: chance.word(),
                password: chance.word(),
                user: chance.word(),
            };
            const query = chance.string();
            const data = chance.n(chance.string, 6);

            mockPool.execute = jest.fn().mockResolvedValue([data, null]);

            const response = await executeQuery(query, dbConfig);

            expect(getPool).toHaveBeenCalledTimes(1);
            expect(getPool).toHaveBeenCalledWith(dbConfig);
            expect(mockPool.execute).toHaveBeenCalledWith(query, null);

            expect(response.data).toEqual(data);
        });

        it('should fail the first query and return an error', async () => {
            const dbConfig = {
                database: chance.word(),
                host: chance.word(),
                password: chance.word(),
                user: chance.word(),
            };
            const query = chance.string();
            const error = chance.string();

            mockPool.execute = jest.fn().mockRejectedValue(error);

            const response = await executeQuery(query, dbConfig);

            expect(mockPool.execute).toHaveBeenCalledWith(query, null);

            expect(response.data).toEqual(undefined);
            expect(response.error).toEqual(error);
        });
    });

    describe('executeQueryWithParams', () => {
        let mockPool = {};

        beforeEach(() => {
            getPool.mockResolvedValue(mockPool);
        });

        it('should configure mysql when the option is passed', async () => {
            // given
            const dbConfig = {
                database: chance.word(),
                host: chance.word(),
                password: chance.word(),
                user: chance.word(),
            };

            // when
            await executeQueryWithParams('', [], dbConfig);

            // then
            expect(getPool).toHaveBeenCalledTimes(1);
            expect(getPool).toHaveBeenCalledWith(dbConfig);
        });

        it('should successfully query mysql on the first try', async () => {
            const params = chance.n(chance.string, 6);
            const query = chance.string();
            const data = chance.n(chance.string, 6);

            mockPool.execute = jest.fn().mockResolvedValue([data, null]);

            const response = await executeQueryWithParams(query, params);

            expect(mockPool.execute).toHaveBeenCalledWith(query, params);

            expect(response.data).toEqual(data);
        });

        it('should fail the first query and return an error when the second query fails', async () => {
            const params = chance.n(chance.string, 6);
            const query = chance.string();
            const error = chance.string();

            mockPool.execute = jest.fn().mockRejectedValue(error);

            const response = await executeQueryWithParams(query, params);

            expect(mockPool.execute).toHaveBeenCalledWith(query, params);

            expect(response.data).toEqual(undefined);
            expect(response.error).toEqual(error);
        });
    });
});
