import { ConnectionOptions, createPool } from 'mysql2';
import { Pool } from 'mysql2/promise';

const _pools: { [host: string]: Pool } = {};

export const getPool = async (config: ConnectionOptions): Promise<Pool> => {
    if (_pools[config.host]) return _pools[config.host];

    /* istanbul ignore next */
    const typeCast = function (field, next) {
        if (field.type == 'DECIMAL') {
            const value = field.string();

            return value === null ? null : Number(value);
        }

        return next();
    };

    const pool = await createPool({
        ...config,
        typeCast,
    }).promise();

    _pools[config.host] = pool;

    return pool;
};
