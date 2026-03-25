jest.mock("@adobe/aio-lib-state", () => {
  class AdobeStateMock {
    get() {
      return Promise.resolve();
    }
    put() {
      return "mock-key";
    }
  }

  return {
    init: jest.fn().mockResolvedValue(new AdobeStateMock()),
    AdobeState: AdobeStateMock,
  };
});

const action = require("../../../../../actions/company/commerce/consumer");
jest.mock("openwhisk");
const {
  HTTP_BAD_REQUEST,
  HTTP_INTERNAL_ERROR,
} = require("../../../../../actions/constants");
const Openwhisk = require("../../../../../actions/openwhisk");
const stateLib = require("@adobe/aio-lib-state");
const {
  commerceCompanyMetrics,
} = require("../../../../../actions/company/commerce/metrics");

beforeAll(() => {
  process.env.__AIO_DEV = "false";
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

const EVENT_TYPE =
  "com.adobe.commerce.test_app.observer.company_save_commit_after";

const baseParams = {
  API_HOST: "API_HOST",
  API_AUTH: "API_AUTH",
  EVENT_PREFIX: "test_app",
  ENABLE_TELEMETRY: "true",
  type: EVENT_TYPE,
  data: {
    value: {
      _isNew: true,
      company_id: 1,
      company_name: "Acme Corp",
    },
  },
};

describe("Given company commerce consumer", () => {
  it("returns 400 when params.type is missing", async () => {
    const params = { ...baseParams };
    params.type = undefined;

    const response = await action.main(params);

    expect(response).toEqual({
      error: {
        statusCode: HTTP_BAD_REQUEST,
        body: {
          error: expect.stringContaining("type"),
        },
      },
    });
  });

  it("returns 400 when the event type is not supported", async () => {
    const params = {
      ...baseParams,
      type: "com.adobe.commerce.test_app.observer.unsupported_event",
    };

    const response = await action.main(params);

    expect(response).toEqual({
      error: {
        statusCode: HTTP_BAD_REQUEST,
        body: {
          error: expect.stringContaining("not supported"),
        },
      },
    });
  });

  it("skips processing and returns success when event_id was already processed", async () => {
    const stateMock = {
      get: jest.fn().mockResolvedValue("true"),
      put: jest.fn().mockResolvedValue("mock-key"),
    };
    stateLib.init.mockResolvedValue(stateMock);

    const params = {
      ...baseParams,
      event_id: "already-processed-event-123",
    };

    const response = await action.main(params);

    expect(response).toEqual({
      statusCode: 200,
      body: {
        type: EVENT_TYPE,
        response: { success: true },
      },
    });
  });

  it("marks event_id as processed in state with TTL 300 after first processing", async () => {
    const stateMock = {
      get: jest.fn().mockResolvedValue(undefined),
      put: jest.fn().mockResolvedValue("mock-key"),
    };
    stateLib.init.mockResolvedValue(stateMock);

    Openwhisk.prototype.invokeAction = jest.fn().mockResolvedValue({
      response: {
        result: {
          statusCode: 200,
          body: { success: true },
        },
      },
    });

    const params = {
      ...baseParams,
      event_id: "new-event-456",
    };

    await action.main(params);

    expect(stateMock.put).toHaveBeenCalledWith(
      "processed-event-new-event-456",
      "true",
      { ttl: 300 },
    );
  });

  it("invokes company-commerce/created when _isNew is true", async () => {
    const invokeActionMock = jest.fn().mockResolvedValue({
      response: {
        result: {
          statusCode: 200,
          body: { success: true, action: "created" },
        },
      },
    });
    Openwhisk.prototype.invokeAction = invokeActionMock;

    const params = {
      ...baseParams,
      data: { value: { ...baseParams.data.value, _isNew: true } },
    };

    await action.main(params);

    expect(invokeActionMock).toHaveBeenCalledWith(
      "company-commerce/created",
      expect.objectContaining({ _isNew: true }),
    );
  });

  it("skips created invocation and returns success when _isNew is false", async () => {
    const invokeActionMock = jest.fn();
    Openwhisk.prototype.invokeAction = invokeActionMock;

    const params = {
      ...baseParams,
      data: { value: { ...baseParams.data.value, _isNew: false } },
    };

    const response = await action.main(params);

    expect(response).toEqual({
      statusCode: 200,
      body: {
        type: EVENT_TYPE,
        response: { success: true },
      },
    });
    expect(invokeActionMock).not.toHaveBeenCalled();
  });

  it("skips created invocation and returns success when _isNew is absent", async () => {
    const invokeActionMock = jest.fn();
    Openwhisk.prototype.invokeAction = invokeActionMock;

    const params = {
      ...baseParams,
      data: { value: { company_id: 1, company_name: "Acme Corp" } },
    };

    const response = await action.main(params);

    expect(response).toEqual({
      statusCode: 200,
      body: {
        type: EVENT_TYPE,
        response: { success: true },
      },
    });
    expect(invokeActionMock).not.toHaveBeenCalled();
  });

  it("returns success response when created action invocation succeeds", async () => {
    Openwhisk.prototype.invokeAction = jest.fn().mockResolvedValue({
      response: {
        result: {
          statusCode: 200,
          body: { success: true, action: "created" },
        },
      },
    });

    const response = await action.main(baseParams);

    expect(response).toEqual({
      statusCode: 200,
      body: {
        type: EVENT_TYPE,
        response: { success: true, action: "created" },
      },
    });
  });

  it("returns error response when created action invocation returns failure", async () => {
    const ACTION_RESPONSE = {
      response: {
        result: {
          body: { success: false, error: "Downstream error" },
          statusCode: HTTP_INTERNAL_ERROR,
        },
      },
    };

    Openwhisk.prototype.invokeAction = jest
      .fn()
      .mockResolvedValue(ACTION_RESPONSE);

    const response = await action.main(baseParams);

    expect(response).toMatchObject({
      error: {
        statusCode: HTTP_INTERNAL_ERROR,
        body: {
          error: "Downstream error",
        },
      },
    });
  });

  it("increments consumerTotalCounter on every invocation", async () => {
    Openwhisk.prototype.invokeAction = jest.fn().mockResolvedValue({
      response: {
        result: {
          statusCode: 200,
          body: { success: true },
        },
      },
    });

    const addSpy = jest.spyOn(
      commerceCompanyMetrics.consumerTotalCounter,
      "add",
    );

    await action.main(baseParams);

    expect(addSpy).toHaveBeenCalledWith(1);
  });

  it("increments consumerSuccessCounter on successful processing", async () => {
    Openwhisk.prototype.invokeAction = jest.fn().mockResolvedValue({
      response: {
        result: {
          statusCode: 200,
          body: { success: true },
        },
      },
    });

    const addSpy = jest.spyOn(
      commerceCompanyMetrics.consumerSuccessCounter,
      "add",
    );

    await action.main(baseParams);

    expect(addSpy).toHaveBeenCalledWith(1);
  });
});
