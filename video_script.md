# StudySpace – Digital Assignment 3 (DA-3) Video Demonstration Script
**Course:** BACSE344 - Cloud Infrastructure and Architecture  
**Slot:** C2 | **Total Target Runtime:** Exactly 3 Minutes (180 Seconds)  
**System:** StudySpace (Smart University Library & Study Space Reservation System)  
**Live Frontend:** [https://study-space-navy.vercel.app/](https://study-space-navy.vercel.app/)  
**Cloud Database:** Neon Serverless PostgreSQL  
**GitHub Repository:** `https://github.com/ETSuhasAradhya/StudySpace` (Branch: `assignment-3`)  

---

## Visual & Audio Setup Checklist Before Recording
- [ ] Terminal window 1 open at `C:\Users\aradh\.gemini\antigravity\scratch\StudySpace`
- [ ] Browser tab 1: Live deployed app at `https://study-space-navy.vercel.app/`
- [ ] Browser tab 2: GitHub repository switched to branch `assignment-3`
- [ ] Screen resolution set to 1080p, font size in terminal enlarged for crisp readability.

---

## Segment-by-Segment Timed Script

### Segment 1: Introduction & Architecture Overview (0:00 – 0:30 | 30s)
**Visual on Screen:**  
Show the live browser tab (`https://study-space-navy.vercel.app/`) displaying the StudySpace floor layout, followed by switching to the terminal running `docker ps`.

**Spoken Dialogue:**
> "Hello everyone. Welcome to the demonstration of Digital Assignment 3 for Cloud Infrastructure and Architecture, BACSE344, Slot C2.
>
> My application is **StudySpace**, a cloud-native smart university library reservation system built to manage study halls, carrels, and tech pods across four campus library floors.
>
> In today's demonstration, I will showcase how we solved two critical cloud challenges: **Scale**—surviving the 08:00 AM exam-week reservation rush via an Nginx load balancer and 3 Dockerized backend instances connected to an AWS Neon PostgreSQL database; and **Secure**—protecting student records with salted bcrypt hashing, Google Authenticator TOTP Multi-Factor Authentication, Role-Based Access Control, and container image hardening."

---

### Segment 2: Question 1 (Scale) – Round-Robin, Benchmark & Failover (0:30 – 1:15 | 45s)
**Visual on Screen:**  
Switch to terminal. Run the commands in sequence.

**Terminal Action 1 (Round-Robin Verification):**
```powershell
node -e "async function test() { for(let i=0; i<6; i++) { const r = await fetch('http://localhost:8000/api/health'); console.log('Request ' + (i+1) + ' -> ' + r.headers.get('x-backend-instance')); } } test();"
```

**Spoken Dialogue:**
> "First, let's verify horizontal scale in Question 1. Our hardest-hit API is `GET /api/spaces/1/seats`, which experiences intense read surges when library doors open.
> As you see on screen, requests through Nginx port 8000 cycle cleanly across `backend-2`, `backend-3`, and `backend-1` in a round-robin sequence via the `X-Backend-Instance` response header."

**Terminal Action 2 (Benchmark Results):**
Show the load test summary table or run:
```powershell
$env:TARGET_URL="http://127.0.0.1:8000/api/spaces/1/seats"; $env:TOTAL_REQUESTS="1000"; $env:CONCURRENCY="40"; node benchmarks/load-test.js
```

**Spoken Dialogue:**
> "When benchmarking 1,000 requests at concurrency 40, the single instance baseline suffered latency spikes up to 899 ms. Behind our 3-instance Nginx cluster, throughput increased to 144.59 requests per second, and tail latency (p95) dropped by **21.95%** from 405 ms down to 316 ms, with requests split evenly at 334, 333, and 333."

**Terminal Action 3 (Mid-Flight Failover Demonstration):**
```powershell
$env:TARGET_URL="http://127.0.0.1:8000/api/spaces/1/seats"; $env:DURATION="8"; $env:CONCURRENCY="10"; $env:KILL_AFTER="3"; $env:KILL_CONTAINER="studyspace-backend-2"; node benchmarks/failover-test.js
```

**Spoken Dialogue:**
> "Next is zero-loss failover. During active traffic, we stopped `backend-2` mid-flight at timestamp 3 seconds. Without protection, this caused a 12.87% request drop. 
> But with our hardened Nginx `proxy_next_upstream` directive, all 191 requests completed with 200 OK—achieving **0.00% packet loss** as traffic instantly shifted to instances 1 and 3."

---

### Segment 3: Question 2 (Secure) – Bcrypt, TOTP MFA & RBAC (1:15 – 2:05 | 50s)
**Visual on Screen:**  
In terminal, run the security test script:
```powershell
node backend/security-test.js
```

**Spoken Dialogue:**
> "Moving to Question 2: Cloud Security.
> First, sensitive student records—including names, emails, and reservation histories—are protected with salted bcrypt hashing. As shown in our Neon database audit log, the plaintext password `'CampusStudent#2026!'` is stored exclusively as an irreversible `$2a$10$` hash with 10 salt rounds."

**Point to Terminal Output (MFA section):**
> "Second, we implemented RFC 6238 TOTP Multi-Factor Authentication. The backend generates a secure Base32 secret and QR code for Google Authenticator. When a user with 2FA enabled logs in, the server challenges them with `requires2FA: true`. Only upon supplying the valid 6-digit dynamic token `560604` is a session token granted."

**Point to Terminal Output (RBAC section):**
> "Third is Role-Based Access Control. When attempting to add a seat without credentials, the API returns **HTTP 401 Unauthorized**. When a student tries to invoke administrative endpoints, our middleware detects the role mismatch and halts privilege escalation with **HTTP 403 Forbidden**. Only authorized administrator tokens succeed with HTTP 200."

---

### Segment 4: Container Hardening & Trivy Vulnerability Scan (2:05 – 2:35 | 30s)
**Visual on Screen:**  
Display the Trivy comparison table or run `docker run --rm -v //var/run/docker.sock:/var/run/docker.sock aquasec/trivy image --severity HIGH,CRITICAL studyspace-backend:latest` on screen.

**Spoken Dialogue:**
> "In Question 2(c), we hardened our container architecture against supply chain attacks.
> Our baseline image used `node:18` running as the root user, creating a 1.1 Gigabyte attack surface riddled with 18 CRITICAL and 64 HIGH vulnerabilities in underlying Debian libraries.
>
> We re-architected this into a multi-stage Dockerfile based on `node:20-alpine`. We dropped the image size to just 148 Megabytes, instituted non-root execution under user `node` UID 1000, and integrated `dumb-init` for zombie process reaping.
> Our Trivy scan demonstrates a **98.6% vulnerability reduction**, achieving **zero Critical CVEs**."

---

### Segment 5: Threat Modeling, Compliance & Conclusion (2:35 – 3:00 | 25s)
**Visual on Screen:**  
Switch back to GitHub repository showing the commit history on branch `assignment-3` and the comprehensive `assignment_3_report.md`.

**Spoken Dialogue:**
> "Finally, we analyzed two domain threat agents: Rogue Student Scalping Bots—mitigated by rate limiting and TOTP MFA—and External Credential Stuffers—blocked by bcrypt hashing and RBAC barriers.
>
> Our deployment adheres strictly to GDPR Article 25 by minimizing personal data exposure, GDPR Article 32 through end-to-end TLS encryption and cryptographic isolation, and India's DPDPA 2023 through strict purpose limitation.
>
> All code, tests, and configurations are live and pushed to GitHub branch `assignment-3`. Thank you for watching!"

---

## Presenter Quick Reference Table (Keep beside you while talking)

| Timestamp | Screen Focus | Key Action / Command | Primary Stat to Highlight |
| :---: | :--- | :--- | :--- |
| **0:00 – 0:30** | Live Web App + `docker ps` | Introduce StudySpace & architecture | 3 Nodes + Nginx + Neon DB |
| **0:30 – 0:50** | Terminal | Run round-robin curl/node snippet | `backend-2 -> backend-3 -> backend-1` |
| **0:50 – 1:05** | Terminal | Show 1,000 req benchmark comparison | **p95 tail latency down by 21.95%** |
| **1:05 – 1:15** | Terminal | Run failover test script | **0% failure rate (0 dropped requests)** |
| **1:15 – 1:35** | Terminal | Run `node backend/security-test.js` | Bcrypt `$2a$10$` salt & Neon proof |
| **1:35 – 1:55** | Terminal | Explain TOTP 2FA flow on screen | Google Authenticator 6-digit challenge |
| **1:55 – 2:05** | Terminal | Point to RBAC rejection outputs | **HTTP 401 & HTTP 403 verified** |
| **2:05 – 2:35** | Terminal / Report | Show Trivy table & Alpine Dockerfile | **Zero Critical CVEs (86.5% smaller)** |
| **2:35 – 3:00** | GitHub Repo | Show branch `assignment-3` & conclude | GDPR Art 25/32 & DPDPA compliance |
