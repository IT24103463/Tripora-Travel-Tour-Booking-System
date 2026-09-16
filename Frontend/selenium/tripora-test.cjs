const { Builder, By, until } = require("selenium-webdriver");

async function runTest() {
    let driver = await new Builder()
        .forBrowser("chrome")
        .build();

    try {
        console.log("Opening Tripora...");

        await driver.get("http://localhost:5174/");

        await driver.wait(
            until.elementLocated(By.tagName("body")),
            10000
        );

        console.log("PASS: Frontend loaded.");

        // Find Book Now button
        let bookNow = await driver.wait(
            until.elementLocated(
                By.xpath("//*[normalize-space()='Book Now']")
            ),
            10000
        );

        await driver.executeScript(
            "arguments[0].scrollIntoView({block: 'center'});",
            bookNow
        );

        await driver.sleep(500);

        await driver.wait(
            until.elementIsVisible(bookNow),
            5000
        );

        await bookNow.click();

        console.log("PASS: Book Now button clicked.");

        await driver.sleep(1000);

        // Find email field
        let email = await driver.wait(
            until.elementLocated(By.css("input[type='email']")),
            10000
        );

        await driver.wait(until.elementIsVisible(email), 5000);

        let password = await driver.wait(
            until.elementLocated(By.css("input[type='password']")),
            10000
        );

        await driver.wait(until.elementIsVisible(password), 5000);

        await email.sendKeys("user1@gmail.com");
        await password.sendKeys("user1@gmail.com");

        console.log("PASS: Login credentials entered.");

        // Find submit button
        let submitButton = await driver.wait(
            until.elementLocated(By.css("button[type='submit']")),
            10000
        );

        await driver.wait(
            until.elementIsVisible(submitButton),
            5000
        );

        await submitButton.click();

        await driver.sleep(3000);

        console.log("PASS: Login submitted.");
        console.log("SELENIUM LOGIN TEST: PASS");

    } catch (error) {
        console.log("SELENIUM LOGIN TEST: FAIL");
        console.error(error);

    } finally {
        await driver.quit();
    }
}

runTest();