const end = jest.fn();
const query = jest.fn();

exports.end = end;
exports.query = query;

module.exports = () => ({
  query,
  end
});
