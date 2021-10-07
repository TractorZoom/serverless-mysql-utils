import Chance from 'chance';
import Mysql from 'serverless-mysql';
import { executeQuery } from '../src/execute-query';
import { captureSubsegment } from '../src/capture-subsegments';

const chance = new Chance();
const mysql = Mysql();

jest.mock('serverless-mysql');
jest.mock('aws-xray-sdk');
jest.mock('../src/capture-subsegments');

describe('serverless mysql utility', () => {
    let mockData;

    beforeEach(() => {
        const rejectError = chance.string();

        mockData = {
            errorMessage: { error: `Error: ${rejectError}` },
            query: chance.string(),
            queryResponse: chance.string(),
            rejectError,
        };

        mysql.end.mockResolvedValue();
        mysql.query.mockResolvedValue(mockData.queryResponse);
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
            host: chance.word(),
            user: chance.word(),
            password: chance.word(),
            database: chance.word(),
        };

        process.env.database = chance.word();
        process.env.host = chance.word();
        process.env.password = chance.word();
        process.env.user = chance.word();

        // when
        await executeQuery(mockData.query, dbConfig);

        // then
        expect(mysql.quit).toHaveBeenCalledTimes(1);
        expect(mysql.quit).toHaveBeenCalledWith();
    });

    it('should captureSubsegment', async () => {
        // given
        const dbConfig = {
            host: chance.word(),
            user: chance.word(),
            password: chance.word(),
            database: chance.word(),
        };

        process.env.database = chance.word();
        process.env.host = chance.word();
        process.env.password = chance.word();
        process.env.user = chance.word();

        // when
        await executeQuery(mockData.query, dbConfig, { xray: true });

        // then
        expect(captureSubsegment).toHaveBeenCalledWith(mockData.query);
    });

    it('should configure mysql when the option is passed', async () => {
        // given
        const dbConfig = {
            host: chance.word(),
            user: chance.word(),
            password: chance.word(),
            database: chance.word(),
        };

        // when
        await executeQuery(mockData.query, dbConfig);

        // then
        expect(mysql.config).toHaveBeenCalledTimes(1);
        expect(mysql.config).toHaveBeenCalledWith(dbConfig);
    });

    it('should successfully query mysql on the first try', async () => {
        const response = await executeQuery(mockData.query);

        expect(mysql.query).toHaveBeenCalledTimes(1);
        expect(mysql.query).toHaveBeenCalledWith(mockData.query);

        expect(response.data).toEqual(mockData.queryResponse);
    });

    it('should fail the first query and succeed on the second', async () => {
        mysql.query.mockRejectedValueOnce(new Error(mockData.rejectError));

        const response = await executeQuery(mockData.query);

        expect(mysql.query).toHaveBeenCalledTimes(2);
        expect(mysql.query).toHaveBeenCalledWith(mockData.query);

        expect(response.data).toEqual(mockData.queryResponse);
    });

    it('should fail the first query and return an error when the second query fails', async () => {
        mysql.query.mockRejectedValueOnce(new Error(mockData.rejectError));
        mysql.query.mockRejectedValueOnce(new Error(mockData.rejectError));

        const response = await executeQuery(mockData.query);

        expect(mysql.query).toHaveBeenCalledTimes(2);
        expect(mysql.query).toHaveBeenCalledWith(mockData.query);

        expect(response).toEqual(mockData.errorMessage);
    });

    it('should end the connection', async () => {
        await executeQuery(mockData.query);

        expect(mysql.end).toHaveBeenCalledTimes(1);
        expect(mysql.end).toHaveBeenCalledWith();
    });
});
