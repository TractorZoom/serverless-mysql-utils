import Chance from 'chance';
import Mysql from 'serverless-mysql';
import { executeTransaction } from '../src/execute-transaction';

const chance = new Chance();
const mysql = Mysql();

jest.mock('serverless-mysql');

describe('execute Transaction', () => {
    let mockData;

    beforeEach(() => {
        const rejectError = chance.string();

        mockData = {
            errorMessage: { error: `Error: ${rejectError}` },
            queries: chance.n(chance.string, chance.d6()),
            queryResponse: chance.string(),
            rejectError,
        };

        mysql.end.mockResolvedValue();
        mysql.transaction.mockReturnValue(mysql);
        mysql.query.mockReturnValue();
        mysql.commit.mockResolvedValue(mockData.queryResponse);
        mysql.quit.mockResolvedValue();
    });

    afterEach(() => {
        mysql.config.mockRestore();
        mysql.end.mockRestore();
        mysql.quit.mockRestore();
        mysql.query.mockRestore();
    });

    it('should quit connection if configuration passed is different than current configuration', async () => {
        // given
        const dbConfig = {
            database: chance.word(),
            host: chance.word(),
            password: chance.word(),
            user: chance.word(),
        };

        process.env.database = chance.word();
        process.env.host = chance.word();
        process.env.password = chance.word();
        process.env.user = chance.word();

        // when
        await executeTransaction(mockData.queries, dbConfig);

        // then
        expect(mysql.quit).toHaveBeenCalledTimes(1);
        expect(mysql.quit).toHaveBeenCalledWith();
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
        await executeTransaction(mockData.queries, dbConfig);

        // then
        expect(mysql.config).toHaveBeenCalledTimes(1);
        expect(mysql.config).toHaveBeenCalledWith(dbConfig);
    });

    it('should successfully query mysql on the first try', async () => {
        const response = await executeTransaction(mockData.queries);

        expect(mysql.query).toHaveBeenCalledTimes(mockData.queries.length);
        expect(response.data).toEqual(mockData.queryResponse);
    });

    it('should return error', async () => {
        mysql.commit.mockRejectedValue(new Error(mockData.rejectError));

        const response = await executeTransaction(mockData.queries);

        expect(response).toEqual(mockData.errorMessage);
    });

    it('should end the connection', async () => {
        await executeTransaction(mockData.queries);

        expect(mysql.end).toHaveBeenCalledTimes(1);
        expect(mysql.end).toHaveBeenCalledWith();
    });

    it('should successfully query mysql with transaction commands when readonly is true', async () => {
        mysql.query.mockResolvedValue(data);

        await executeTransaction(mockData.queries, null, true);

        const data = chance.word();

        expect(mysql.query).toHaveBeenCalledTimes(mockData.queries.length + 3);
        expect(mysql.query).toHaveBeenNthCalledWith(1, 'SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');
        expect(mysql.query).toHaveBeenNthCalledWith(2, 'START TRANSACTION');
        expect(mysql.query).toHaveBeenNthCalledWith(mockData.queries.length + 3, 'COMMIT');
    });
});
