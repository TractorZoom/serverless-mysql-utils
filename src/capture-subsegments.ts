import * as AWSXray from 'aws-xray-sdk';

export const captureSubsegment = (query) => {
    const isProd = process.env.ENV === 'Prod' && process.env.IGNORE_XRAY !== 'true';

    if (isProd) {
        const subs = AWSXray.getSegment().subsegments;

        console.info('available segements', { query, subs });

        if (subs && subs.length > 0) {
            const sqlSub: any = subs[subs.length - 1];

            sqlSub.sql.sanitized_query = query;
        }

        return subs;
    }
};
