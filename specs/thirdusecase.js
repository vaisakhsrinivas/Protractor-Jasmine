import DATA from "../data/common";
import documentPage from "../pages/documentPage/page";

describe("verify user can apply fact and tags filter", () => {
  beforeAll(async () => {
    await documentPage.get();
  });

  it("apply & verify fact filter", async () => {
    expect(await documentPage.applyFactFilter()).toBe(DATA.factzip);
    expect(await documentPage.searchResults()).toBeGreaterThanOrEqual("0");
  });

  it("apply & verify tag filter", async () => {
    expect(await documentPage.applyTagFilter()).toEqual(DATA.tagName);
    expect(await documentPage.searchResults()).toBeGreaterThanOrEqual("0");
  });
});
