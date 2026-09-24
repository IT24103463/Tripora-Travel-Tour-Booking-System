const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function testPaymentExecution() {
    let options = new chrome.Options();
    options.addArguments("--log-level=3");
    options.addArguments("--disable-background-networking");
    options.excludeSwitches("enable-logging");

    let driver = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

    try {
        console.log("==================================================");
        console.log("FEATURE 3: PAYMENT EXECUTION & CONFIRMATION (TRIP-58/59)");
        console.log("==================================================");
        await driver.manage().window().maximize();

        // 1. Establish session origin & authenticate
        console.log("1. Authenticating as user1@gmail.com to acquire JWT...");
        await driver.get("http://localhost:5173/");
        await driver.wait(until.elementLocated(By.tagName("body")), 10000);

        // Fetch token directly from UserService and inject into localStorage
        let authSuccess = await driver.executeAsyncScript(async (done) => {
            try {
                const res = await fetch("http://localhost:5001/api/users/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: "user1@gmail.com",
                        password: "user1@gmail.com"
                    })
                });
                const data = await res.json();
                if (data?.data?.token) {
                    localStorage.setItem("tripora_token", data.data.token);
                    localStorage.setItem("tripora_user", JSON.stringify(data.data.user || { email: "user1@gmail.com" }));
                    done(true);
                } else {
                    done(false);
                }
            } catch (err) {
                done(false);
            }
        });

        if (!authSuccess) {
            throw new Error("Failed to acquire and inject JWT token into browser session.");
        }
        console.log("PASS: Authenticated session established (tripora_token set in localStorage).");

        // 2. Navigate to Payment Route with unique Booking ID
        const bookingRef = `BK-QA-${Date.now().toString().slice(-6)}`;
        console.log(`2. Opening payment page for booking ${bookingRef}...`);
        await driver.get(`http://localhost:5173/payment/${bookingRef}`);
        await driver.wait(until.elementLocated(By.className("payment-page-container")), 10000);
        console.log("PASS: PaymentPage loaded.");

        // 3. Populate Card Details via React prototype dispatch
        console.log("3. Populating valid payment credentials...");
        await driver.executeScript(`
            const setReactValue = (el, val) => {
                if (!el) return false;
                const tracker = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                tracker.call(el, val);
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.dispatchEvent(new Event('blur', { bubbles: true }));
                return true;
            };

            const nameEl = document.querySelector("input[placeholder*='John Doe']");
            const cardEl = document.querySelector("input[placeholder*='1234']");
            const expEl  = document.querySelector("input[placeholder*='MM/YY']");
            const cvvEl  = document.querySelector("input[placeholder='123'], input[type='password']");

            setReactValue(nameEl, "Alex Morgan");
            setReactValue(cardEl, "4242 4242 4242 4242");
            setReactValue(expEl,  "12/28");
            setReactValue(cvvEl,  "789");
        `);
        await driver.sleep(600);

        // 4. Verify button state and submit
        let payBtn = await driver.findElement(By.css("button.btn-pay-now"));
        let disabledState = await payBtn.getAttribute("disabled");
        if (disabledState !== null) {
            throw new Error("Pay button is unexpectedly disabled.");
        }

        console.log("PASS: 'Pay Now' button is ACTIVE and ENABLED.");
        await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", payBtn);
        await driver.sleep(300);
        await payBtn.click();
        console.log("PASS: Clicked 'Pay Now'. Awaiting backend response...");

        // 5. Assert Receipt Card or Detect Error Banner
        let resultElement = await driver.wait(
            until.elementLocated(By.xpath("//*[contains(@class, 'payment-success-card') or contains(@class, 'payment-error-banner') or contains(@class, 'payment-warning-banner')]")),
            15000
        );

        let className = await resultElement.getAttribute("class");
        let receiptText = await resultElement.getText();

        if (className.includes("error") || className.includes("warning")) {
            throw new Error("Payment rejected with banner: " + receiptText);
        }

        console.log("\n==================================================");
        console.log("FEATURE 3 (TRIP-58/59): TEST PASSED SUCCESSFULLY!");
        console.log("==================================================");
        console.log("Receipt Details:\n" + receiptText);

    } catch (err) {
        console.error("\nFAIL in Feature 3:", err.message);
    } finally {
        await driver.quit();
    }
}
testPaymentExecution();
