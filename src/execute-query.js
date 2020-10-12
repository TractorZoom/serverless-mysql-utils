const mysql = require('serverless-mysql')({
    config: {
        host: process.env.host,
        user: process.env.user,
        password: process.env.password,
        database: process.env.database,
    },
});

const executeQuery = async (query, dbConfig) => {
    if (JSON.stringify(mysql.getConfig()) !== JSON.stringify(dbConfig)) {
        await mysql.quit();
    }

    if (dbConfig) {
        mysql.config(dbConfig);
    }

    let response;

    try {
        response = await mysql.query(query);
    } catch (ex) {
        console.error('query failed: ', ex);

        try {
            response = await mysql.query(query);
        } catch (ex2) {
            console.error('retried query failed: ', ex2);

            response = { error: `${ex2}` };
        }
    } finally {
        await mysql.end();

        return response;
    }
};

export default executeQuery;