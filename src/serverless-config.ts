import * as mysqlInitial from 'mysql';
import * as AWSXray from 'aws-xray-sdk';
import { Config } from 'serverless-mysql';

export const mysqlServerlessConfig = (): Config => {
    const defaultConfig: mysqlInitial.ConnectionConfig = {
        database: process.env.database,
        host: process.env.host,
        password: process.env.password,
        user: process.env.user,
    };

    const isProd = process.env.ENV === 'Prod';

    if (isProd) {
        AWSXray.setContextMissingStrategy('LOG_ERROR');
    }

    return {
        config: defaultConfig,
        // @ts-ignore
        library: isProd ? AWSXray.captureMySQL(mysqlInitial) : mysqlInitial,
        onConnect: (e) => console.info('Created new database connection', e),
        onClose: (e) => console.info('Closed Database connection explicitly', e),
        onRetry: (e) => console.info('Retry opening database connection', e),
        onConnectError: (e) => console.error('Error creating database connection', e),
    };
};
