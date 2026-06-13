import os
import re
import random
import time
import sys
import pytest

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.common.exceptions import StaleElementReferenceException, ElementNotInteractableException
except ImportError:
    if "pytest" in sys.modules:
        pytest.skip("selenium not installed, skipping selenium tests", allow_module_level=True)
    else:
        raise

CHROME_PATH = r"C:\Users\ajith kumar\AppData\Local\ms-playwright\chromium-1223\chrome-win64\chrome.exe"

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:8081")

# Generate a unique operative for testing
RAND_ID = random.randint(100000, 999999)
USERNAME = f"sel_agent_{RAND_ID}"
EMAIL = f"sel_agent_{RAND_ID}@nexus.io"
PASSWORD = "SecurePassword123!"

@pytest.fixture(scope="module")
def driver():
    options = Options()
    if os.path.exists(CHROME_PATH):
        options.binary_location = CHROME_PATH
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1280,720")
    
    # Disable sandboxing and shared memory issues in headless environments
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    driver = webdriver.Chrome(options=options)
    yield driver
    driver.quit()

def wait_and_find(driver, testid, timeout=10, last=False):
    """Find elements by data-testid compiled from React Native testID."""
    selector = f'[data-testid="{testid}"]'
    try:
        WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
        )
    except Exception as e:
        print(f"\n[DEBUG] Timeout waiting for testID: '{testid}'. Current URL: {driver.current_url}")
        elements = driver.find_elements(By.CSS_SELECTOR, "[data-testid]")
        print("[DEBUG] Available data-testids on the page:")
        for el in elements:
            try:
                tid = el.get_attribute("data-testid")
                txt = el.text.strip().replace("\n", " ")
                print(f"  - {tid} (tag: {el.tag_name}, text: '{txt}')")
            except Exception:
                pass
        raise e
    elements = driver.find_elements(By.CSS_SELECTOR, selector)
    if last:
        return elements[-1]
    return elements[0]

def click_element(driver, testid, last=False):
    """Click an element, retrying if it's stale or temporarily non-interactable."""
    for i in range(5):
        try:
            elem = wait_and_find(driver, testid, last=last)
            elem.click()
            return
        except (StaleElementReferenceException, ElementNotInteractableException):
            if i == 4:
                raise
            time.sleep(0.5)

def type_into_element(driver, testid, text, last=False):
    """Type text into an element, retrying if it's stale or non-interactable."""
    for i in range(5):
        try:
            elem = wait_and_find(driver, testid, last=last)
            # Try clearing the field first if possible
            try:
                elem.clear()
            except Exception:
                pass
            elem.send_keys(text)
            return
        except (StaleElementReferenceException, ElementNotInteractableException):
            if i == 4:
                raise
            time.sleep(0.5)

def click_tab_by_text(driver, tab_name):
    """Click a navigation tab in the bottom bar by its display text (case-insensitive)."""
    xpath = f"//*[text()='{tab_name}' or text()='{tab_name.upper()}' or text()='{tab_name.lower()}']"
    for i in range(5):
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, xpath))
            )
            elements = driver.find_elements(By.XPATH, xpath)
            # Try to click the first element that works
            for elem in elements:
                try:
                    elem.click()
                    return
                except Exception:
                    pass
            # If standard clicks fail, use JS execution as fallback
            driver.execute_script("arguments[0].click();", elements[0])
            return
        except Exception as e:
            if i == 4:
                raise e
            time.sleep(0.5)

def test_01_registration_and_otp(driver):
    """Test user registration and demo OTP verification."""
    print("\n--- 1. Testing Registration ---")
    driver.get(f"{FRONTEND_URL}/register")
    
    type_into_element(driver, "register-username-input", USERNAME)
    type_into_element(driver, "register-email-input", EMAIL)
    type_into_element(driver, "register-password-input", PASSWORD)
    type_into_element(driver, "register-confirm-input", PASSWORD)
    
    click_element(driver, "register-submit-button")
    
    # Wait for verify email redirection
    WebDriverWait(driver, 10).until(lambda d: "/verify-email" in d.current_url)
    print("Registration submitted. Redirected to verification.")

    print("--- 2. Testing Email Verification ---")
    click_element(driver, "resend-token-button")
    
    # Wait for demo token text to appear in body
    WebDriverWait(driver, 5).until(
        lambda d: "(Demo:" in d.find_element(By.TAG_NAME, "body").text
    )
    
    body_text = driver.find_element(By.TAG_NAME, "body").text
    match = re.search(r"\(Demo:\s*(\d+)\)", body_text)
    assert match is not None, "Demo OTP Code not found in screen text."
    otp_code = match.group(1)
    print(f"Extracted Verification OTP: {otp_code}")
    
    type_into_element(driver, "verify-token-input", otp_code)
    click_element(driver, "verify-submit-button")
    
    # Wait for login screen redirect
    WebDriverWait(driver, 10).until(lambda d: "/login" in d.current_url)
    print("Account verified. Redirected to login page.")

def test_02_login(driver):
    """Test user login authentication."""
    print("--- 3. Testing Authentication (Login) ---")
    type_into_element(driver, "login-email-input", EMAIL)
    type_into_element(driver, "login-password-input", PASSWORD)
    click_element(driver, "login-submit-button")
    
    # Wait for character creation redirection
    WebDriverWait(driver, 10).until(lambda d: "/character-creation" in d.current_url)
    print("Login succeeded. Redirected to character creation.")

def test_03_character_creation(driver):
    """Test character configuration and creation."""
    print("--- 4. Testing Character Creation ---")
    type_into_element(driver, "character-name-input", USERNAME)
    click_element(driver, "class-penetration_tester")
    click_element(driver, "avatar-avatar_2")
    click_element(driver, "create-character-button")
    
    # Wait for dashboard redirection
    WebDriverWait(driver, 10).until(lambda d: "/dashboard" in d.current_url)
    print("Character created. Redirected to Dashboard.")

def test_04_dashboard_and_navigation(driver):
    """Test that all bottom navigation tabs and quick navigation routes work correctly."""
    print("--- 5. Testing Bottom Tabs Navigation ---")
    
    # Verify we are on Dashboard first
    coins_display = wait_and_find(driver, "dashboard-coins", last=True)
    assert coins_display.text == "100", f"Expected starting coins 100, got: {coins_display.text}"
    
    # Navigation tabs checklist
    tabs = [
        ("Story", "/story"),
        ("NPCs", "/npcs"),
        ("Gear", "/inventory"),
        ("HQ", "/dashboard")
    ]
    
    for tab_name, route in tabs:
        print(f"Navigating bottom tab: {tab_name} to {route}")
        click_tab_by_text(driver, tab_name)
        WebDriverWait(driver, 5).until(lambda d: route in d.current_url)
        
    print("Bottom tab navigation flow completed successfully.")

def test_05_leaderboard_view(driver):
    """Test that the global leaderboard displays correct entry lists."""
    print("--- 6. Testing Leaderboard Rankings ---")
    # Open leaderboard from the quick grid on dashboard
    click_element(driver, "quick-leaderboard", last=True)
    WebDriverWait(driver, 5).until(lambda d: "/leaderboard" in d.current_url)
    
    # Verify leaderboard row presence
    # Since we just created this user, it should show up or have at least 1 ranking
    row_element = wait_and_find(driver, "leaderboard-row-1")
    assert row_element.is_displayed(), "Leaderboard does not display any ranking rows."
    print("Leaderboard rankings displayed successfully.")
    
    # Go back to dashboard
    driver.back()
    WebDriverWait(driver, 5).until(lambda d: "/dashboard" in d.current_url)

def test_06_mission_xp_progression(driver):
    """Test active mission completion and subsequent coin/XP progression updates."""
    print("--- 7. Testing Mission Completion & XP Progression ---")
    click_element(driver, "start-active-mission", last=True)
    
    WebDriverWait(driver, 5).until(lambda d: "/mission/m1" in d.current_url)
    print("Redirection to Mission 1: First Contact.")
    
    # Submit the correct puzzle option
    click_element(driver, "puzzle-option-22")
    click_element(driver, "submit-puzzle")
    
    # Click to return to HQ
    click_element(driver, "mission-continue")
    
    WebDriverWait(driver, 10).until(lambda d: "/dashboard" in d.current_url)
    
    # Verify coins incremented to 150
    WebDriverWait(driver, 10).until(
        lambda d: wait_and_find(d, "dashboard-coins", last=True).text == "150"
    )
    print("Updated Coins verified successfully: 150 CR.")

def test_07_responsive_ui(driver):
    """Test responsiveness of the UI layout under mobile device resolutions."""
    print("--- 8. Testing Layout Responsiveness ---")
    # Resize window to mobile aspect ratio
    driver.set_window_size(375, 812)
    time.sleep(1) # wait for fluid layout transition
    
    # Check that dashboard elements remain visible
    mobile_coins = wait_and_find(driver, "dashboard-coins", last=True)
    assert mobile_coins.is_displayed(), "Dashboard stats elements not visible in mobile view."
    print("Mobile layout elements layout verification successful.")
    
    # Restore window size
    driver.set_window_size(1280, 720)

def test_08_profile_and_logout(driver):
    """Test the profile details page and then perform account logout."""
    print("--- 9. Testing Profile & Logout Flow ---")
    click_tab_by_text(driver, "Profile")
    WebDriverWait(driver, 5).until(lambda d: "/profile" in d.current_url)
    
    # Verify profile contains character details
    body_text = driver.find_element(By.TAG_NAME, "body").text
    assert USERNAME.lower() in body_text.lower(), "Username not found in profile body text."
    
    # Trigger logout
    click_element(driver, "logout-button")
    
    # Verify redirected back to login page
    WebDriverWait(driver, 10).until(lambda d: "/login" in d.current_url)
    print("Logged out successfully. Redirected to Login.")
