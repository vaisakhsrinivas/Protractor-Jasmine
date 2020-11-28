import DATA from "../data/common";
import documentPage from "../pages/documentPage/page";

const docurl = "https://app.thoughttrace.dev/qa/documents";

describe("verify user can apply fact value to single document using bulk update", () => {
  it("apply fact value on uploaded document & check toast message", async () => {
    expect(await documentPage.selectAndEditUploadedDocument());
    expect(await documentPage.checkToastMessage());
  });

  it("verify fact value is applied to the document", async () => {
    await documentPage.expandUploadedDocument();
    expect(await documentPage.checkForFactCount()).toBeGreaterThanOrEqual("1");
    expect(await documentPage.checkForFactName()).toEqual(DATA.factName);
  });

  it("close the document expand window", async () => {
    await documentPage.close();
  });
});
