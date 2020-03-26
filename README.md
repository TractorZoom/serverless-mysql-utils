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

The following environment variables must be set to make the connection with mysql:
| variable | type | description |
| --------- | ------ | ------------------------------- |
| database | string | mame of the database to use for this connection |
| host | string | the hostname of the database you are connecting to |
| user | string | the mysql user to authenticate as |
| password | string | the password of that mysql user |

```js
import { executeQuery } from "@tractorzoom/serverless-mysql-utils";

export const getItems = async () => {
  const queryString = `SELECT * FROM MyTable WHERE id = "some-guid"`;

  const response = await executeQuery(queryString);

  if (response.error) {
    return [];
  }

  return response;
};
```
