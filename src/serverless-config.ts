import { Config } from 'serverless-mysql';
import * as AWSXray from 'aws-xray-sdk';
import * as mysqlInitial from 'mysql';

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
        library: isProd ? (AWSXray.captureMySQL(mysqlInitial) as any) : mysqlInitial,
    };
};
