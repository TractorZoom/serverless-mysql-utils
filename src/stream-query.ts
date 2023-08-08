import { ConnectionOptions, createPool } from 'mysql2/promise';
import stream from 'stream';

export const streamQuery = (query: string, dbConfig: ConnectionOptions): Promise<stream.Readable> => {
    return new Promise((resolve, reject) => {
        const pool = createPool({
            charset: dbConfig.charset,
            connectTimeout: dbConfig.connectTimeout,
            database: dbConfig.database,
            host: dbConfig.host,
            password: dbConfig.password,
            user: dbConfig.user,
        });

        const queryStream = pool.pool.query(query).stream();

        queryStream.once('error', reject);
        queryStream.once('fields', () => {
            queryStream.removeListener('error', reject);

            resolve(queryStream);
        });
        queryStream.once('error', reject);
    });
};
