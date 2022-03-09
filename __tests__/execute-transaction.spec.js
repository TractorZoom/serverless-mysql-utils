import Chance from 'chance';
import { executeTransaction } from '../src/execute-transaction';
import { getPool } from '../src/pools';

const chance = new Chance();

jest.mock('../src/pools');

describe('execute Transaction', () => {
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
        const queries = [];

        // when
        await executeTransaction(queries, dbConfig);

        // then
        expect(getPool).toHaveBeenCalledTimes(1);
        expect(getPool).toHaveBeenCalledWith(dbConfig);
    });

    it('should successfully query mysql on the first try', async () => {
        // given
        const conn = {
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            query: jest.fn(),
            release: jest.fn(),
        };

        mockPool.getConnection = jest.fn().mockResolvedValue(conn);

        const queries = chance.n(chance.string, 5);
        const data = chance.string();

        conn.query.mockResolvedValue(data);

        // when
        const response = await executeTransaction(queries);

        // then
        expect(conn.beginTransaction).toHaveBeenCalledTimes(1);
        expect(conn.commit).toHaveBeenCalledTimes(1);
        expect(conn.release).toHaveBeenCalledTimes(1);
        expect(conn.query).toHaveBeenCalledTimes(5);
        expect(response.data).toEqual(Array(5).fill(data));
    });

    it('should return error', async () => {
        // given
        const conn = {
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            query: jest.fn(),
            release: jest.fn(),
            rollback: jest.fn(),
        };

        mockPool.getConnection = jest.fn().mockResolvedValue(conn);

        const queries = chance.n(chance.string, 5);
        const error = chance.string();

        conn.query.mockRejectedValue(error);

        // when
        const response = await executeTransaction(queries);

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
