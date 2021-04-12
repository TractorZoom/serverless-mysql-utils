import { ConnectionConfig } from 'mysql';
import * as serverlessMysql from 'serverless-mysql';

const defaultConfig: ConnectionConfig = {
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database,
};
const mysql = serverlessMysql({ config: defaultConfig });

async function executeQuery<T>(query: string, dbConfig: ConnectionConfig): Promise<{ data: T; error: string }> {
    if (JSON.stringify(mysql.getConfig()) !== JSON.stringify(dbConfig)) {
        await mysql.quit();
    }

    if (dbConfig) {
        mysql.config(dbConfig);
    }

    let data: T;
    let error;

    try {
        data = await mysql.query<T>(query);
    } catch (ex) {
        console.error('query failed: ', ex);

        try {
            data = await mysql.query<T>(query);
        } catch (ex2) {
            console.error('retried query failed: ', ex2);

            error = `${ex2}`;
        }
    } finally {
        await mysql.end();

        return { data, error };
    }
}

export default executeQuery;
