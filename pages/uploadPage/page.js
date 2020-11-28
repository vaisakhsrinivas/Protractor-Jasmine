import SELECTORS from "./selectors";
import DATA from "../../data/common";
import { element } from "protractor";
import path from "path";
import log4js from "../../utils/log4js";

var EC = protractor.ExpectedConditions;
browser.ignoreSynchronization = true;

const uploadfileslabel = element(
  by.cssContainingText(SELECTORS.filedragUpload, "Drag files here to upload")
);
const UploadButton = element(by.css(SELECTORS.uploadButton));
const documentSplitToggle = element(
  by.css(SELECTORS.documentsplitToggleButton)
);
const inputFileType = element(by.css(SELECTORS.inputfileType));
const FileSelect = browser.$(SELECTORS.fileSelect);
const DocumentType = element(by.css(SELECTORS.documentType));
const OilAndGas = element(
  by.cssContainingText(SELECTORS.oilAndGas, "Oil and Gas Lease")
);
const uploadComplete = element(by.css(SELECTORS.uploadCompletedMessage));
const addTagButton = element(by.css(SELECTORS.addTagButton));
const addTag = element(by.css(SELECTORS.addTag));
const selectTeamRed = element(
  by.cssContainingText(SELECTORS.selectTagRed, "Team Red")
);
const labelChipTeamRed = element(by.css(SELECTORS.teamLabelChip));
const log = log4js.getLogger("results");

const uploadPage = function () {
  this.url = DATA.uploadUrl;

  /**
   * @method : get
   * @description : method to get the upload page url
   * @author : vaisakh
   */
  this.get = async () => {
    await browser.get(DATA.uploadUrl);
  };

  /**
   * @method : loaduploadPage
   * @description : method to load and check upload drop
   * @author : vaisakh
   * @returns : boolean value 'true'
   */

  this.loaduploadPage = async () => {
    browser.wait(EC.elementToBeClickable(uploadfileslabel, 3000));
    return await uploadfileslabel.isDisplayed();
  };

  /**
   * @method : clicuploadZone
   * @description : method to access upload zone
   * @author : vaisakh
   */

  this.clickuploadZone = async () => {
    uploadfileslabel.click();
  };

  /**
   * @method : uploadFile
   * @description : method to upload the file and add the tag
   * @author : vaisakh
   * @returns : String 'Completed' after upload
   */

  this.uploadFile = async (documentPath) => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    browser.driver.executeScript(
      "arguments[0].setAttribute('hidden','');",
      inputFileType.getWebElement()
    );
    log.info("Uploading file....");
    const absolutePath = path.resolve(documentPath);
    await FileSelect.sendKeys(absolutePath);
    log.info("Adding tags and document informations");
    browser.wait(EC.elementToBeClickable(documentSplitToggle), 3000);
    await documentSplitToggle.click();
    browser.wait(EC.elementToBeClickable(DocumentType), 3000);
    browser.wait(EC.elementToBeClickable(OilAndGas), 3000);
    await OilAndGas.click();
    browser.wait(EC.elementToBeClickable(addTagButton), 5000);
    await addTagButton.click();
    browser.wait(EC.elementToBeClickable(addTag), 5000);
    await addTag.click();
    await addTag.sendKeys(DATA.tagName);
    browser.wait(EC.elementToBeClickable(selectTeamRed), 5000);
    await selectTeamRed.click();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await UploadButton.click();
    log.info("File upload complete");
    return uploadComplete.getText();
  };

  /**
   * @method : checkTeamRedTag
   * @description : method to check the tag
   * @author : vaisakh
   * @returns : Team tag in 'String'
   */

  this.checkTeamRedTag = async () => {
    browser.wait(EC.visibilityOf(labelChipTeamRed, 5000));
    log.info("Team tag checked");
    return await labelChipTeamRed.getText();
  };
};

export default new uploadPage();
