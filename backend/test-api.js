// Automated Verification Test for StudySpace Backend
const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting StudySpace Backend & Overlap Tests...\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Testing Health Check...');
    const health = await fetch(`${BASE_URL}/api/health`).then(r => r.json());
    console.log('   ✅ Health Check passed:', health.status);

    // 2. Student Login
    console.log('2️⃣ Testing Student Login...');
    const studentLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex@university.edu', password: 'password123' })
    }).then(r => r.json());

    if (!studentLogin.token) throw new Error('Student login failed: ' + JSON.stringify(studentLogin));
    console.log(`   ✅ Logged in as ${studentLogin.user.name} (${studentLogin.user.role})`);
    const studentToken = studentLogin.token;

    // 3. Admin Login
    console.log('3️⃣ Testing Admin Login...');
    const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@studyspace.com', password: 'password123' })
    }).then(r => r.json());

    if (!adminLogin.token) throw new Error('Admin login failed');
    console.log(`   ✅ Logged in as Admin: ${adminLogin.user.name}`);

    // 4. Fetch Spaces
    console.log('4️⃣ Testing Fetch Study Spaces...');
    const spaces = await fetch(`${BASE_URL}/api/spaces`).then(r => r.json());
    console.log(`   ✅ Found ${spaces.length} study spaces. First space: "${spaces[0].name}"`);

    // 5. Fetch Seats
    console.log('5️⃣ Testing Fetch Seats for Space 1...');
    const seats = await fetch(`${BASE_URL}/api/spaces/1/seats`).then(r => r.json());
    console.log(`   ✅ Found ${seats.length} seats in Space 1.`);
    const testSeatId = seats[1].id; // Let's use seat A2 (index 1)

    // 6. Overlap Testing on Seat A2
    const testDate = '2026-10-01'; // future date to avoid conflicts with demo data
    console.log(`\n6️⃣ ⚡ CRITICAL TEST: Double-Booking & Overlap Engine on Seat ID ${testSeatId}...`);

    // Step A: First booking: 10:00 -> 12:00
    console.log('   👉 Attempting Booking 1: 10:00 - 12:00 (Should SUCCEED)...');
    const b1 = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        seat_id: testSeatId,
        reservation_date: testDate,
        start_time: '10:00:00',
        end_time: '12:00:00'
      })
    });
    const b1Data = await b1.json();
    if (b1.status !== 201) throw new Error('Booking 1 failed: ' + JSON.stringify(b1Data));
    console.log('   ✅ Booking 1 confirmed (ID: ' + b1Data.reservation.id + ')');

    // Step B: Overlapping booking attempt: 11:00 -> 13:00 (MUST BE REJECTED)
    console.log('   👉 Attempting Overlapping Booking: 11:00 - 13:00 (Should REJECT with 409)...');
    const b2 = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        seat_id: testSeatId,
        reservation_date: testDate,
        start_time: '11:00:00',
        end_time: '13:00:00'
      })
    });
    const b2Data = await b2.json();
    if (b2.status === 409) {
      console.log('   ✅ SUCCESS! Overlap correctly rejected with 409 Conflict:', b2Data.error);
    } else {
      throw new Error('❌ FAILURE! Overlap was NOT rejected. Status: ' + b2.status);
    }

    // Step C: Back-to-back booking attempt: 12:00 -> 14:00 (MUST BE ALLOWED)
    console.log('   👉 Attempting Back-to-Back Booking: 12:00 - 14:00 (Should SUCCEED)...');
    const b3 = await fetch(`${BASE_URL}/api/reservations`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        seat_id: testSeatId,
        reservation_date: testDate,
        start_time: '12:00:00',
        end_time: '14:00:00'
      })
    });
    const b3Data = await b3.json();
    if (b3.status === 201) {
      console.log('   ✅ SUCCESS! Back-to-back booking allowed (ID: ' + b3Data.reservation.id + ')');
    } else {
      throw new Error('❌ FAILURE! Back-to-back was rejected: ' + JSON.stringify(b3Data));
    }

    // 7. Test Fetch My Reservations
    console.log('\n7️⃣ Testing Fetch Student Reservations (/api/reservations/my)...');
    const myRes = await fetch(`${BASE_URL}/api/reservations/my`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    }).then(r => r.json());
    console.log(`   ✅ Student has ${myRes.length} total reservations.`);

    // 8. Test Cancellation
    console.log('8️⃣ Testing Reservation Cancellation...');
    const cancelRes = await fetch(`${BASE_URL}/api/reservations/${b1Data.reservation.id}/cancel`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    }).then(r => r.json());
    console.log('   ✅ Reservation status after cancel:', cancelRes.reservation.status);

    console.log('\n=========================================');
    console.log('🎉 ALL BACKEND & OVERLAP TESTS PASSED 100%');
    console.log('=========================================');

  } catch (err) {
    console.error('\n❌ Test run failed:', err);
    process.exit(1);
  }
}

runTests();
