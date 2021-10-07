import Chance from 'chance';
import { mysqlServerlessConfig } from '../src/serverless-config';
import * as AWSXray from 'aws-xray-sdk';

const chance = new Chance();

jest.mock('aws-xray-sdk');

describe('serverless-config', () => {
    let mockData;

    it('should use default configs', async () => {
        // given
        const dbConfig = {
            host: chance.word(),
            user: chance.word(),
            password: chance.word(),
            database: chance.word(),
        };

        process.env.database = dbConfig.database;
        process.env.host = dbConfig.host;
        process.env.password = dbConfig.password;
        process.env.user = dbConfig.user;

        // when
        const config = await mysqlServerlessConfig();

        // then
        expect(config.config).toStrictEqual(dbConfig);
    });

    it('should use capture sql', async () => {
        // given

        // when
        await mysqlServerlessConfig();

        // then
        expect(AWSXray.captureMySQL).toHaveBeenCalled();
    });

    it('should handle onConnect', async () => {
        // given
        const consoleSpy = jest.spyOn(console, 'info');
        const e = chance.word();

        // when
        const config = await mysqlServerlessConfig();
        config.onConnect(e);

        // then
        expect(consoleSpy).toHaveBeenCalledWith('Created new database connection', e);
    });

    it('should handle onClose', async () => {
        // given
        const consoleSpy = jest.spyOn(console, 'info');
        const e = chance.word();

        // when
        const config = await mysqlServerlessConfig();
        config.onClose(e);

        // then
        expect(consoleSpy).toHaveBeenCalledWith('Closed Database connection explicitly', e);
    });

    it('should handle onRetry', async () => {
        // given
        const consoleSpy = jest.spyOn(console, 'info');
        const e = chance.word();

        // when
        const config = await mysqlServerlessConfig();
        config.onRetry(e);

        // then
        expect(consoleSpy).toHaveBeenCalledWith('Retry opening database connection', e);
    });

    it('should handle onRetry', async () => {
        // given
        const consoleSpy = jest.spyOn(console, 'error');
        const e = chance.word();

        // when
        const config = await mysqlServerlessConfig();
        config.onConnectError(e);

        // then
        expect(consoleSpy).toHaveBeenCalledWith('Error creating database connection', e);
    });
});
