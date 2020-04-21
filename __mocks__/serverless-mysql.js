const config = jest.fn();
const end = jest.fn();
const query = jest.fn();

exports.config = config;
exports.end = end;
exports.query = query;

module.exports = () => ({
    config,
    end,
    query,
});
