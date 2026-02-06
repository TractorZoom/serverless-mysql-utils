import Chance from 'chance';
import { executeTransaction } from '../src/execute-transaction';
import { getPool } from '../src/pools';

const chance = new Chance();

jest.mock('../src/pools');

describe('execute Transaction', () => {
    let mockPool = {};
    const conn = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        query: jest.fn(),
        release: jest.fn(),
        rollback: jest.fn(),
    };

    beforeEach(() => {
        getPool.mockResolvedValue(mockPool);
        mockPool.getConnection = jest.fn().mockResolvedValue(conn);
    });

    it('should configure mysql when the option is passed', async () => {
        // given
        const dbConfig = {
            database: chance.word(),
            host: chance.word(),
            password: chance.word(),
            user: chance.word(),
        };
        const queries = [];

        // when
        await executeTransaction(queries, dbConfig);

        // then - implementation adds ssl: {} when undefined so mysql uses secure connection (required for caching_sha2_password)
        expect(getPool).toHaveBeenCalledTimes(1);
        expect(getPool).toHaveBeenCalledWith({ ...dbConfig, ssl: {} });
    });

    it('should pass through ssl config when provided', async () => {
        const dbConfig = {
            database: chance.word(),
            host: chance.word(),
            password: chance.word(),
            user: chance.word(),
            ssl: { ca: chance.string() },
        };

        await executeTransaction([], dbConfig);

        expect(getPool).toHaveBeenCalledWith(expect.objectContaining({ ssl: dbConfig.ssl }));
    });

    it('should successfully query mysql on the first try', async () => {
        // given
        const dbConfig = {
            database: chance.word(),
            host: chance.word(),
            password: chance.word(),
            user: chance.word(),
        };
        const queries = chance.n(chance.string, 5);
        const data = chance.string();

        conn.query.mockResolvedValue([data, chance.word()]);

        // when
        const response = await executeTransaction(queries, dbConfig);

        // then
        expect(conn.beginTransaction).toHaveBeenCalledTimes(1);
        expect(conn.commit).toHaveBeenCalledTimes(1);
        expect(conn.release).toHaveBeenCalledTimes(1);
        expect(conn.query).toHaveBeenCalledTimes(5);
        expect(response.data).toEqual(Array(5).fill(data));
    });

    it('should handle missing result set', async () => {
        // this is likely not possible, but I wanted to add a safe dereference
        const dbConfig = {
            database: chance.word(),
            host: chance.word(),
            password: chance.word(),
            user: chance.word(),
        };
        const queries = chance.n(chance.string, 5);

        const response = await executeTransaction(queries, dbConfig);

        expect(conn.beginTransaction).toHaveBeenCalledTimes(1);
        expect(conn.commit).toHaveBeenCalledTimes(1);
        expect(conn.release).toHaveBeenCalledTimes(1);
        expect(conn.query).toHaveBeenCalledTimes(5);
        expect(response.data).toEqual(Array(5).fill(undefined));
    });

    it('should return error', async () => {
        // given
        const dbConfig = {
            database: chance.word(),
            host: chance.word(),
            password: chance.word(),
            user: chance.word(),
        };
        const queries = chance.n(chance.string, 5);
        const error = chance.string();

        conn.query.mockRejectedValue(error);

        // when
        const response = await executeTransaction(queries, dbConfig);

        // then
        expect(conn.beginTransaction).toHaveBeenCalledTimes(1);
        expect(conn.commit).toHaveBeenCalledTimes(0);
        expect(conn.release).toHaveBeenCalledTimes(1);
        expect(conn.query).toHaveBeenCalledTimes(1);
        expect(response.data).toEqual([]);
        expect(response.error).toEqual(error);
        expect(conn.rollback).toHaveBeenCalledTimes(1);
    });
});
