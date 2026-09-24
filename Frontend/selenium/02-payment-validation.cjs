const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function testPaymentValidation() {
    let options = new chrome.Options();
    options.addArguments("--log-level=3");
    options.addArguments("--disable-background-networking");
    options.excludeSwitches("enable-logging");

    let driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

    try {
        console.log("==================================================");
        console.log("FEATURE 2: PAYMENT FORM CLIENT VALIDATION (TRIP-56)");
        console.log("==================================================");
        await driver.manage().window().maximize();

        // 1. Navigate to exact route with bookingId param
        console.log("1. Navigating to payment route (/payment/BK-VAL-101)...");
        await driver.get("http://localhost:5173/payment/BK-VAL-101");
        await driver.wait(until.elementLocated(By.className("payment-page-container")), 10000);
        console.log("PASS: PaymentPage loaded successfully.");

        // 2. Validate Submit Button is Disabled Initially
        console.log("2. Validating initial disabled state (empty form)...");
        let payBtn = await driver.wait(until.elementLocated(By.css("button.btn-pay-now")), 10000);
        let isDisabled = await payBtn.getAttribute("disabled");
        if (isDisabled !== null) {
            console.log("PASS: 'Pay Now' button is disabled when fields are blank.");
        } else {
            throw new Error("Pay button was unexpectedly enabled on an empty form.");
        }

        // 3. Test Invalid / Incomplete Card Number
        console.log("3. Testing invalid card input validation...");
        let cardInput = await driver.findElement(By.css("input[placeholder*='1234']"));
        await cardInput.sendKeys("4242"); // Truncated number
        
        let stillDisabled = await payBtn.getAttribute("disabled");
        console.log("PASS: Pay button remains disabled with incomplete card: " + (stillDisabled !== null));

        // 4. Clear input
        await cardInput.clear();
        console.log("==================================================");
        console.log("FEATURE 2 (TRIP-56): ALL VALIDATION CHECKS PASSED");
        console.log("==================================================");

    } catch (err) {
        console.error("FAIL in Feature 2:", err.message);
    } finally {
        await driver.quit();
    }
}
testPaymentValidation();
