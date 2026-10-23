/* Pure calendar rules; no device-clock fallback. */
(function (root) {
  'use strict';
  const formatter = new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Stockholm', year:'numeric',month:'numeric',day:'numeric'});
  function dateParts(timestamp) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map(p=>[p.type,p.value]));
    return {year:Number(parts.year),month:Number(parts.month),day:Number(parts.day)};
  }
  function available(timestamp) { const p=dateParts(timestamp); return p.month===12 ? Math.min(24,p.day) : 0; }
  function daysLeft(timestamp) {
    const p=dateParts(timestamp),year=p.month===12&&p.day>24?p.year+1:p.year;
    return Math.max(0,Math.round((Date.UTC(year,11,24)-Date.UTC(p.year,p.month-1,p.day))/86400000));
  }
  function readProgress(value,year) {
    try { const p=JSON.parse(value);return p.year===year&&Array.isArray(p.days)?[...new Set(p.days.filter(n=>Number.isInteger(n)&&n>=1&&n<=24))]:[]; } catch {return [];}
  }
  const api={dateParts,available,daysLeft,readProgress};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.FPAdventRules=Object.freeze(api);
})(typeof window!=='undefined'?window:globalThis);
