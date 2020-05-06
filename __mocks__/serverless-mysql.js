const config = jest.fn();
const end = jest.fn();
const getConfig = jest.fn();
const query = jest.fn();

exports.config = config;
exports.end = end;
exports.getConfig = getConfig;
exports.query = query;

module.exports = () => ({
    config,
    end,
    getConfig,
    query,
});
