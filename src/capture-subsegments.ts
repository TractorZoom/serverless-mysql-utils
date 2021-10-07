import * as AWSXray from 'aws-xray-sdk';

export const captureSubsegment = (query) => {
    const subs = AWSXray.getSegment().subsegments;

    console.info('available segements', subs);

    if (subs && subs.length > 0) {
        var sqlSub = subs[subs.length - 1];
        // @ts-ignore
        sqlSub.sql.sanitized_query = query;
    }

    return subs;
};
