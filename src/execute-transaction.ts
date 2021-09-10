import { ConnectionConfig } from 'mysql';
import { TransactionResponse } from './types';
import * as serverlessMysql from 'serverless-mysql';

const defaultConfig: ConnectionConfig = {
    database: process.env.database,
    host: process.env.host,
    password: process.env.password,
    user: process.env.user,
};
const mysql = serverlessMysql({ config: defaultConfig });

export async function executeTransaction(queries: string[], dbConfig: ConnectionConfig): TransactionResponse {
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
