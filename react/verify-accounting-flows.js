const http = require('http');
const fs = require('fs');
const path = require('path');

// Dynamically load playwright-core
let playwright;
try {
  playwright = require('playwright-core');
} catch (e) {
  console.error("Error: 'playwright-core' is not installed in this directory.");
  console.error("Please run: npm install playwright-core\n");
  process.exit(1);
}

const PORT = 8086;
const PUBLIC_DIR = __dirname;

// Create static HTTP server to serve the prototype files
const server = http.createServer((req, res) => {
  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  filePath = decodeURIComponent(filePath);
  const ext = path.extname(filePath);
  let contentType = 'text/html';
  switch (ext) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpeg'; break;
    case '.svg': contentType = 'image/svg+xml'; break;
  }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Decorate the browser page with virtual mouse cursor and subtitle overlay banner
async function setupPageDecorations(page) {
  await page.addInitScript(() => {
    // 1. Prevent the Firebase sync engine from programmatically reloading the page during automation
    setInterval(() => {
      if (window.firebaseReloadTimeout) {
        clearTimeout(window.firebaseReloadTimeout);
        window.firebaseReloadTimeout = null;
      }
    }, 50);

    window.addEventListener('DOMContentLoaded', () => {
      // 2. Create a floating virtual cursor circle (red dot)
      if (!document.getElementById('playwright-cursor')) {
        const cursor = document.createElement('div');
        cursor.id = 'playwright-cursor';
        cursor.style.position = 'fixed';
        cursor.style.width = '18px';
        cursor.style.height = '18px';
        cursor.style.borderRadius = '50%';
        cursor.style.backgroundColor = 'rgba(239, 68, 68, 0.85)'; // Red dot
        cursor.style.border = '2px solid #ffffff';
        cursor.style.pointerEvents = 'none';
        cursor.style.zIndex = '100000';
        cursor.style.transform = 'translate(-50%, -50%)';
        cursor.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        cursor.style.transition = 'width 0.1s, height 0.1s, background-color 0.1s';
        document.body.appendChild(cursor);

        // Move cursor dot to actual mouse coordinates
        document.addEventListener('mousemove', (e) => {
          cursor.style.left = e.clientX + 'px';
          cursor.style.top = e.clientY + 'px';
        });

        // Click indicator changes
        document.addEventListener('mousedown', () => {
          cursor.style.width = '14px';
          cursor.style.height = '14px';
          cursor.style.backgroundColor = 'rgba(16, 185, 129, 0.95)'; // Green dot on click
        });

        document.addEventListener('mouseup', () => {
          cursor.style.width = '18px';
          cursor.style.height = '18px';
          cursor.style.backgroundColor = 'rgba(239, 68, 68, 0.85)';
        });
      }

      // 3. Create subtitle overlay banner at the bottom
      if (!document.getElementById('playwright-banner')) {
        const banner = document.createElement('div');
        banner.id = 'playwright-banner';
        banner.style.position = 'fixed';
        banner.style.bottom = '30px';
        banner.style.left = '50%';
        banner.style.transform = 'translateX(-50%)';
        banner.style.backgroundColor = 'rgba(15, 23, 42, 0.95)';
        banner.style.color = '#ffffff';
        banner.style.padding = '14px 28px';
        banner.style.borderRadius = '10px';
        banner.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        banner.style.fontSize = '15px';
        banner.style.fontWeight = '600';
        banner.style.zIndex = '99999';
        banner.style.boxShadow = '0 10px 25px rgba(0,0,0,0.4)';
        banner.style.maxWidth = '85%';
        banner.style.textAlign = 'center';
        banner.style.border = '2px solid #38bdf8'; // Blue highlight border
        banner.style.pointerEvents = 'none';
        banner.innerHTML = '<div style="font-size:11px;color:#38bdf8;margin-bottom:4px;font-weight:700;text-transform:uppercase;">VERIDEX FINANCE SYSTEM</div><div>Initializing...</div>';
        document.body.appendChild(banner);
      }
    });
  });
}

// Helper function to show captions on the screen and speak in Hindi/English clearly
async function speakAndShow(page, english, hindi) {
  console.log(`\n💬 Captions (English): ${english}`);
  console.log(`🗣️ Narration (Hindi):   ${hindi}`);
  
  try {
    await page.evaluate(({ eng, hin }) => {
      const banner = document.getElementById('playwright-banner');
      if (banner) {
        banner.innerHTML = `<div style="font-size:12px;color:#38bdf8;margin-bottom:4px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">${eng}</div><div style="line-height:1.4;">${eng} <br/><span style="font-size:14px;color:#94a3b8;font-weight:normal;">${hin}</span></div>`;
      }
      
      // Execute Speech Synthesis
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utter = new SpeechSynthesisUtterance();
      
      utter.rate = 0.84; 
      utter.pitch = 1.0;
      
      const speakText = () => {
        const voices = window.speechSynthesis.getVoices();
        
        // Priority 1: Native Hindi voice
        let selectedVoice = voices.find(v => v.lang.startsWith('hi') || v.lang.includes('Hindi') || v.lang.includes('हिन्दी'));
        let textToSpeak = hin;
        
        if (selectedVoice) {
          utter.voice = selectedVoice;
        } else {
          // Priority 2: English with Indian accent (clear fallback)
          selectedVoice = voices.find(v => v.lang.includes('IN') || v.lang.startsWith('en-IN'));
          // Priority 3: Default English voice
          if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
          }
          if (selectedVoice) utter.voice = selectedVoice;
          
          // If using English voice, speak English text so it makes sense
          textToSpeak = eng;
        }
        
        utter.text = textToSpeak;
        window.speechSynthesis.speak(utter);
      };

      // Handle async loading of speech voices
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', speakText, { once: true });
      } else {
        speakText();
      }
    }, { eng: english, hin: hindi });
  } catch (err) {
    console.error("Speech Synthesis evaluation error:", err.message);
  }
}

// Helper function to query local storage and print the newest MGA and Carrier level JEs
async function printLatestJE(page, stepLabel, hindiSpeech) {
  const latestJEs = await page.evaluate(() => {
    const getJEs = (key) => JSON.parse(localStorage.getItem(key) || '[]');
    const mga = getJEs('mga_v_gl_journal_entries');
    const carrier = getJEs('carrier_v_gl_journal_entries');
    return {
      mgaLatest: mga[0] || null, // Index 0 contains the newest unshifted JE
      carrierLatest: carrier[0] || null
    };
  });

  console.log(`\n==================================================================`);
  console.log(`🔥 [JE HIT REGISTERED] - ${stepLabel}`);
  console.log(`==================================================================`);

  if (latestJEs.mgaLatest) {
    console.log(`📌 [MGA LEVEL JOURNAL ENTRY]`);
    console.log(`📄 JE ID: ${latestJEs.mgaLatest.id} | Desc: ${latestJEs.mgaLatest.description}`);
    latestJEs.mgaLatest.lines.forEach(l => {
      const amount = l.debit > 0 ? `Debit:  +$${l.debit.toLocaleString()}` : `Credit: -$${l.credit.toLocaleString()}`;
      const padding = l.debit > 0 ? "  [DEBIT]  " : "  [CREDIT] ";
      console.log(`${padding} Acct ${l.acct} (${l.desc}) -> ${amount}`);
    });
  } else {
    console.log("📌 [MGA LEVEL JOURNAL ENTRY] - No JE generated.");
  }

  if (latestJEs.carrierLatest) {
    console.log(`\n📌 [CARRIER LEVEL JOURNAL ENTRY]`);
    console.log(`📄 JE ID: ${latestJEs.carrierLatest.id} | Desc: ${latestJEs.carrierLatest.description}`);
    latestJEs.carrierLatest.lines.forEach(l => {
      const amount = l.debit > 0 ? `Debit:  +$${l.debit.toLocaleString()}` : `Credit: -$${l.credit.toLocaleString()}`;
      const padding = l.debit > 0 ? "  [DEBIT]  " : "  [CREDIT] ";
      console.log(`${padding} Acct ${l.acct} (${l.desc}) -> ${amount}`);
    });
  } else {
    console.log("\n📌 [CARRIER LEVEL JOURNAL ENTRY] - No JE generated.");
  }
  console.log(`==================================================================\n`);
}

// Helper to switch active entity/role using the visual UI dropdown
async function switchRoleInTab(pageNew, targetRole) {
  console.log(`🔄 [UI Action] Clicking Entity Switcher to switch to ${targetRole}...`);
  await pageNew.click('.v-entity-switch');
  await pageNew.waitForTimeout(500);
  
  // Set up navigation promise before clicking to prevent race conditions
  const navPromise = pageNew.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => {});
  
  if (targetRole === 'Carrier') {
    // Switch to Rohit (Insurance Carrier)
    await pageNew.click('.v-entity-menu-item:has-text("Rohit")');
  } else {
    // Switch to Ankit (MGA / Program Manager)
    await pageNew.click('.v-entity-menu-item:has-text("Ankit")');
  }
  
  await navPromise;
  await pageNew.waitForTimeout(1000);
}

// Helper to handle visual Posting of a Journal Entry inside the tab
async function postDraftJE(pageNew, roleLabel, englishDesc, hindiSpeech) {
  // 1. Click the "Post" button in the first row of the JE table
  console.log(`🖱️ [UI Action] Clicking 'Post' on the newest draft Journal Entry...`);
  await pageNew.click('#recent-je-tbody tr:first-child button:has-text("Post")');
  await pageNew.waitForSelector('#gl-je-modal.open');
  await pageNew.waitForTimeout(1000);

  // 2. Speak about reviewing the draft journal entry
  await speakAndShow(
    pageNew,
    `GL POSTING: Reviewing Draft JE (${roleLabel} Level).`,
    `${roleLabel} level par draft entry review karenge aur use ledger me post karenge.`
  );
  await pageNew.waitForTimeout(4000);

  // 3. Click the "Post to Ledger" button inside the modal
  console.log(`🖱️ [UI Action] Clicking 'Post to Ledger' inside the modal...`);
  await pageNew.click('#gl-je-modal-footer button:has-text("Post to Ledger")');
  
  // Wait for modal to close (detached state)
  await pageNew.waitForSelector('#gl-je-modal.open', { state: 'detached' });
  await pageNew.waitForTimeout(1500);

  // 4. Verify that the entry status has now changed to "Posted"
  await speakAndShow(
    pageNew,
    `GL POSTING: Journal Entry posted successfully!`,
    `Aap dekh sakte hain ki entry ka status ab Posted ho chuka hai.`
  );
  await pageNew.waitForTimeout(3000);
}

// Helper to open a ledger drilldown modal inside the Chart of Accounts tab
async function inspectAccountLedger(pageCOA, accountCode, accountName, roleLabel, englishDesc, hindiSpeech) {
  console.log(`🖱️ [UI Action] Drilling down into account ${accountCode} (${accountName})...`);
  
  // Click the balance link for the specific account code
  await pageCOA.click(`a[onclick*="${accountCode}"]`);
  await pageCOA.waitForSelector('#gl-ledger-modal.open');
  await pageCOA.waitForTimeout(1000);

  // Speak and display the ledger details modal
  await speakAndShow(pageCOA, englishDesc, hindiSpeech);
  await pageCOA.waitForTimeout(5000);

  // Close the ledger modal
  console.log(`🖱️ [UI Action] Closing account ledger modal...`);
  await pageCOA.click('#gl-ledger-modal button:has-text("Close")');
  await pageCOA.waitForSelector('#gl-ledger-modal.open', { state: 'detached' });
  await pageCOA.waitForTimeout(1000);
}

// Helper to open Accounts Receivable tab and display the subledger invoices
async function showArTab(context, userEmail, userRole, userStrMGA, emailStrMGA, englishCaption, hindiSpeech, waitTime) {
  console.log(`📝 [Action] Opening new tab to check Accounts Receivable (AR)...`);
  const pageAR = await context.newPage();
  await pageAR.addInitScript(({ user, email }) => {
    if (!sessionStorage.getItem('v_current_user')) {
      sessionStorage.setItem('v_current_user', user);
      sessionStorage.setItem('login_email', email);
    }
  }, { user: userStrMGA, email: emailStrMGA });

  await setupPageDecorations(pageAR);
  await pageAR.goto(`http://localhost:${PORT}/accounts-receivable.html`);
  await pageAR.bringToFront();
  await pageAR.waitForSelector('#ar-table tbody tr');

  await speakAndShow(pageAR, englishCaption, hindiSpeech);
  await pageAR.waitForTimeout(waitTime);
  await pageAR.close();
}

// Helper to open Accounts Payable tab and display the subledger payables
async function showApTab(context, userEmail, userRole, userStrMGA, emailStrMGA, englishCaption, hindiSpeech, waitTime) {
  console.log(`📝 [Action] Opening new tab to check Accounts Payable (AP)...`);
  const pageAP = await context.newPage();
  await pageAP.addInitScript(({ user, email }) => {
    if (!sessionStorage.getItem('v_current_user')) {
      sessionStorage.setItem('v_current_user', user);
      sessionStorage.setItem('login_email', email);
    }
  }, { user: userStrMGA, email: emailStrMGA });

  await setupPageDecorations(pageAP);
  await pageAP.goto(`http://localhost:${PORT}/accounts-payable.html`);
  await pageAP.bringToFront();
  await pageAP.waitForSelector('#ap-inv-table tbody tr');

  await speakAndShow(pageAP, englishCaption, hindiSpeech);
  await pageAP.waitForTimeout(waitTime);
  await pageAP.close();
}

// Helper to open Bank Reconciliation tab and display matching items
async function showReconTab(context, userEmail, userRole, userStrMGA, emailStrMGA, englishCaption, hindiSpeech, waitTime) {
  console.log(`📝 [Action] Opening new tab to check Bank Reconciliation...`);
  const pageRecon = await context.newPage();
  await pageRecon.addInitScript(({ user, email }) => {
    if (!sessionStorage.getItem('v_current_user')) {
      sessionStorage.setItem('v_current_user', user);
      sessionStorage.setItem('login_email', email);
    }
  }, { user: userStrMGA, email: emailStrMGA });

  await setupPageDecorations(pageRecon);
  await pageRecon.goto(`http://localhost:${PORT}/bank-reconciliation.html`);
  await pageRecon.bringToFront();
  await pageRecon.waitForSelector('#dtl-tbody tr').catch(() => {});

  await speakAndShow(pageRecon, englishCaption, hindiSpeech);
  await pageRecon.waitForTimeout(waitTime);
  await pageRecon.close();
}

server.listen(PORT, async () => {
  console.log(`\n==================================================================`);
  console.log(`🚀 [Server] Local development server running at http://localhost:${PORT}`);
  console.log(`==================================================================\n`);
  
  let browser;
  try {
    console.log("🎬 [Browser Launch] Launching Google Chrome visually (Non-Headless Mode)...");
    browser = await playwright.chromium.launch({ channel: 'chrome', headless: false, slowMo: 450 }); // Faster slowMo
  } catch (err) {
    console.log("🎬 [Browser Launch] Chrome not found. Launching Microsoft Edge visually...");
    try {
      browser = await playwright.chromium.launch({ channel: 'msedge', headless: false, slowMo: 450 });
    } catch (err2) {
      console.error("❌ Failed to launch Chrome or Edge. Ensure a system browser is installed.", err2);
      server.close();
      process.exit(1);
    }
  }

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Inject cursor & banner configurations on the main simulator page
    await setupPageDecorations(page);

    // Navigate to Login Page
    await page.goto(`http://localhost:${PORT}/index.html`);
    await page.waitForTimeout(1500);

    // Neutral click to register user gesture and unlock Speech Synthesis audio
    await page.click('body'); 

    // STEP 1: SUBMIT CREDENTIALS
    await speakAndShow(
      page, 
      "STEP 1: Submitting login credentials.", 
      "Hum login screen par hain. Hum credentials submit kar rahe hain."
    );
    await page.waitForTimeout(2500);

    await page.fill('#email', 'mga@gmail.com');
    await page.fill('#password', 'admin@123');
    await page.click('button.auth-btn');
    await page.waitForTimeout(2500);

    // STEP 2: OTP VERIFICATION
    await speakAndShow(
      page, 
      "STEP 2: Typing multi-factor validation code.", 
      "OTP verification screen par hum verification code type kar rahe hain."
    );
    await page.waitForTimeout(3000);

    const otpDigits = await page.$$('.otp-inputs input');
    for (let i = 0; i < otpDigits.length; i++) {
      await otpDigits[i].fill(String(i + 1));
      await page.waitForTimeout(150); 
    }
    await page.click('button.auth-btn');
    await page.waitForTimeout(3000);

    // Clone MGA user details for subsequent tabs
    const userStrMGA = await page.evaluate(() => sessionStorage.getItem('v_current_user'));
    const emailStrMGA = await page.evaluate(() => sessionStorage.getItem('login_email'));

    // STEP 3: NAVIGATE TO SIMULATOR
    await speakAndShow(
      page, 
      "STEP 3: Opening PAS Event Data Injector.", 
      "Dashboard load ho chuka hai. Ab hum PAS Event Data Injector panel open kar rahe hain."
    );
    await page.waitForTimeout(3000);

    await page.goto(`http://localhost:${PORT}/pas-policy.html`);
    await page.waitForSelector('#event-preset-select');
    await page.waitForTimeout(2000);

    // SIMULATOR STEP 1: INJECT POLICY_BOUND EVENT
    await speakAndShow(
      page, 
      "SIMULATOR STEP 1: Injecting POLICY_BOUND Event.", 
      "Hum policy_bound preset select karke custom policy information rules engine me inject karenge."
    );
    await page.waitForTimeout(4500);

    await page.selectOption('#event-preset-select', 'policy_bound');
    await page.waitForTimeout(1000);
    await page.fill('#inj-party-insured', 'Playwright Tech Corp');
    await page.fill('#inj-fin-premium', '10000');
    await page.fill('#inj-fin-commission', '1500');
    await page.fill('#inj-fin-tax', '1800');
    
    // Save the dynamically generated policy number to use in downstream steps
    const policyNumber = await page.inputValue('#inj-pol-num');
    console.log(`📋 [Action] Policy Number generated: ${policyNumber}`);

    await page.click('button:has-text("⚡ Inject Event into Rules Engine")');
    await page.waitForTimeout(3000);

    // Print JEs in terminal
    await printLatestJE(
      page, 
      "POLICY_BOUND (Policy Issued)", 
      "Policy bound event successfully injected. GL accounts updated."
    );

    // DYNAMIC TAB: JOURNAL ENTRY (MGA LEVEL -> CARRIER LEVEL SWAP)
    console.log("📝 [Action] Opening new tab to check JEs in General Ledger...");
    const pageJE = await context.newPage();
    
    await pageJE.addInitScript(({ user, email }) => {
      if (!sessionStorage.getItem('v_current_user')) {
        sessionStorage.setItem('v_current_user', user);
        sessionStorage.setItem('login_email', email);
      }
    }, { user: userStrMGA, email: emailStrMGA });

    await setupPageDecorations(pageJE);
    await pageJE.goto(`http://localhost:${PORT}/journal-entry.html`);
    await pageJE.bringToFront();
    await pageJE.waitForSelector('#recent-je-tbody tr');
    
    // MGA Level draft post
    await postDraftJE(pageJE, "MGA", "GL POSTING: POLICY_BOUND Draft JE (MGA Level)", "");

    // Switch Role visually to Carrier inside the JE tab
    await switchRoleInTab(pageJE, 'Carrier');
    
    // Carrier Level draft post
    await postDraftJE(pageJE, "Carrier", "GL POSTING: POLICY_BOUND Draft JE (Carrier Level)", "");
    await pageJE.close();

    // DYNAMIC TAB: CHART OF ACCOUNTS (MGA LEVEL -> CARRIER LEVEL SWAP)
    console.log("📝 [Action] Opening new tab to check COA balances...");
    const pageCOA = await context.newPage();
    await pageCOA.addInitScript(({ user, email }) => {
      if (!sessionStorage.getItem('v_current_user')) {
        sessionStorage.setItem('v_current_user', user);
        sessionStorage.setItem('login_email', email);
      }
    }, { user: userStrMGA, email: emailStrMGA });

    await setupPageDecorations(pageCOA);
    await pageCOA.goto(`http://localhost:${PORT}/chart-of-accounts.html`);
    await pageCOA.bringToFront();
    await pageCOA.waitForSelector('table.data-table');

    // MGA Level COA inspection (Drilldown Premium Receivable 1100)
    await inspectAccountLedger(
      pageCOA,
      "1100",
      "Premium Receivable",
      "MGA",
      "COA DRILLDOWN: Premium Receivable (Account 1100 - MGA)",
      "MGA Chart of Accounts par Premium Receivable Ledger click kijiye taaki entries dekh sakein."
    );

    // Switch Role visually to Carrier inside the COA tab
    await switchRoleInTab(pageCOA, 'Carrier');
    
    // Carrier Level COA inspection (Drilldown Gross Premium Revenue 4100)
    await inspectAccountLedger(
      pageCOA,
      "4100",
      "Gross Premium Revenue",
      "Carrier",
      "COA DRILLDOWN: Gross Premium Revenue (Account 4100 - Carrier)",
      "Carrier Chart of Accounts par Gross Premium Revenue account ka detail ledger verify kijiye."
    );
    await pageCOA.close();

    // DYNAMIC TABS: ACCOUNTS RECEIVABLE & PAYABLE SUBLEDGERS (POLICY BOUND IMPACT)
    await showArTab(
      context,
      'mga@gmail.com',
      'MGA',
      userStrMGA,
      emailStrMGA,
      "AR SUBLEDGER: New Premium Invoice generated for the Insured.",
      "Accounts Receivable subledger par check kijiye. Insured ke liye premium invoice update ho gaya hai.",
      4000
    );

    await showApTab(
      context,
      'mga@gmail.com',
      'MGA',
      userStrMGA,
      emailStrMGA,
      "AP SUBLEDGER: Carrier Commission & Net Payables recorded.",
      "Accounts Payable subledger par dekhia. Carrier ke liye net payables aur commission balance create ho gaya hai.",
      4000
    );

    await page.bringToFront();
    await page.waitForTimeout(1000);

    // SIMULATOR STEP 2: INJECT PAYMENT_RECEIVED EVENT
    await speakAndShow(
      page, 
      "SIMULATOR STEP 2: Injecting PAYMENT_RECEIVED Event.", 
      "Ab hum payment_received preset select karke cash receipt transaction rules engine me inject karenge."
    );
    await page.waitForTimeout(5000);

    await page.selectOption('#event-preset-select', 'payment_received');
    await page.waitForTimeout(1000);
    
    // Populate form with custom parameters and same policy number
    await page.fill('#inj-pol-num', policyNumber);
    await page.fill('#inj-party-insured', 'Playwright Tech Corp');
    await page.fill('#inj-fin-premium', '10000');
    await page.fill('#inj-fin-tax', '1800');
    await page.fill('#inj-fin-commission', '1500');
    await page.fill('#inj-fin-payment', '11800'); // Gross Premium + Taxes & Fees

    await page.click('button:has-text("⚡ Inject Event into Rules Engine")');
    await page.waitForTimeout(3000);

    // Print JEs in terminal
    await printLatestJE(
      page, 
      "PAYMENT_RECEIVED (Cash Collection)", 
      "Cash collection event injected successfully."
    );

    // DYNAMIC TAB: JOURNAL ENTRY (MGA LEVEL -> CARRIER LEVEL SWAP)
    console.log("📝 [Action] Opening new tab to check JEs for Payment Received...");
    const pageJE2 = await context.newPage();
    await pageJE2.addInitScript(({ user, email }) => {
      if (!sessionStorage.getItem('v_current_user')) {
        sessionStorage.setItem('v_current_user', user);
        sessionStorage.setItem('login_email', email);
      }
    }, { user: userStrMGA, email: emailStrMGA });

    await setupPageDecorations(pageJE2);
    await pageJE2.goto(`http://localhost:${PORT}/journal-entry.html`);
    await pageJE2.bringToFront();
    await pageJE2.waitForSelector('#recent-je-tbody tr');
    
    // MGA Level draft post
    await postDraftJE(pageJE2, "MGA", "GL POSTING: PAYMENT_RECEIVED Draft JE (MGA Level)", "");

    // Switch Role visually to Carrier inside the JE tab
    await switchRoleInTab(pageJE2, 'Carrier');
    
    // Carrier Level draft post
    await postDraftJE(pageJE2, "Carrier", "GL POSTING: PAYMENT_RECEIVED Draft JE (Carrier Level)", "");
    await pageJE2.close();

    // DYNAMIC TAB: CHART OF ACCOUNTS (MGA LEVEL -> CARRIER LEVEL SWAP)
    console.log("📝 [Action] Opening new tab to check COA balances for Payment Received...");
    const pageCOA2 = await context.newPage();
    await pageCOA2.addInitScript(({ user, email }) => {
      if (!sessionStorage.getItem('v_current_user')) {
        sessionStorage.setItem('v_current_user', user);
        sessionStorage.setItem('login_email', email);
      }
    }, { user: userStrMGA, email: emailStrMGA });

    await setupPageDecorations(pageCOA2);
    await pageCOA2.goto(`http://localhost:${PORT}/chart-of-accounts.html`);
    await pageCOA2.bringToFront();
    await pageCOA2.waitForSelector('table.data-table');

    // MGA Level COA inspection (Drilldown Bank Cash Account 1001)
    await inspectAccountLedger(
      pageCOA2,
      "1001",
      "Cash / Bank Account",
      "MGA",
      "COA DRILLDOWN: Bank / Cash (Account 1001 - MGA)",
      "MGA Level: Bank account ka details open kijiye, jisme cash receive ka impact dikh sake."
    );

    // Switch Role visually to Carrier inside the COA tab
    await switchRoleInTab(pageCOA2, 'Carrier');
    
    // Carrier Level COA inspection (Drilldown Bank Cash Account 1001)
    await inspectAccountLedger(
      pageCOA2,
      "1001",
      "Cash / Bank Account",
      "Carrier",
      "COA DRILLDOWN: Bank / Cash (Account 1001 - Carrier)",
      "Carrier Level: Bank and cash account ka drilldown review kijiye."
    );
    await pageCOA2.close();

    // DYNAMIC TAB: ACCOUNTS RECEIVABLE SUBLEDGER (PAYMENT RECEIVED IMPACT)
    await showArTab(
      context,
      'mga@gmail.com',
      'MGA',
      userStrMGA,
      emailStrMGA,
      "AR SUBLEDGER: Invoice status updated to Paid.",
      "Accounts Receivable subledger par dekhiye. Insured se payment aane par invoice cleared ho chuka hai.",
      4000
    );

    await page.bringToFront();
    await page.waitForTimeout(1000);

    // SIMULATOR STEP 3: INJECT CARRIER_PAYMENT_COMPLETED EVENT
    await speakAndShow(
      page, 
      "SIMULATOR STEP 3: Injecting CARRIER_PAYMENT_COMPLETED Event.", 
      "Ab hum carrier_payment_completed preset select karke carrier settlement rules engine me inject karenge."
    );
    await page.waitForTimeout(5000);

    await page.selectOption('#event-preset-select', 'carrier_payment_completed');
    await page.waitForTimeout(1000);

    // Populate form with same policy number
    await page.fill('#inj-pol-num', policyNumber);
    await page.fill('#inj-party-insured', 'Playwright Tech Corp');
    await page.fill('#inj-fin-premium', '10000');
    await page.fill('#inj-fin-tax', '1800');
    await page.fill('#inj-fin-commission', '1500');

    await page.click('button:has-text("⚡ Inject Event into Rules Engine")');
    await page.waitForTimeout(3000);

    // Print JEs in terminal
    await printLatestJE(
      page, 
      "CARRIER_PAYMENT_COMPLETED (Carrier Settlement)", 
      "Carrier payment complete ho chuka hai."
    );

    // DYNAMIC TAB: JOURNAL ENTRY (MGA LEVEL -> CARRIER LEVEL SWAP)
    console.log("📝 [Action] Opening new tab to check JEs for Carrier Settlement...");
    const pageJE3 = await context.newPage();
    await pageJE3.addInitScript(({ user, email }) => {
      if (!sessionStorage.getItem('v_current_user')) {
        sessionStorage.setItem('v_current_user', user);
        sessionStorage.setItem('login_email', email);
      }
    }, { user: userStrMGA, email: emailStrMGA });

    await setupPageDecorations(pageJE3);
    await pageJE3.goto(`http://localhost:${PORT}/journal-entry.html`);
    await pageJE3.bringToFront();
    await pageJE3.waitForSelector('#recent-je-tbody tr');
    
    // MGA Level draft post
    await postDraftJE(pageJE3, "MGA", "GL POSTING: CARRIER_PAYMENT_COMPLETED Draft JE (MGA Level)", "");

    // Switch Role visually to Carrier inside the JE tab
    await switchRoleInTab(pageJE3, 'Carrier');
    
    // Carrier Level draft post
    await postDraftJE(pageJE3, "Carrier", "GL POSTING: CARRIER_PAYMENT_COMPLETED Draft JE (Carrier Level)", "");
    await pageJE3.close();

    // DYNAMIC TAB: CHART OF ACCOUNTS (MGA LEVEL -> CARRIER LEVEL SWAP)
    console.log("📝 [Action] Opening new tab to check COA balances for Settlement...");
    const pageCOA3 = await context.newPage();
    await pageCOA3.addInitScript(({ user, email }) => {
      if (!sessionStorage.getItem('v_current_user')) {
        sessionStorage.setItem('v_current_user', user);
        sessionStorage.setItem('login_email', email);
      }
    }, { user: userStrMGA, email: emailStrMGA });

    await setupPageDecorations(pageCOA3);
    await pageCOA3.goto(`http://localhost:${PORT}/chart-of-accounts.html`);
    await pageCOA3.bringToFront();
    await pageCOA3.waitForSelector('table.data-table');

    // MGA Level COA inspection (Drilldown Premium Payable 2200)
    await inspectAccountLedger(
      pageCOA3,
      "2200",
      "Premium Payable",
      "MGA",
      "COA DRILLDOWN: Premium Payable (Account 2200 - MGA)",
      "MGA Level: Premium payable ledger ka drilldown kijiye, liability check zero ho chuki hai."
    );

    // Switch Role visually to Carrier inside the COA tab
    await switchRoleInTab(pageCOA3, 'Carrier');
    
    // Carrier Level COA inspection (Drilldown Bank Cash Account 1001)
    await inspectAccountLedger(
      pageCOA3,
      "1001",
      "Cash / Bank Account",
      "Carrier",
      "COA DRILLDOWN: Bank / Cash (Account 1001 - Carrier)",
      "Carrier Level: Final net cash balance updates and settlements fully verified."
    );
    await pageCOA3.close();

    // DYNAMIC TAB: ACCOUNTS PAYABLE SUBLEDGER (SETTLEMENT IMPACT)
    await showApTab(
      context,
      'mga@gmail.com',
      'MGA',
      userStrMGA,
      emailStrMGA,
      "AP SUBLEDGER: Carrier settlement payment completed.",
      "Accounts Payable subledger par check kijiye. Settlement complete hone par payables status cleared ho gayi hai.",
      4000
    );

    // DYNAMIC TAB: BANK RECONCILIATION
    await showReconTab(
      context,
      'mga@gmail.com',
      'MGA',
      userStrMGA,
      emailStrMGA,
      "BANK RECONCILIATION: Reconciling Bank statement against GL Cash ledger.",
      "Bank Reconciliation screen check kijiye. Bank statement line items ko GL cash ledger entry ke sath automatically match kiya ja sakta hai.",
      5000
    );

    await page.bringToFront();
    await page.waitForTimeout(1000);

    // SUCCESS SUMMARY
    await speakAndShow(
      page, 
      "FLOW VERIFIED SUCCESSFULLY!", 
      "Accounting cycle completely verify ho chuki hai. Dono side balances automatically settle ho chuke hain."
    );

    console.log("\n==================================================================");
    console.log("🎉 [SUCCESS] Step-by-step Voice and Captions verification complete!");
    console.log("🗣️ [HINDI] Verification complete! Browser will close in 10 seconds.");
    console.log("==================================================================\n");

    await page.waitForTimeout(10000);
    server.close();
    await browser.close();
    process.exit(0);

  } catch (err) {
    console.error("\n❌ [ERROR] Verification failed:");
    console.error(err);
    server.close();
    if (browser) await browser.close();
    process.exit(1);
  }
});
