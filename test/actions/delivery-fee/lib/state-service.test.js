const stateLib = require("@adobe/aio-lib-state");

jest.mock("@adobe/aio-lib-state");

const mockGet = jest.fn();
const mockPut = jest.fn();
const mockDelete = jest.fn();
const mockList = jest.fn();

const mockState = {
  get: mockGet,
  put: mockPut,
  delete: mockDelete,
  list: mockList,
};

beforeEach(() => {
  stateLib.init = jest.fn().mockResolvedValue(mockState);
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe("state-service", () => {
  let stateService;

  beforeEach(() => {
    jest.resetModules();
    const stateLibMock = require("@adobe/aio-lib-state");
    stateLibMock.init = jest.fn().mockResolvedValue(mockState);
    stateService = require("../../../../actions/delivery-fee/lib/state-service");
  });

  describe("buildKey", () => {
    it("builds state key as rule.COUNTRY.REGION in uppercase using only valid aio-lib-state characters", async () => {
      mockGet.mockResolvedValue(undefined);
      await stateService.getRule("us", "ca");
      expect(mockGet).toHaveBeenCalledWith("rule.US.CA");
    });
  });

  describe("getRule", () => {
    it("returns null when rule does not exist in state", async () => {
      mockGet.mockResolvedValue(undefined);
      const result = await stateService.getRule("US", "CA");
      expect(result).toBeNull();
    });

    it("returns rule object when rule exists in state", async () => {
      const rule = {
        country: "US",
        region: "CA",
        name: "CA Rule",
        type: "fixed",
        value: 10,
      };
      mockGet.mockResolvedValue({
        value: JSON.stringify(rule),
        expiration: "2027-01-01",
      });
      const result = await stateService.getRule("US", "CA");
      expect(result).toEqual(rule);
    });

    it("deserializes JSON string from get() result.value into rule object", async () => {
      const rule = {
        country: "US",
        region: "NY",
        name: "NY Rule",
        type: "percentage",
        value: 5,
      };
      mockGet.mockResolvedValue({
        value: JSON.stringify(rule),
        expiration: "2027-01-01",
      });
      const result = await stateService.getRule("US", "NY");
      expect(result).toEqual(rule);
    });

    it("returns null (not undefined) when get() returns undefined for missing key", async () => {
      mockGet.mockResolvedValue(undefined);
      const result = await stateService.getRule("US", "TX");
      expect(result).toBeNull();
      expect(result).not.toBeUndefined();
    });
  });

  describe("putRule", () => {
    it("stores rule in state with correct key format", async () => {
      mockPut.mockResolvedValue(undefined);
      const rule = {
        country: "US",
        region: "CA",
        name: "CA Rule",
        type: "fixed",
        value: 10,
      };
      await stateService.putRule(rule);
      expect(mockPut).toHaveBeenCalledWith(
        "rule.US.CA",
        expect.any(String),
        expect.any(Object),
      );
    });

    it("serializes rule as JSON string when storing via put()", async () => {
      mockPut.mockResolvedValue(undefined);
      const rule = {
        country: "US",
        region: "CA",
        name: "CA Rule",
        type: "fixed",
        value: 10,
      };
      await stateService.putRule(rule);
      expect(mockPut).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(rule),
        expect.any(Object),
      );
    });

    it("stores rules with ttl of 31536000 (max 1 year)", async () => {
      mockPut.mockResolvedValue(undefined);
      const rule = {
        country: "US",
        region: "CA",
        name: "CA Rule",
        type: "fixed",
        value: 10,
      };
      await stateService.putRule(rule);
      expect(mockPut).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        { ttl: 31_536_000 },
      );
    });
  });

  describe("deleteRule", () => {
    it("deletes rule from state by country and region", async () => {
      mockDelete.mockResolvedValue(undefined);
      await stateService.deleteRule("US", "CA");
      expect(mockDelete).toHaveBeenCalledWith("rule.US.CA");
    });
  });

  describe("listRules", () => {
    it("returns empty array when no rules exist", async () => {
      function* emptyGen() {
        // empty generator — yields nothing
      }
      mockList.mockReturnValue(emptyGen());
      const result = await stateService.listRules();
      expect(result).toEqual([]);
    });

    it("lists all rules matching the rule.* prefix pattern", async () => {
      function* emptyGen() {
        // empty generator — yields nothing
      }
      mockList.mockReturnValue(emptyGen());
      await stateService.listRules();
      expect(mockList).toHaveBeenCalledWith({ match: "rule.*" });
    });

    it("fetches each key returned by list() and returns parsed rule objects", async () => {
      const rule1 = {
        country: "US",
        region: "CA",
        name: "CA Rule",
        type: "fixed",
        value: 10,
      };
      const rule2 = {
        country: "US",
        region: "NY",
        name: "NY Rule",
        type: "percentage",
        value: 5,
      };
      function* listGen() {
        yield { keys: ["rule.US.CA", "rule.US.NY"] };
      }
      mockList.mockReturnValue(listGen());
      mockGet
        .mockResolvedValueOnce({
          value: JSON.stringify(rule1),
          expiration: "2027-01-01",
        })
        .mockResolvedValueOnce({
          value: JSON.stringify(rule2),
          expiration: "2027-01-01",
        });
      const result = await stateService.listRules();
      expect(mockGet).toHaveBeenCalledWith("rule.US.CA");
      expect(mockGet).toHaveBeenCalledWith("rule.US.NY");
      expect(result).toEqual([rule1, rule2]);
    });

    it("returns array of rule objects from list", async () => {
      const rule1 = {
        country: "US",
        region: "CA",
        name: "CA Rule",
        type: "fixed",
        value: 10,
      };
      function* listGen() {
        yield { keys: ["rule.US.CA"] };
      }
      mockList.mockReturnValue(listGen());
      mockGet.mockResolvedValueOnce({
        value: JSON.stringify(rule1),
        expiration: "2027-01-01",
      });
      const result = await stateService.listRules();
      expect(result).toEqual([rule1]);
    });
  });
});
