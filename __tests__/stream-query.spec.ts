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

    it('should pass through ssl when provided in dbConfig', async () => {
        // given: dbConfig with ssl defined so the ssl branch on line 18 is covered
        const query = chance.string();
        const sslConfig = { rejectUnauthorized: true };
        const dbConfig = { ssl: sslConfig };

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
        await streamQuery(query, dbConfig);

        // then: createPool was called with ssl from dbConfig (not default {})
        expect(createPool).toHaveBeenCalledWith(
            expect.objectContaining({ ssl: sslConfig })
        );
    });
});
