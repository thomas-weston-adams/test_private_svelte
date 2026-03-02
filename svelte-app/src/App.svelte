<script>
  import trainings from './trainings.json';

  const easternIsoFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' });
  const easternDateFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York' });
  const today = easternIsoFormatter.format(new Date());
  let query = '';
  let selectedRegion = 'All';
  let selectedMode = 'All';
  let selectedDate = 'All dates';

  // Set this to your deployed registration API endpoint to persist submissions.
  // Keep empty to use local JSON download fallback.
  const REGISTRATION_API_URL = '';
  let submissionMessage = '';
  let submissionError = '';

  let showRegistrationModal = false;
  let intendedCourse = '';
  let classSearch = '';

  const counties = ['Adair', 'Boyd', 'Campbell', 'Fayette', 'Franklin', 'Jefferson', 'Perry', 'Rowan', 'Warren'];
  const payOptions = ['No', 'Yes'];
  const payers = ['Self', 'Agency', 'Grant', 'Other'];
  const jobCategories = ['Emergency Management', 'Fire', 'Law Enforcement', 'Public Health', 'Healthcare', 'Public Works', 'Volunteer'];
  const registrantTypes = ['County Official', 'Local EM', 'State Agency', 'Federal Partner', 'Nonprofit', 'Private Sector', 'Other'];

  const emptyForm = {
    firstName: '',
    middleInitial: '',
    lastName: '',
    agency: '',
    title: '',
    phone: '',
    cell: '',
    email: '',
    county: '',
    beingPaid: '',
    paidBy: '',
    jobCategory: '',
    registrantType: '',
    selectedClassId: '',
    accommodations: '',
    ageConfirmed: '',
    prereqAgreement: false
  };

  let registrationForm = { ...emptyForm };

  const regions = ['All', ...new Set(trainings.map((t) => t.region))];
  const modes = ['All', ...new Set(trainings.map((t) => t.mode))];
  const allAvailableDates = ['All dates', ...new Set(trainings.map((t) => t.startDate).sort())];

  const formatDate = (dateString) => {
    const [y, m, d] = dateString.split('-').map(Number);
    return easternDateFormatter.format(new Date(Date.UTC(y, m - 1, d, 12)));
  };
  const toICSDate = (dateString) => dateString.replaceAll('-', '');
  const escapeICS = (value) => String(value).replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll('\n', '\\n');

  function addDaysToIsoDate(isoDate, days) {
    const [y, m, d] = isoDate.split('-').map(Number);
    const localDate = new Date(y, m - 1, d);
    localDate.setDate(localDate.getDate() + days);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function clearFilters() {
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
    const endExclusiveDate = addDaysToIsoDate(training.endDate, 1);

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
    const dtEnd = toICSDate(addDaysToIsoDate(training.endDate, 1));

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
    registrationForm = { ...emptyForm };
    showRegistrationModal = true;
  }

  async function handleRegistrationSubmit() {
    submissionMessage = '';
    submissionError = '';

    const selectedClass = trainings.find((t) => String(t.id) === registrationForm.selectedClassId);
    const payload = {
      ...registrationForm,
      selectedClassId: registrationForm.selectedClassId,
      selectedClass: selectedClass ? `${selectedClass.title} - ${selectedClass.location}` : '',
      submittedAtEastern: today
    };

    if (REGISTRATION_API_URL) {
      try {
        const response = await fetch(REGISTRATION_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Registration API returned ${response.status}`);
        }

        submissionMessage = 'Registration submitted to connected class database.';
        showRegistrationModal = false;
        return;
      } catch (error) {
        submissionError = 'Could not submit to the connected database. Downloading draft JSON instead.';
      }
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kyem-registration-${registrationForm.lastName || 'draft'}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    submissionMessage = 'Registration exported as JSON draft (API not connected yet).';
    showRegistrationModal = false;
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

  $: isFormValid =
    registrationForm.firstName &&
    registrationForm.lastName &&
    registrationForm.agency &&
    registrationForm.title &&
    registrationForm.phone &&
    registrationForm.email &&
    registrationForm.county &&
    registrationForm.beingPaid &&
    registrationForm.jobCategory &&
    registrationForm.registrantType &&
    registrationForm.selectedClassId &&
    registrationForm.ageConfirmed &&
    registrationForm.prereqAgreement;
</script>

<a class="skip-link" href="#results">Skip to training results</a>

<main class="layout">
  <header>
    <p class="eyebrow">UNOFFICIAL PROTOTYPE</p>
    <h1>Kentucky Emergency Management Training Calendar</h1>
    <p class="intro">Integrated training and registration prototype with ADA-focused form structure.</p>
    <p class="intro-note">This prototype replaces the legacy look/feel by keeping the registration fields in an accessible in-app dialog connected directly to the selected training workflow.</p>
  </header>

  <section class="controls" aria-label="Filter trainings">
    <label>Search<input bind:value={query} placeholder="Search by course, audience, location, notes, or date" /></label>
    <label>Region<select bind:value={selectedRegion}>{#each regions as region}<option value={region}>{region}</option>{/each}</select></label>
    <label>Delivery mode<select bind:value={selectedMode}>{#each modes as mode}<option value={mode}>{mode}</option>{/each}</select></label>
    <label>Start date<select bind:value={selectedDate}>{#each allAvailableDates as date}<option value={date}>{date === 'All dates' ? date : formatDate(date)}</option>{/each}</select></label>
  </section>

  <div class="dates-row">
    {#each allAvailableDates.slice(1) as date}
      <button class:selected={selectedDate === date} on:click={() => (selectedDate = date)}>{formatDate(date)}</button>
    {/each}
    <button on:click={clearFilters}>Show all</button>
  </div>

  <p class="summary" role="status" aria-live="polite">Showing {filtered.length} of {trainings.length} trainings · Updated {formatDate(today)} (Eastern)</p>

  {#if submissionMessage}<p class="submit-status" role="status" aria-live="polite">{submissionMessage}</p>{/if}
  {#if submissionError}<p class="submit-error" role="alert">{submissionError}</p>{/if}

  <section id="results" class="table-wrap" aria-label="Training results">
    <table>
      <caption class="sr-only">KYEM training results with registration and calendar actions</caption>
      <thead>
        <tr><th scope="col">Course</th><th scope="col">Dates</th><th scope="col">Region</th><th scope="col">Location</th><th scope="col">Tuition</th><th scope="col">Other costs / notes</th><th scope="col">Status</th><th scope="col">Registration</th><th scope="col">Calendar</th></tr>
      </thead>
      <tbody>
        {#if filtered.length === 0}
          <tr><td colspan="9" class="empty">No matching trainings found.</td></tr>
        {:else}
          {#each filtered as t}
            <tr>
              <td data-label="Course"><strong>{t.title}</strong><div class="meta">{t.audience} · {t.mode}</div></td>
              <td data-label="Dates">{formatDate(t.startDate)}–{formatDate(t.endDate)}</td>
              <td data-label="Region">{t.region}</td>
              <td data-label="Location">{t.location}</td>
              <td data-label="Tuition">{t.tuition}</td>
              <td data-label="Other costs / notes">{t.other}</td>
              <td data-label="Status"><span class="badge">{t.registration}</span></td>
              <td data-label="Registration"><button type="button" class="register-btn" on:click={() => openRegistration(t)}>Register</button></td>
              <td data-label="Calendar">
                <details class="calendar-nested">
                  <summary class="calendar-summary">Add to calendar</summary>
                  <div class="calendar-menu">
                    <button type="button" class="calendar-btn apple" on:click={() => downloadICS(t)}> Apple (.ics)</button>
                    <a class="calendar-btn google" href={getCalendarUrls(t).google} target="_blank" rel="noopener noreferrer">G Google</a>
                    <a class="calendar-btn outlook" href={getCalendarUrls(t).outlook} target="_blank" rel="noopener noreferrer">O Outlook</a>
                  </div>
                </details>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </section>
</main>

{#if showRegistrationModal}
  <div class="modal-backdrop" role="presentation" on:click={() => (showRegistrationModal = false)}></div>
  <section class="modal" role="dialog" aria-modal="true" aria-labelledby="registration-modal-title" aria-describedby="registration-modal-desc">
    <button type="button" class="close-modal" aria-label="Close registration dialog" on:click={() => (showRegistrationModal = false)}>×</button>
    <h2 id="registration-modal-title">KYEM Registration (Prototype Replacement for Logiforms)</h2>
    <p>You clicked: <strong>{intendedCourse}</strong></p>
    <p id="registration-modal-desc" class="warning">Class is intentionally not prefilled. Search and select from the class list below.</p>
    <p class="destination">Data destination: {REGISTRATION_API_URL ? 'Connected registration database (API)' : 'Local JSON draft download (no live database connected yet)'}</p>

    <form class="reg-grid" on:submit|preventDefault={handleRegistrationSubmit}>
      <label>First Name *<input bind:value={registrationForm.firstName} required /></label>
      <label>MI<input maxlength="1" bind:value={registrationForm.middleInitial} /></label>
      <label>Last Name *<input bind:value={registrationForm.lastName} required /></label>

      <label>Agency *<input bind:value={registrationForm.agency} required /></label>
      <label>Title *<input bind:value={registrationForm.title} required /></label>

      <label>Phone *<input bind:value={registrationForm.phone} required /></label>
      <label>Cell<input bind:value={registrationForm.cell} /></label>

      <label>Email *<input type="email" bind:value={registrationForm.email} required /></label>
      <label>County *
        <select bind:value={registrationForm.county} required>
          <option value="">-- Please select --</option>
          {#each counties as c}<option value={c}>{c}</option>{/each}
        </select>
      </label>

      <label>Being paid to attend? *
        <select bind:value={registrationForm.beingPaid} required>
          <option value="">-- Please select --</option>
          {#each payOptions as opt}<option value={opt}>{opt}</option>{/each}
        </select>
      </label>

      <label>If paid, by whom?
        <select bind:value={registrationForm.paidBy}>
          <option value="">-- Please select --</option>
          {#each payers as p}<option value={p}>{p}</option>{/each}
        </select>
      </label>

      <label>Job category *
        <select bind:value={registrationForm.jobCategory} required>
          <option value="">-- Please select --</option>
          {#each jobCategories as j}<option value={j}>{j}</option>{/each}
        </select>
      </label>

      <label>Registrant type *
        <select bind:value={registrationForm.registrantType} required>
          <option value="">-- Please select --</option>
          {#each registrantTypes as r}<option value={r}>{r}</option>{/each}
        </select>
      </label>

      <label class="full">Search classes<input bind:value={classSearch} placeholder="Type course, county, or date" /></label>
      <label class="full">Choose class *
        <select bind:value={registrationForm.selectedClassId} required>
          <option value="">-- Select class from search results --</option>
          {#each searchableClassOptions as t}
            <option value={String(t.id)}>{formatDate(t.startDate)} — {t.title}, {t.location}</option>
          {/each}
        </select>
      </label>

      <label class="full">Special accommodations / accessibility needs
        <textarea rows="4" bind:value={registrationForm.accommodations}></textarea>
      </label>

      <fieldset class="full inline">
        <legend>Age *</legend>
        <label><input type="radio" bind:group={registrationForm.ageConfirmed} value="over18" required /> I am over the age of 18.</label>
        <label><input type="radio" bind:group={registrationForm.ageConfirmed} value="under18" required /> I am under the age of 18.</label>
      </fieldset>

      <label class="full checkbox"><input type="checkbox" bind:checked={registrationForm.prereqAgreement} /> I agree to provide prerequisites and confirm information is accurate. *</label>

      <div class="modal-actions full">
        <button type="button" on:click={() => (showRegistrationModal = false)}>Cancel</button>
        <button type="submit" class="primary" disabled={!isFormValid}>Submit registration draft</button>
      </div>
    </form>
  </section>
{/if}

<style>
  .layout { max-width: 1300px; margin: 0 auto; background: #fff; border-radius: 14px; box-shadow: 0 12px 32px rgba(0,0,0,.1); padding: 1.5rem; }
  .eyebrow { text-transform: uppercase; letter-spacing: .08em; color: #35578a; }
  .skip-link { position: absolute; left: -9999px; top: auto; width: 1px; height: 1px; overflow: hidden; }
  .skip-link:focus { left: 1rem; top: 1rem; width: auto; height: auto; background: #fff; padding: .5rem .75rem; border: 2px solid #0f5db0; border-radius: 8px; z-index: 1000; }
  .controls { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: .75rem; }
  label { display: grid; gap: .35rem; color: #1f3350; }
  input, select, textarea { padding: .6rem; border: 1px solid #c5d0df; border-radius: 8px; font: inherit; }
  .dates-row { display: flex; flex-wrap: wrap; gap: .4rem; margin: .75rem 0; }
  .dates-row button { border: 1px solid #c5d0df; background: #fff; border-radius: 999px; padding: .26rem .6rem; }
  .dates-row button.selected { background: #e7f1ff; border-color: #8fb0d8; }
  .summary { color: #425b80; }
  .intro-note { color: #5a4c2a; background: #fff9ea; border: 1px solid #f1ddb0; border-radius: 8px; padding: .55rem; }

  .submit-status { color: #1d5f36; background: #eaf8ef; border: 1px solid #bfe5cb; border-radius: 8px; padding: .5rem .65rem; margin: .5rem 0; }
  .submit-error { color: #7a1c1c; background: #fff1f1; border: 1px solid #f3c2c2; border-radius: 8px; padding: .5rem .65rem; margin: .5rem 0; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); border: 0; }
  .table-wrap { overflow: auto; border: 1px solid #d7e0ec; border-radius: 10px; }
  table { width: 100%; border-collapse: collapse; min-width: 1200px; }
  th, td { padding: .75rem; border-bottom: 1px solid #e6edf6; text-align: left; vertical-align: top; }
  thead th { background: #f3f7fc; }
  .meta { color: #5d6e87; margin-top: .25rem; }
  .badge { background: #e7f1ff; color: #184778; padding: .2rem .5rem; border-radius: 999px; font-weight: 600; }
  .register-btn { border: 1px solid #0f5db0; background: #1c73d3; color: #fff; border-radius: 999px; padding: .35rem .7rem; }
  .calendar-summary { list-style: none; border: 1px solid #8fb0d8; background: #f3f8ff; color: #113b68; border-radius: 999px; padding: .35rem .7rem; font-weight: 600; cursor: pointer; }
  .calendar-summary::-webkit-details-marker { display: none; }
  .calendar-menu { margin-top: .4rem; display: flex; flex-direction: column; gap: .35rem; min-width: 180px; }
  .calendar-btn { border-radius: 999px; padding: .33rem .65rem; border: 1px solid; text-decoration: none; }
  .calendar-btn.apple { border-color: #d8d8db; background: #f7f7f8; color: #111; }
  .calendar-btn.google { border-color: #8fb0d8; background: #f3f8ff; color: #113b68; }
  .calendar-btn.outlook { border-color: #8fb0d8; background: #eef6ff; color: #0a3f73; }

  .modal-backdrop { position: fixed; inset: 0; background: rgba(8,23,48,.45); }
  .modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(980px, 95vw); max-height: 92vh; overflow: auto; background: #fff; border-radius: 12px; padding: 1rem; }
  .close-modal { position: absolute; top: .35rem; right: .45rem; border: 1px solid #ccd8ea; background: #fff; border-radius: 6px; width: 2rem; height: 2rem; font-size: 1.2rem; }
  .warning { background: #fff5e6; border: 1px solid #ffd9a3; border-radius: 8px; padding: .55rem; }
  .destination { color: #344f73; margin: .2rem 0 .8rem; }
  .reg-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .65rem; }
  .reg-grid .full { grid-column: 1 / -1; }
  .inline { border: 1px solid #dce6f2; border-radius: 8px; padding: .6rem; display: grid; gap: .55rem; }
  .inline label { display: flex; align-items: center; gap: .55rem; margin: 0; color: #1f3350; }
  .inline input[type='radio'] { margin: 0; width: 1rem; height: 1rem; flex: 0 0 auto; }
  .inline legend { padding: 0 .2rem; }
  .checkbox { display: flex; align-items: flex-start; gap: .5rem; }
  .modal-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: .6rem; }
  .primary { background: #1c73d3; color: #fff; border: 1px solid #0f5db0; border-radius: 8px; }

  button:focus-visible, a:focus-visible, summary:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 3px solid #0f5db0; outline-offset: 2px; }

  @media (max-width: 900px) {
    .layout { padding: 1rem; }
    .controls { grid-template-columns: 1fr; }
    .table-wrap { border: 0; }
    table, thead, tbody, tr, th, td { display: block; width: 100%; }
    thead { display: none; }
    tr { background: #fbfdff; border: 1px solid #dce6f2; border-radius: 10px; margin-bottom: .7rem; padding: .4rem; }
    td { border: 0; padding: .45rem .35rem; }
    td::before { content: attr(data-label); display: block; color: #5a6f8d; font-size: .8rem; margin-bottom: .12rem; }
    .reg-grid { grid-template-columns: 1fr; }
  }
</style>
