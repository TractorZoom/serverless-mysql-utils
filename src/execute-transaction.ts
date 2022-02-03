import { TransactionResponse } from './types';
import { mysqlServerlessConfig } from './serverless-config';
import { readOnlyTransaction } from './read-only-transaction';
import serverlessMysql from 'serverless-mysql';
import * as mysqlInitial from 'mysql';

// Must Stay Outside of Main Execution https://github.com/jeremydaly/serverless-mysql#how-to-use-this-module
const mysql = serverlessMysql(mysqlServerlessConfig());

export async function executeTransaction(
    queries: string[],
    dbConfig: mysqlInitial.ConnectionConfig,
    readOnly?: boolean
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
        if (readOnly) {
            const transaction = readOnlyTransaction(mysql);

            queries.map((query) => transaction.query(query));

            data = await transaction.commit();
        } else {
            const transaction = mysql.transaction();

            queries.map((query) => transaction.query(query));

            data = await transaction.commit();
        }
    } catch (ex) {
        console.error('query failed: ', ex);
        error = `${ex}`;
    } finally {
        await mysql.end();

        return { data, error };
    }
}
