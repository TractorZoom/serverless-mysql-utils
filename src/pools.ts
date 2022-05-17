import { ConnectionOptions, createPool } from 'mysql2';
import { Pool } from 'mysql2/promise';

const _pools: { [cacheKey: string]: Pool } = {};

export const getPool = async (config: ConnectionOptions): Promise<Pool> => {
    const cacheKey = config.host + ':' + config.database;

    if (_pools[cacheKey]) return _pools[cacheKey];

    const pool = await createPool(config).promise();

    _pools[cacheKey] = pool;

    return pool;
};
