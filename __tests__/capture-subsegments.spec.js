import Chance from 'chance';
import { captureSubsegment } from '../src/capture-subsegments';
import * as AWSXray from 'aws-xray-sdk';

const chance = new Chance();

jest.mock('aws-xray-sdk');

describe('serverless-config', () => {
    it('should show subsegments', async () => {
        // given
        process.env.ENV = 'Prod';

        const query = chance.string();
        const subsegments = [
            {
                sql: {
                    sanitized_query: '',
                },
            },
        ];

        AWSXray.getSegment.mockReturnValue({ subsegments });

        // when
        const subs = await captureSubsegment(query);

        // then
        expect(subs[0].sql.sanitized_query).toStrictEqual(query);
    });

    it('should show subsegments', async () => {
        // given
        process.env.ENV = 'Prod';

        const query = chance.string();
        const subsegments = [];

        AWSXray.getSegment.mockReturnValue({ subsegments });

        // when
        const subs = await captureSubsegment(query);

        // then
        expect(subs).toStrictEqual([]);
    });

    it('should do nothing in dev', async () => {
        // given
        process.env.ENV = 'Dev';

        const query = chance.string();

        // when
        const subs = await captureSubsegment(query);

        // then
        expect(subs).toStrictEqual(undefined);
    });
});
