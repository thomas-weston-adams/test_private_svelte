<script>
  import trainings from './trainings.json';

  const today = new Date().toISOString().slice(0, 10);
  let query = '';
  let selectedRegion = 'All';
  let selectedMode = 'All';
  let selectedDate = 'All dates';
  let catalogSearch = '';

  let showRegistrationModal = false;
  let intendedCourse = '';
  let classSearch = '';
  let selectedClassId = '';

  const regions = ['All', ...new Set(trainings.map((t) => t.region))];
  const modes = ['All', ...new Set(trainings.map((t) => t.mode))];

  const formatDate = (dateString) => new Date(dateString + 'T00:00:00').toLocaleDateString();
  const toICSDate = (dateString) => dateString.replaceAll('-', '');
  const escapeICS = (value) => String(value).replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll('\n', '\\n');

  const allAvailableDates = ['All dates', ...new Set(trainings.map((t) => t.startDate).sort())];

  function resetFilters() {
    query = '';
    selectedRegion = 'All';
    selectedMode = 'All';
    selectedDate = 'All dates';
  }

  function buildEventDetails(training) {
    return [
      `Audience: ${training.audience}`,
      `Delivery mode: ${training.mode}`,
      `Region: ${training.region}`,
      `Tuition: ${training.tuition}`,
      `Other costs / notes: ${training.other}`,
      `Registration status: ${training.registration}`
    ].join('\n');
  }

  function getCalendarUrls(training) {
    const endExclusive = new Date(training.endDate + 'T00:00:00');
    endExclusive.setDate(endExclusive.getDate() + 1);
    const endExclusiveDate = endExclusive.toISOString().slice(0, 10);

    return {
      google: `https://calendar.google.com/calendar/render?${new URLSearchParams({
        action: 'TEMPLATE',
        text: training.title,
        dates: `${toICSDate(training.startDate)}/${toICSDate(endExclusiveDate)}`,
        details: buildEventDetails(training),
        location: training.location
      }).toString()}`,
      outlook: `https://outlook.office.com/calendar/0/deeplink/compose?${new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        startdt: training.startDate,
        enddt: endExclusiveDate,
        subject: training.title,
        body: buildEventDetails(training),
        location: training.location,
        allday: 'true'
      }).toString()}`
    };
  }

  function downloadICS(training) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtStart = toICSDate(training.startDate);
    const dtEndDate = new Date(training.endDate + 'T00:00:00');
    dtEndDate.setDate(dtEndDate.getDate() + 1);
    const dtEnd = dtEndDate.toISOString().slice(0, 10).replaceAll('-', '');

    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KYEM Mirror//Training Calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:kyem-training-${training.id}@kyem-mirror.local`, `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dtStart}`, `DTEND;VALUE=DATE:${dtEnd}`,
      `SUMMARY:${escapeICS(training.title)}`,
      `LOCATION:${escapeICS(training.location)}`,
      `DESCRIPTION:${escapeICS(buildEventDetails(training))}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${training.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function openRegistration(training) {
    intendedCourse = `${training.title} (${formatDate(training.startDate)}-${formatDate(training.endDate)})`;
    classSearch = '';
    selectedClassId = '';
    showRegistrationModal = true;
  }

  function closeRegistration() {
    showRegistrationModal = false;
  }

  function submitRegistrationSelection() {
    if (!selectedClassId) return;
    closeRegistration();
  }

  const inQuery = (training) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [training.title, training.audience, training.location, training.other, training.startDate, training.endDate].join(' ').toLowerCase().includes(q);
  };

  $: filtered = trainings.filter((training) => {
    const regionMatch = selectedRegion === 'All' || training.region === selectedRegion;
    const modeMatch = selectedMode === 'All' || training.mode === selectedMode;
    const dateMatch = selectedDate === 'All dates' || training.startDate === selectedDate;
    return regionMatch && modeMatch && dateMatch && inQuery(training);
  });

  $: searchableClassOptions = trainings.filter((training) => {
    const q = classSearch.trim().toLowerCase();
    return !q || `${training.title} ${training.location} ${training.startDate}`.toLowerCase().includes(q);
  });

  $: catalogClasses = trainings.filter((training) => {
    const q = catalogSearch.trim().toLowerCase();
    return !q || `${training.title} ${training.location} ${training.startDate} ${training.region}`.toLowerCase().includes(q);
  });
</script>

<main class="layout">
  <header>
    <p class="eyebrow">Unofficial prototype</p>
    <h1>Kentucky Emergency Management Training Calendar</h1>
    <p class="intro">You can now see calendar buttons directly on each card, and all classes are always accessible in the full catalog section below.</p>
  </header>

  <section class="controls" aria-label="Filter trainings">
    <label>Search<input bind:value={query} placeholder="Search by course, audience, location, notes, or date" /></label>
    <label>Region<select bind:value={selectedRegion}>{#each regions as region}<option value={region}>{region}</option>{/each}</select></label>
    <label>Delivery mode<select bind:value={selectedMode}>{#each modes as mode}<option value={mode}>{mode}</option>{/each}</select></label>
    <label>Start date<select bind:value={selectedDate}>{#each allAvailableDates as date}<option value={date}>{date === 'All dates' ? date : formatDate(date)}</option>{/each}</select></label>
    <button class="reset-btn" on:click={resetFilters}>Clear filters</button>
  </section>

  <p class="summary">Filtered view: {filtered.length} of {trainings.length} classes · Updated {formatDate(today)}</p>

  <section class="cards" aria-label="Filtered class cards with calendar actions">
    {#if filtered.length === 0}
      <p class="empty">No matching trainings found. Use “Clear filters” to show all classes.</p>
    {:else}
      {#each filtered as t}
        <article class="card">
          <h3>{t.title}</h3>
          <p class="meta">{formatDate(t.startDate)}–{formatDate(t.endDate)} · {t.region} · {t.mode}</p>
          <p class="location">{t.location}</p>
          <div class="actions-row">
            <button class="register-btn" on:click={() => openRegistration(t)}>Register</button>
            <details class="calendar-nested">
              <summary class="calendar-summary">Add to calendar</summary>
              <div class="calendar-menu">
                <button class="calendar-btn apple" on:click={() => downloadICS(t)}> Apple Calendar (.ics)</button>
                <a class="calendar-btn google" href={getCalendarUrls(t).google} target="_blank" rel="noopener noreferrer">G Google Calendar</a>
                <a class="calendar-btn outlook" href={getCalendarUrls(t).outlook} target="_blank" rel="noopener noreferrer">O Outlook</a>
              </div>
            </details>
          </div>
        </article>
      {/each}
    {/if}
  </section>

  <section class="catalog" aria-label="All available classes in mock">
    <h2>All classes in this mock ({trainings.length})</h2>
    <input bind:value={catalogSearch} placeholder="Search all classes (always full list)" />
    <ul>
      {#each catalogClasses as t}
        <li>{formatDate(t.startDate)} — <strong>{t.title}</strong> ({t.location})</li>
      {/each}
    </ul>
  </section>
</main>

{#if showRegistrationModal}
  <div class="modal-backdrop" role="presentation" on:click={closeRegistration}></div>
  <section class="modal" role="dialog" aria-modal="true" aria-label="Choose class before registration">
    <h2>Confirm class selection before registration</h2>
    <p>You clicked: <strong>{intendedCourse}</strong></p>
    <p class="warning">Class selection is intentionally not pre-filled. Please search and select a class.</p>
    <label>Search classes<input bind:value={classSearch} placeholder="Type course, county, or date" /></label>
    <label>Choose class *
      <select bind:value={selectedClassId}>
        <option value="">-- Select class from search results --</option>
        {#each searchableClassOptions as t}
          <option value={t.id}>{formatDate(t.startDate)} — {t.title}, {t.location}</option>
        {/each}
      </select>
    </label>
    <div class="modal-actions">
      <button on:click={closeRegistration}>Cancel</button>
      <button class="primary" on:click={submitRegistrationSelection} disabled={!selectedClassId}>Continue to registration</button>
    </div>
  </section>
{/if}

<style>
  .layout { max-width: 1100px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 12px 32px rgba(0,0,0,.1); padding: 1.25rem; }
  .eyebrow { text-transform: uppercase; letter-spacing: .08em; color: #35578a; font-size: .75rem; margin: 0; }
  h1 { margin: .25rem 0 .5rem; }
  .intro { margin: 0 0 .9rem; }
  .controls { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: .6rem; align-items: end; }
  label { display: grid; gap: .35rem; font-size: .9rem; color: #1f3350; }
  input, select { padding: .58rem; border: 1px solid #c5d0df; border-radius: 8px; font: inherit; }
  .reset-btn { height: 40px; border: 1px solid #b7c9e2; border-radius: 8px; background: #f4f9ff; cursor: pointer; }
  .summary { color: #425b80; margin: .75rem 0; }
  .cards { display: grid; grid-template-columns: 1fr; gap: .7rem; }
  .card { border: 1px solid #dce6f2; border-radius: 10px; padding: .75rem; background: #fbfdff; }
  .card h3 { margin: 0 0 .25rem; }
  .meta, .location { margin: .1rem 0; color: #4d6380; }
  .actions-row { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .55rem; align-items: flex-start; }
  .register-btn, .calendar-btn { border-radius: 999px; padding: .35rem .7rem; font-weight: 600; border: 1px solid; text-decoration: none; }
  .register-btn { border-color: #0f5db0; background: #1c73d3; color: #fff; }

  .calendar-nested { position: relative; }
  .calendar-summary { list-style: none; border: 1px solid #8fb0d8; background: #f3f8ff; color: #113b68; border-radius: 999px; padding: .35rem .7rem; font-weight: 600; cursor: pointer; }
  .calendar-summary::-webkit-details-marker { display: none; }
  .calendar-menu { margin-top: .4rem; display: flex; flex-direction: column; gap: .35rem; min-width: 230px; background: #fff; border: 1px solid #dce6f2; border-radius: 10px; padding: .45rem; box-shadow: 0 8px 24px rgba(0,0,0,.12); }
  .calendar-btn.apple { border-color: #d8d8db; background: #f7f7f8; color: #111; }
  .calendar-btn.google { border-color: #8fb0d8; background: #f3f8ff; color: #113b68; }
  .calendar-btn.outlook { border-color: #8fb0d8; background: #eef6ff; color: #0a3f73; }
  .empty { color: #5d6e87; }
  .catalog { margin-top: 1rem; border-top: 1px solid #e4ecf6; padding-top: .8rem; }
  .catalog ul { margin: .5rem 0 0; padding-left: 1rem; }

  .modal-backdrop { position: fixed; inset: 0; background: rgba(8,23,48,.45); z-index: 40; }
  .modal { position: fixed; z-index: 50; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(680px, 92vw); background: #fff; border-radius: 12px; padding: 1rem; }
  .warning { background: #fff5e6; border: 1px solid #ffd9a3; border-radius: 8px; padding: .55rem; }
  .modal-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: .6rem; }
  .primary { background: #1c73d3; color: #fff; border: 1px solid #0f5db0; border-radius: 8px; }

  @media (max-width: 900px) { .controls { grid-template-columns: 1fr; } }
</style>
