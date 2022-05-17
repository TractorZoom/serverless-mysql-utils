import { ConnectionOptions } from 'mysql2';
import { QueryResponse } from './types';
import { RowDataPacket } from 'mysql2/promise';
import { createConnection } from 'mysql2/promise';

type RowData = {
    [name: string]: any;
};

type QueryInfo = { affectedRows?: number; insertId?: number };

async function wrap<T extends RowData[] | QueryInfo>(
    query: string,
    params: any[] | any,
    dbConfig: ConnectionOptions
): QueryResponse<T> {
    const connection = await createConnection({
        database: dbConfig.database,
        host: dbConfig.host,
        password: dbConfig.password,
        user: dbConfig.user,
    });

    let data: T;
    let error;

    try {
        if (params) {
            data = (await connection.execute<T & RowDataPacket[]>(query, params))[0];
        } else {
            data = (await connection.query<T & RowDataPacket[]>(query))[0];
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
