const config = jest.fn();
const end = jest.fn();
const getConfig = jest.fn();
const query = jest.fn();
const quit = jest.fn();

exports.config = config;
exports.end = end;
exports.getConfig = getConfig;
exports.query = query;
exports.quit = quit;

module.exports = () => ({
    config,
    end,
    getConfig,
    query,
    quit,
});
