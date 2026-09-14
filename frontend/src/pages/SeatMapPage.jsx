import React, { useState, useEffect } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, Clock, BookOpen, VolumeX, Book, User, 
  CheckCircle2, AlertTriangle, Armchair, Zap, Sparkles, Shield, Layers, UserCheck
} from 'lucide-react';

export default function SeatMapPage({ currentFloorId, onSelectFloor, onReservationSuccess }) {
  const { user } = useAuth();
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('12:00');

  const [seats, setSeats] = useState([]);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('Table 1');
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const floorMeta = {
    1: { name: 'Floor 1 – Main Reading Hall', subtitle: '40 Desks • 9 Grand Tables • Help Desk & Circulation' },
    2: { name: 'Floor 2 – Collaborative Commons', subtitle: '32 Desks • 6 Team Tables • High-Speed Tech Bar & Lounge' },
    3: { name: 'Floor 3 – Silent Study & Research', subtitle: '40 Desks • 8 Single Carrels on West Wall • 8 Reading Tables • Reference Stacks' },
    4: { name: 'Floor 4 – Deep Focus & Penthouse Pods', subtitle: '44 Desks • 12 Solo Focus Pods on West Wall • 8 Thesis Tables • Hardcover Stacks' }
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchFloorSeats() {
      setLoading(true);
      setError('');
      setSelectedSeat(null);

      try {
        const data = await api.getSeats(currentFloorId, {
          date,
          start_time: startTime + ':00',
          end_time: endTime + ':00'
        });

        if (!isMounted) return;
        setSeats(data);

        // Auto-select first available desk on floor change
        if (currentFloorId === 1) {
          const t8 = data.find(s => !s.is_reserved && s.seat_number === 'T8-A1') || data.find(s => !s.is_reserved) || data[0];
          setSelectedSeat(t8 || null);
          setSelectedGroup('Table 8');
        } else if (currentFloorId === 3 || currentFloorId === 4) {
          const availSolo = data.find(s => !s.is_reserved && s.seat_number.startsWith('SOLO-')) || data.find(s => !s.is_reserved) || data[0];
          setSelectedSeat(availSolo || null);
          setSelectedGroup(availSolo?.seat_number.startsWith('SOLO-') ? 'Solo Focus Wing' : 'Table 1');
        } else {
          const avail = data.find(s => !s.is_reserved) || data[0];
          setSelectedSeat(avail || null);
          setSelectedGroup('Table 1');
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load floor seats.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchFloorSeats();
    return () => { isMounted = false; };
  }, [currentFloorId, date, startTime, endTime]);

  const handleSeatClick = (seat, groupName) => {
    if (!seat) return;
    if (groupName) setSelectedGroup(groupName);

    if (seat.is_reserved) {
      if (user?.role === 'admin') {
        setSelectedSeat(seat);
        setError('');
        return;
      }
      setError(`Desk "${seat.seat_number}" is already reserved for ${startTime} – ${endTime}.`);
      return;
    }
    setError('');
    setSelectedSeat(seat);
  };

  const handleAdminVerifySeat = async (reservationId) => {
    if (!reservationId) return;
    setError('');
    try {
      const res = await api.verifyReservation(reservationId);
      setSuccessMessage(res.message);
      
      const refreshed = await api.getSeats(currentFloorId, {
        date,
        start_time: startTime + ':00',
        end_time: endTime + ':00'
      });
      setSeats(refreshed);
      if (selectedSeat) {
        const updated = refreshed.find(s => s.id === selectedSeat.id);
        if (updated) setSelectedSeat(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to verify reservation.');
    }
  };

  const handleReserve = async () => {
    if (!selectedSeat) {
      setError('Please click an available desk on the floor blueprint.');
      return;
    }

    if (startTime >= endTime) {
      setError('Start time must be strictly before end time.');
      return;
    }

    setReserving(true);
    setError('');
    setSuccessMessage('');

    try {
      await api.createReservation({
        seat_id: selectedSeat.id,
        reservation_date: date,
        start_time: startTime + ':00',
        end_time: endTime + ':00'
      });

      setSuccessMessage(`Confirmed! Desk ${selectedSeat.seat_number} on Floor ${currentFloorId} is reserved for ${date} (${startTime} - ${endTime}).`);
      
      const refreshed = await api.getSeats(currentFloorId, {
        date,
        start_time: startTime + ':00',
        end_time: endTime + ':00'
      });
      setSeats(refreshed);

      if (onReservationSuccess) {
        setTimeout(() => onReservationSuccess(), 2200);
      }
    } catch (err) {
      if (err.status === 409) {
        setError('⚠️ Double-booking rejected: Another student already booked this desk for this time slot.');
      } else {
        setError(err.message || 'Failed to complete reservation.');
      }
    } finally {
      setReserving(false);
    }
  };

  const totalSeatsCount = seats.length;
  const reservedCount = seats.filter(s => s.is_reserved).length;
  const availableCount = totalSeatsCount - reservedCount;

  const findSeat = (num) => seats.find(s => s.seat_number === num);

  const renderChair = (seat, groupName) => {
    if (!seat) return <div className="chair-circle placeholder" />;
    const isSelected = selectedSeat?.id === seat.id;
    let chairClass = 'chair-circle';
    if (seat.is_reserved) chairClass += ' reserved';
    else if (isSelected) chairClass += ' selected';
    else chairClass += ' available';

    return (
      <div 
        key={seat.id}
        className={chairClass}
        onClick={(e) => {
          e.stopPropagation();
          handleSeatClick(seat, groupName);
        }}
        title={`${seat.seat_number}: ${seat.is_reserved ? 'Reserved (Red)' : (isSelected ? 'Selected (Blue)' : 'Available (Green)')}`}
      />
    );
  };

  const getActiveGroupSeats = () => {
    if (selectedGroup === 'Solo Focus Wing' || selectedGroup.includes('Solo')) {
      return seats.filter(s => s.seat_number.startsWith('SOLO-'));
    }
    if (selectedGroup === 'Tech Bar') {
      return seats.filter(s => s.seat_number.startsWith('BAR-'));
    }
    const match = selectedGroup.match(/Table\s*(\d+)/i) || selectedGroup.match(/Thesis\s*(\d+)/i);
    if (match) {
      const num = match[1];
      return seats.filter(s => s.seat_number.startsWith(`T${num}-`));
    }
    return seats.slice(0, 8);
  };

  const groupSeatsList = getActiveGroupSeats();

  return (
    <div className="floorplan-container-main">
      {/* 1-CLICK PROMINENT FLOOR SELECTOR PILL TABS */}
      <div className="fp-floor-pills-bar">
        <span className="pills-label">
          <Layers size={15} /> Select Level:
        </span>
        <div className="pills-track">
          {[1, 2, 3, 4].map((fId) => (
            <button
              key={fId}
              type="button"
              className={`floor-pill-btn ${currentFloorId === fId ? 'active' : ''}`}
              onClick={() => onSelectFloor(fId)}
            >
              <span>Level {fId}</span>
              <small className="pill-sub">
                {fId === 1 ? 'Reading Hall (40)' : (fId === 2 ? 'Commons (32)' : (fId === 3 ? 'Silent & Solo (40)' : 'Penthouse Pods (44)'))}
              </small>
              {(fId === 3 || fId === 4) && <span className="pill-solo-tag">Solo Desks</span>}
            </button>
          ))}
        </div>
      </div>

      {/* TOP HEADER & COUNTER PILLS */}
      <div className="fp-top-bar">
        <div className="fp-brand">
          <div className="fp-brand-icon">
            <BookOpen size={24} color="#ffffff" />
          </div>
          <div>
            <h1>{floorMeta[currentFloorId]?.name}</h1>
            <p className="fp-tagline">{floorMeta[currentFloorId]?.subtitle}</p>
          </div>
        </div>

        <div className="fp-stats-row">
          <div className="stat-pill">
            <div className="stat-icon-wrapper">
              <Armchair size={16} color="#475569" />
            </div>
            <div className="stat-text">
              <span className="stat-label">Total Seats</span>
              <span className="stat-val">{totalSeatsCount}</span>
            </div>
          </div>

          <div className="stat-pill">
            <span className="dot dot-available"></span>
            <div className="stat-text">
              <span className="stat-label">Available</span>
              <span className="stat-val">{availableCount}</span>
            </div>
          </div>

          <div className="stat-pill">
            <span className="dot dot-reserved"></span>
            <div className="stat-text">
              <span className="stat-label">Reserved</span>
              <span className="stat-val">{reservedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="fp-content-layout">
        {/* BLUEPRINT CANVAS */}
        <div className="fp-plan-wrapper">
          {loading ? (
            <div className="loading-state" style={{ minHeight: '520px', justifyContent: 'center' }}>
              <div className="spinner"></div>
              <p>Rendering Level {currentFloorId} Blueprint...</p>
            </div>
          ) : (
            <div className={`floorplan-canvas floor-${currentFloorId}`}>
              {/* Windows at top wall */}
              <div className="arch-windows">
                <div className="window-pane"></div>
                <div className="window-pane"></div>
                <div className="window-pane"></div>
                <div className="window-pane"></div>
                <div className="window-pane"></div>
              </div>

              {/* ======================================================== */}
              {/* FLOOR 1: 40 SEATS (3x3 GRAND READING TABLES)             */}
              {/* ======================================================== */}
              {currentFloorId === 1 && (
                <>
                  <div className="arch-bookshelf top-left">
                    <span className="shelf-label">Bookshelf</span>
                    <div className="shelf-grid">
                      <div className="book-shelf-row"><span className="b b1"></span><span className="b b2"></span><span className="b b3"></span></div>
                      <div className="book-shelf-row"><span className="b b4"></span><span className="b b1"></span><span className="b b2"></span></div>
                      <div className="book-shelf-row"><span className="b b3"></span><span className="b b4"></span><span className="b b1"></span></div>
                    </div>
                  </div>

                  <div className="arch-zone quiet-zone">
                    <VolumeX size={24} color="#64748b" />
                    <span>Quiet Zone</span>
                  </div>

                  <div className="arch-zone study-zone">
                    <Book size={24} color="#64748b" />
                    <span>Study Zone</span>
                  </div>

                  <div className="arch-help-desk">
                    <User size={18} color="#475569" />
                    <span>Help Desk</span>
                  </div>

                  <div className="arch-bookshelf bottom-center">
                    <div className="book-shelf-horizontal">
                      <span className="b b1"></span><span className="b b2"></span><span className="b b3"></span><span className="b b4"></span>
                      <span className="b b2"></span><span className="b b1"></span><span className="b b4"></span><span className="b b3"></span>
                    </div>
                  </div>

                  <div className="indoor-plant plant-top-right">🌿</div>
                  <div className="indoor-plant plant-bottom-left">🌿</div>
                  <div className="indoor-plant plant-bottom-mid">🌿</div>
                  <div className="indoor-plant plant-bottom-right">🌿</div>

                  <div className="arch-entrance">
                    <div className="entrance-arrow">↑</div>
                    <span className="entrance-text">Entrance</span>
                  </div>

                  <div className="tables-grid">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((tbl) => {
                      const topSeats = [findSeat(`T${tbl}-A1`), findSeat(`T${tbl}-A2`), findSeat(`T${tbl}-A3`), findSeat(`T${tbl}-A4`)].filter(Boolean);
                      const btmSeats = [findSeat(`T${tbl}-B1`), findSeat(`T${tbl}-B2`), findSeat(`T${tbl}-B3`), findSeat(`T${tbl}-B4`)].filter(Boolean);
                      const isTblActive = selectedGroup === `Table ${tbl}`;

                      return (
                        <div 
                          key={tbl} 
                          className={`table-station table-${tbl} ${isTblActive ? 'table-active' : ''}`}
                          onClick={() => {
                            setSelectedGroup(`Table ${tbl}`);
                            const tblSeats = [...topSeats, ...btmSeats];
                            const firstAvail = tblSeats.find(s => !s.is_reserved) || tblSeats[0];
                            if (firstAvail) handleSeatClick(firstAvail, `Table ${tbl}`);
                          }}
                        >
                          <div className="chairs-row top-chairs">
                            {topSeats.map(s => renderChair(s, `Table ${tbl}`))}
                          </div>
                          <div className="desk-surface">
                            <span className="desk-label">Table {tbl}</span>
                          </div>
                          <div className="chairs-row bottom-chairs">
                            {btmSeats.map(s => renderChair(s, `Table ${tbl}`))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ======================================================== */}
              {/* FLOOR 2: 32 SEATS (COLLABORATIVE COMMONS)                 */}
              {/* ======================================================== */}
              {currentFloorId === 2 && (
                <>
                  <div className="arch-bookshelf f2-top-shelf">
                    <span className="shelf-label">Digital Technology Reference Stacks</span>
                    <div className="book-shelf-horizontal">
                      <span className="b b1"></span><span className="b b4"></span><span className="b b2"></span><span className="b b3"></span>
                      <span className="b b1"></span><span className="b b3"></span><span className="b b4"></span><span className="b b2"></span>
                    </div>
                  </div>

                  <div className="arch-zone f2-lounge">
                    <Sparkles size={24} color="#2563eb" />
                    <span>Discussion Lounge</span>
                    <small>Whiteboards & Media</small>
                  </div>

                  <div className="f2-tables-grid">
                    {[1, 2, 3, 4, 5, 6].map((tbl) => {
                      const topSeats = [findSeat(`T${tbl}-A1`), findSeat(`T${tbl}-A2`)].filter(Boolean);
                      const btmSeats = [findSeat(`T${tbl}-B1`), findSeat(`T${tbl}-B2`)].filter(Boolean);
                      const isTblActive = selectedGroup === `Table ${tbl}`;

                      return (
                        <div 
                          key={tbl} 
                          className={`table-station f2-station ${isTblActive ? 'table-active' : ''}`}
                          onClick={() => {
                            setSelectedGroup(`Table ${tbl}`);
                            const tblSeats = [...topSeats, ...btmSeats];
                            const firstAvail = tblSeats.find(s => !s.is_reserved) || tblSeats[0];
                            if (firstAvail) handleSeatClick(firstAvail, `Table ${tbl}`);
                          }}
                        >
                          <div className="chairs-row top-chairs">
                            {topSeats.map(s => renderChair(s, `Table ${tbl}`))}
                          </div>
                          <div className="desk-surface f2-desk">
                            <span className="desk-label">Team Table {tbl}</span>
                          </div>
                          <div className="chairs-row bottom-chairs">
                            {btmSeats.map(s => renderChair(s, `Table ${tbl}`))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="f2-tech-bar-zone">
                    <div className="tech-bar-surface" onClick={() => setSelectedGroup('Tech Bar')}>
                      <span className="bar-label">⚡ High-Speed Tech Bar (Dual Monitors)</span>
                    </div>
                    <div className="chairs-row bar-chairs">
                      {['BAR-1', 'BAR-2', 'BAR-3', 'BAR-4', 'BAR-5', 'BAR-6', 'BAR-7', 'BAR-8'].map(code => (
                        <div key={code} className="bar-seat-unit">
                          {renderChair(findSeat(code), 'Tech Bar')}
                          <span className="micro-label">{code}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="indoor-plant plant-top-right">🌿</div>
                  <div className="indoor-plant plant-bottom-left">🌿</div>
                </>
              )}

              {/* ======================================================== */}
              {/* FLOOR 3: 40 SEATS (SPACIOUS 2-ZONE LAYOUT + SHELVES)     */}
              {/* ======================================================== */}
              {currentFloorId === 3 && (
                <div className="full-floor-two-zone">
                  {/* WEST SIDE: 8 Solo Desks arranged cleanly in 2 columns of 4 */}
                  <div 
                    className="west-solo-wing" 
                    onClick={() => {
                      setSelectedGroup('Solo Focus Wing');
                      const soloDesks = seats.filter(s => s.seat_number.startsWith('SOLO-'));
                      const firstAvail = soloDesks.find(s => !s.is_reserved) || soloDesks[0];
                      if (firstAvail) handleSeatClick(firstAvail, 'Solo Focus Wing');
                    }}
                  >
                    <div className="solo-wing-header">
                      <Zap size={14} color="#f59e0b" />
                      <span>Solo Desks (8 Units)</span>
                    </div>

                    <div className="solo-double-column">
                      {['SOLO-1', 'SOLO-2', 'SOLO-3', 'SOLO-4', 'SOLO-5', 'SOLO-6', 'SOLO-7', 'SOLO-8'].map((code) => {
                        const seat = findSeat(code);
                        const isSelected = selectedSeat?.seat_number === code;
                        return (
                          <div 
                            key={code}
                            className={`solo-desk-card ${isSelected ? 'carrel-active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSeatClick(seat, 'Solo Focus Wing');
                            }}
                          >
                            <div className="solo-desk-head">
                              <span className="lamp-dot"></span>
                              <span className="desk-code-text">{code}</span>
                              <span className="solo-plug-icon">⚡</span>
                            </div>
                            <div className="solo-chair-container">
                              {renderChair(seat, 'Solo Focus Wing')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* EAST SIDE: 8 Reading Tables + Full-Width Bookshelf Below */}
                  <div className="east-hall-area">
                    <div className="hall-title-badge">
                      <div className="badge-inner-title">
                        <VolumeX size={15} color="#475569" />
                        <span>Silent Reading Hall (8 Tables • 32 Desks)</span>
                      </div>
                      <span className="badge-policy-tag">Strict Quiet</span>
                    </div>

                    {/* 2 Rows of 4 Tables filling the hall */}
                    <div className="tables-grid-2x4">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((tbl) => {
                        const topSeats = [findSeat(`T${tbl}-A1`), findSeat(`T${tbl}-A2`)].filter(Boolean);
                        const btmSeats = [findSeat(`T${tbl}-B1`), findSeat(`T${tbl}-B2`)].filter(Boolean);
                        const isTblActive = selectedGroup === `Table ${tbl}`;

                        return (
                          <div 
                            key={tbl} 
                            className={`table-station f3-station ${isTblActive ? 'table-active' : ''}`}
                            onClick={() => {
                              setSelectedGroup(`Table ${tbl}`);
                              const tblSeats = [...topSeats, ...btmSeats];
                              const firstAvail = tblSeats.find(s => !s.is_reserved) || tblSeats[0];
                              if (firstAvail) handleSeatClick(firstAvail, `Table ${tbl}`);
                            }}
                          >
                            <div className="chairs-row top-chairs">
                              {topSeats.map(s => renderChair(s, `Table ${tbl}`))}
                            </div>
                            <div className="desk-surface f3-desk">
                              <span className="desk-label">Table {tbl}</span>
                            </div>
                            <div className="chairs-row bottom-chairs">
                              {btmSeats.map(s => renderChair(s, `Table ${tbl}`))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* SPANNING BOOKSHELF STACKS BELOW TABLES */}
                    <div className="spanning-bookshelf-unit f3-shelf">
                      <div className="spanning-shelf-title">
                        <span>📚 Level 3 Reference Collections, Periodicals & Research Stacks</span>
                        <span className="shelf-sub-tag">3 Subject Bays</span>
                      </div>
                      <div className="spanning-shelf-body">
                        <div className="shelf-bay">
                          <span className="bay-label">Bay A • Computer Science</span>
                          <div className="shelf-column-stack"><span className="b b1"></span><span className="b b3"></span><span className="b b2"></span><span className="b b4"></span><span className="b b1"></span><span className="b b2"></span></div>
                        </div>
                        <div className="shelf-bay">
                          <span className="bay-label">Bay B • Mathematics & AI</span>
                          <div className="shelf-column-stack"><span className="b b2"></span><span className="b b4"></span><span className="b b1"></span><span className="b b3"></span><span className="b b2"></span><span className="b b4"></span></div>
                        </div>
                        <div className="shelf-bay">
                          <span className="bay-label">Bay C • Engineering & Physics</span>
                          <div className="shelf-column-stack"><span className="b b3"></span><span className="b b1"></span><span className="b b4"></span><span className="b b2"></span><span className="b b4"></span><span className="b b1"></span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* FLOOR 4: 44 SEATS (SPACIOUS 2-ZONE LAYOUT + SHELVES)     */}
              {/* ======================================================== */}
              {currentFloorId === 4 && (
                <div className="full-floor-two-zone">
                  {/* WEST SIDE: 12 Solo Focus Pods arranged in 2 columns of 6 */}
                  <div 
                    className="west-solo-wing f4-dark-wing" 
                    onClick={() => {
                      setSelectedGroup('Solo Focus Wing');
                      const soloDesks = seats.filter(s => s.seat_number.startsWith('SOLO-'));
                      const firstAvail = soloDesks.find(s => !s.is_reserved) || soloDesks[0];
                      if (firstAvail) handleSeatClick(firstAvail, 'Solo Focus Wing');
                    }}
                  >
                    <div className="solo-wing-header f4-wing-head">
                      <Shield size={14} color="#38bdf8" />
                      <span>Solo Pods (12 Units)</span>
                    </div>

                    <div className="solo-double-column f4-pod-grid">
                      {[
                        'SOLO-1', 'SOLO-2', 'SOLO-3', 'SOLO-4', 'SOLO-5', 'SOLO-6',
                        'SOLO-7', 'SOLO-8', 'SOLO-9', 'SOLO-10', 'SOLO-11', 'SOLO-12'
                      ].map((code) => {
                        const seat = findSeat(code);
                        const isSelected = selectedSeat?.seat_number === code;
                        return (
                          <div 
                            key={code}
                            className={`solo-desk-card f4-dark-pod ${isSelected ? 'carrel-active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSeatClick(seat, 'Solo Focus Wing');
                            }}
                          >
                            <div className="solo-desk-head f4-head">
                              <span className="lamp-dot blue-lamp"></span>
                              <span className="desk-code-text">{code}</span>
                              <span className="solo-plug-icon f4-plug">🔒</span>
                            </div>
                            <div className="solo-chair-container">
                              {renderChair(seat, 'Solo Focus Wing')}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* EAST SIDE: 8 Thesis Research Tables + Full-Width Bookshelf Below */}
                  <div className="east-hall-area">
                    <div className="hall-title-badge f4-hall-badge">
                      <div className="badge-inner-title">
                        <Sparkles size={15} color="#0284c7" />
                        <span>Thesis & Postgraduate Research Wing (8 Tables • 32 Desks)</span>
                      </div>
                      <span className="badge-policy-tag">Graduate Focus</span>
                    </div>

                    {/* 2 Rows of 4 Tables */}
                    <div className="tables-grid-2x4">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((tbl) => {
                        const topSeats = [findSeat(`T${tbl}-A1`), findSeat(`T${tbl}-A2`)].filter(Boolean);
                        const btmSeats = [findSeat(`T${tbl}-B1`), findSeat(`T${tbl}-B2`)].filter(Boolean);
                        const isTblActive = selectedGroup === `Thesis ${tbl}`;

                        return (
                          <div 
                            key={tbl} 
                            className={`table-station f4-station ${isTblActive ? 'table-active' : ''}`}
                            onClick={() => {
                              setSelectedGroup(`Thesis ${tbl}`);
                              const tblSeats = [...topSeats, ...btmSeats];
                              const firstAvail = tblSeats.find(s => !s.is_reserved) || tblSeats[0];
                              if (firstAvail) handleSeatClick(firstAvail, `Thesis ${tbl}`);
                            }}
                          >
                            <div className="chairs-row top-chairs">
                              {topSeats.map(s => renderChair(s, `Thesis ${tbl}`))}
                            </div>
                            <div className="desk-surface f4-desk">
                              <span className="desk-label">Thesis {tbl}</span>
                            </div>
                            <div className="chairs-row bottom-chairs">
                              {btmSeats.map(s => renderChair(s, `Table ${tbl}`))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* SPANNING HARDCOVER THESIS STACKS BELOW TABLES */}
                    <div className="spanning-bookshelf-unit f4-shelf">
                      <div className="spanning-shelf-title f4-title">
                        <span>📚 University Hardcover Thesis & Dissertation Archive Stacks (Level 4)</span>
                        <span className="shelf-sub-tag f4-sub-tag">3 Archival Bays</span>
                      </div>
                      <div className="spanning-shelf-body">
                        <div className="shelf-bay f4-bay">
                          <span className="bay-label f4-bay-label">Bay 1 • Doctoral Theses</span>
                          <div className="shelf-column-stack f4-stack"><span className="b b1"></span><span className="b b2"></span><span className="b b3"></span><span className="b b4"></span><span className="b b1"></span><span className="b b2"></span></div>
                        </div>
                        <div className="shelf-bay f4-bay">
                          <span className="bay-label f4-bay-label">Bay 2 • Masters Dissertations</span>
                          <div className="shelf-column-stack f4-stack"><span className="b b4"></span><span className="b b1"></span><span className="b b3"></span><span className="b b2"></span><span className="b b4"></span><span className="b b3"></span></div>
                        </div>
                        <div className="shelf-bay f4-bay">
                          <span className="bay-label f4-bay-label">Bay 3 • IEEE / ACM Conference</span>
                          <div className="shelf-column-stack f4-stack"><span className="b b2"></span><span className="b b3"></span><span className="b b1"></span><span className="b b4"></span><span className="b b2"></span><span className="b b1"></span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR CONTROLS */}
        <div className="fp-sidebar">
          {/* Card 1: Legend */}
          <div className="fp-card legend-card">
            <div className="legend-row">
              <span className="dot dot-available"></span>
              <span>Available Desk</span>
            </div>
            <div className="legend-row">
              <span className="dot dot-reserved"></span>
              <span>Reserved Desk</span>
            </div>
            <div className="legend-row">
              <span className="dot dot-selected"></span>
              <span>Selected Desk</span>
            </div>
            {(currentFloorId === 3 || currentFloorId === 4) && (
              <div className="legend-row" style={{ color: '#0284c7', fontWeight: 700 }}>
                <span>🎯 Single Solo Desks on West Wall</span>
              </div>
            )}
          </div>

          {/* Card 2: Selected Station & Live Seats List */}
          <div className="fp-card table-detail-card">
            <div className="td-header">
              <div className="td-title-row">
                <Armchair size={18} color="var(--primary)" />
                <h4>
                  {selectedGroup}
                  <span className="highlight-tag"> (Active)</span>
                </h4>
              </div>
              <span className="seats-count-badge">{groupSeatsList.length} Desks</span>
            </div>

            <div className="station-seats-pill-grid">
              {groupSeatsList.map((seat) => {
                const isSelected = selectedSeat?.id === seat.id;
                let dotClass = 'dot dot-available';
                if (seat.is_reserved) dotClass = 'dot dot-reserved';
                if (isSelected) dotClass = 'dot dot-selected';

                return (
                  <div
                    key={seat.id}
                    className={`seat-pill-item ${isSelected ? 'active' : ''} ${seat.is_reserved ? 'disabled' : ''}`}
                    onClick={() => handleSeatClick(seat, selectedGroup)}
                  >
                    <span className={dotClass}></span>
                    <span className="pill-code">{seat.seat_number}</span>
                  </div>
                );
              })}
            </div>

            {selectedSeat && (
              <div className="selected-desk-highlight-box" style={{ marginTop: '12px' }}>
                <div className="sd-badge-row">
                  <span className="sd-seat-code">{selectedSeat.seat_number}</span>
                  <span className={`status-tag ${selectedSeat.is_reserved ? (selectedSeat.reservation_status === 'verified' ? 'confirmed' : 'cancelled') : 'confirmed'}`}>
                    {selectedSeat.is_reserved ? (selectedSeat.reservation_status === 'verified' ? 'Verified' : 'Reserved') : 'Ready to Book'}
                  </span>
                </div>
                <div className="sd-meta-text">
                  <span>📍 Floor {currentFloorId} • {floorMeta[currentFloorId]?.name.split('–')[1]}</span>
                  {selectedSeat.is_corner_seat && <span>🔒 Private Solo Desk with AC Socket & Lamp</span>}
                  {selectedSeat.is_reserved && user?.role === 'admin' && (
                    <div style={{ marginTop: '8px', padding: '8px 10px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontWeight: '700', color: '#1e40af', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <UserCheck size={14} />
                        <span>Registered Student</span>
                      </div>
                      <div style={{ fontWeight: '700', color: '#0f172a', fontSize: '0.88rem', marginTop: '2px' }}>
                        {selectedSeat.reserved_by_name || 'Registered Student'}
                      </div>
                      <div style={{ color: '#475569', fontSize: '0.78rem' }}>
                        {selectedSeat.reserved_by_email}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>
                        Slot: {selectedSeat.reserved_start_time?.slice(0, 5) || startTime} – {selectedSeat.reserved_end_time?.slice(0, 5) || endTime}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Reserve Form */}
          <div className="fp-card reserve-form-card">
            <div className="rf-header">
              <Calendar size={18} color="#475569" />
              <h4>Reserve Desk</h4>
            </div>

            {error && (
              <div className="alert alert-error" style={{ padding: '8px 12px', fontSize: '0.8rem', margin: '10px 0' }}>
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="alert alert-success" style={{ padding: '8px 12px', fontSize: '0.8rem', margin: '10px 0' }}>
                <CheckCircle2 size={14} />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="rf-fields">
              <div className="rf-field">
                <label>Date</label>
                <div className="rf-input-wrapper">
                  <input 
                    type="date" 
                    value={date} 
                    min={todayStr}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="rf-field">
                <label>Start Time</label>
                <div className="rf-input-wrapper">
                  <input 
                    type="time" 
                    value={startTime}
                    step="1800"
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="rf-field">
                <label>End Time</label>
                <div className="rf-input-wrapper">
                  <input 
                    type="time" 
                    value={endTime}
                    step="1800"
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {selectedSeat?.is_reserved && user?.role === 'admin' ? (
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => handleAdminVerifySeat(selectedSeat.reservation_id)}
                style={{ 
                  width: '100%', 
                  background: selectedSeat.reservation_status === 'verified' ? '#475569' : '#16a34a',
                  padding: '12px',
                  fontWeight: '700'
                }}
              >
                <UserCheck size={16} />
                <span>{selectedSeat.reservation_status === 'verified' ? 'Revert Verification' : 'Verify Student & Mark Present'}</span>
              </button>
            ) : (
              <button 
                type="button" 
                className="btn-fp-reserve"
                onClick={handleReserve}
                disabled={reserving || !selectedSeat || selectedSeat.is_reserved}
              >
                {reserving 
                  ? 'Reserving...' 
                  : (selectedSeat 
                      ? `Reserve Desk ${selectedSeat.seat_number}` 
                      : 'Select a Desk on Blueprint')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
