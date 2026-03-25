jest.mock("@adobe/aio-lib-telemetry", () => ({
  instrument: jest.fn((fn) => fn),
  getInstrumentationHelpers: jest.fn(() => ({
    currentSpan: { addEvent: jest.fn() },
    logger: { info: jest.fn(), debug: jest.fn(), error: jest.fn() },
  })),
  instrumentEntrypoint: jest.fn((fn) => fn),
  defineTelemetryConfig: jest.fn((fn) => fn),
  getAioRuntimeResource: jest.fn(),
  getPresetInstrumentations: jest.fn(),
}));

jest.mock("got");

const got = require("got");
const sender = require("../../../../../actions/company/commerce/created/sender");

const baseParams = {
  RESEND_API_KEY: "test-key",
  NOTIFICATION_EMAIL_TO: "admin@example.com",
  NOTIFICATION_EMAIL_FROM: "from@example.com",
  ADMIN_NAME: "Jane Admin",
  COMMERCE_BASE_URL: "https://commerce.example.com",
};

const baseData = {
  companyId: 42,
  companyName: "Acme Corp",
  customerName: "admin@acme.com",
  eventType: "created",
};

describe("Given company commerce created sender", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    got.post = jest.fn().mockResolvedValue({ body: { id: "email-123" } });
  });

  it("sends email to NOTIFICATION_EMAIL_TO via Resend API", async () => {
    await sender.sendData(baseParams, baseData);
    expect(got.post).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        json: expect.objectContaining({
          to: ["admin@example.com"],
        }),
      }),
    );
  });

  it("uses NOTIFICATION_EMAIL_FROM as from address", async () => {
    await sender.sendData(baseParams, baseData);
    expect(got.post).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        json: expect.objectContaining({
          from: "from@example.com",
        }),
      }),
    );
  });

  it('defaults from address to "onboarding@resend.dev" when NOTIFICATION_EMAIL_FROM is not set', async () => {
    const params = { ...baseParams, NOTIFICATION_EMAIL_FROM: undefined };
    await sender.sendData(params, baseData);
    expect(got.post).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        json: expect.objectContaining({
          from: "onboarding@resend.dev",
        }),
      }),
    );
  });

  it("includes admin name in email body from ADMIN_NAME param", async () => {
    await sender.sendData(baseParams, baseData);
    const callArgs = got.post.mock.calls[0][1];
    expect(callArgs.json.html).toContain("Jane Admin");
  });

  it('defaults admin name to "Admin" when ADMIN_NAME is not set', async () => {
    const params = { ...baseParams, ADMIN_NAME: undefined };
    await sender.sendData(params, baseData);
    const callArgs = got.post.mock.calls[0][1];
    expect(callArgs.json.html).toContain("Dear Admin");
  });

  it("includes customer name in email body", async () => {
    await sender.sendData(baseParams, baseData);
    const callArgs = got.post.mock.calls[0][1];
    expect(callArgs.json.html).toContain("admin@acme.com");
  });

  it("includes company name in email subject and body link text", async () => {
    await sender.sendData(baseParams, baseData);
    const callArgs = got.post.mock.calls[0][1];
    expect(callArgs.json.subject).toContain("Acme Corp");
    expect(callArgs.json.html).toContain("Acme Corp");
  });

  it("includes company admin URL as href in the company link", async () => {
    await sender.sendData(baseParams, baseData);
    const callArgs = got.post.mock.calls[0][1];
    expect(callArgs.json.html).toContain(
      "https://commerce.example.com/admin/company/index/edit/id/42",
    );
  });

  it("returns success true when email is sent successfully", async () => {
    const result = await sender.sendData(baseParams, baseData);
    expect(result).toEqual({ success: true });
  });

  it("returns success false with message when Resend API call fails", async () => {
    got.post = jest.fn().mockRejectedValue(new Error("Network error"));
    const result = await sender.sendData(baseParams, baseData);
    expect(result.success).toBe(false);
    expect(result.message).toContain("Network error");
  });

  it("skips email send and returns success true when RESEND_API_KEY is missing", async () => {
    const params = { ...baseParams, RESEND_API_KEY: undefined };
    const result = await sender.sendData(params, baseData);
    expect(got.post).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  it("skips email send and returns success true when NOTIFICATION_EMAIL_TO is missing", async () => {
    const params = { ...baseParams, NOTIFICATION_EMAIL_TO: undefined };
    const result = await sender.sendData(params, baseData);
    expect(got.post).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });
});
