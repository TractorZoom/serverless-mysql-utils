# @tractorzoom/serverless-mysql-utils

## Available Methods

##### Method: `executeQuery(queryString)`

| parameter | type   | description                     |
| --------- | ------ | ------------------------------- |
| query     | string | sql query string to be executed |

## How do I use? :thinking:

##### Installation:

```bash
npm i @tractorzoom/serverless-mysql-utils
```

##### Usage:

The following environment variables must be set or a config object must be passed as a second arg to `executeQuery` to make the connection with mysql:
| variable | type | description |
| --------- | ------ | ------------------------------- |
| database | string | mame of the database to use for this connection |
| host | string | the hostname of the database you are connecting to |
| user | string | the mysql user to authenticate as |
| password | string | the password of that mysql user |

```js
import dbConfig from './config';
import { executeQuery } from '@tractorzoom/serverless-mysql-utils';

export const getItems = async () => {
    const queryString = `SELECT * FROM MyTable WHERE id = "some-guid"`;

    const response = await executeQuery(queryString, dbConfig);

    if (response.error) {
        return [];
    }

    return response;
};
```
