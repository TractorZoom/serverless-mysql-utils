import { executeQuery, executeQueryWithParams } from '../src/execute-query';
import Chance from 'chance';
import { getPool } from '../src/pools';

const chance = new Chance();

jest.mock('../src/pools');

describe('serverless mysql utility', () => {
    let mockPool = {};

    beforeEach(() => {
        getPool.mockResolvedValue(mockPool);
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

            // then - implementation adds ssl: {} when undefined so mysql uses secure connection (required for caching_sha2_password)
            expect(getPool).toHaveBeenCalledTimes(1);
            expect(getPool).toHaveBeenCalledWith(expect.objectContaining({ ...dbConfig, ssl: {} }));
        });

        it('should pass through ssl config when provided', async () => {
            const dbConfig = {
                database: chance.word(),
                host: chance.word(),
                password: chance.word(),
                user: chance.word(),
                ssl: { ca: chance.string() },
            };

            await executeQuery('', dbConfig);

            expect(getPool).toHaveBeenCalledWith(expect.objectContaining({ ssl: dbConfig.ssl }));
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

            // then - implementation adds ssl: {} when undefined so mysql uses secure connection (required for caching_sha2_password)
            expect(getPool).toHaveBeenCalledTimes(1);
            expect(getPool).toHaveBeenCalledWith(expect.objectContaining({ ...dbConfig, ssl: {} }));
        });

        it('should successfully query mysql on the first try', async () => {
            const dbConfig = {
                database: chance.word(),
                host: chance.word(),
                password: chance.word(),
                user: chance.word(),
            };

            const params = chance.n(chance.string, 6);
            const query = chance.string();
            const data = chance.n(chance.string, 6);

            mockPool.execute = jest.fn().mockResolvedValue([data, null]);

            const response = await executeQueryWithParams(query, params, dbConfig);

            expect(mockPool.execute).toHaveBeenCalledWith(query, params);

            expect(response.data).toEqual(data);
        });

        it('should fail the first query and return an error when the second query fails', async () => {
            const dbConfig = {
                database: chance.word(),
                host: chance.word(),
                password: chance.word(),
                user: chance.word(),
            };
            const params = chance.n(chance.string, 6);
            const query = chance.string();
            const error = chance.string();

            mockPool.execute = jest.fn().mockRejectedValue(error);

            const response = await executeQueryWithParams(query, params, dbConfig);

            expect(mockPool.execute).toHaveBeenCalledWith(query, params);

            expect(response.data).toEqual(undefined);
            expect(response.error).toEqual(error);
        });

        it('should use pool.query instead of pool.execute when preparedStatement is false', async () => {
            const dbConfig = {
                database: chance.word(),
                host: chance.word(),
                password: chance.word(),
                user: chance.word(),
            };

            const params = chance.n(chance.string, 6);
            const query = chance.string();
            const data = chance.n(chance.string, 6);

            mockPool.query = jest.fn().mockResolvedValue([data, null]);
            mockPool.execute = jest.fn();

            const response = await executeQueryWithParams(query, params, dbConfig, { preparedStatement: false });

            expect(mockPool.query).toHaveBeenCalledWith(query, params);
            expect(mockPool.execute).not.toHaveBeenCalled();

            expect(response.data).toEqual(data);
        });
    });

    describe('dropped connection retry', () => {
        const dbConfig = { database: 'db', host: 'host', password: 'pw', user: 'user' };
        const droppedError = (code) => Object.assign(new Error(`dropped: ${code}`), { code });

        it.each(['EPIPE', 'ECONNRESET', 'PROTOCOL_CONNECTION_LOST'])(
            'should retry once and return data when the first attempt fails with %s',
            async (code) => {
                const data = chance.n(chance.string, 3);
                mockPool.execute = jest
                    .fn()
                    .mockRejectedValueOnce(droppedError(code))
                    .mockResolvedValueOnce([data, null]);

                const response = await executeQueryWithParams('SELECT 1', [1], dbConfig);

                expect(mockPool.execute).toHaveBeenCalledTimes(2);
                expect(response.data).toEqual(data);
                expect(response.error).toBeUndefined();
            }
        );

        it('should return the error when the retry also fails', async () => {
            mockPool.query = jest.fn().mockRejectedValue(droppedError('EPIPE'));

            const response = await executeQuery('SELECT 1', dbConfig);

            expect(mockPool.query).toHaveBeenCalledTimes(2);
            expect(response.data).toBeUndefined();
            expect(response.error).toEqual('Error: dropped: EPIPE');
        });

        it('should not retry other errors', async () => {
            mockPool.query = jest.fn().mockRejectedValue(Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' }));

            const response = await executeQuery('SELECT 1', dbConfig);

            expect(mockPool.query).toHaveBeenCalledTimes(1);
            expect(response.error).toEqual('Error: dup');
        });

        it('should retry a read with leading whitespace and lowercase keyword', async () => {
            mockPool.query = jest.fn().mockRejectedValueOnce(droppedError('EPIPE')).mockResolvedValueOnce([[], null]);

            const response = await executeQuery('\n    select id from user', dbConfig);

            expect(mockPool.query).toHaveBeenCalledTimes(2);
            expect(response.error).toBeUndefined();
        });

        it.each(['INSERT INTO t VALUES (1)', 'UPDATE t SET n = n + 1', 'WITH x AS (SELECT 1) DELETE FROM t'])(
            'should not retry a write after a dropped connection: %s',
            async (query) => {
                mockPool.query = jest.fn().mockRejectedValue(droppedError('PROTOCOL_CONNECTION_LOST'));

                const response = await executeQuery(query, dbConfig);

                expect(mockPool.query).toHaveBeenCalledTimes(1);
                expect(response.error).toEqual('Error: dropped: PROTOCOL_CONNECTION_LOST');
            }
        );
    });
});
