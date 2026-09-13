-- ==========================================================
-- StudySpace Database Schema - Central Library (4 Floors)
-- Compatible with PostgreSQL 13+ & Neon Cloud PostgreSQL
-- ==========================================================

DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS study_spaces CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. STUDY SPACES (The 4 Floors of Central Library)
CREATE TABLE study_spaces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    description TEXT,
    capacity INT DEFAULT 40,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. SEATS TABLE
CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    space_id INT NOT NULL REFERENCES study_spaces(id) ON DELETE CASCADE,
    seat_number VARCHAR(20) NOT NULL,
    has_power_outlet BOOLEAN DEFAULT true,
    is_corner_seat BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_seat_per_space UNIQUE (space_id, seat_number)
);

-- 4. RESERVATIONS TABLE
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seat_id INT NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time_window CHECK (end_time > start_time)
);

CREATE INDEX idx_reservations_seat_date ON reservations(seat_id, reservation_date, status);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_seats_space ON seats(space_id);

-- ==========================================================
-- SEED DATA
-- Password: "password123"
-- ==========================================================

INSERT INTO users (name, email, password_hash, role) VALUES
('Campus Admin', 'admin@studyspace.com', '$2a$10$4MEVS4C3ia7IQoZbo.Rrf.Kodsyw/DHID4NHTsUUIxG/YBzdkHm9O', 'admin'),
('Alex Student', 'alex@university.edu', '$2a$10$4MEVS4C3ia7IQoZbo.Rrf.Kodsyw/DHID4NHTsUUIxG/YBzdkHm9O', 'student'),
('Sara Student', 'sara@university.edu', '$2a$10$4MEVS4C3ia7IQoZbo.Rrf.Kodsyw/DHID4NHTsUUIxG/YBzdkHm9O', 'student');

INSERT INTO study_spaces (id, name, location, description, capacity) VALUES
(1, 'Floor 1 – Main Reading Hall', 'Central Library, Ground Level', 'Traditional grand reading room with 9 large study tables, circulation desk, and quick-reference bookshelves.', 40),
(2, 'Floor 2 – Collaborative Commons', 'Central Library, Level 2', 'Group study tables, tech-enabled digital media bar, and discussion lounges.', 32),
(3, 'Floor 3 – Silent Study & Research', 'Central Library, Level 3', 'Strict silence zone featuring 40 seats: 8 individual single-seated carrels along the west wall plus 8 silent reading tables.', 40),
(4, 'Floor 4 – Deep Focus & Penthouse Pods', 'Central Library, Top Level', 'Extended 44-seat floor featuring 12 individual single-seated focus pods aligned along the west wall plus 8 research tables.', 44);

-- ----------------------------------------------------------
-- FLOOR 1: 40 seats (Tables 1-9)
-- ----------------------------------------------------------
INSERT INTO seats (space_id, seat_number, has_power_outlet, is_corner_seat) VALUES
(1, 'T1-A1', true, false), (1, 'T1-A2', true, false), (1, 'T1-B1', true, false), (1, 'T1-B2', true, false),
(1, 'T2-A1', true, false), (1, 'T2-A2', true, false), (1, 'T2-B1', true, false), (1, 'T2-B2', true, false),
(1, 'T3-A1', true, false), (1, 'T3-A2', true, false), (1, 'T3-B1', true, false), (1, 'T3-B2', true, false),
(1, 'T4-A1', true, false), (1, 'T4-A2', true, false), (1, 'T4-B1', true, false), (1, 'T4-B2', true, false),
(1, 'T5-A1', true, false), (1, 'T5-A2', true, false), (1, 'T5-B1', true, false), (1, 'T5-B2', true, false),
(1, 'T6-A1', true, false), (1, 'T6-A2', true, false), (1, 'T6-B1', true, false), (1, 'T6-B2', true, false),
(1, 'T7-A1', true, false), (1, 'T7-A2', true, false), (1, 'T7-B1', true, false), (1, 'T7-B2', true, false),
(1, 'T8-A1', true, false), (1, 'T8-A2', true, false), (1, 'T8-A3', true, false), (1, 'T8-A4', true, false),
(1, 'T8-B1', true, false), (1, 'T8-B2', true, false), (1, 'T8-B3', true, false), (1, 'T8-B4', true, false),
(1, 'T9-A1', true, false), (1, 'T9-A2', true, false), (1, 'T9-B1', true, false), (1, 'T9-B2', true, false);

-- ----------------------------------------------------------
-- FLOOR 2: 32 seats (Tables 1-6 + Tech Bar)
-- ----------------------------------------------------------
INSERT INTO seats (space_id, seat_number, has_power_outlet, is_corner_seat) VALUES
(2, 'T1-A1', true, false), (2, 'T1-A2', true, false), (2, 'T1-B1', true, false), (2, 'T1-B2', true, false),
(2, 'T2-A1', true, false), (2, 'T2-A2', true, false), (2, 'T2-B1', true, false), (2, 'T2-B2', true, false),
(2, 'T3-A1', true, false), (2, 'T3-A2', true, false), (2, 'T3-B1', true, false), (2, 'T3-B2', true, false),
(2, 'T4-A1', true, false), (2, 'T4-A2', true, false), (2, 'T4-B1', true, false), (2, 'T4-B2', true, false),
(2, 'T5-A1', true, false), (2, 'T5-A2', true, false), (2, 'T5-B1', true, false), (2, 'T5-B2', true, false),
(2, 'T6-A1', true, false), (2, 'T6-A2', true, false), (2, 'T6-B1', true, false), (2, 'T6-B2', true, false),
(2, 'BAR-1', true, false), (2, 'BAR-2', true, false), (2, 'BAR-3', true, false), (2, 'BAR-4', true, false),
(2, 'BAR-5', true, false), (2, 'BAR-6', true, false), (2, 'BAR-7', true, false), (2, 'BAR-8', true, false);

-- ----------------------------------------------------------
-- FLOOR 3: 40 SEATS (8 Solo Desks on West Wall + 8 Tables)
-- ----------------------------------------------------------
INSERT INTO seats (space_id, seat_number, has_power_outlet, is_corner_seat) VALUES
-- 8 Single Seated Desks along West Wall
(3, 'SOLO-1', true, true), (3, 'SOLO-2', true, true), (3, 'SOLO-3', true, true), (3, 'SOLO-4', true, true),
(3, 'SOLO-5', true, true), (3, 'SOLO-6', true, true), (3, 'SOLO-7', true, true), (3, 'SOLO-8', true, true),
-- 8 Tables (32 seats)
(3, 'T1-A1', true, false), (3, 'T1-A2', true, false), (3, 'T1-B1', true, false), (3, 'T1-B2', true, false),
(3, 'T2-A1', true, false), (3, 'T2-A2', true, false), (3, 'T2-B1', true, false), (3, 'T2-B2', true, false),
(3, 'T3-A1', true, false), (3, 'T3-A2', true, false), (3, 'T3-B1', true, false), (3, 'T3-B2', true, false),
(3, 'T4-A1', true, false), (3, 'T4-A2', true, false), (3, 'T4-B1', true, false), (3, 'T4-B2', true, false),
(3, 'T5-A1', true, false), (3, 'T5-A2', true, false), (3, 'T5-B1', true, false), (3, 'T5-B2', true, false),
(3, 'T6-A1', true, false), (3, 'T6-A2', true, false), (3, 'T6-B1', true, false), (3, 'T6-B2', true, false),
(3, 'T7-A1', true, false), (3, 'T7-A2', true, false), (3, 'T7-B1', true, false), (3, 'T7-B2', true, false),
(3, 'T8-A1', true, false), (3, 'T8-A2', true, false), (3, 'T8-B1', true, false), (3, 'T8-B2', true, false);

-- ----------------------------------------------------------
-- FLOOR 4: 44 SEATS (12 Solo Pods on West Wall + 8 Tables)
-- ----------------------------------------------------------
INSERT INTO seats (space_id, seat_number, has_power_outlet, is_corner_seat) VALUES
-- 12 Single Seated Pods along West Wall
(4, 'SOLO-1', true, true), (4, 'SOLO-2', true, true), (4, 'SOLO-3', true, true), (4, 'SOLO-4', true, true),
(4, 'SOLO-5', true, true), (4, 'SOLO-6', true, true), (4, 'SOLO-7', true, true), (4, 'SOLO-8', true, true),
(4, 'SOLO-9', true, true), (4, 'SOLO-10', true, true), (4, 'SOLO-11', true, true), (4, 'SOLO-12', true, true),
-- 8 Research Tables (32 seats)
(4, 'T1-A1', true, false), (4, 'T1-A2', true, false), (4, 'T1-B1', true, false), (4, 'T1-B2', true, false),
(4, 'T2-A1', true, false), (4, 'T2-A2', true, false), (4, 'T2-B1', true, false), (4, 'T2-B2', true, false),
(4, 'T3-A1', true, false), (4, 'T3-A2', true, false), (4, 'T3-B1', true, false), (4, 'T3-B2', true, false),
(4, 'T4-A1', true, false), (4, 'T4-A2', true, false), (4, 'T4-B1', true, false), (4, 'T4-B2', true, false),
(4, 'T5-A1', true, false), (4, 'T5-A2', true, false), (4, 'T5-B1', true, false), (4, 'T5-B2', true, false),
(4, 'T6-A1', true, false), (4, 'T6-A2', true, false), (4, 'T6-B1', true, false), (4, 'T6-B2', true, false),
(4, 'T7-A1', true, false), (4, 'T7-A2', true, false), (4, 'T7-B1', true, false), (4, 'T7-B2', true, false),
(4, 'T8-A1', true, false), (4, 'T8-A2', true, false), (4, 'T8-B1', true, false), (4, 'T8-B2', true, false);

-- Sample reservations for today
INSERT INTO reservations (user_id, seat_id, reservation_date, start_time, end_time, status) VALUES
(2, 4, CURRENT_DATE, '10:00:00', '12:00:00', 'confirmed'),
(3, 10, CURRENT_DATE, '10:00:00', '12:00:00', 'confirmed'),
(2, 13, CURRENT_DATE, '10:00:00', '12:00:00', 'confirmed'),
(3, 24, CURRENT_DATE, '10:00:00', '12:00:00', 'confirmed'),
(2, 37, CURRENT_DATE, '10:00:00', '12:00:00', 'confirmed'),
(3, 7, CURRENT_DATE, '10:00:00', '12:00:00', 'confirmed');
