import dateFormat from "./dateFormat.js";
import dateDiffFactory from "./dateDiffFactory.js";
import dateAddFactory from "./dateAddFactory.js";
import xDate from "../index.js";
import {
  localeMonthnames, localeValidator, localeWeekdays,
  setLocaleInfo, isNumberOrNumberString, } from "./genericHelpers.js";

const dateDiff = dateDiffFactory();
const weekdays = weekdayFactory();
const add2Date = dateAddFactory();

export {
  toLocalString,
  format,
  daysUntil,
  getNames,
  getTime,
  getFullDate,
  firstWeekday,
  daysInMonth,
  getTimeValues,
  getDateValues,
  getDTValues,
  nextOrPrevious,
  setTimeParts,
  setDateParts,
  revalue,
  relocate,
  setProxy,
  addParts2Date,
  add2Date,
  localeWeekdays,
  localeMonthnames,
  setLocaleInfo,
  compareDates,
  getISO8601Weeknr,
  getWeeksInYear,
  getQuarter,
  hasDST,
  removeTime,
  DSTAcive,
  cloneInstance,
  timezoneAwareDifferenceTo,
  offsetFrom,
  getAggregatedInfo,
  localeValidator,
  toJSDateString,
  getDowNumber,
  toISOString,
  fullMonth,
};

function addParts2Date(instance, ...parts2Add) {
  const clone = instance.clone;
  add2Date(clone, ...parts2Add);
  return clone;
}
function compareDates(instance, {start, end, before, include = {start: false, end: false}} = {}) {
  const instnc = instance.clone.UTC;
  start = xDate(start).UTC;

  if (!Number.isNaN(+start) && !end) {
    return before ? +instnc < +start : +instnc > +start
  }

  end = xDate(end).UTC;

  return (include.start ? +instnc >= +start : +instnc > +start) &&
    (include.end ? +instnc <= +end : +instnc < +end);
}

function format(instance, formatStr, moreOptions) {
  if (!instance.localeInfo) {
    instance.localeInfo = setLocaleInfo();
  }
  moreOptions = moreOptions || instance.localeInfo.formatOptions;
  return dateFormat(new Date(instance), formatStr, moreOptions);
}

function daysUntil(instance, nextDate) {
  const diff = dateDiff({start: instance, end: nextDate || instance});
  const isNegative = diff.sign === `-`;
  return isNegative ? -diff.diffInDays : diff.diffInDays;
}

function getNames(instance, remote = false) {
  const {locale, timeZone, formatOptions} = remote ? instance.localeInfo : xDate().localeInfo;
  const monthAndDay = instance.format(`MM|WD`, formatOptions).split(`|`);

  return { locale, timeZone,
    monthName: monthAndDay[0],
    dayName: monthAndDay[1],
    dayNames: localeWeekdays(locale),
    monthNames: localeMonthnames(locale),
  };
}

function getTime(instance, tz = false) {
  const [hours, minutes, seconds, milliseconds] = getTimeValues(instance, tz);
  const values4Timezone = tz ? instance.timeZone : localeValidator().timeZone
  const returnValue = { values4Timezone, hours, minutes, seconds, milliseconds };

  return Object.freeze(returnValue);
}

function getTimeValues(instance, remote = false) {
  const tzOpt = remote ? `,tz:${instance.timeZone}` : `,tz:${localeValidator().timeZone}`;
  const opts = `l:en-CA${tzOpt},hrc:23`;
  
  return instance.format("hh-mmi-ss", opts)
    .split(/-/)
    .map(Number)
    .concat(instance.getMilliseconds());
}

function getFullDate(instance, local) {
  const tzOpt = !local ? `,tz:${instance.timeZone}` : `tz:${localeValidator().timeZone}`;
  let [year, month, date] = instance.format(`yyyy-mm-dd`, tzOpt).split(/-/) .map(Number);
  month -= 1;
  const values4Timezone = local ? instance.timeZone : localeValidator().timeZone;
  return Object.freeze({ values4Timezone, year, month, date, });
}

function getDateValues(instance, local = true) {
  if (local) {
    return [instance.getFullYear(), instance.getMonth(), instance.getDate()];
  }

  const values = instance.format("yyyy-m-d", instance.localeInfo.formatOptions).split(/-/).map(Number);
  values[1] -= 1;
  return values;
}

function firstWeekday(instance, {sunday = false, midnight = false} = {}) {
  return nextOrPrevious(instance, { day: sunday ? `sun` : `mon`, midnight, forFirstWeekday: true }) ;
}

function toISOString(instance, local = true) {
  if (local) {
    return instance.toISOString();
  }
  const ms = pad0(instance.milliseconds, 3);
  return instance.format(`yyyy-mm-dd~T~hh:mmi:ss.${ms}`, instance.localeInfo.formatOptions);
}

function timezoneAwareDifferenceTo({start, end} = {}) {
  if (!end?.clone) {
    end = xDate(end, {timeZone: start.timeZone});
  }

  if (!end) {
    end = start.clone;
  }

  start = xDate(DTInTimezone(start, start.timeZone), {timeZone: start.timeZone});
  end = xDate(DTInTimezone(end, end.timeZone), {timeZone: end.timeZone});

  return dateDiff({start, end, diffs: {timeZoneStart: start.timeZone, timeZoneEnd: end.timeZone}});
}

function offsetFrom(instance, from) {
  const instanceClone = instance.clone;
  const userTimeZone = localeValidator().timeZone;

  if (from instanceof Date && !from?.clone) {
    from = instanceClone.clone.relocate({timeZone: userTimeZone});
  }

  if (!from) {
    from = instanceClone.clone.relocate({timeZone: userTimeZone});
  }

  from = from.revalue(instanceClone.value);
  const diff = timezoneAwareDifferenceTo({start: instanceClone, end: from});

  return {
    from: instanceClone.timeZone,
    to: from.timeZone,
    offset: `${diff.sign}${pad0(diff.hours)}:${pad0(diff.minutes)}`
  };
}

function pad0(number2Pad, n = 2) {
  return `${number2Pad}`.padStart(n, `0`);
}

function maybePlural(value, word) {
  return `${word}${value > 1 ? `s` : ``}`;
}

function timeDiffenceInWords(diffInfo) {
  if (/00:00/.test(diffInfo)) { return `no time diffence`; }
  const hoursAndMinutes = diffInfo.slice(1).split(`:`).map(Number);
  const [hours, minutes] = hoursAndMinutes;
  const later = diffInfo.at(0) === `+`;
  return minutes > 0
    ? `${hours} ${maybePlural(hours, `hour`)} and ${minutes} ${maybePlural(minutes, `minute`)} ${later ? `ahead of`: `behind`}`
    : `${hours} ${maybePlural(hours, `hour`)} ${later ? `ahead of`: `behind`}`;
}

function toJSDateString(instance) {
  const instanceEN = instance.clone.relocate({locale: `en-CA`});
  const gmtString = instanceEN.format(`tz`, instanceEN.localeInfo.formatOptions + `,tzn:longOffset`).replace(`:`, ``);
  const formatString = `wd M d yyyy hh:mmi:ss ${gmtString} (tz)`;
  return instanceEN.format(formatString, instanceEN.localeInfo.formatOptions + `,tzn:long,hrc:23`);
}

function getDowNumber(instance, remote = false) {
  const dayFormat = Intl.DateTimeFormat(`en-CA`, {
    timeZone: remote ? instance.timeZone : localeValidator().timeZone,
    weekday: "short",
  });
  
  return weekdays(dayFormat.format(instance).toLowerCase());
}

function getAggregatedInfo(instance) {
  const localInstance = instance.clone
    .relocate({locale: instance.userLocaleInfo.locale, timeZone: instance.userLocaleInfo.timeZone});
  const timeDifferenceUserLocal2Remote = instance.offsetFrom(localInstance).offset;
  const local = instance.userLocaleInfo;
  const remote = instance.localeInfo;
  const pmRemote = instance.format(`hh:mmi:ss dp`, `hrc:12,tz:${instance.timeZone}`);
  const pmLocal = localInstance.format(`hh:mmi:ss dp`, `hrc:12,tz:${localInstance.timeZone}`);
  
  return {
    note: "'user' are values for your locale/timeZone, 'remote' idem for the instance",
    locales: {
      user: {locale: local.locale, timeZone: local.timeZone },
      remote: {locale: remote.locale, timeZone: remote.timeZone }
    },
    dateTime: {
      user: {
        ...instance.dateTime,
        monthName: localInstance.monthName,
        weekdayNr: getDowNumber(localInstance),
        weekdayName: localInstance.dayName,
        dayPeriodTime: pmLocal,
        hasDST: localInstance.hasDST,
        DSTActive: localInstance.DSTActive,
        string: localInstance.toString(),
      },
      remote: {
        ...instance.zoneDateTime,
        monthName: instance.zoneNames.monthName,
        weekdayNr: getDowNumber(instance, true),
        weekdayName: instance.zoneNames.dayName,
        dayPeriodTime: pmRemote,
        hasDST: instance.hasDST,
        DSTActive: instance.DSTActive,
        string: instance.toString(),
      },
    },
    offset: {
      fromUserTime: `${instance.timeZone} ` + timeDiffenceInWords(timeDifferenceUserLocal2Remote)
        + ` ${localInstance.timeZone}`,
      fromUTC: `${instance.timeZone} ` + timeDiffenceInWords(instance.UTCOffset.offset) + ` GMT`
    },
  };
}

function getDTValues(instance, local = true) {
  if (local) {
    return [
      instance.getFullYear(),
      instance.getMonth(),
      instance.getDate(),
      instance.getHours(),
      instance.getMinutes(),
      instance.getSeconds(),
      instance.getMilliseconds()
    ]
  }

  const numbers = instance.format("yyyy-m-d-hh-mmi-ss", `${instance.localeInfo.formatOptions},hrc23:true`)
    .split(/-/)
    .map(Number)
    .concat(instance.getMilliseconds());
  numbers[1] -= 1;
  return numbers;
}

function daysInMonth(instance) {
  return new Date(instance.year, instance.month + 1, 0, 0, 0, 0).getDate();
}

function fullMonth(instance, forLocale) {
  const firstDay = instance.clone.removeTime;
  if (forLocale) { firstDay.relocate({locale: forLocale}); }
  firstDay.date = { date: 1 };
  return [...Array(daysInMonth(firstDay))].map( (v, i) => firstDay.addDays(i+1) );
}

function nextOrPrevious(instance, {day, next = false, forFirstWeekday = false} = {}) {
  let dayNr = weekdays(day?.toLowerCase());
  const cloned = xDate(new Date(...instance.dateValues), instance.localeInfo);

  if (dayNr < 0) { return cloned; }

  let today = cloned.getDay();

  if (forFirstWeekday && today === dayNr) { return instance; }

  let addTerm = next ? 1 : -1 ;

  return findDayRecursive(today);

  function findDayRecursive(day) {
    return day !== dayNr
      ? findDayRecursive(cloned.add(`${addTerm} days`).getDay())
      : cloned;
  }
}

function toLocalString(instance, {dateOnly = false, timeOnly = false} = {}) {
  if (!instance.localeInfo) {
    instance.localeInfo = setLocaleInfo();
  }
  const {locale, timeZone} = instance.localeInfo;
  return dateOnly
    ? new Date(instance).toLocaleDateString(locale, {timeZone})
    : timeOnly
      ? new Date(instance).toLocaleTimeString(locale, {timeZone})
      : new Date(instance).toLocaleString(locale, {timeZone});
}

function DTInTimezone(date, timeZoneID) {
  const timeZoneInfo = {timeZone: timeZoneID, hourCycle: `h23`};
  return new Date(new Date(date).toLocaleString(`en`, timeZoneInfo));
}

function setDateParts(instance, {year, month, date} = {}) {
  if (isNumberOrNumberString(year)) { instance.setFullYear(year); }
  if (isNumberOrNumberString(date)) { instance.setDate(date); }
  if (isNumberOrNumberString(month)) { instance.setMonth(month - 1); }
  return true;
}

function setTimeParts(instance, {hours, minutes, seconds, milliseconds} = {}) {
  if (isNumberOrNumberString(hours)) { instance.setHours(hours); }
  if (isNumberOrNumberString(minutes)) { instance.setMinutes(minutes); }
  if (isNumberOrNumberString(seconds)) { instance.setSeconds(seconds) };
  if (isNumberOrNumberString(milliseconds)) { instance.setMilliseconds(milliseconds); }
  return true;
}

function cloneInstance(instance, date) {
  return xDate(date && new Date(date) || instance.value, instance.localeInfo);
}

function weekdayFactory() {
  const dow = {
    short: `sun,mon,tue,wed,thu,fri,sat`.split(`,`),
    long: `sunday,monday,tuesday,wednesday,thursday,friday,saturday`.split(`,`),
  };

  return function(day) {
    if (!day) { return -1 }
    let dayNr = dow.short.indexOf(day);
    return dayNr < 0 ? dow.long.indexOf(day) : dayNr;
  };
}

function setProxy(proxy) {
  return proxy;
}

function offset2Number(dtStr) {
  return Number(dtStr.split(/[+-]/).slice(-1)[0].replace(/:/, ``));
}

function removeTime(instance) {
  instance = instance || xDate();
  return xDate(new Date(...instance.dateValues), instance.localeInfo);
}

function hasDST(instance) {
  const timeZone = instance.timeZone;
  const dt1 = new Date(instance.year, 0, 1, 14);
  const dt2 = new Date(new Date(dt1).setMonth(6));
  const fmt = Intl.DateTimeFormat(`en-CA`, {
    year: `numeric`,
    timeZone: timeZone,
    timeZoneName: "shortOffset",
  });
  const [fmt1, fmt2] = [offset2Number(fmt.format(dt1)), offset2Number(fmt.format(dt2))];
  
  return fmt1 - fmt2 !== 0;
}

function DSTAcive(instance) {
  if (instance.hasDST) {
    const dtJanuary = instance.clone;
    dtJanuary.month = 1;
    dtJanuary.date = 1;

    return dtJanuary.format(`tz`, `${dtJanuary.localeInfo.formatOptions},tzn:shortOffset`) !==
      instance.format(`tz`, `${instance.localeInfo.formatOptions},tzn:shortOffset`);
  }

  return false;
}

function relocate(instance, {locale, timeZone} = {}) {
  instance.localeInfo = localeValidator({
    locale: locale || instance.locale,
    timeZone: timeZone || instance.timeZone
  });

  return instance;
}

function revalue(instance, date) {
  if (date?.constructor !== Date) { return instance; }
  return xDate(date, date.localeInfo || instance.localeInfo);
}

function getWeeksInYear(year, date) {
  const currentWeek = getISO8601Weeknr(new Date(year, 11, date));
  return currentWeek === 1 ? getWeeksInYear(year, date-1) : currentWeek;
}

function getQuarter(instance, numeric) {
  const currentMonth = instance.month;
  switch(true) {
    case currentMonth < 3: return numeric ? 1 : `First`;
    case currentMonth < 6: return numeric ? 2 : `Second`;
    case currentMonth < 9: return numeric ? 3 : `Third`;
    case currentMonth < 12: return numeric ? 4 : `Fourth`;
  }
}

function getISO8601Weeknr(instance) {
  const clone = new Date(instance);
  const dayn = (clone.getDay() + 6) % 7;
  clone.setDate(clone.getDate() - dayn + 3);
  const firstThursday = clone.valueOf();
  clone.setMonth(0, 1);

  if (clone.getDay() !== 4) {
    clone.setMonth(0, 1 + ((4 - clone.getDay()) + 7) % 7);
  }

  return 1 + Math.ceil((firstThursday - clone) / 604800000);
}