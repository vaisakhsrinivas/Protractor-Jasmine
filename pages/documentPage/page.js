import SELECTORS from "./selectors";
import DATA from "../../data/common";
import { element, browser, by, $ } from "protractor";
import { protractor } from "protractor/built/ptor";
import log4js from "../../utils/log4js";

var EC = protractor.ExpectedConditions;
browser.ignoreSynchronization = true;
const log = log4js.getLogger("result");

const uploads = element(
  by.cssContainingText(SELECTORS.documentUploadIcon, "Uploads")
);
const documents = element(
  by.cssContainingText(SELECTORS.documentUploadIcon, "Library")
);
const refresh = element(by.css(SELECTORS.pageRefresh));
const option = element.all(by.css(SELECTORS.selectOption)).first();
const edit = element(by.cssContainingText(SELECTORS.documentEdit, "Edit"));
const facts = element(
  by.cssContainingText(SELECTORS.documentEditFacts, "Facts")
);
const fact = element(by.css(SELECTORS.searchFacts));
const factareastring = element(by.css(SELECTORS.searchFactsTextArea));
const selectedFact = element(by.css(SELECTORS.selectedFactFromList));
const applyfact = element(by.css(SELECTORS.factApply));
const applydocument = element(by.css(SELECTORS.editDocumentApply));
const expanddocument = element(by.css(SELECTORS.expanduploadedDocument));
const expandedFacts = element(by.css(SELECTORS.expandeddocumentFacts));
const expandedSearch = element(by.css(SELECTORS.expandeddocumentSearch));
const countOfFacts = element(by.css(SELECTORS.factCount));
const close = element(by.css(SELECTORS.expandeddocumentClose));
const updatemessage = element(by.css(SELECTORS.updateMessage));
const documentsPagefactsFilter = element(
  by.cssContainingText(SELECTORS.factFilter, "Facts")
);
const documentsPageNameFilter = element(
  by.cssContainingText(SELECTORS.factFilter, "Name")
);
const documentsPageTagsFilter = element(
  by.cssContainingText(SELECTORS.factFilter, "Tags")
);
const documentSearch = element(by.css(SELECTORS.documentnameSearch));
const documentexpandfactCheck = element(by.css(SELECTORS.factStringcheck));
const factFilterEquals = element(by.css(SELECTORS.factEquals));
const factFilterText = element(by.css(SELECTORS.factfilterTextarea));
const tagsfiltersearch = element(by.css(SELECTORS.searchTag));
const tagsfilterpanel = element(
  by.cssContainingText(SELECTORS.filterPanelTag, DATA.tagName)
);
const factsfilterpanel = element(
  by.cssContainingText(SELECTORS.filterPanelFact, DATA.factzip)
);
const results = element(by.css(SELECTORS.searchResults));
const factaddresszip = element(by.css(SELECTORS.addresszip));

const documentPage = function () {
  this.url = DATA.documentUrl;
  this.searchDocument = DATA.uploadDocumentName;

  /**
   * @method : get
   * @description : method to get the document url
   * @author : vaisakh
   */

  this.get = async () => {
    await browser.get(DATA.documentUrl);
  };

  /**
   * @method : loadDocumentPage
   * @description : method to load the document page
   * @author : vaisakh
   * @returns : boolean value 'true'
   */

  this.loadDocumentPage = async () => {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    log.info("Documents Page Loaded");
    return await uploads.isDisplayed();
  };

  /**
   * @method : loaduploadPage
   * @description : method to load upload page
   * @author : vaisakh
   */

  this.loaduploadPage = async () => {
    log.info("Uploads Page Loaded");
    await uploads.click();
  };

  /**
   * @method : navigateToDocumentsPage
   * @description : method to get back to the document page
   * @author : vaisakh
   */

  this.navigateToDocumentsPage = async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await documents.click();
  };

  /**
   * @method : pageRefresh
   * @description : Refresh the document page
   * @author : vaisakh
   */

  this.pageRefresh = async () => {
    log.info("Documents Page Refreshed");
    await new Promise((resolve) => setTimeout(resolve, 5000));
    refresh.click();
  };

  /**
   * @method : checkForUploadedDocument
   * @description : method to check the uploaded document in document page list
   * @author : vaisakh
   * @returns : uploaded document name
   */
  this.checkForUploadedDocument = async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await documentsPageNameFilter.click();
    await documentSearch.click();
    await documentSearch.sendKeys(DATA.uploadDocumentName);
    await applydocument.click();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    log.info("Checking for uploaded document in documents page");
    return await element
      .all(by.css(SELECTORS.uploadedDocument))
      .get(1)
      .getText();
  };

  /**
   * @method : selectAndEditUploadedDocument
   * @description : method edit the uploaded document
   * @author : vaisakh
   */

  this.selectAndEditUploadedDocument = async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    option.click();
    log.info("Document Selected");
    await edit.click();
    log.info("Editting the document");
    await new Promise((resolve) => setTimeout(resolve, 7000));
    await facts.click();
    log.info("Adding Facts");
    await factareastring.click();
    await factareastring.sendKeys(DATA.factTextAreaString);
    await fact.sendKeys(DATA.factName);
    await selectedFact.click();
    await applyfact.click();
    await applydocument.click();
    await new Promise((resolve) => setTimeout(resolve, 3000));
  };

  /**
   * @method : checkToastMessage
   * @description : method to check the toast alert
   * @author : vaisakh
   * @returns : boolean value 'true' if alert is present
   */

  this.checkToastMessage = async () => {
    log.info("Checking for documents are being updated alert");
    await browser.wait(function () {
      return $(".ui-toast-summary").isPresent();
    }, 1500);
  };

  /**
   * @method : expandUploadedDocument
   * @description : method to expand the loaded document
   * @author : vaisakh
   */

  this.expandUploadedDocument = async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await browser.driver.executeScript(
      "arguments[0].click();",
      expanddocument.getWebElement()
    );
    log.info("Document Expanded");
  };

  /**
   * @method : checkForFactCount
   * @description : method verify the fact count
   * @author : vaisakh
   * @returns : count of fact
   */

  this.checkForFactCount = async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await expandedFacts.click();
    await expandedSearch.click();
    expandedSearch.sendKeys(DATA.factName);
    log.info("Checking the fact counts");
    return await countOfFacts.getText();
  };

  /**
   * @method : checkForFactName
   * @description : method to check the fact name
   * @author : vaisakh
   * @returns : name of fact
   */

  this.checkForFactName = async () => {
    await countOfFacts.click();
    await new Promise((resolve) => setTimeout(resolve, 5000));
    log.info("Checking the fact name in document expansion");
    return await documentexpandfactCheck.getText();
  };

  /**
   * @method : close
   * @description : method to close the expanded document window
   * @author : vaisakh
   */

  this.close = async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await close.click();
  };

  /**
   * @method : applyFactFilter
   * @description : method to apply fact filter in documents page
   * @author : vaisakh
   * @returns : fact name
   */

  this.applyFactFilter = async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await documentsPagefactsFilter.click();
    await fact.sendKeys(DATA.factFilterName);
    await selectedFact.click();
    await factFilterEquals.click();
    await factaddresszip.sendKeys(DATA.factzip);
    await applydocument.click();
    log.info("Selecting Fact filter");
    return await factsfilterpanel.getText();
  };

  /**
   * @method : applyTagFilter
   * @description : method to apply tag filter in documents page
   * @author : vaisakh
   * @returns : tag name
   */

  this.applyTagFilter = async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await documentsPageTagsFilter.click();
    await tagsfiltersearch.sendKeys(DATA.tagName);
    await selectedFact.click(); //used the same selector which was used in selecting fact
    await applydocument.click();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    log.info("Selecting Tag filter");
    return await tagsfilterpanel.getText();
  };

  /**
   * @method : searchResults
   * @description : method to check searchResults
   * @author : vaisakh
   * @returns : search count
   */

  this.searchResults = async () => {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    log.info("Checking the results");
    return await results.getText();
  };
};

export default new documentPage();
