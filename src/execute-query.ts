import { QueryInfo, QueryResponse, RowData } from './types';
import { ConnectionOptions } from 'mysql2';
import { RowDataPacket } from 'mysql2/promise';
import { getPool } from './pools';

async function wrap<T extends RowData[] | QueryInfo>(
    query: string,
    params: any[] | any,
    dbConfig: ConnectionOptions
): QueryResponse<T> {
    const pool = await getPool({
        charset: dbConfig.charset,
        connectTimeout: dbConfig.connectTimeout,
        database: dbConfig.database,
        host: dbConfig.host,
        password: dbConfig.password,
        user: dbConfig.user,
        ssl: dbConfig.ssl !== undefined ? dbConfig.ssl : {},
    });

    let data: T;
    let error;

    try {
        // uses query() rather than execute() even when params are present: the SQL text
        // passed in here is frequently built dynamically (e.g. squel-generated inserts/
        // updates whose column list varies per call), so execute()'s server-side prepared
        // statements would never be reused and instead accumulate indefinitely per pooled
        // connection until MySQL's max_prepared_stmt_count is exhausted
        if (params) {
            data = (await pool.query<T & RowDataPacket[]>(query, params))[0];
        } else {
            data = (await pool.query<T & RowDataPacket[]>(query))[0];
        }
    } catch (ex) {
        console.error('query failed: ', ex);

        error = `${ex}`;
    } finally {
        return { data, error };
    }
}

export async function executeQueryWithParams<T extends RowData[] | QueryInfo>(
    query: string,
    params: any[] | any,
    dbConfig: ConnectionOptions
): QueryResponse<T> {
    return await wrap(query, params, dbConfig);
}

export async function executeQuery<T extends RowData[] | QueryInfo>(
    query: string,
    dbConfig: ConnectionOptions
): QueryResponse<T> {
    return await wrap(query, null, dbConfig);
}
