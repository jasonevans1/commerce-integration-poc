const fs = require("node:fs");
const path = require("node:path");

const WEBHOOKS_XML_PATH = path.resolve(
  __dirname,
  "../../../.commerce-to-app-builder/webhooks.xml",
);

describe("webhooks.xml", () => {
  let content;

  beforeAll(() => {
    content = fs.readFileSync(WEBHOOKS_XML_PATH, "utf8");
  });

  it("creates webhooks.xml with the correct operation name plugin.magento.quote.api.cart_total_repository.get", () => {
    expect(content).toContain(
      "plugin.magento.quote.api.cart_total_repository.get",
    );
  });

  it("registers the hook with method after", () => {
    expect(content).toContain('type="after"');
  });

  it("sets required to false", () => {
    expect(content).toContain('required="false"');
  });

  it("sets timeout to 5000 and softTimeout to 2000", () => {
    expect(content).toContain('timeout="5000"');
    expect(content).toContain('softTimeout="2000"');
  });

  it("includes quote.shipping_address.country_id field in the field mapping", () => {
    expect(content).toContain('name="quote.shipping_address.country_id"');
  });

  it("includes quote.shipping_address.region_code field in the field mapping", () => {
    expect(content).toContain('name="quote.shipping_address.region_code"');
  });

  it("includes totals.grand_total in the field mapping", () => {
    expect(content).toContain('name="totals.grand_total"');
  });

  it("includes totals.total_segments in the field mapping", () => {
    expect(content).toContain('name="totals.total_segments"');
  });

  it("references the action URL via environment variable placeholder", () => {
    expect(content).toContain("{env:WEBHOOK_QUOTE_TOTAL_URL}");
  });
});
