/**
 * ================================================================
 * Cebu Eastern College — College of Information Technology
 * Digital Signage Display & Admin CMS Cloud Storage Handler
 * ================================================================
 * Instructions:
 * 1. Open your Google Apps Script project (https://script.google.com).
 * 2. Paste this code into your Code.gs file.
 * 3. Click Deploy -> Manage Deployments -> Edit -> Version: New Version -> Deploy.
 *    Make sure "Who has access" is set to "Anyone".
 */

function doGet(e) {
  var props = PropertiesService.getScriptProperties();
  var action = (e && e.parameter && e.parameter.action) || 'getAll';

  if (action === 'getAll') {
    var keys = [
      'slides',
      'roomSchedule',
      'announcements',
      'flashItems',
      'carouselSettings'
    ];

    var result = {};
    for (var i = 0; i < keys.length; i++) {
      var raw = props.getProperty('cec_tv_' + keys[i]);
      if (raw) {
        try {
          result[keys[i]] = JSON.parse(raw);
        } catch (err) {
          result[keys[i]] = null;
        }
      }
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'CEC Digital Signage API Active' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var payload = null;

  try {
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Invalid JSON payload' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (!payload) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Empty payload' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Handle save
  if (payload.action === 'save' && payload.key) {
    var storageKey = 'cec_tv_' + payload.key;
    props.setProperty(storageKey, JSON.stringify(payload.data));
    props.setProperty('cec_tv_last_updated', new Date().toISOString());

    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      key: payload.key, 
      updatedAt: new Date().toISOString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'ignored' }))
    .setMimeType(ContentService.MimeType.JSON);
}
