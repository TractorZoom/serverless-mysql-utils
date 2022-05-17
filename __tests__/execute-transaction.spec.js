import Chance from 'chance';
import { createConnection } from 'mysql2/promise';
import { executeTransaction } from '../src/execute-transaction';

const chance = new Chance();

jest.mock('mysql2/promise', () => ({
    createConnection: jest.fn(),
}));

describe('execute Transaction', () => {
    const conn = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        end: jest.fn(),
        query: jest.fn(),
        rollback: jest.fn(),
    };

    beforeEach(() => {
        createConnection.mockResolvedValue(conn);
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
        expect(createConnection).toHaveBeenCalledTimes(1);
        expect(createConnection).toHaveBeenCalledWith(dbConfig);
    });

    it('should successfully query mysql on the first try', async () => {
        // given
        const queries = chance.n(chance.string, 5);
        const data = chance.string();

        conn.query.mockResolvedValue(data);

        // when
        const response = await executeTransaction(queries);

        // then
        expect(conn.beginTransaction).toHaveBeenCalledTimes(1);
        expect(conn.commit).toHaveBeenCalledTimes(1);
        expect(conn.end).toHaveBeenCalledTimes(1);
        expect(conn.query).toHaveBeenCalledTimes(5);
        expect(response.data).toEqual(Array(5).fill(data));
    });

    it('should return error', async () => {
        // given
        const queries = chance.n(chance.string, 5);
        const error = chance.string();

        conn.query.mockRejectedValue(error);

        // when
        const response = await executeTransaction(queries);

        // then
        expect(conn.beginTransaction).toHaveBeenCalledTimes(1);
        expect(conn.commit).toHaveBeenCalledTimes(0);
        expect(conn.end).toHaveBeenCalledTimes(1);
        expect(conn.query).toHaveBeenCalledTimes(1);
        expect(response.data).toEqual([]);
        expect(response.error).toEqual(error);
        expect(conn.rollback).toHaveBeenCalledTimes(1);
    });
});
