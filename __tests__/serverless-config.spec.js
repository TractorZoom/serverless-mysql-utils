import Chance from 'chance';
import { mysqlServerlessConfig } from '../src/serverless-config';
import * as AWSXray from 'aws-xray-sdk';

const chance = new Chance();

jest.mock('aws-xray-sdk');

describe('serverless-config', () => {
    it('should use default configs', async () => {
        // given
        const dbConfig = {
            database: chance.word(),
            host: chance.word(),
            password: chance.word(),
            user: chance.word(),
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
        process.env.ENV = 'Prod';

        // when
        await mysqlServerlessConfig();

        // then
        expect(AWSXray.captureMySQL).toHaveBeenCalled();
    });
});
