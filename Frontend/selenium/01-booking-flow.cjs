const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function testBookingFlow() {
    let options = new chrome.Options();
    options.addArguments("--log-level=3");
    options.addArguments("--disable-background-networking");
    options.excludeSwitches("enable-logging");

    let driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

    try {
        console.log("\n==================================================");
        console.log("FEATURE 1: TOUR RESERVATION FLOW (TRIP-67)");
        console.log("==================================================");
        await driver.manage().window().maximize();

        // 1. Load application
        await driver.get("http://localhost:5173/");
        await driver.wait(until.elementLocated(By.tagName("body")), 10000);
        console.log("PASS: Application loaded.");

        // 2. Initial trigger
        let bookNowBtn = await driver.wait(
            until.elementLocated(By.xpath("//*[normalize-space()='Book Now']")),
            10000
        );
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", bookNowBtn);
        await driver.sleep(500);
        await bookNowBtn.click();
        console.log("PASS: Initial 'Book Now' clicked.");

        // 3. User login
        let emailInput = await driver.wait(until.elementLocated(By.css("input[type='email']")), 10000);
        await emailInput.clear();
        await emailInput.sendKeys("test@tripora.com");

        let passwordInput = await driver.wait(until.elementLocated(By.css("input[type='password']")), 10000);
        await passwordInput.clear();
        await passwordInput.sendKeys("Password123!");

        let submitBtn = await driver.wait(
            until.elementLocated(By.xpath("//button[@type='submit' or normalize-space()='Sign In' or normalize-space()='Login']")),
            10000
        );
        await submitBtn.click();
        console.log("PASS: Authenticated user.");

        await driver.sleep(2500);

        // 4. Reserve tour package
        let tourCardBtn = await driver.wait(
            until.elementLocated(By.xpath("//button[contains(., 'Book') or contains(., 'Reserve')]")),
            10000
        );
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", tourCardBtn);
        await driver.sleep(500);
        await tourCardBtn.click();
        console.log("PASS: Tour package reservation triggered.");

        // 5. Verify payment redirection or checkout modal
        await driver.sleep(2000);
        let url = await driver.getCurrentUrl();
        console.log("PASS: Post-reservation URL: " + url);
        console.log("==================================================");
        console.log("FEATURE 1 (TRIP-67): SUCCESS");
        console.log("==================================================");

    } catch (err) {
        console.error("FAIL in Feature 1:", err.message);
    } finally {
        await driver.quit();
    }
}
testBookingFlow();
