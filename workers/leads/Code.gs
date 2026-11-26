// Rodionactive — приймач заявок з калькулятора вартості сайту (Google Apps Script).
// Розгорнуто як веб-застосунок: виконується від імені власника, доступ — будь-хто.
// Пише кожну заповнену форму в таблицю «Rodionactive — заявки калькулятора».
var SHEET_ID = '1ImW27ndPQFmg7MU1Cn_mmrL4dbi9NlWEGfJyvhcmsZE';
var COLS = ['Дата', 'ID', 'Вартість', 'Ринкова ціна', 'Тип сайту', 'Дизайн', 'Функції', 'Мови', 'Тексти', 'SEO', 'Платформа', 'Терміни', 'Написав у Telegram', 'Джерело', 'Пристрій'];

function sheet_() {
  var sh = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  if (sh.getLastRow() === 0) { sh.appendRow(COLS); sh.setFrozenRows(1); sh.getRange(1, 1, 1, COLS.length).setFontWeight('bold'); }
  return sh;
}
// Час заявки за Києвом як число-дата таблиці (не залежить від часового поясу самого скрипта).
function kyivNow_() {
  var d = new Date(), z = Utilities.formatDate(d, 'Europe/Kiev', 'Z'); // напр. +0200
  var off = (z[0] === '-' ? -1 : 1) * (Number(z.slice(1, 3)) * 60 + Number(z.slice(3, 5)));
  return (d.getTime() + off * 60000) / 864e5 + 25569;
}
function clean_(v) { return String(v == null ? '' : v).replace(/^[=+\-@]/, "'$&").slice(0, 300); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents || '{}');
    var id = clean_(d.id).replace(/[^a-z0-9]/gi, '').slice(0, 20);
    if (!id) return out_('bad');
    var sh = sheet_();
    if (d.action === 'tg') {
      var ids = sh.getRange(1, 2, sh.getLastRow(), 1).getValues();
      for (var i = ids.length - 1; i >= 1; i--) if (ids[i][0] === id) { sh.getRange(i + 1, COLS.indexOf('Написав у Telegram') + 1).setValue('так'); break; }
      return out_('ok');
    }
    var rows = {};
    (d.rows || []).slice(0, 20).forEach(function (r) { rows[clean_(r[0])] = clean_(r[1]); });
    sh.appendRow([kyivNow_(), id, clean_(d.range), clean_(d.market), rows['Тип сайту'] || '', rows['Дизайн'] || '', rows['Функції'] || '', rows['Мови'] || '', rows['Тексти'] || '', rows['SEO'] || '', rows['Платформа'] || '', rows['Терміни'] || '', 'ні', clean_(d.ref), clean_(d.device)]);
    sh.getRange(sh.getLastRow(), 1).setNumberFormat('dd.MM.yyyy HH:mm');
    return out_('ok');
  } finally { lock.releaseLock(); }
}
function doGet() { return out_('Rodionactive leads endpoint'); }
function out_(s) { return ContentService.createTextOutput(s); }
