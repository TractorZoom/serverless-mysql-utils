import Chance from 'chance';
import { createPool } from 'mysql2/promise';
import { streamQuery } from '../src/stream-query';

const chance = new Chance();

jest.mock('mysql2/promise', () => ({
    createPool: jest.fn(),
}));

describe('A Stream Query Function', () => {
    it('should return a stream of data', async () => {
        // given
        const query = chance.string();
        const dbConfig = {};

        (createPool as jest.Mock).mockReturnValue({
            pool: {
                query: jest.fn().mockReturnValue({
                    stream: jest.fn().mockReturnValue({
                        once: jest.fn().mockImplementation((event, callback) => {
                            if (event === 'fields') {
                                callback();
                            }
                        }),
                        removeListener: jest.fn(),
                    }),
                }),
            },
        });

        // when
        const result = await streamQuery(query, dbConfig);

        // then
        expect(result).toBeDefined();
    });
});
