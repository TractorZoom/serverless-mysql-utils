import * as mysqlInitial from 'mysql';
import { QueryResponse } from './types';
import * as serverlessMysql from 'serverless-mysql';
import { mysqlServerlessConfig } from './serverless-config';
import { captureSubsegment } from './capture-subsegments';

// Must Stay Outside of Main Execution https://github.com/jeremydaly/serverless-mysql#how-to-use-this-module
const mysql = serverlessMysql(mysqlServerlessConfig());

export async function executeQuery<T>(query: string, dbConfig: mysqlInitial.ConnectionConfig): QueryResponse<T> {
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
        captureSubsegment(query);

        await mysql.end();

        return { data, error };
    }
}
