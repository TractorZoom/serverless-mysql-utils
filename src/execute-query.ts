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

const DROPPED_CONNECTION_CODES = ['EPIPE', 'ECONNRESET', 'PROTOCOL_CONNECTION_LOST'];

// Only reads are retried. A write may have committed before the connection dropped, so running it
// again could apply it twice. WITH is left out because MySQL allows WITH ... UPDATE / DELETE.
const READ_ONLY_QUERY = /^\s*(SELECT|SHOW|DESCRIBE|DESC|EXPLAIN)\b/i;

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
        ssl: dbConfig.ssl !== undefined ? dbConfig.ssl : {},
        user: dbConfig.user,
    });

    const run = async (): Promise<T> => {
        if (params) {
            return options?.preparedStatement === false
                ? (await pool.query<T & RowDataPacket[]>(query, params))[0]
                : (await pool.execute<T & RowDataPacket[]>(query, params))[0];
        }

        return (await pool.query<T & RowDataPacket[]>(query))[0];
    };

    let data: T;
    let error;

    try {
        try {
            data = await run();
        } catch (ex) {
            if (!DROPPED_CONNECTION_CODES.includes(ex.code) || !READ_ONLY_QUERY.test(query)) throw ex;

            // The RDS proxy can close a pooled connection while the Lambda is frozen. The pool
            // discards the dead connection on this error, so one retry gets a fresh one.
            console.warn('query hit a dropped connection, retrying once: ', ex.code);
            data = await run();
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
