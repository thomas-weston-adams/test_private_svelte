# Google Apps Script webhook for EOC Org Tool

Use this to receive pushes from the org chart app and write to Google Sheets tabs.

## 1) Create the spreadsheet tabs
Create these tabs in your Google Sheet:
- `MasterContacts`
- `Assignments`
- `AssignmentHistory`

### Expected columns
`MasterContacts`
- id
- name
- agency
- title
- email
- phone

`Assignments`
- roleId
- roleName
- contactId
- contactName
- agency
- title
- email
- phone

`AssignmentHistory`
- timestamp
- roleId
- roleName
- contactId
- contactName

## 2) Apps Script code
In Extensions → Apps Script, paste this into `Code.gs` and set `SPREADSHEET_ID`.

```javascript
const SPREADSHEET_ID = 'PASTE_YOUR_SHEET_ID_HERE';
const SECRET_TOKEN = ''; // optional: set and require bearer token

function doPost(e) {
  try {
    const auth = (e.headers && (e.headers.Authorization || e.headers.authorization)) || '';
    if (SECRET_TOKEN && auth !== `Bearer ${SECRET_TOKEN}`) {
      return jsonResponse({ ok: false, error: 'Unauthorized' }, 401);
    }

    const payload = JSON.parse(e.postData.contents || '{}');
    if (!payload || !payload.masterContacts || !payload.assignments) {
      return jsonResponse({ ok: false, error: 'Invalid payload' }, 400);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    upsertContacts(ss, payload.masterContacts || []);
    writeAssignments(ss, payload.assignments || []);
    writeHistory(ss, payload.assignmentHistory || []);

    return jsonResponse({ ok: true, receivedAt: new Date().toISOString() }, 200);
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
}

function upsertContacts(ss, contacts) {
  const sh = getOrCreateSheet(ss, 'MasterContacts', ['id', 'name', 'agency', 'title', 'email', 'phone']);
  sh.clearContents();
  sh.getRange(1, 1, 1, 6).setValues([['id', 'name', 'agency', 'title', 'email', 'phone']]);
  if (!contacts.length) return;

  const rows = contacts.map(c => [c.id || '', c.name || '', c.agency || '', c.title || '', c.email || '', c.phone || '']);
  sh.getRange(2, 1, rows.length, 6).setValues(rows);
}

function writeAssignments(ss, assignments) {
  const sh = getOrCreateSheet(ss, 'Assignments', ['roleId', 'roleName', 'contactId', 'contactName', 'agency', 'title', 'email', 'phone']);
  sh.clearContents();
  sh.getRange(1, 1, 1, 8).setValues([['roleId', 'roleName', 'contactId', 'contactName', 'agency', 'title', 'email', 'phone']]);
  if (!assignments.length) return;

  const rows = assignments.map(a => [a.roleId || '', a.roleName || '', a.contactId || '', a.contactName || '', a.agency || '', a.title || '', a.email || '', a.phone || '']);
  sh.getRange(2, 1, rows.length, 8).setValues(rows);
}

function writeHistory(ss, history) {
  const sh = getOrCreateSheet(ss, 'AssignmentHistory', ['timestamp', 'roleId', 'roleName', 'contactId', 'contactName']);
  sh.clearContents();
  sh.getRange(1, 1, 1, 5).setValues([['timestamp', 'roleId', 'roleName', 'contactId', 'contactName']]);
  if (!history.length) return;

  const rows = history.map(h => [h.timestamp || '', h.roleId || '', h.roleName || '', h.contactId || '', h.contactName || '']);
  sh.getRange(2, 1, rows.length, 5).setValues(rows);
}

function getOrCreateSheet(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function jsonResponse(obj, status) {
  return ContentService
    .createTextOutput(JSON.stringify({ ...obj, status }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3) Deploy web app
- Deploy → New deployment
- Type: Web app
- Execute as: Me
- Who has access: Anyone with link (or restricted as needed)

Copy the deployment URL and paste into **Apps Script Webhook URL** in the org tool.

## 4) Optional auth
- Set `SECRET_TOKEN` in Apps Script.
- Set the same token in the app's **Webhook Bearer Token** field.
