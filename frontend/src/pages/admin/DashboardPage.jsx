import React, { useEffect, useState } from 'react';
import client from '../../api/client';

function getMondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0,0,0,0);
  return d.toISOString().split('T')[0];
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [todayRes, setTodayRes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const weekStart = getMondayOf(new Date());
    const today = new Date().toISOString().split('T')[0];

    Promise.all([
      client.get(`/reservations?weekStart=${weekStart}`),
      client.get('/rooms'),
      client.get('/timeslots'),
    ]).then(([resData, roomsData, slotsData]) => {
      const d = resData.data;
      let totalWeek = 0;
      const todayList = [];

      for (const room of d.rooms) {
        for (const day of d.days) {
          for (const slot of d.timeslots) {
            const res = room.schedule?.[day]?.[slot.id];
            if (res) {
              totalWeek++;
              if (day === today) todayList.push({ ...res, roomName: room.name, slotLabel: slot.label, date: day, gradeSection: `${res.grade}${res.section ? ' ' + res.section : ''}` });
            }
          }
        }
      }

      setStats({
        totalWeek,
        rooms:    roomsData.data.filter(r => r.is_active).length,
        slots:    slotsData.data.filter(s => s.isBookable).length,
        todayCount: todayList.length,
      });
      setTodayRes(todayList);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex-center" style={{ height: 200 }}><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h2>Resumen General</h2>
        <p>Estadísticas de la semana actual</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Reservas esta semana</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>{stats?.totalWeek ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Reservas hoy</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats?.todayCount ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ambientes activos</div>
          <div className="stat-value">{stats?.rooms ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Horas disponibles/día</div>
          <div className="stat-value">{stats?.slots ?? 0}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Reservas de hoy</h3>
          <span className="badge badge-blue">{todayRes.length} reservas</span>
        </div>
        <div style={{ overflow: 'hidden' }}>
          {todayRes.length === 0 ? (
            <div className="empty-state">
              <p>No hay reservas para hoy</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ambiente</th>
                  <th>Hora</th>
                  <th>Docente</th>
                  <th>Asignatura</th>
                  <th>Grado</th>
                  <th>Sección</th>
                </tr>
              </thead>
              <tbody>
                {todayRes.map((r, i) => (
                  <tr key={i}>
                    <td><span className="badge badge-blue">{r.roomName}</span></td>
                    <td style={{ fontWeight: 500 }}>{r.slotLabel}</td>
                    <td>{r.teacherName}</td>
                    <td>{r.subject}</td>
                    <td>{r.grade}</td>
                    <td><span className="badge badge-yellow">{r.section || '—'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
