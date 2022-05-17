import { executeQuery, executeQueryWithParams } from '../src/execute-query';
import Chance from 'chance';
import { createConnection } from 'mysql2/promise';

const chance = new Chance();

jest.mock('mysql2/promise', () => ({
    createConnection: jest.fn(),
}));

describe('serverless mysql utility', () => {
    let mockPool = {};

    beforeEach(() => {
        createConnection.mockResolvedValue(mockPool);
    });
    describe('executeQuery', () => {
        it('should configure mysql when the option is passed', async () => {
            // given
            const dbConfig = {
                database: chance.word(),
                host: chance.word(),
                password: chance.word(),
                user: chance.word(),
            };

            // when
            await executeQuery('', dbConfig);

            // then
            expect(createConnection).toHaveBeenCalledTimes(1);
            expect(createConnection).toHaveBeenCalledWith(dbConfig);
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

            mockPool.query = jest.fn().mockResolvedValue([data, null]);

            const response = await executeQuery(query, dbConfig);

            expect(mockPool.query).toHaveBeenCalledWith(query);

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

            mockPool.query = jest.fn().mockRejectedValue(error);

            const response = await executeQuery(query, dbConfig);

            expect(mockPool.query).toHaveBeenCalledWith(query);

            expect(response.data).toEqual(undefined);
            expect(response.error).toEqual(error);
        });
    });

    describe('executeQueryWithParams', () => {
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
            expect(createConnection).toHaveBeenCalledTimes(1);
            expect(createConnection).toHaveBeenCalledWith(dbConfig);
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
