import { ConnectionOptions, createPool } from 'mysql2/promise';
import { StreamOptions } from 'mysql2/typings/mysql/lib/protocol/sequences/Query';
import stream from 'stream';

export const streamQuery = (
    query: string,
    dbConfig: ConnectionOptions,
    streamOptions?: StreamOptions
): Promise<stream.Readable> => {
    return new Promise((resolve, reject) => {
        const pool = createPool({
            charset: dbConfig.charset,
            connectTimeout: dbConfig.connectTimeout,
            database: dbConfig.database,
            host: dbConfig.host,
            password: dbConfig.password,
            user: dbConfig.user,
            ssl: dbConfig.ssl !== undefined ? dbConfig.ssl : {},
        });

        const queryStream = pool.pool.query(query).stream(streamOptions);

        queryStream.once('error', reject);
        queryStream.once('fields', () => {
            queryStream.removeListener('error', reject);

            resolve(queryStream);
        });
        queryStream.once('error', reject);
    });
};
