# Google Apps Script webhook for KYEM Ops Tool

One script handles two payload types:
- **Org chart pushes** from the EOC Org Chart tool
- **Registration submissions** from the Training Calendar

---

## 1) Create the spreadsheet tabs

Create these tabs in your Google Sheet:

**For org chart:**
- `MasterContacts` — id, name, agency, title, email, phone
- `Assignments` — roleId, roleName, contactId, contactName, agency, title, email, phone
- `AssignmentHistory` — timestamp, roleId, roleName, contactId, contactName

**For registrations:**
- `Registrations` — id, submittedAt, firstName, middleInitial, lastName, agency, title, phone, cell, email, state, county, beingPaid, paidBy, jobCategory, registrantType, selectedClass, accommodations, ageConfirmed, prereqAgreement

---

## 2) Apps Script code

In **Extensions → Apps Script**, paste this into `Code.gs` and set `SPREADSHEET_ID`.

```javascript
const SPREADSHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE';
const SECRET_TOKEN = ''; // optional: set a bearer token and require it below

function doPost(e) {
  try {
    const auth = (e.headers && (e.headers.Authorization || e.headers.authorization)) || '';
    if (SECRET_TOKEN && auth !== `Bearer ${SECRET_TOKEN}`) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }

    const payload = JSON.parse(e.postData.contents || '{}');

    // Route by payload type
    if (payload.type === 'registration') {
      appendRegistration(payload);
      return jsonResponse({ ok: true, type: 'registration', receivedAt: new Date().toISOString() }, 200);
    }

    // Default: org chart push
    if (!payload.masterContacts || !payload.assignments) {
      return jsonResponse({ ok: false, error: 'Invalid payload' }, 400);
    }
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    upsertContacts(ss, payload.masterContacts || []);
    writeAssignments(ss, payload.assignments || []);
    writeHistory(ss, payload.assignmentHistory || []);
    return jsonResponse({ ok: true, type: 'org-chart', receivedAt: new Date().toISOString() }, 200);

  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
}

// --- Registration handler ---

function appendRegistration(r) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const cols = ['id','submittedAtEastern','firstName','middleInitial','lastName','agency','title',
                 'phone','cell','email','state','county','beingPaid','paidBy','jobCategory',
                 'registrantType','selectedClass','accommodations','ageConfirmed','prereqAgreement'];
  const sh = getOrCreateSheet(ss, 'Registrations', cols);

  // Write header row if sheet is empty
  if (sh.getLastRow() === 0) {
    sh.appendRow(cols);
  }

  sh.appendRow(cols.map(k => r[k] !== undefined ? String(r[k]) : ''));
}

// --- Org chart handlers ---

function upsertContacts(ss, contacts) {
  const cols = ['id', 'name', 'agency', 'title', 'email', 'phone'];
  const sh = getOrCreateSheet(ss, 'MasterContacts', cols);
  sh.clearContents();
  sh.appendRow(cols);
  if (!contacts.length) return;
  sh.getRange(2, 1, contacts.length, cols.length)
    .setValues(contacts.map(c => cols.map(k => c[k] || '')));
}

function writeAssignments(ss, assignments) {
  const cols = ['roleId', 'roleName', 'contactId', 'contactName', 'agency', 'title', 'email', 'phone'];
  const sh = getOrCreateSheet(ss, 'Assignments', cols);
  sh.clearContents();
  sh.appendRow(cols);
  if (!assignments.length) return;
  sh.getRange(2, 1, assignments.length, cols.length)
    .setValues(assignments.map(a => cols.map(k => a[k] || '')));
}

function writeHistory(ss, history) {
  const cols = ['timestamp', 'roleId', 'roleName', 'contactId', 'contactName'];
  const sh = getOrCreateSheet(ss, 'AssignmentHistory', cols);
  sh.clearContents();
  sh.appendRow(cols);
  if (!history.length) return;
  sh.getRange(2, 1, history.length, cols.length)
    .setValues(history.map(h => cols.map(k => h[k] || '')));
}

// --- Helpers ---

function getOrCreateSheet(ss, name, cols) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function jsonResponse(obj, status) {
  return ContentService
    .createTextOutput(JSON.stringify({ ...obj, status }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

## 3) Deploy as web app

1. Click **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone** (required for the app to POST without OAuth)
5. Copy the deployment URL

---

## 4) Connect to the app

**Registrations webhook:**
Go to **Backend Docs** in the KYEM Ops Tool → paste the deployment URL into the **Registration → Google Sheet Webhook** field. Every training registration submitted will immediately append a row to the `Registrations` tab.

**Org chart webhook:**
Go to **Org Chart** → **Google Sheets Contact Sync** → paste the same URL into the **Apps Script Webhook URL** field and click **Push current data to webhook**.

Both use the same script — the `type` field in the payload routes them to the correct sheet.

---

## 5) Optional: bearer token auth

Set `SECRET_TOKEN` in Apps Script to a random string (e.g. `openssl rand -hex 16`). Set the same value in the app's **Bearer Token** field on both the Org Chart and Backend Docs pages.
