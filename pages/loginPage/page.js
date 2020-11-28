import SELECTORS from "./selectors";
import DATA from "../../data/common";
import log4js from "../../utils/log4js";

var EC = protractor.ExpectedConditions;
browser.ignoreSynchronization = true;

const email = element(by.css(SELECTORS.useremail));
const passwordInput = element(by.css(SELECTORS.userpassword));
const log = log4js.getLogger("result");

const loginPage = function () {
  this.get = async () => {
    await browser.get(DATA.baseUrl);
  };

  /**
   * @method : enterCredentials
   * @description : method to login
   * @author : vaisakh
   */

  this.enterCredentials = async (userName, password) => {
    log.info("User Logging in");
    browser.wait(EC.elementToBeClickable(email, 3000));
    browser.wait(EC.elementToBeClickable(passwordInput, 3000));
    await email.click();
    await email.sendKeys(userName);
    await passwordInput.click();
    await passwordInput.sendKeys(password);
    element(by.css(SELECTORS.submitButton)).click();
    log.info("Login Completed");
  };
};

export default new loginPage();
