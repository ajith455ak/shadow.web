const { chromium, expect } = require('@playwright/test');
const assert = require('assert');
const fs = require('fs');

(async () => {
  console.log("=== STARTING PLAYWRIGHT E2E UI TEST ===");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  const rand = Math.floor(Math.random() * 1000000);
  const username = `operative_${rand}`;
  const email = `op_${rand}@nexus.io`;
  const password = `P@ssword123!`;

  const steps = [
    { id: 1, category: "Landing Page", name: "test_navigation_to_register", status: "PENDING", error: "None" },
    { id: 2, category: "Register Page", name: "test_registration_form_submission", status: "PENDING", error: "None" },
    { id: 3, category: "Verification Page", name: "test_email_otp_verification", status: "PENDING", error: "None" },
    { id: 4, category: "Login Page", name: "test_login_authentication", status: "PENDING", error: "None" },
    { id: 5, category: "Character Page", name: "test_character_creation_and_setup", status: "PENDING", error: "None" },
    { id: 6, category: "Dashboard Page", name: "test_dashboard_routes_and_navigation", status: "PENDING", error: "None" },
    { id: 7, category: "Missions Page", name: "test_mission_completion_and_coin_reward", status: "PENDING", error: "None" }
  ];

  const startTime = Date.now();
  function saveReport() {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    fs.writeFileSync('playwright_report.json', JSON.stringify({
      duration: parseFloat(elapsed),
      steps: steps
    }, null, 2));
  }
  saveReport();

  try {
    // 1. Navigate to Register Screen
    console.log("Navigating to register screen...");
    await page.goto('http://localhost:8081/register');
    await page.waitForTimeout(2000);
    steps[0].status = "PASSED";
    saveReport();

    // 2. Perform User Registration
    console.log(`Registering user: ${username} (${email})...`);
    await page.fill('[data-testid="register-username-input"]', username);
    await page.fill('[data-testid="register-email-input"]', email);
    await page.fill('[data-testid="register-password-input"]', password);
    await page.fill('[data-testid="register-confirm-input"]', password);
    
    console.log("Submitting registration form...");
    await page.click('[data-testid="register-submit-button"]');
    await page.waitForTimeout(3000);
    steps[1].status = "PASSED";
    saveReport();

    // 3. Verify Email Screen & Grab Demo OTP
    console.log("Expecting verify email screen redirect...");
    assert(page.url().includes('/verify-email'), `Failed registration redirect. URL is: ${page.url()}`);
    
    console.log("Requesting verification token resend to extract OTP...");
    await page.click('[data-testid="resend-token-button"]');
    await page.waitForTimeout(2000);

    const bodyText = await page.innerText('body');
    const otpMatch = bodyText.match(/\(Demo:\s*(\d+)\)/);
    if (!otpMatch) {
      throw new Error("Could not find Demo OTP code on screen text.");
    }
    const otp = otpMatch[1];
    console.log(`Extracted Demo OTP Code: ${otp}`);

    await page.fill('[data-testid="verify-token-input"]', otp);
    console.log("Submitting OTP verification...");
    await page.click('[data-testid="verify-submit-button"]');
    await page.waitForTimeout(3000);
    steps[2].status = "PASSED";
    saveReport();

    // 4. Login Screen
    console.log("Expecting login screen redirect...");
    assert(page.url().includes('/login'), `Failed OTP verification redirect. URL is: ${page.url()}`);

    console.log("Logging in...");
    await page.fill('[data-testid="login-email-input"]', email);
    await page.fill('[data-testid="login-password-input"]', password);
    await page.click('[data-testid="login-submit-button"]');
    await page.waitForTimeout(3000);
    steps[3].status = "PASSED";
    saveReport();

    // 5. Character Creation
    console.log("Expecting character creation screen redirect...");
    assert(page.url().includes('/character-creation'), `Failed login redirect. URL is: ${page.url()}`);

    console.log("Creating character...");
    await page.fill('[data-testid="character-name-input"]', username);
    // select netrunner class
    await page.click('[data-testid="class-penetration_tester"]');
    // select second avatar
    await page.click('[data-testid="avatar-avatar_2"]');
    await page.click('[data-testid="create-character-button"]');
    await page.waitForTimeout(4000);
    steps[4].status = "PASSED";
    saveReport();

    // 6. Dashboard navigation and click checks
    console.log("Expecting Dashboard redirect...");
    assert(page.url().includes('/dashboard'), `Failed character creation redirect. URL is: ${page.url()}`);

    console.log("Verifying coins display...");
    const initialCoinsLocator = page.locator('[data-testid="dashboard-coins"]').last();
    const coinsText = await initialCoinsLocator.innerText();
    console.log(`Current character starting coins: ${coinsText}`);
    assert.strictEqual(coinsText, "100", "Starting coins should be 100");

    // Click quick-story
    console.log("Testing Story Navigation...");
    await page.click('[data-testid="quick-story"]');
    await page.waitForTimeout(1500);
    assert(page.url().includes('/story'), "Failed Story redirection");
    console.log("Navigating back to Dashboard...");
    await page.goBack();
    await page.waitForTimeout(1500);

    // Click quick-leaderboard
    console.log("Testing Leaderboard Navigation...");
    await page.click('[data-testid="quick-leaderboard"]');
    await page.waitForTimeout(1500);
    assert(page.url().includes('/leaderboard'), "Failed Leaderboard redirection");
    console.log("Navigating back to Dashboard...");
    await page.goBack();
    await page.waitForTimeout(1500);

    // Click quick-inventory
    console.log("Testing Inventory Navigation...");
    await page.click('[data-testid="quick-inventory"]');
    await page.waitForTimeout(1500);
    assert(page.url().includes('/inventory'), "Failed Inventory redirection");
    console.log("Navigating back to Dashboard...");
    await page.goBack();
    await page.waitForTimeout(1500);

    // Click quick-skills
    console.log("Testing Skills Navigation...");
    await page.click('[data-testid="quick-skills"]');
    await page.waitForTimeout(1500);
    assert(page.url().includes('/skills'), "Failed Skills redirection");
    console.log("Navigating back to Dashboard...");
    await page.goBack();
    await page.waitForTimeout(1500);

    // Click quick-daily
    console.log("Testing Daily Navigation...");
    await page.click('[data-testid="quick-daily"]');
    await page.waitForTimeout(1500);
    assert(page.url().includes('/daily'), "Failed Daily redirection");
    console.log("Navigating back to Dashboard...");
    await page.goBack();
    await page.waitForTimeout(1500);

    // Click quick-messenger
    console.log("Testing Messenger Navigation...");
    await page.click('[data-testid="quick-messenger"]');
    await page.waitForTimeout(1500);
    assert(page.url().includes('/messenger'), "Failed Messenger redirection");
    console.log("Navigating back to Dashboard...");
    await page.goBack();
    await page.waitForTimeout(1500);
    steps[5].status = "PASSED";
    saveReport();

    // 7. Complete first puzzle mission
    console.log("Engaging first active mission: First Contact...");
    await page.click('[data-testid="start-active-mission"]');
    await page.waitForTimeout(2000);
    assert(page.url().includes('/mission/m1'), "Failed active mission page redirect");

    console.log("Selecting option 22 (SSH)...");
    await page.click('[data-testid="puzzle-option-22"]');
    await page.waitForTimeout(1000);
    console.log("Submitting solution...");
    await page.click('[data-testid="submit-puzzle"]');
    await page.waitForTimeout(2000);

    const successText = await page.innerText('body');
    assert(successText.includes("MISSION COMPLETE"), "Solution submission did not show MISSION COMPLETE");
    console.log("Solution correct! Mission Completed successfully!");

    // Return to HQ
    await page.click('[data-testid="mission-continue"]');
    await page.waitForTimeout(2500);
    assert(page.url().includes('/dashboard'), "Failed dashboard return redirect");

    // Verify coin increase (100 coins + 50 coins reward)
    const coinsLocator = page.locator('[data-testid="dashboard-coins"]').last();
    await expect(coinsLocator).toHaveText("150", { timeout: 5000 });
    const newCoins = await coinsLocator.innerText();
    console.log(`Coins after mission completion: ${newCoins}`);
    assert.strictEqual(newCoins, "150", "Coins should have updated to 150");
    steps[6].status = "PASSED";
    saveReport();

    console.log("=== ALL E2E UI TEST CHECKS PASSED ===");
    
    // Success screenshot
    if (!fs.existsSync('screenshots')){
        fs.mkdirSync('screenshots');
    }
    await page.screenshot({ path: 'screenshots/success.png', fullPage: true });
    console.log("Success screenshot saved to screenshots/success.png");

  } catch (error) {
    console.error("!!! E2E TEST CRITICAL FAILURE !!!");
    console.error(error);
    
    // Mark failed step and subsequent skipped steps
    let failedFound = false;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].status === "PENDING") {
        if (!failedFound) {
          steps[i].status = "FAILED";
          steps[i].error = error.message || String(error);
          failedFound = true;
        } else {
          steps[i].status = "SKIPPED";
        }
      }
    }
    saveReport();
    
    // Failure screenshot
    try {
      if (!fs.existsSync('screenshots')){
          fs.mkdirSync('screenshots');
      }
      await page.screenshot({ path: 'screenshots/failure.png', fullPage: true });
      console.log("Failure screenshot saved to screenshots/failure.png");
    } catch (e) {
      console.error("Failed to take failure screenshot:", e);
    }
    
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
