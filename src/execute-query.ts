import * as initialMysql from 'mysql';
import { QueryResponse } from './types';
import * as serverlessMysql from 'serverless-mysql';
import { captureMySQL } from 'aws-xray-sdk';

const defaultConfig: initialMysql.ConnectionConfig = {
    database: process.env.database,
    host: process.env.host,
    password: process.env.password,
    user: process.env.user,
};

// istanbul ignore next
const mysql = serverlessMysql({
    config: defaultConfig,
    library: () => captureMySQL(initialMysql),
});

export async function executeQuery<T>(query: string, dbConfig: initialMysql.ConnectionConfig): QueryResponse<T> {
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
