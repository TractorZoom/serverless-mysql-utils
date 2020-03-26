import Chance from "chance";
import Mysql from "serverless-mysql";
import executeQuery from "../src/execute-query";

const chance = new Chance();
const mysql = Mysql();

jest.mock("serverless-mysql");

describe("serverless mysql utility", () => {
  let mockData;

  beforeEach(() => {
    const rejectError = chance.string();

    mockData = {
      errorMessage: { error: `Error: ${rejectError}` },
      query: chance.string(),
      queryResponse: chance.string(),
      rejectError
    };

    mysql.query.mockResolvedValue(mockData.queryResponse);
  });

  afterEach(() => {
    mysql.end.mockRestore();
    mysql.query.mockRestore();
  });

  it("should successfully query mysql on the first try", async () => {
    const response = await executeQuery(mockData.query);

    expect(mysql.query).toHaveBeenCalledTimes(1);
    expect(mysql.query).toHaveBeenCalledWith(mockData.query);

    expect(response).toEqual(mockData.queryResponse);
  });

  it("should fail the first query and succeed on the second", async () => {
    mysql.query.mockRejectedValueOnce(new Error(mockData.rejectError));

    const response = await executeQuery(mockData.query);

    expect(mysql.query).toHaveBeenCalledTimes(2);
    expect(mysql.query).toHaveBeenCalledWith(mockData.query);

    expect(response).toEqual(mockData.queryResponse);
  });

  it("should fail the first query and return an error when the second query fails", async () => {
    mysql.query.mockRejectedValueOnce(new Error(mockData.rejectError));
    mysql.query.mockRejectedValueOnce(new Error(mockData.rejectError));

    const response = await executeQuery(mockData.query);

    expect(mysql.query).toHaveBeenCalledTimes(2);
    expect(mysql.query).toHaveBeenCalledWith(mockData.query);

    expect(response).toEqual(mockData.errorMessage);
  });

  it("should end the connection", async () => {
    await executeQuery(mockData.query);

    expect(mysql.end).toHaveBeenCalledTimes(1);
    expect(mysql.end).toHaveBeenCalledWith();
  });
});
