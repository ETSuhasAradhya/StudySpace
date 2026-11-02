import http from 'http';

const TARGET_URL = process.env.TARGET_URL || 'http://localhost:8000/api/spaces/1/seats';
const TOTAL_REQUESTS = parseInt(process.env.TOTAL_REQUESTS || '1000', 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '20', 10);

async function runBenchmark() {
  console.log(`=======================================================`);
  console.log(`🚀 StudySpace Cloud Benchmark (BACSE344 DA-3 Q1b)`);
  console.log(`🎯 Target API:     ${TARGET_URL}`);
  console.log(`📦 Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`⚡ Concurrency:    ${CONCURRENCY}`);
  console.log(`=======================================================\n`);

  const url = new URL(TARGET_URL);
  let completed = 0;
  let active = 0;
  let sent = 0;

  const latencies = [];
  const statusCodes = {};
  const instanceDistribution = {};

  const startTime = Date.now();

  return new Promise((resolve) => {
    function dispatchNext() {
      if (completed >= TOTAL_REQUESTS) {
        return;
      }

      while (active < CONCURRENCY && sent < TOTAL_REQUESTS) {
        sent++;
        active++;
        sendRequest();
      }
    }

    function sendRequest() {
      const reqStart = process.hrtime.bigint();

      const options = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'Connection': 'keep-alive',
          'Accept': 'application/json'
        },
        timeout: 10000
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          const reqEnd = process.hrtime.bigint();
          const latencyMs = Number(reqEnd - reqStart) / 1e6;
          latencies.push(latencyMs);

          // Track HTTP status
          statusCodes[res.statusCode] = (statusCodes[res.statusCode] || 0) + 1;

          // Track backend instance header
          const instance = res.headers['x-backend-instance'] || 'unknown';
          instanceDistribution[instance] = (instanceDistribution[instance] || 0) + 1;

          active--;
          completed++;

          if (completed % 200 === 0 || completed === TOTAL_REQUESTS) {
            console.log(`⏳ Progress: ${completed}/${TOTAL_REQUESTS} requests (${Math.round((completed / TOTAL_REQUESTS) * 100)}%)`);
          }

          if (completed >= TOTAL_REQUESTS) {
            finish();
          } else {
            dispatchNext();
          }
        });
      });

      req.on('error', (err) => {
        const reqEnd = process.hrtime.bigint();
        const latencyMs = Number(reqEnd - reqStart) / 1e6;
        latencies.push(latencyMs);

        statusCodes['ERR_' + err.code] = (statusCodes['ERR_' + err.code] || 0) + 1;
        active--;
        completed++;

        if (completed >= TOTAL_REQUESTS) {
          finish();
        } else {
          dispatchNext();
        }
      });

      req.end();
    }

    function finish() {
      const totalTimeMs = Date.now() - startTime;
      const totalTimeSec = totalTimeMs / 1000;
      const rps = (completed / totalTimeSec).toFixed(2);

      latencies.sort((a, b) => a - b);
      const sum = latencies.reduce((acc, v) => acc + v, 0);
      const avgLatency = (sum / latencies.length).toFixed(2);
      const minLatency = latencies[0]?.toFixed(2);
      const p50 = latencies[Math.floor(latencies.length * 0.5)]?.toFixed(2);
      const p90 = latencies[Math.floor(latencies.length * 0.9)]?.toFixed(2);
      const p95 = latencies[Math.floor(latencies.length * 0.95)]?.toFixed(2);
      const p99 = latencies[Math.floor(latencies.length * 0.99)]?.toFixed(2);
      const maxLatency = latencies[latencies.length - 1]?.toFixed(2);

      console.log(`\n\n📊 BENCHMARK RESULTS:`);
      console.log(`-------------------------------------------------------`);
      console.log(`⏱️  Total Duration:         ${totalTimeSec.toFixed(2)} seconds`);
      console.log(`⚡ Throughput (RPS):       ${rps} req/sec`);
      console.log(`📈 Average Latency:        ${avgLatency} ms`);
      console.log(`📉 Min Latency:            ${minLatency} ms`);
      console.log(`📊 p50 (Median) Latency:   ${p50} ms`);
      console.log(`📊 p90 Latency:            ${p90} ms`);
      console.log(`📊 p95 Latency:            ${p95} ms`);
      console.log(`📊 p99 Latency:            ${p99} ms`);
      console.log(`⚠️  Max Latency:            ${maxLatency} ms`);
      console.log(`-------------------------------------------------------`);
      console.log(`📋 Status Codes:`, statusCodes);
      console.log(`🔀 Load Balancer Distribution:`, instanceDistribution);
      console.log(`=======================================================\n`);

      resolve({
        totalRequests: completed,
        concurrency: CONCURRENCY,
        durationSec: Number(totalTimeSec.toFixed(2)),
        rps: Number(rps),
        avgLatencyMs: Number(avgLatency),
        p95LatencyMs: Number(p95),
        maxLatencyMs: Number(maxLatency),
        statusCodes,
        instanceDistribution
      });
    }

    dispatchNext();
  });
}

runBenchmark().catch(console.error);
