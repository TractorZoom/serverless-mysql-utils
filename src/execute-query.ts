import { ConnectionOptions } from 'mysql2';
import { QueryResponse } from './types';
import { RowDataPacket } from 'mysql2/promise';
import { getPool } from './pools';
import { v4 as uuidv4 } from 'uuid';

type RowData = {
    [name: string]: any;
};

type QueryInfo = { affectedRows?: number; insertId?: number };

async function wrap<T extends RowData[] | QueryInfo>(
    query: string,
    params: any[] | any,
    dbConfig: ConnectionOptions
): QueryResponse<T> {
    const pool = await getPool(dbConfig);

    let data: T;
    let error;
    const id = uuidv4();
    const logName = `Query Time - ${id}`;

    console.time(logName);

    try {
        data = (await pool.execute<T & RowDataPacket[]>(query, params))[0];
    } catch (ex) {
        console.error('query failed: ', ex);

        error = `${ex}`;
    } finally {
        console.timeEnd(logName);

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
