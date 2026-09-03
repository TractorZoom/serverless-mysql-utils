import { QueryInfo, QueryResponse, RowData } from './types';
import { ConnectionOptions } from 'mysql2';
import { RowDataPacket } from 'mysql2/promise';
import { getPool } from './pools';

export type ExecuteQueryOptions = {
    // When false, sends params as a plain (safely value-substituted) COM_QUERY instead of
    // preparing a server-side statement via COM_STMT_PREPARE. Use this for queries whose SQL
    // text is high-cardinality (e.g. built with a dynamic column list per call) so they don't
    // permanently consume a slot against MySQL's server-wide max_prepared_stmt_count. Defaults
    // to true to preserve the historical behavior for fixed-shape queries that benefit from
    // prepared-statement reuse on a warm connection.
    preparedStatement?: boolean;
};

async function wrap<T extends RowData[] | QueryInfo>(
    query: string,
    params: any[] | any,
    dbConfig: ConnectionOptions,
    options?: ExecuteQueryOptions
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
        if (params) {
            data =
                options?.preparedStatement === false
                    ? (await pool.query<T & RowDataPacket[]>(query, params))[0]
                    : (await pool.execute<T & RowDataPacket[]>(query, params))[0];
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
    dbConfig: ConnectionOptions,
    options?: ExecuteQueryOptions
): QueryResponse<T> {
    return await wrap(query, params, dbConfig, options);
}

export async function executeQuery<T extends RowData[] | QueryInfo>(
    query: string,
    dbConfig: ConnectionOptions
): QueryResponse<T> {
    return await wrap(query, null, dbConfig);
}
