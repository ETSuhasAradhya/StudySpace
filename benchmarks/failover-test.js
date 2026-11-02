import http from 'http';
import { execSync } from 'child_process';

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:8000/api/spaces/1/seats';
const DURATION_SECONDS = parseInt(process.env.DURATION || '15', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '15', 10);
const AUTO_KILL_SECONDS = parseInt(process.env.KILL_AFTER || '4', 10);
const CONTAINER_TO_KILL = process.env.KILL_CONTAINER || 'studyspace-backend-2';

async function runFailoverTest() {
  console.log(`=======================================================`);
  console.log(`🧪 StudySpace High-Availability Failover Test (DA-3 Q1c)`);
  console.log(`🎯 Target API:           ${TARGET_URL}`);
  console.log(`⏱️ Duration:             ${DURATION_SECONDS} seconds`);
  console.log(`⚡ Concurrency:          ${CONCURRENCY}`);
  console.log(`💥 Mid-flight Stop Target: ${CONTAINER_TO_KILL} (at T=${AUTO_KILL_SECONDS}s)`);
  console.log(`=======================================================\n`);

  const url = new URL(TARGET_URL);
  let totalRequests = 0;
  let successCount = 0;
  let failureCount = 0;
  const statusCodes = {};
  const instanceDistribution = {};
  let killed = false;

  const startTime = Date.now();
  const endTime = startTime + DURATION_SECONDS * 1000;

  // Schedule container kill mid-flight
  if (AUTO_KILL_SECONDS > 0) {
    setTimeout(() => {
      try {
        console.log(`\n\n🚨 [INJECTING FAILURE]: Stopping container ${CONTAINER_TO_KILL} now...`);
        execSync(`docker stop ${CONTAINER_TO_KILL}`, { stdio: 'ignore' });
        killed = true;
        console.log(`💥 Container ${CONTAINER_TO_KILL} stopped! Monitoring Nginx failover...\n`);
      } catch (err) {
        console.error(`⚠️ Could not stop container: ${err.message}`);
      }
    }, AUTO_KILL_SECONDS * 1000);
  }

  return new Promise((resolve) => {
    let running = 0;

    function sendOne() {
      if (Date.now() >= endTime) {
        if (running === 0) finish();
        return;
      }

      running++;
      totalRequests++;

      const options = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: 'GET',
        headers: { 'Connection': 'keep-alive' },
        timeout: 4000
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          running--;
          statusCodes[res.statusCode] = (statusCodes[res.statusCode] || 0) + 1;

          if (res.statusCode >= 200 && res.statusCode < 400) {
            successCount++;
            const instance = res.headers['x-backend-instance'] || 'unknown';
            instanceDistribution[instance] = (instanceDistribution[instance] || 0) + 1;
          } else {
            failureCount++;
          }

          if (totalRequests % 50 === 0) {
            console.log(`⚡ Requests: ${totalRequests} | 🟢 Success: ${successCount} | 🔴 Failures: ${failureCount}`);
          }

          if (Date.now() < endTime) {
            sendOne();
          } else if (running === 0) {
            finish();
          }
        });
      });

      req.on('timeout', () => {
        req.destroy(new Error('TIMEOUT'));
      });

      req.on('error', (err) => {
        running--;
        failureCount++;
        const errKey = err.message === 'TIMEOUT' ? 'ERR_TIMEOUT' : ('ERR_' + (err.code || 'UNKNOWN'));
        statusCodes[errKey] = (statusCodes[errKey] || 0) + 1;

        if (totalRequests % 50 === 0) {
          console.log(`⚡ Requests: ${totalRequests} | 🟢 Success: ${successCount} | 🔴 Failures: ${failureCount}`);
        }

        if (Date.now() < endTime) {
          sendOne();
        } else if (running === 0) {
          finish();
        }
      });

      req.end();
    }

    // Launch initial concurrent workers
    for (let i = 0; i < CONCURRENCY; i++) {
      sendOne();
    }

    function finish() {
      const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
      const failPercent = ((failureCount / (totalRequests || 1)) * 100).toFixed(2);

      console.log(`\n\n=======================================================`);
      console.log(`📋 FAILOVER EXPERIMENT SUMMARY:`);
      console.log(`-------------------------------------------------------`);
      console.log(`⏱️ Elapsed Time:             ${elapsedSec}s`);
      console.log(`📦 Total Requests Dispatched: ${totalRequests}`);
      console.log(`🟢 Successful Requests (200): ${successCount}`);
      console.log(`🔴 Failed Requests:           ${failureCount} (${failPercent}%)`);
      console.log(`📊 HTTP Status Breakdown:    `, statusCodes);
      console.log(`🔀 Active Instances:         `, instanceDistribution);
      console.log(`=======================================================\n`);

      resolve({
        totalRequests,
        successCount,
        failureCount,
        failPercent: Number(failPercent),
        statusCodes,
        instanceDistribution
      });
    }
  });
}

runFailoverTest().catch(console.error);
