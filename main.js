import { remote } from "webdriverio";


console.log("automation tester started");
const driver = await remote({
  hostname: "127.0.0.1",
  port: 4723,
  path: "/",
  capabilities: {
    platformName: "Android",
    "appium:automationName": "uiAutomator2",
    "appium:udid": "R3CX10DVVBM",
    "appium:appPackage": "com.kbstar.global",
    "appium:appActivity": ".MainActivity",
    "appium:noReset": true,
    "appium:newCommandTimeout": 120,
    "appium:autoWebview": true,
    "appium:autoWebviewTimeout": 20000
  }
});

try {
  const contexts = await driver.getContexts();
  console.log("contexts =", contexts);
  // 2) WEBVIEW로 전환 (autoWebview가 실패할 때 대비)
  const webview = contexts.find(c => c.includes("WEBVIEW"));
  if (!webview) {
    throw new Error("WEBVIEW context not found. (WebView 디버깅/설정 필요)");
  }
  await driver.switchContext(webview);
    // 3) 이제부터 CSS selector 사용 가능
  const loginBtn = await driver.$("css selector=button.btn.md.white.login");
  await loginBtn.waitForExist({ timeout: 10000 });
  await loginBtn.click();
} catch {
   console.log("login button not found");
} finally {
  await driver.deleteSession();
}
