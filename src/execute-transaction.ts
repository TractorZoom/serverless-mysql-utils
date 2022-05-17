import { Connection, ConnectionOptions, createConnection } from 'mysql2/promise';
import { TransactionResponse } from './types';

export async function executeTransaction(queries: string[], dbConfig: ConnectionOptions): TransactionResponse {
    const data: any[] = [];
    let error;
    let conn: Connection = null;

    try {
        conn = await createConnection({
            database: dbConfig.database,
            host: dbConfig.host,
            password: dbConfig.password,
            user: dbConfig.user,
        });

        await conn.beginTransaction();

        for (const query of queries) {
            const response = await conn.query(query);

            data.push(response);
        }
        await conn.commit();
    } catch (ex) {
        if (conn) await conn.rollback();
        console.error('query failed: ', ex);
        error = `${ex}`;
    } finally {
        if (conn) await conn.end();

        return { data, error };
    }
}
