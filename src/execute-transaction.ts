import { TransactionResponse } from './types';
import * as serverlessMysql from 'serverless-mysql';
import * as AWSXray from 'aws-xray-sdk';
import * as mysqlInitial from 'mysql';
import { mysqlServerlessConfig } from './serverless-config';

// Must Stay Outside of Main Execution https://github.com/jeremydaly/serverless-mysql#how-to-use-this-module
const mysql = serverlessMysql(mysqlServerlessConfig());

export async function executeTransaction(
    queries: string[],
    dbConfig: mysqlInitial.ConnectionConfig
): TransactionResponse {
    AWSXray.setContextMissingStrategy('LOG_ERROR');

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
