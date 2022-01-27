export const readOnlyTransaction = (mysql) => {
    const queries = []; // keep track of queries
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    let rollback = () => {}; // default rollback event

    // Commit transaction by running queries
    const commit = async (queries, rollback) => {
        const results = []; // keep track of results

        await mysql.query('SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED');

        // Start a transaction
        await mysql.query('START TRANSACTION');

        // Loop through queries
        for (let i = 0; i < queries.length; i++) {
            // Execute the queries, pass the rollback as context
            const result = await mysql.query.apply({ rollback }, queries[i](results[results.length - 1], results));

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
            return await commit(queries, rollback);
        },
        query: function (...args) {
            if (typeof args[0] === 'function') {
                queries.push(args[0]);
            } else {
                queries.push(() => [...args]);
            }

            return this;
        },
        rollback: function (fn) {
            if (typeof fn === 'function') {
                rollback = fn;
            }

            return this;
        },
    };
};
