import DATA from "../data/common";
import loginPage from "../pages/loginPage/page";
import documentPage from "../pages/documentPage/page";
import uploadPage from "../pages/uploadPage/page";

const docurl = "https://app.thoughttrace.dev/qa/documents";
const filepath = "./data/OGL_DEMO_Test.pdf";

describe("verify user can upload document with tags", () => {
  beforeAll(async () => {
    await loginPage.get();
  });

  it("should display documents pages on successful login", async () => {
    await loginPage.enterCredentials(
      DATA.testUser.username,
      DATA.testUser.password
    );
    await expect(documentPage.loadDocumentPage()).toBe(true);
    expect(documentPage.url).toEqual(docurl);
  });

  it("navigate to uploads page", async () => {
    await documentPage.loaduploadPage();
    await uploadPage.loaduploadPage();
    expect(uploadPage.loaduploadPage()).toBe(true);
  });

  it("click upload zone", async () => {
    await uploadPage.loaduploadPage();
    await uploadPage.clickuploadZone();
    expect(uploadPage.loaduploadPage()).toBe(true);
  });

  it("Upload File and add related information", async () => {
    await uploadPage.get();
    expect(uploadPage.uploadFile(filepath)).toEqual("Completed");
    expect(uploadPage.checkTeamRedTag()).toEqual("Team Red");
  });

  it("Navigate back to documents page", async () => {
    await documentPage.navigateToDocumentsPage();
    expect(documentPage.loadDocumentPage()).toBe(true);
  });

  it("Refresh the documents page", async () => {
    await documentPage.pageRefresh();
    expect(documentPage.loadDocumentPage()).toBe(true);
  });

  it("Check for uploaded document", async () => {
    await documentPage.loadDocumentPage();
    expect(await documentPage.checkForUploadedDocument()).toEqual(
      DATA.uploadDocumentName
    );
  });
});
