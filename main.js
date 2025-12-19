// main.js
import { remote } from 'webdriverio';

const APPIUM_SERVER = 'http://127.0.0.1:4723';

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
    "appium:autoWebviewTimeout": 200000,
    "appium:chromedriverExecutableDir": "C:\\Users\\KBDS\\AppiumChromedrivers\\drivers",
    "appium:chromedriverChromeMappingFile": "C:\\Users\\KBDS\\AppiumChromedrivers\\mapping.json"
  }
});
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 1) 앱이 실제로 올라올 때까지 대기 (Native)
 */
async function waitForAppLaunched(driver, pkgName, timeoutMs = 300000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const curPkg = await driver.getCurrentPackage();
      if (curPkg === pkgName) return true;
    } catch (e) {
      // 간헐적으로 실패할 수 있어 무시하고 재시도
    }
    await sleep(5000);
  }
  throw new Error(`앱 런치 대기 실패: getCurrentPackage()가 ${pkgName}로 안 바뀜`);
}

/**
 * 2) WEBVIEW 컨텍스트 등장할 때까지 대기 후 전환
 */
async function waitForAndSwitchToWebview(driver, nameContains, timeoutMs = 400000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const contexts = await driver.getContexts();
    // 디버그: 컨텍스트 변화 확인하고 싶으면 아래 주석 해제
    // console.log('contexts =', contexts);

    const target = contexts.find((c) => c.includes(nameContains));
    if (target) {
      await driver.switchContext(target);
      return target;
    }
    await sleep(5000);
  }
  throw new Error(`WEBVIEW 전환 실패: contexts에 ${nameContains} 포함 항목이 안 뜸`);
}

/**
 * 3) DOM readyState 대기 (Web)
 */
async function waitForDomReady(driver, timeoutMs = 300000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const rs = await driver.execute(() => document.readyState);
      if (rs === 'complete' || rs === 'interactive') return true;
    } catch (e) {
      // 아직 webview가 완전히 준비 전이면 execute 자체가 실패할 수 있음
    }
    await sleep(3000);
  }
  throw new Error('DOM readyState 대기 실패');
}

/**
 * 4) 로그인 버튼 클릭 (Web)
 */
async function clickLoginButton(driver) {
  // CSS selector: .btn.md.white.login (class="btn md white login")
  const loginBtn = await driver.$('.btn.md.white.login');

  await loginBtn.waitForExist({ timeout: 300000 });
  await loginBtn.waitForDisplayed({ timeout: 300000 });

  // 클릭 안정화: 스크롤 + clickable 대기
  await loginBtn.scrollIntoView();
  await loginBtn.waitForClickable({ timeout: 300000 });

  try {
    await loginBtn.click();
  } catch (e) {
    // 오버레이/특수 이벤트로 click이 막히면 JS click으로 우회
    await driver.execute((el) => el.click(), loginBtn);
  }
}
// 포커스
async function focusByJS(el) {
   await driver.execute((e) => {
      e.scrollIntoView({ block: 'center', inline: 'center' });
      e.focus();
   }, el);
}
// 바텀시트 표시될 때까지 대기
async function ensureKeypadVisible() {
    const keypad = await driver.$('.btn-area-full.fixed.fixed-bottom-sheet');
    await keypad.waitForDisplayed({ timeout: 15000 });
    await keypad.scrollIntoView({ block: 'center', inline: 'center' });
    await driver.pause(150);
    return keypad;
}

async function writeIDAndPassword(driver, id, password) {
  // ID
  const inputID = await driver.$('input.form-control[placeholder="아이디 입력"]');
  await inputID.waitForDisplayed({ timeout: 2000 });
  await inputID.scrollIntoView({ block: 'center', inline: 'center' });
  await inputID.click();
  await inputID.setValue(id);
  // password
  const inputPassword = await driver.$('#password');
  await inputPassword.waitForDisplayed({ timeout: 2000 });
  const blocker = await driver.$('.btn-area--full.fixed.fixed-bottom-sheet');
  // block처리 하는 공간 제거하기
  if (await blocker.isDisplayed().catch(() => false)) {
     await blocker.waitForDisplayed({ reverse: true, timeout: 1500 }).catch(() => {});
  }
  
  await inputPassword.scrollIntoView({ block: 'center', inline: 'center'});
  await driver.pause(300);
  try {
    await inputPassword.click();
  } catch (e) {
    await driver.execute((el) => el.focus(), inputPassword);
  }
// 보안키패드 입력
  try {
 // 키패드 전체 컨테이너(가능한 상위 div로 잡기)
     const kpdRoot = await driver.$('[data-keypad-theme="mobile"], .btn-area--full.fixed.fixed-bottom-sheet');
     await kpdRoot.waitForDisplayed({ timeout: 15000 });
     await kpdRoot.scrollIntoView({ block: 'center', inline: 'center' });

     await driver.pause(300);
     await QWER1212(driver);
  } catch (e) {
     console.log("보안 키패드 비밀번호 입력 실패(QWER1212)");
  }
}

/*
 * 보안키패드(qwer1212)
 */

async function QWER1212(driver) {
   const keyQ = await driver.$('img.kpd-data[aria-label="대문자 Q"]');
   const keyW = await driver.$('img.kpd-data[aria-label="대문자 W"]');
   const keyE = await driver.$('img.kpd-data[aria-label="대문자 E"]');
   const keyR = await driver.$('img.kpd-data[aria-label="대문자 R"]');
   const numberOne = await driver.$('[role="button"].kpd-data[aria-label="1"]');
   const numberTwo = await driver.$('[role="button"].kpd-data[aria-lable="2"]');

   await keyQ.waitForDisplayed({ timeout: 10000 });
   await keyQ.click();
   await keyW.waitForDisplayed({ timeout: 10000 });
   await keyW.click();
   await keyE.waitForDisplayed({ timeout: 10000 });
   await keyE.click();
   await keyR.waitForDisplayed({ timeout: 10000 });
   await keyR.click();
   // 키패드 전체 컨테이너(가능한 상위 div로 잡기)

   await numberOne.waitForDisplayed({ timeout: 10000 });
   await numberOne.click();
   await numberTwo.waitForDisplayed({ timeout: 10000 });
   await numberTwo.click();
   await numberOne.click();
   await numberTwo.click();
}


/**
 * 실행 엔트리
 */
async function run() {
  console.log('automation tester started');

  try {
    // ✅ (선택) 앱을 명시적으로 활성화 (noReset=true면 이미 떠있어도 안전)
    // await driver.activateApp('com.kbstar.global');

    // 1) 앱 런치 완료 대기 (Native)
    await driver.switchContext('NATIVE_APP');
    await waitForAppLaunched(driver, 'com.kbstar.global', 30000);

    // 2) WEBVIEW 등장 대기 + 전환
    const switched = await waitForAndSwitchToWebview(driver, 'WEBVIEW_com.kbstar.global', 40000);
    console.log('switched to =', switched);

    // 3) DOM ready 대기
    await waitForDomReady(driver, 30000);

    // 4) 로그인 버튼 클릭
    await clickLoginButton(driver);
    console.log('clicked login button');
    await writeIDAndPassword(driver, 'VN1TEST103', 'qwer1212');
    console.log('아이디/패스워드입력');

  } catch (err) {
    console.error('TEST FAILED:', err);
  } finally {
    await driver.deleteSession();
    console.log('session deleted');
  }
}

run().catch((e) => console.error(e));

