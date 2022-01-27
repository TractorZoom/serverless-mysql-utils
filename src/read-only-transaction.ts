export const readOnlyTransaction = (mysql) => {
    const queries = []; // keep track of queries

    // Commit transaction by running queries
    const commit = async (queries) => {
        const results = []; // keep track of results

        await mysql.query('SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');

        // Start a transaction
        await mysql.query('START TRANSACTION');

        // Loop through queries
        for (let i = 0; i < queries.length; i++) {
            // Execute the queries, pass the rollback as context
            const result = await mysql.query.apply({}, queries[i](results[results.length - 1], results));

            // Add the result to the main results accumulator

            results.push(result);
        }

        // Commit our transaction
        await mysql.query('COMMIT');

        // Return the results
        return results;
    };

    return {
        commit: async function () {
            return await commit(queries);
        },
        query: function (...args) {
            queries.push(() => [...args]);

            return this;
        },
    };
};
