import { ConnectionOptions, createPool } from 'mysql2';
import { Pool } from 'mysql2/promise';

const _pools: { [host: string]: Pool } = {};

export const getPool = async (config: ConnectionOptions): Promise<Pool> => {
    if (_pools[config.host]) return _pools[config.host];

    const pool = await createPool(config).promise();

    _pools[config.host] = pool;

    return pool;
};
