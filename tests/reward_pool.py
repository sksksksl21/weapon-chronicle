"""Exclude no-op Overdrive reward while keeping other meaningful choices."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "src/combat/story_combat.html").read_text(encoding="utf8")
assert SOURCE.count("resetRun();\n})();") == 1, "combat source injection point moved"
AUDIT = """window.__rewardAudit = {
  options: () => { pickRewardChoices(); return [...rewardChoices]; },
  eligible: () => Object.keys(MEMORY_POOL).filter(k => k !== 'cooling'),
  take: keys => { memoriesTaken = [...keys]; }
};"""
TEST_HTML = SOURCE.replace("resetRun();\n})();", AUDIT + "\nresetRun();\n})();")

with sync_playwright() as p:
    browser = p.chromium.launch(
        headless=True,
        executable_path="/usr/bin/chromium" if Path("/usr/bin/chromium").exists() else None,
        args=["--no-sandbox", "--disable-dev-shm-usage"],
    )
    page = browser.new_page(viewport={"width": 390, "height": 844})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.set_content(TEST_HTML, wait_until="load")
    page.wait_for_function("Boolean(window.__rewardAudit)")
    valid = page.evaluate("__rewardAudit.eligible()")
    assert len(valid) >= 3, valid
    for taken in ([], valid[:2], valid, valid[:-1]):
        page.evaluate("__rewardAudit.take", taken)
        for _ in range(20):
            offered = page.evaluate("__rewardAudit.options()")
            assert len(offered) == 3, (taken, offered)
            assert len(set(offered)) == 3, offered
            assert all(k in valid for k in offered), (taken, offered)
    assert not errors, errors
    browser.close()
print("PASS: disabled Overdrive reward cannot appear in reward choices or fallback")
