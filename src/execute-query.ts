import { QueryResponse } from './types';
import { captureSubsegment } from './capture-subsegments';
import { mysqlServerlessConfig } from './serverless-config';
import * as mysqlInitial from 'mysql';
import * as serverlessMysql from 'serverless-mysql';

// Must Stay Outside of Main Execution https://github.com/jeremydaly/serverless-mysql#how-to-use-this-module
const mysql = serverlessMysql(mysqlServerlessConfig());

async function wrap<T>(query: () => Promise<T>, dbConfig: mysqlInitial.ConnectionConfig): QueryResponse<T> {
    if (JSON.stringify(mysql.getConfig()) !== JSON.stringify(dbConfig)) {
        await mysql.quit();
    }

    if (dbConfig) {
        mysql.config(dbConfig);
    }

    let data: T;
    let error;

    try {
        data = await query();
    } catch (ex) {
        console.error('query failed: ', ex);

        error = `${ex}`;
    } finally {
        await mysql.end();

        return { data, error };
    }
}

export async function executeQueryWithParams<T>(
    query: string,
    params: any[] | any,
    dbConfig: mysqlInitial.ConnectionConfig
): QueryResponse<T> {
    const response = await wrap(() => mysql.query<T>(query, params), dbConfig);

    captureSubsegment(query);

    return response;
}

export async function executeQuery<T>(query: string, dbConfig: mysqlInitial.ConnectionConfig): QueryResponse<T> {
    const response = await wrap(() => mysql.query<T>(query), dbConfig);

    captureSubsegment(query);

    return response;
}
