const WebSocket = require('ws');
const fs = require('fs');

const wsUrl = 'ws://localhost:9222/devtools/page/B8A05B10CAA7411C40EBB2C5018ED3F0';
const logFile = 'C:\\Users\\acer\\.gemini\\antigravity-ide\\brain\\017daeb9-00d7-4c2e-a9dc-9d84b38cca08\\scratch\\chrome-debug.log';

const log = (msg) => {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
};

if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}

log('Connecting to Chrome remote debugger...');
const ws = new WebSocket(wsUrl);

let id = 1;
const send = (method, params = {}) => {
  const msg = JSON.stringify({ id: id++, method, params });
  ws.send(msg);
};

ws.on('open', () => {
  log('Connected!');
  
  // Enable Runtime and Page domains
  send('Runtime.enable');
  send('Page.enable');

  // Clear nav_logs
  setTimeout(() => {
    log('Clearing old nav_logs...');
    send('Runtime.evaluate', { expression: "localStorage.removeItem('nav_logs')" });
  }, 500);

  // 1. Navigate to base dashboard
  setTimeout(() => {
    log('Navigating page to base dashboard...');
    send('Page.navigate', { url: 'http://localhost:3000/muzakki-dashboard' });
  }, 1000);

  // 2. Wait for page load, then click the "Riwayat & BSZ" sidebar link
  setTimeout(() => {
    log('Clicking "Riwayat & BSZ" link in sidebar...');
    // In CDP, we can click using JavaScript evaluation
    // Let's find the link that contains text "Riwayat & BSZ" and click it
    const jsClick = `
      (function() {
        const links = Array.from(document.querySelectorAll('a'));
        const link = links.find(el => el.textContent.includes('Riwayat & BSZ'));
        if (link) {
          link.click();
          return 'Clicked link: ' + link.href;
        }
        return 'Link not found!';
      })()
    `;
    send('Runtime.evaluate', { expression: jsClick });
  }, 4000);

  // 3. Wait 3 seconds, then evaluate the URL and logs
  setTimeout(() => {
    log('Evaluating page state after click...');
    send('Runtime.evaluate', { expression: 'window.location.href' });
    send('Runtime.evaluate', { expression: "localStorage.getItem('nav_logs')" });
  }, 7000);
});

ws.on('message', (data) => {
  const response = JSON.parse(data.toString());
  
  if (response.id) {
    if (response.result && response.result.result) {
      const val = response.result.result.value;
      log(`[RESPONSE ${response.id}] ${JSON.stringify(val)}`);
    } else {
      log(`[RESPONSE ${response.id}] ${JSON.stringify(response.result)}`);
    }
  } else {
    if (response.method === 'Runtime.consoleAPICalled') {
      const text = response.params.args.map(a => a.value).join(' ');
      log(`[BROWSER CONSOLE] ${text}`);
    }
  }
});

ws.on('error', (err) => {
  log(`[WS ERROR] ${err.message}`);
});

// Close websocket after 11 seconds
setTimeout(() => {
  log('Closing connection.');
  ws.close();
}, 11000);
