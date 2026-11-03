const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const dist = path.resolve('C:/Users/aradh/.gemini/antigravity/scratch/StudySpace/frontend/dist');
const workspace = path.resolve('C:/Users/aradh/.gemini/antigravity/scratch/StudySpace');

const adminSession = JSON.parse(fs.readFileSync(path.join(workspace, 'admin_session.json'), 'utf-8'));
const studentSession = JSON.parse(fs.readFileSync(path.join(workspace, 'student_session.json'), 'utf-8'));

const mimes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, 'http://127.0.0.1:5173');
  const pathname = parsedUrl.pathname;

  // Proxy /api to Nginx on 8000
  if (pathname.startsWith('/api')) {
    const proxy = http.request({
      hostname: '127.0.0.1',
      port: 8000,
      path: req.url,
      method: req.method,
      headers: req.headers
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });
    proxy.on('error', (err) => {
      res.writeHead(502);
      res.end(JSON.stringify({ error: err.message }));
    });
    req.pipe(proxy);
    return;
  }

  // Serve static files
  let file = path.join(dist, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(file)) file = path.join(dist, 'index.html');

  let data = fs.readFileSync(file);
  if (file.endsWith('index.html')) {
    const mode = parsedUrl.searchParams.get('mode') || 'student';
    const tab = parsedUrl.searchParams.get('tab') || '';
    let script = '';

    if (mode === 'admin') {
      script = `
      <script>
        localStorage.setItem('studyspace_user', JSON.stringify(${JSON.stringify(adminSession.user)}));
        localStorage.setItem('studyspace_token', ${JSON.stringify(adminSession.token)});
        window.addEventListener('load', () => {
          setTimeout(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const target = btns.find(b => b.textContent.includes('Verification') || b.textContent.includes('Admin'));
            if (target && '${tab}' === 'verification') target.click();
          }, 800);
        });
      </script>
      `;
    } else if (mode === 'student') {
      script = `
      <script>
        localStorage.setItem('studyspace_user', JSON.stringify(${JSON.stringify(studentSession.user)}));
        localStorage.setItem('studyspace_token', ${JSON.stringify(studentSession.token)});
      </script>
      `;
    } else {
      script = `<script>localStorage.clear();</script>`;
    }

    data = Buffer.from(data.toString('utf-8').replace('<head>', '<head>' + script));
  }

  res.writeHead(200, { 'Content-Type': mimes[path.extname(file)] || 'application/octet-stream' });
  res.end(data);
});

server.listen(5173, async () => {
  console.log('Capture server running on port 5173');

  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const userDir = 'C:\\Users\\aradh\\.gemini\antigravity\\scratch\\StudySpace\\.tmp-chrome-realapp';

  const jobs = [
    {
      file: 'real_app_01_seatmap.png',
      url: 'http://127.0.0.1:5173/?mode=student'
    },
    {
      file: 'real_app_02_admin_verification.png',
      url: 'http://127.0.0.1:5173/?mode=admin&tab=verification'
    },
    {
      file: 'real_app_03_login.png',
      url: 'http://127.0.0.1:5173/?mode=login'
    }
  ];

  for (const job of jobs) {
    const out = path.join(workspace, job.file);
    console.log(`Capturing ${job.file} from ${job.url}...`);

    await new Promise((resolve) => {
      const child = spawn(chromePath, [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=1400,900',
        `--user-data-dir=${userDir}`,
        `--screenshot=${out}`,
        job.url
      ]);
      child.on('close', resolve);
    });

    console.log(`Saved: ${out}`);
  }

  server.close(() => {
    console.log('All real app screenshots captured successfully!');
    process.exit(0);
  });
});
