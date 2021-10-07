import Chance from 'chance';
import * as AWSXray from 'aws-xray-sdk';
import { captureSubsegment } from '../src/capture-subsegments';

const chance = new Chance();

jest.mock('aws-xray-sdk');

describe('serverless-config', () => {
    it('should show subsegments', async () => {
        // given
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
        const query = chance.string();
        const subsegments = [];
        AWSXray.getSegment.mockReturnValue({ subsegments });

        // when
        const subs = await captureSubsegment(query);

        // then
        expect(subs).toStrictEqual([]);
    });
});
