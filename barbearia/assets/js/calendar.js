/* =============================================================================
 * calendar.js — Gera arquivo .ics para "adicionar ao calendário"
 * ========================================================================== */

const CalendarICS = (() => {
  const pad = (n) => String(n).padStart(2, '0');

  // monta 'YYYYMMDDTHHMMSS' (hora local, sem Z — o app de calendário assume local)
  const fmt = (isoDate, minutes) => {
    const d = Utils.parseISODate(isoDate);
    d.setMinutes(minutes);
    return (
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T` +
      `${pad(d.getHours())}${pad(d.getMinutes())}00`
    );
  };

  function build(appointment) {
    const brand = window.APP_CONFIG.brand;
    const svc = DB.get('services', appointment.serviceId);
    const barber = DB.get('barbers', appointment.barberId);
    const title = `${svc ? svc.name : 'Serviço'} — ${brand.name}`;
    const desc =
      `Profissional: ${barber ? barber.name : ''}\\n` +
      `Código: ${appointment.code}\\n` +
      `${brand.phone}`;

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Barbearia Navalha//Agendamento//PT-BR',
      'BEGIN:VEVENT',
      `UID:${appointment.code}@barbearia-navalha`,
      `DTSTAMP:${fmt(Utils.todayISO(), Utils.nowMinutes())}`,
      `DTSTART:${fmt(appointment.date, appointment.startMin)}`,
      `DTEND:${fmt(appointment.date, appointment.startMin + appointment.durationMin)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:${brand.address}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  function download(appointment) {
    const blob = new Blob([build(appointment)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appointment.code}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return { build, download };
})();
