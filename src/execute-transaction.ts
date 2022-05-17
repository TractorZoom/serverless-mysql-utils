import { ConnectionOptions, PoolConnection } from 'mysql2/promise';
import { TransactionResponse } from './types';
import { getPool } from './pools';

export async function executeTransaction(queries: string[], dbConfig: ConnectionOptions): TransactionResponse {
    const data: any[] = [];
    let error;
    let conn: PoolConnection = null;

    try {
        const pool = await getPool({
            database: dbConfig.database,
            host: dbConfig.host,
            password: dbConfig.password,
            user: dbConfig.user,
        });

        conn = await pool.getConnection();

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
        if (conn) await conn.release();

        return { data, error };
    }
}
