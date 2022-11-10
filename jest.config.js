module.exports = {
    collectCoverage: true,
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
    preset: 'ts-jest',
    resetMocks: true,
    restoreMocks: true,
    transform: {
        '^.+\\.(ts|tsx|js|jsx)?$': 'ts-jest',
    },
};
