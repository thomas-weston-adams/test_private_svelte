function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const spreadsheetId = 'REPLACE_WITH_SHARED_SPREADSHEET_ID';
    const ss = SpreadsheetApp.openById(spreadsheetId);

    const classId = String(payload.selectedClassId || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
    const classSheetName = `Class_${classId}`;
    const classSheet = ensureSheet(ss, classSheetName, [
      'submittedAtEastern', 'firstName', 'middleInitial', 'lastName', 'agency', 'title',
      'phone', 'cell', 'email', 'county', 'beingPaid', 'paidBy', 'jobCategory',
      'registrantType', 'selectedClassId', 'selectedClass', 'accommodations',
      'ageConfirmed', 'prereqAgreement'
    ]);

    classSheet.appendRow([
      payload.submittedAtEastern || '',
      payload.firstName || '',
      payload.middleInitial || '',
      payload.lastName || '',
      payload.agency || '',
      payload.title || '',
      payload.phone || '',
      payload.cell || '',
      payload.email || '',
      payload.county || '',
      payload.beingPaid || '',
      payload.paidBy || '',
      payload.jobCategory || '',
      payload.registrantType || '',
      payload.selectedClassId || '',
      payload.selectedClass || '',
      payload.accommodations || '',
      payload.ageConfirmed || '',
      payload.prereqAgreement ? 'true' : 'false'
    ]);

    const backups = ensureSheet(ss, 'Backups', ['timestamp', 'selectedClassId', 'payloadJson']);
    backups.appendRow([new Date().toISOString(), payload.selectedClassId || '', JSON.stringify(payload)]);

    return jsonResponse({ ok: true, classSheet: classSheetName });
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error) });
  }
}

function ensureSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
