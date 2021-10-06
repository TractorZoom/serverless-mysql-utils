import { TransactionResponse } from './types';
import * as serverlessMysql from 'serverless-mysql';
import * as AWSXray from 'aws-xray-sdk';
import * as mysqlInitial from 'mysql';

const defaultConfig: mysqlInitial.ConnectionConfig = {
    database: process.env.database,
    host: process.env.host,
    password: process.env.password,
    user: process.env.user,
};

export async function executeTransaction(
    queries: string[],
    dbConfig: mysqlInitial.ConnectionConfig,
    options: { xray: boolean } = { xray: false }
): TransactionResponse {
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
