import { TransactionResponse } from './types';
import * as initialMysql from 'mysql';
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

export async function executeTransaction(
    queries: string[],
    dbConfig: initialMysql.ConnectionConfig
): TransactionResponse {
    if (JSON.stringify(mysql.getConfig()) !== JSON.stringify(dbConfig)) {
        await mysql.quit();
    }

    if (dbConfig) {
        mysql.config(dbConfig);
    }

    let data: any[];
    let error;

    try {
        const transaction = mysql.transaction();

        queries.map((query) => transaction.query(query));

        data = await transaction.commit();
    } catch (ex) {
        console.error('query failed: ', ex);
        error = `${ex}`;
    } finally {
        await mysql.end();

        return { data, error };
    }
}
