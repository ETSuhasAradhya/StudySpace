# StudySpace – Viva & Technical Defense Cheat Sheet
### Concise Q&A Guide for 2nd-Year CSE University Evaluation

Use this cheat sheet to confidently answer examiner questions during your project demonstration.

---

### Q1: Why did you choose PostgreSQL over a NoSQL database like MongoDB?
> **Answer**:  
> "A library reservation system requires **strict ACID transactions** and relational integrity. If two students attempt to reserve the same desk simultaneously, a relational database allows us to perform atomic interval checks (`FOR UPDATE` locking) and enforce foreign key constraints (`user_id -> users.id`, `seat_id -> seats.id`). In NoSQL document stores, preventing time-window race conditions without native multi-document relational constraints requires complex application-level mutexes."

---

### Q2: How does the system prevent double-booking or overlapping reservations?
> **Answer**:  
> "We implement the mathematical interval overlap formula inside the SQL query:  
> `(existing.start_time < new.end_time AND existing.end_time > new.start_time)` on the same seat and date.  
> If an overlapping confirmed reservation is found, the backend rejects the request with an **HTTP 409 Conflict** error. Back-to-back reservations (e.g., 10:00–12:00 and 12:00–14:00) are explicitly permitted because $12:00 > 12:00$ is false."

---

### Q3: How does JWT (JSON Web Token) authentication work in your application?
> **Answer**:  
> "StudySpace uses **stateless authentication**. Upon successful credential verification, the backend signs a JWT using the HMAC SHA-256 (`HS256`) algorithm with a private secret key. The token payload contains the student's `id`, `email`, and `role`. The frontend stores this token in `localStorage` and includes it in the `Authorization: Bearer <token>` HTTP header for protected routes. The backend verifies the cryptographic signature on each request without querying the users table."

---

### Q4: How are passwords stored and secured?
> **Answer**:  
> "Passwords are never stored in plaintext. We use `bcryptjs` with **10 salt rounds**. The salt is a random cryptographic sequence generated prior to hashing, which prevents rainbow table attacks. Even if two students choose the same password, their generated password hashes will be completely different."

---

### Q5: What is the purpose of composite B-tree indexes in your schema?
> **Answer**:  
> "We created an index `idx_reservations_seat_date ON reservations(seat_id, reservation_date, status)`. Without an index, the database engine would execute a full table scan ($O(N)$) across all historical reservations to check availability. With this composite index, the database performs a logarithmic search ($O(\log N)$), ensuring that checking seat availability remains sub-millisecond even with hundreds of thousands of bookings."

---

### Q6: How does the visual floorplan UI render seat availability?
> **Answer**:  
> "When the user changes the calendar date or start/end time in the React interface, a `GET /api/spaces/:id/seats?date=...&start_time=...&end_time=...` query is dispatched. The SQL query performs a `LEFT JOIN` between `seats` and `reservations` filtered by the selected time slot. The backend returns an array of desks where each object contains an `is_reserved` boolean flag. The React component maps these to CSS classes (`available` 🟢, `reserved` 🔴, `selected` 🔵)."

---

### Q7: What are the distinct zones across the 4 floors in Central Library?
> **Answer**:  
> 1. **Floor 1 – Main Reading Hall (40 Desks)**: High-traffic reading hall with 9 grand study tables, circulation help desk, and main entrance turnstiles.
> 2. **Floor 2 – Collaborative Commons (32 Desks)**: 6 team tables, dual-monitor high-speed tech bar (`BAR-1` to `BAR-8`), and discussion lounge.
> 3. **Floor 3 – Silent Study & Research (40 Desks)**: 8 single-seated private study carrels along the West wall + 8 silent tables + 3-bay spanning reference bookshelf.
> 4. **Floor 4 – Deep Focus & Penthouse Pods (44 Desks)**: 12 solo acoustic focus pods on the West wall + 8 thesis tables + 3-bay hardcover thesis archive stacks.

---

### Q8: How is the application deployed to the cloud?
> **Answer**:  
> "The system utilizes a modern decoupled cloud architecture:
> - **Frontend**: Hosted on **Vercel** with client-side SPA routing (`vercel.json`).
> - **Backend**: Hosted on **Render** as a Node.js web service (`render.yaml`).
> - **Database**: Hosted on **Neon Serverless PostgreSQL** with SSL-encrypted pooling."
