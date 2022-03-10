// this is only used by babel jest to compile javascript files from ESM to commonjs for jest to run
module.exports = {
    plugins: ['@babel/plugin-transform-runtime'],
    presets: ['@babel/preset-env'],
};
