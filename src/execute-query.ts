import * as mysqlInitial from 'mysql';
import { QueryResponse } from './types';
import * as serverlessMysql from 'serverless-mysql';
import * as AWSXray from 'aws-xray-sdk';

const defaultConfig: mysqlInitial.ConnectionConfig = {
    database: process.env.database,
    host: process.env.host,
    password: process.env.password,
    user: process.env.user,
};

export async function executeQuery<T>(
    query: string,
    dbConfig: mysqlInitial.ConnectionConfig,
    options: { xray?: boolean } = {}
): QueryResponse<T> {
    AWSXray.setContextMissingStrategy('LOG_ERROR');

    const mysql = serverlessMysql({
        config: defaultConfig,
        // @ts-ignore
        library: options.xray ? AWSXray.captureMySQL(mysqlInitial) : mysqlInitial,
    });

    if (JSON.stringify(mysql.getConfig()) !== JSON.stringify(dbConfig)) {
        await mysql.quit();
    }

    if (dbConfig) {
        mysql.config(dbConfig);
    }

    let data: T;
    let error;

    try {
        data = await mysql.query<T>(query);
    } catch (ex) {
        console.error('query failed: ', ex);

        try {
            data = await mysql.query<T>(query);
        } catch (ex2) {
            console.error('retried query failed: ', ex2);

            error = `${ex2}`;
        }
    } finally {
        await mysql.end();

        return { data, error };
    }
}
