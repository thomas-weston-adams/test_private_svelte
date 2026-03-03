<script>
  import { onMount } from 'svelte';
  import trainings from './trainings.json';
  import OrgNode from './OrgNode.svelte';
  import { defaultAssignments, defaultMasterContacts, orgChart } from './orgChartData';

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

  // Backend docs: set these to your master Google Sheet and CSV publish URLs.
  const BACKEND_DOCS_SHEET_URL = '';
  const BACKEND_DOCS_CSV_URL = '';
  let submissionMessage = '';
  let submissionError = '';

  let showRegistrationModal = false;
  let intendedCourse = '';
  let classSearch = '';

  const counties = [
    'Adair', 'Allen', 'Anderson', 'Ballard', 'Barren', 'Bath', 'Bell', 'Boone', 'Bourbon', 'Boyd',
    'Boyle', 'Bracken', 'Breathitt', 'Breckinridge', 'Bullitt', 'Butler', 'Caldwell', 'Calloway', 'Campbell', 'Carlisle',
    'Carroll', 'Carter', 'Casey', 'Christian', 'Clark', 'Clay', 'Clinton', 'Crittenden', 'Cumberland', 'Daviess',
    'Edmonson', 'Elliott', 'Estill', 'Fayette', 'Fleming', 'Floyd', 'Franklin', 'Fulton', 'Gallatin', 'Garrard',
    'Grant', 'Graves', 'Grayson', 'Green', 'Greenup', 'Hancock', 'Hardin', 'Harlan', 'Harrison', 'Hart',
    'Henderson', 'Henry', 'Hickman', 'Hopkins', 'Jackson', 'Jefferson', 'Jessamine', 'Johnson', 'Kenton', 'Knott',
    'Knox', 'Larue', 'Laurel', 'Lawrence', 'Lee', 'Leslie', 'Letcher', 'Lewis', 'Lincoln', 'Livingston',
    'Logan', 'Lyon', 'McCracken', 'McCreary', 'McLean', 'Madison', 'Magoffin', 'Marion', 'Marshall', 'Martin',
    'Mason', 'Meade', 'Menifee', 'Mercer', 'Metcalfe', 'Monroe', 'Montgomery', 'Morgan', 'Muhlenberg', 'Nelson',
    'Nicholas', 'Ohio', 'Oldham', 'Owen', 'Owsley', 'Pendleton', 'Perry', 'Pike', 'Powell', 'Pulaski',
    'Robertson', 'Rockcastle', 'Rowan', 'Russell', 'Scott', 'Shelby', 'Simpson', 'Spencer', 'Taylor', 'Todd',
    'Trigg', 'Trimble', 'Union', 'Warren', 'Washington', 'Wayne', 'Webster', 'Whitley', 'Wolfe', 'Woodford'
  ];
  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida',
    'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
    'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island',
    'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];
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
    state: 'Kentucky',
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
    registrationForm.state &&
    registrationForm.county &&
    registrationForm.beingPaid &&
    registrationForm.jobCategory &&
    registrationForm.registrantType &&
    registrationForm.selectedClassId &&
    registrationForm.ageConfirmed &&
    registrationForm.prereqAgreement;


  let currentPage = 'home';
  let selectedRoleId = orgChart.id;
  let zoom = 65;

  let masterContacts = [...defaultMasterContacts];
  let assignmentsByRole = { ...defaultAssignments };
  let assignmentHistory = [];
  let contactForm = { id: '', name: '', agency: '', title: '', email: '', phone: '' };
  let googleContactsCsvUrl = '';
  let googlePushWebhookUrl = '';
  let googleSyncMessage = '';
  let googleSyncError = '';
  let googleWebhookToken = '';

  let ics203Form = {
    incidentName: 'Kentucky Emergency Operations Center',
    operationalPeriod: '',
    preparedBy: '',
    approvedBy: ''
  };

  const CONTACTS_KEY = 'eoc-master-contacts-v1';
  const ASSIGNMENTS_KEY = 'eoc-assignments-v1';
  const HISTORY_KEY = 'eoc-assignment-history-v1';
  const GOOGLE_CONTACTS_URL_KEY = 'eoc-google-contacts-csv-url-v1';
  const GOOGLE_PUSH_URL_KEY = 'eoc-google-push-webhook-url-v1';
  const GOOGLE_PUSH_TOKEN_KEY = 'eoc-google-push-token-v1';

  const flattenRoles = (node) => [node, ...node.children.flatMap(flattenRoles)];
  const roleList = flattenRoles(orgChart);
  const roleById = Object.fromEntries(roleList.map((role) => [role.id, role]));

  const toContactId = (name) => `contact-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

  $: contactsById = Object.fromEntries(masterContacts.map((contact) => [contact.id, contact]));
  $: selectedRole = roleById[selectedRoleId] || orgChart;
  $: selectedAssignedContact = contactsById[assignmentsByRole[selectedRole.id]];
  $: populatedRoles = roleList.filter((role) => Boolean(assignmentsByRole[role.id])).length;

  function setPage(page) {
    currentPage = page;
    const hashes = { 'org-chart': '#org-chart', training: '#training', news: '#news', directory: '#directory', twitter: '#twitter', docs: '#docs' };
    window.location.hash = hashes[page] || '#home';
  }

  function handleRoleSelect(event) {
    selectedRoleId = event.detail.roleId;
    hydrateFormFromAssignedContact();
  }

  function hydrateFormFromAssignedContact() {
    if (selectedAssignedContact) {
      contactForm = { ...selectedAssignedContact };
      return;
    }

    contactForm = { id: '', name: '', agency: '', title: selectedRole.name, email: '', phone: '' };
  }

  function saveRoleAssignment() {
    if (!contactForm.name || !contactForm.email) return;

    const existing = masterContacts.find((contact) => contact.email.toLowerCase() === contactForm.email.toLowerCase());
    const savedContact = {
      ...contactForm,
      id: existing?.id || contactForm.id || toContactId(contactForm.name),
      title: contactForm.title || selectedRole.name
    };

    if (existing) {
      masterContacts = masterContacts.map((contact) => (contact.id === existing.id ? savedContact : contact));
    } else {
      masterContacts = [...masterContacts, savedContact];
    }

    assignmentsByRole = { ...assignmentsByRole, [selectedRole.id]: savedContact.id };
    assignmentHistory = [
      {
        timestamp: new Date().toISOString(),
        roleId: selectedRole.id,
        roleName: selectedRole.name,
        contactId: savedContact.id,
        contactName: savedContact.name
      },
      ...assignmentHistory
    ].slice(0, 200);
  }

  function clearAssignment() {
    const { [selectedRole.id]: removed, ...rest } = assignmentsByRole;
    assignmentsByRole = rest;
    hydrateFormFromAssignedContact();
  }

  function printOrgChart() {
    window.print();
  }

  function parseContactsCsv(csv) {
    const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
    if (!headerLine || lines.length === 0) return [];

    const headers = headerLine.split(',').map((h) => h.trim().toLowerCase());
    const getIndex = (name) => headers.findIndex((h) => h === name);

    const nameIndex = getIndex('name');
    const agencyIndex = getIndex('agency');
    const titleIndex = getIndex('title');
    const emailIndex = getIndex('email');
    const phoneIndex = getIndex('phone');

    if (nameIndex === -1 || emailIndex === -1) {
      throw new Error('CSV must include at least name and email columns.');
    }

    return lines
      .map((line) => line.split(',').map((cell) => cell.trim()))
      .filter((row) => row[nameIndex] && row[emailIndex])
      .map((row) => ({
        id: toContactId(row[nameIndex]),
        name: row[nameIndex],
        agency: agencyIndex >= 0 ? (row[agencyIndex] || '') : '',
        title: titleIndex >= 0 ? (row[titleIndex] || '') : '',
        email: row[emailIndex],
        phone: phoneIndex >= 0 ? (row[phoneIndex] || '') : ''
      }));
  }

  async function importContactsFromGoogleSheet() {
    googleSyncMessage = '';
    googleSyncError = '';

    if (!googleContactsCsvUrl) {
      googleSyncError = 'Add a Google Sheets CSV publish URL first.';
      return;
    }

    try {
      const response = await fetch(googleContactsCsvUrl);
      if (!response.ok) throw new Error(`Google sheet returned ${response.status}`);
      const csv = await response.text();
      const incoming = parseContactsCsv(csv);

      const mergedByEmail = new Map(masterContacts.map((contact) => [contact.email.toLowerCase(), contact]));
      incoming.forEach((contact) => mergedByEmail.set(contact.email.toLowerCase(), contact));
      masterContacts = [...mergedByEmail.values()];
      googleSyncMessage = `Imported ${incoming.length} contacts from Google Sheets.`;
    } catch (error) {
      googleSyncError = `Could not import contacts: ${error.message}`;
    }
  }

  async function pushContactsToGoogleSheet() {
    googleSyncMessage = '';
    googleSyncError = '';

    if (!googlePushWebhookUrl) {
      googleSyncError = 'Add an Apps Script webhook URL to push updates.';
      return;
    }

    try {
      const response = await fetch(googlePushWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(googleWebhookToken ? { Authorization: `Bearer ${googleWebhookToken}` } : {})
        },
        body: JSON.stringify(buildGoogleWebhookPayload())
      });
      if (!response.ok) throw new Error(`Webhook returned ${response.status}`);
      googleSyncMessage = 'Pushed current master contacts and assignments to Google webhook.';
    } catch (error) {
      googleSyncError = `Could not push to Google webhook: ${error.message}`;
    }
  }


  function buildAssignmentsSnapshot() {
    return roleList.map((role) => {
      const contact = contactsById[assignmentsByRole[role.id]];
      return {
        roleId: role.id,
        roleName: role.name,
        contactId: contact?.id || '',
        contactName: contact?.name || '',
        agency: contact?.agency || '',
        title: contact?.title || '',
        email: contact?.email || '',
        phone: contact?.phone || ''
      };
    });
  }

  function buildGoogleWebhookPayload() {
    return {
      version: '1.0',
      source: 'kyem-eoc-org-tool',
      sentAt: new Date().toISOString(),
      incident: ics203Form,
      masterContacts,
      assignments: buildAssignmentsSnapshot(),
      assignmentHistory
    };
  }

  function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function downloadIcs203Json() {
    const roster = roleList.map((role) => {
      const contact = contactsById[assignmentsByRole[role.id]];
      return {
        role: role.name,
        assignedName: contact?.name || '',
        agency: contact?.agency || '',
        title: contact?.title || '',
        email: contact?.email || '',
        phone: contact?.phone || ''
      };
    });

    const payload = {
      form: 'ICS-203-compatible-draft',
      incident: ics203Form,
      generatedAt: new Date().toISOString(),
      roster
    };

    downloadFile('ics-203-draft.json', JSON.stringify(payload, null, 2), 'application/json');
  }

  function downloadIcs207Csv() {
    const header = 'Role,Assigned Name,Agency,Email,Phone';
    const rows = roleList.map((role) => {
      const contact = contactsById[assignmentsByRole[role.id]];
      return [
        role.name,
        contact?.name || 'Vacant',
        contact?.agency || '',
        contact?.email || '',
        contact?.phone || ''
      ].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',');
    });

    downloadFile('ics-207-staffing.csv', [header, ...rows].join('\n'), 'text/csv;charset=utf-8');
  }

  onMount(() => {
    const syncPageFromHash = () => {
      const h = window.location.hash;
      currentPage = h === '#org-chart' ? 'org-chart'
        : h === '#training' ? 'training'
        : h === '#news' ? 'news'
        : h === '#directory' ? 'directory'
        : h === '#twitter' || h === '#x' ? 'twitter'
        : h === '#docs' ? 'docs'
        : 'home';
    };

    syncPageFromHash();
    window.addEventListener('hashchange', syncPageFromHash);

    const storedContacts = localStorage.getItem(CONTACTS_KEY);
    const storedAssignments = localStorage.getItem(ASSIGNMENTS_KEY);
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    const storedGoogleContactsUrl = localStorage.getItem(GOOGLE_CONTACTS_URL_KEY);
    const storedGooglePushUrl = localStorage.getItem(GOOGLE_PUSH_URL_KEY);
    const storedGooglePushToken = localStorage.getItem(GOOGLE_PUSH_TOKEN_KEY);

    if (storedContacts) masterContacts = JSON.parse(storedContacts);
    if (storedAssignments) assignmentsByRole = JSON.parse(storedAssignments);
    if (storedHistory) assignmentHistory = JSON.parse(storedHistory);
    if (storedGoogleContactsUrl) googleContactsCsvUrl = storedGoogleContactsUrl;
    if (storedGooglePushUrl) googlePushWebhookUrl = storedGooglePushUrl;
    if (storedGooglePushToken) googleWebhookToken = storedGooglePushToken;

    hydrateFormFromAssignedContact();

    return () => window.removeEventListener('hashchange', syncPageFromHash);
  });

  $: if (currentPage === 'org-chart') {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(masterContacts));
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignmentsByRole));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(assignmentHistory));
    localStorage.setItem(GOOGLE_CONTACTS_URL_KEY, googleContactsCsvUrl);
    localStorage.setItem(GOOGLE_PUSH_URL_KEY, googlePushWebhookUrl);
    localStorage.setItem(GOOGLE_PUSH_TOKEN_KEY, googleWebhookToken);
  }
</script>

<nav class="page-nav" aria-label="Application pages">
  <a href="#home" class:active={currentPage === 'home'} on:click|preventDefault={() => setPage('home')}>Home</a>
  <a href="#training" class:active={currentPage === 'training'} on:click|preventDefault={() => setPage('training')}>Training</a>
  <a href="#org-chart" class:active={currentPage === 'org-chart'} on:click|preventDefault={() => setPage('org-chart')}>Org Chart</a>
  <a href="#news" class:active={currentPage === 'news'} on:click|preventDefault={() => setPage('news')}>News</a>
  <a href="#directory" class:active={currentPage === 'directory'} on:click|preventDefault={() => setPage('directory')}>Directory</a>
  <a href="#twitter" class:active={currentPage === 'twitter'} on:click|preventDefault={() => setPage('twitter')}>Twitter/X</a>
  <a href="#docs" class:active={currentPage === 'docs'} on:click|preventDefault={() => setPage('docs')}>Backend Docs</a>
</nav>

{#if currentPage === 'home'}
  <main class="layout home-layout">
    <header>
      <p class="eyebrow">START PAGE</p>
      <h1>KYEM Operations Workspace</h1>
      <p class="intro">Use this central hub to access current tools, and we can add more pages over time.</p>
    </header>

    <section class="home-grid" aria-label="Workspace pages">
      <article class="home-card">
        <h2>Training Site</h2>
        <p>Training calendar, registration workflow, and class filters.</p>
        <a href="#training" on:click|preventDefault={() => setPage('training')}>Open Training Page</a>
      </article>

      <article class="home-card">
        <h2>Org Chart Tool</h2>
        <p>Interactive EOC staffing chart with contacts, history, and print output.</p>
        <a href="#org-chart" on:click|preventDefault={() => setPage('org-chart')}>Open Org Chart Page</a>
      </article>

      <article class="home-card">
        <h2>News</h2>
        <p>Latest Kentucky Emergency Management news and announcements.</p>
        <a href="#news" on:click|preventDefault={() => setPage('news')}>Open News</a>
      </article>

      <article class="home-card">
        <h2>Directory</h2>
        <p>Contact directory for KYEM partners and agency personnel.</p>
        <a href="#directory" on:click|preventDefault={() => setPage('directory')}>Open Directory</a>
      </article>

      <article class="home-card">
        <h2>Twitter / X</h2>
        <p>KYEM official social media feed and announcements.</p>
        <a href="#twitter" on:click|preventDefault={() => setPage('twitter')}>Open Twitter/X</a>
      </article>

      <article class="home-card">
        <h2>Backend Docs</h2>
        <p>Developer guides, master sheet links, and integration documentation.</p>
        <a href="#docs" on:click|preventDefault={() => setPage('docs')}>Open Docs</a>
      </article>
    </section>
  </main>
{:else if currentPage === 'org-chart'}
  <main class="layout org-layout">
    <header>
      <p class="eyebrow">EOC TOOLING PROTOTYPE</p>
      <h1>Kentucky Emergency Management Org Chart</h1>
      <p class="intro">Clickable, updateable role chart with assignment history, master contact sync, and print-ready output for reports/IAPs.</p>
    </header>

    <section class="org-toolbar no-print" aria-label="Org chart controls">
      <p><strong>{populatedRoles}</strong> / {roleList.length} roles currently staffed</p>
      <label>Zoom ({zoom}%) <input type="range" min="60" max="130" step="5" bind:value={zoom} /></label>
      <button type="button" on:click={printOrgChart}>Print / Save PDF</button>
    </section>

    <section class="google-sync no-print" aria-label="Google Sheets sync">
      <h2>Google Sheets Contact Sync</h2>
      <p class="hint">Publish your contacts sheet as CSV (name,agency,title,email,phone), then paste the URL below.</p>
      <label>Google Sheet CSV URL<input bind:value={googleContactsCsvUrl} placeholder="https://docs.google.com/.../pub?output=csv" /></label>
      <label>Apps Script Webhook URL (optional)<input bind:value={googlePushWebhookUrl} placeholder="https://script.google.com/macros/s/.../exec" /></label>
      <label>Webhook Bearer Token (optional)<input bind:value={googleWebhookToken} placeholder="shared secret token" /></label>
      <div class="panel-actions">
        <button type="button" on:click={importContactsFromGoogleSheet}>Import from Google Sheet</button>
        <button type="button" on:click={pushContactsToGoogleSheet}>Push current data to webhook</button>
      </div>
      <p class="hint">Webhook payload includes: incident metadata, master contacts, assignments snapshot, and assignment history.</p>
      <p class="hint">Apps Script setup guide: <code>docs/google-apps-script-webhook.md</code></p>
      {#if googleSyncMessage}<p class="submit-status">{googleSyncMessage}</p>{/if}
      {#if googleSyncError}<p class="submit-error">{googleSyncError}</p>{/if}
    </section>

    <section class="ics-tools no-print" aria-label="ICS forms exports">
      <h2>ICS 203 / 207 Compatibility</h2>
      <div class="ics-grid">
        <label>Incident Name<input bind:value={ics203Form.incidentName} /></label>
        <label>Operational Period<input bind:value={ics203Form.operationalPeriod} placeholder="e.g. 2026-03-02 0800 to 2000" /></label>
        <label>Prepared By<input bind:value={ics203Form.preparedBy} /></label>
        <label>Approved By<input bind:value={ics203Form.approvedBy} /></label>
      </div>
      <div class="panel-actions">
        <button type="button" on:click={downloadIcs203Json}>Download ICS 203 JSON</button>
        <button type="button" on:click={downloadIcs207Csv}>Download ICS 207 CSV</button>
      </div>
    </section>

    <div class="org-two-col">
      <section class="chart-wrap" aria-label="Organizational chart">
        <p class="chart-tip no-print">Tip: rotate your phone to landscape for a wider chart view.</p>
        <div class="chart-scale" style={`--chart-zoom: ${zoom / 100}`}>
          <ul class="tree">
            <OrgNode
              node={orgChart}
              selectedRoleId={selectedRoleId}
              assignmentsByRole={assignmentsByRole}
              contactsById={contactsById}
              on:selectrole={handleRoleSelect}
            />
          </ul>
        </div>
      </section>

      <aside class="role-panel no-print" aria-live="polite">
        <h2>Role Assignment</h2>
        <p><strong>Role:</strong> {selectedRole.name}</p>
        {#if selectedAssignedContact}
          <p class="assignment-state">Assigned to: <strong>{selectedAssignedContact.name}</strong></p>
        {:else}
          <p class="assignment-state vacant">Currently vacant</p>
        {/if}

        <form class="assign-form" on:submit|preventDefault={saveRoleAssignment}>
          <label>Name *<input bind:value={contactForm.name} required /></label>
          <label>Agency<input bind:value={contactForm.agency} /></label>
          <label>Role/Title<input bind:value={contactForm.title} /></label>
          <label>Email *<input type="email" bind:value={contactForm.email} required /></label>
          <label>Phone<input bind:value={contactForm.phone} /></label>
          <p class="hint">If email matches a master contact, this role uses that existing contact. Otherwise a new master contact is created.</p>
          <div class="panel-actions">
            <button type="submit" class="primary">Save assignment</button>
            <button type="button" on:click={clearAssignment}>Mark vacant</button>
          </div>
        </form>
      </aside>
    </div>

    <section class="assignment-report" aria-label="Current role assignments">
      <h2>Current Staffing Report (IAP-ready)</h2>
      <table>
        <thead><tr><th>Role</th><th>Assigned Person</th><th>Agency</th><th>Email</th><th>Phone</th></tr></thead>
        <tbody>
          {#each roleList as role}
            {@const contact = contactsById[assignmentsByRole[role.id]]}
            <tr>
              <td>{role.name}</td>
              <td>{contact?.name || 'Vacant'}</td>
              <td>{contact?.agency || ''}</td>
              <td>{contact?.email || ''}</td>
              <td>{contact?.phone || ''}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>

    <section class="master-contacts no-print" aria-label="Master contact sheet">
      <h2>Master Contact Sheet</h2>
      <p>This list is the source of truth used by all role assignments.</p>
      <table>
        <thead><tr><th>Name</th><th>Agency</th><th>Title</th><th>Email</th><th>Phone</th></tr></thead>
        <tbody>
          {#each masterContacts as contact}
            <tr>
              <td>{contact.name}</td><td>{contact.agency}</td><td>{contact.title}</td><td>{contact.email}</td><td>{contact.phone}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>

    <section class="assignment-history" aria-label="Assignment change history">
      <h2>Assignment Activity Log</h2>
      <table>
        <thead><tr><th>Time (UTC)</th><th>Role</th><th>Assigned to</th></tr></thead>
        <tbody>
          {#if assignmentHistory.length === 0}
            <tr><td colspan="3">No assignment updates yet.</td></tr>
          {:else}
            {#each assignmentHistory.slice(0, 20) as row}
              <tr><td>{row.timestamp}</td><td>{row.roleName}</td><td>{row.contactName}</td></tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </section>
  </main>
{:else if currentPage === 'training'}
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
      <label>State *
        <select bind:value={registrationForm.state} required>
          <option value="">-- Please select --</option>
          {#each states as st}<option value={st}>{st}</option>{/each}
        </select>
      </label>
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

{:else if currentPage === 'news'}
  <main class="layout home-layout">
    <header>
      <p class="eyebrow">NEWS</p>
      <h1>Kentucky Emergency Management News</h1>
      <p class="intro">Latest announcements, alerts, and updates from KYEM.</p>
    </header>
    <div class="embed-shell">
      <p class="hint">Embed a news feed or RSS widget here. Update <code>NEWS_FEED_URL</code> in App.svelte to connect a live source.</p>
    </div>
  </main>

{:else if currentPage === 'directory'}
  <main class="layout home-layout">
    <header>
      <p class="eyebrow">DIRECTORY</p>
      <h1>KYEM Agency Directory</h1>
      <p class="intro">Contact directory for KYEM partners and agency personnel.</p>
    </header>
    <div class="embed-shell">
      <p class="hint">Connect to the master contacts Google Sheet or embed a directory widget here. Update <code>BACKEND_DOCS_SHEET_URL</code> in App.svelte to link a live source.</p>
      {#if BACKEND_DOCS_SHEET_URL}
        <a href={BACKEND_DOCS_SHEET_URL} target="_blank" rel="noopener noreferrer" class="doc-link">Open Directory Sheet</a>
      {/if}
    </div>
  </main>

{:else if currentPage === 'twitter'}
  <main class="layout home-layout">
    <header>
      <p class="eyebrow">TWITTER / X</p>
      <h1>KYEM Social Media Feed</h1>
      <p class="intro">Official Kentucky Emergency Management Twitter/X feed and social announcements.</p>
    </header>
    <div class="embed-shell">
      <p class="hint">Embed the official KYEM Twitter/X timeline widget here. Update <code>TWITTER_HANDLE</code> in App.svelte and add the Twitter embed script.</p>
    </div>
  </main>

{:else if currentPage === 'docs'}
  <main class="layout home-layout">
    <header>
      <p class="eyebrow">BACKEND DOCS</p>
      <h1>Backend Documentation</h1>
      <p class="intro">Developer guides, master sheet links, and integration documentation.</p>
    </header>
    <div class="docs-grid">
      {#if BACKEND_DOCS_SHEET_URL}
        <article class="home-card">
          <h2>Master Google Sheet</h2>
          <p>Primary data source for contacts and assignments.</p>
          <a href={BACKEND_DOCS_SHEET_URL} target="_blank" rel="noopener noreferrer" class="doc-link">Open Sheet</a>
        </article>
      {/if}
      {#if BACKEND_DOCS_CSV_URL}
        <article class="home-card">
          <h2>CSV Export</h2>
          <p>Published CSV endpoint for programmatic access.</p>
          <a href={BACKEND_DOCS_CSV_URL} target="_blank" rel="noopener noreferrer" class="doc-link">Open CSV</a>
        </article>
      {/if}
      <article class="home-card">
        <h2>Google Apps Script Webhook</h2>
        <p>Setup guide for the Apps Script push webhook integration.</p>
        <code>docs/google-apps-script-webhook.md</code>
      </article>
      <article class="home-card">
        <h2>Registration API</h2>
        <p>Connect a registration database via the <code>REGISTRATION_API_URL</code> constant in App.svelte.</p>
      </article>
    </div>
  </main>

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

  .page-nav { max-width: 1300px; margin: 1rem auto .5rem; display: flex; gap: .5rem; }
  .page-nav a { text-decoration: none; border: 1px solid #c5d0df; border-radius: 999px; padding: .35rem .8rem; color: #184778; background: #fff; }
  .page-nav a.active { background: #e7f1ff; border-color: #8fb0d8; font-weight: 600; }

  .home-layout { min-height: 62vh; }
  .home-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .8rem; }
  .home-card { border: 1px solid #d7e0ec; border-radius: 10px; padding: .9rem; background: #fbfdff; }
  .home-card h2 { margin-top: 0; }
  .home-card a { display: inline-block; margin-top: .4rem; text-decoration: none; border: 1px solid #0f5db0; border-radius: 8px; padding: .35rem .55rem; color: #0f5db0; }
  .embed-shell { border: 1px solid #d7e0ec; border-radius: 10px; padding: 1rem; background: #fbfdff; min-height: 200px; }
  .docs-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .8rem; }
  .doc-link { display: inline-block; margin-top: .4rem; text-decoration: none; border: 1px solid #0f5db0; border-radius: 8px; padding: .35rem .55rem; color: #0f5db0; }

  .org-layout { overflow: hidden; }
  .org-toolbar { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: .75rem; }
  .org-toolbar p { margin: 0; }
  .google-sync, .ics-tools { border: 1px solid #d7e0ec; border-radius: 10px; padding: .75rem; margin-bottom: .8rem; background: #fbfdff; }
  .google-sync h2, .ics-tools h2 { margin: 0 0 .35rem; font-size: 1rem; }
  .ics-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: .5rem; }
  .chart-tip { margin: 0 0 .4rem; color: #425b80; font-size: .86rem; }
  .org-two-col { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: .8rem; align-items: start; }
  .chart-wrap { overflow: auto; padding: .5rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; max-height: 70vh; }
  .chart-scale { transform: scale(var(--chart-zoom)); transform-origin: top left; width: calc(100% / var(--chart-zoom)); min-width: 980px; }
  .tree { margin: 0 auto; padding: 0; display: table; }
  :global(.tree ul) { margin: 0; padding: 0; display: table; }
  .role-panel { border: 1px solid #d7e0ec; border-radius: 10px; padding: .75rem; background: #fbfdff; }
  .role-panel h2 { margin-top: 0; }
  .assign-form { display: grid; gap: .45rem; }
  .hint { color: #5a6f8d; font-size: .82rem; margin: .25rem 0; }
  .panel-actions { display: flex; gap: .4rem; flex-wrap: wrap; }
  .assignment-state { color: #1d5f36; }
  .assignment-state.vacant { color: #b45309; }
  .assignment-report, .master-contacts, .assignment-history { margin-top: 1rem; }
  .assignment-report table, .master-contacts table, .assignment-history table { width: 100%; min-width: 800px; border-collapse: collapse; }
  .assignment-report th, .assignment-report td, .master-contacts th, .master-contacts td, .assignment-history th, .assignment-history td { border-bottom: 1px solid #e6edf6; padding: .45rem; text-align: left; font-size: .95rem; }

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
    .org-two-col { grid-template-columns: 1fr; }
    .home-grid { grid-template-columns: 1fr; }
    .docs-grid { grid-template-columns: 1fr; }
    .ics-grid { grid-template-columns: 1fr; }
    .role-panel { order: -1; }
    .chart-scale { min-width: 760px; }
  }

  @media (max-width: 900px) and (orientation: portrait) {
    .chart-scale { min-width: 900px; }
  }

  @media (max-width: 900px) and (orientation: landscape) {
    .chart-scale { min-width: 700px; }
  }

  @media print {
    .no-print, .page-nav { display: none !important; }
    :global(body) { background: white; }
    .layout { box-shadow: none; border: 0; padding: 0; max-width: none; }
    .chart-wrap { max-height: none; overflow: visible; border: 0; }
    .chart-scale { transform: scale(.78); transform-origin: top left; width: 128%; }
  }
</style>
