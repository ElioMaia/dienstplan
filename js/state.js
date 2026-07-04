(function (D) {
  "use strict";

  const weekDays = D.Week.weekDays;

  const schedule = {};
  const allDayEvents = weekDays.reduce((acc, day) => {
    acc[day] = [];
    return acc;
  }, {});
  const eventEditState = { day: null, index: null };
  const entryEditState = { member: null, day: null, index: null };
  let activeCell = null;
  let lastSubmittedFlash = { member: null, days: [] };

  function setActiveCell(cell) {
    if (cell && activeCell === cell) {
      cell.classList.remove("cell-active");
      activeCell = null;
      return;
    }
    if (activeCell && activeCell !== cell) {
      activeCell.classList.remove("cell-active");
    }
    if (cell) {
      cell.classList.add("cell-active");
    }
    activeCell = cell;
  }

  function clearActiveCell() {
    if (activeCell) {
      activeCell.classList.remove("cell-active");
    }
    activeCell = null;
  }

  function addEntry({
    member,
    day,
    startTime,
    endTime,
    location,
    entryType,
    absenceMinutes,
  }) {
    if (!schedule[member]) {
      schedule[member] = {};
    }

    if (!schedule[member][day]) {
      schedule[member][day] = [];
    }
    const entryData = {
      startTime,
      endTime,
      location,
      type: entryType || "Dienst",
      absenceMinutes,
    };
    const entries = schedule[member][day];
    if (
      entryEditState.member === member &&
      entryEditState.day === day &&
      entryEditState.index !== null
    ) {
      entries[entryEditState.index] = entryData;
    } else {
      entries.push(entryData);
    }

    if (D.BreakRules.isAbsenceEntry(entryData)) {
      schedule[member][day] = [entryData];
    } else {
      schedule[member][day] = entries.filter(
        (entry) => !D.BreakRules.isAbsenceEntry(entry),
      );
    }
  }

  function addAllDayEvent({ day, title, startTime, endTime }) {
    if (!allDayEvents[day]) {
      allDayEvents[day] = [];
    }
    const eventData = { title, startTime, endTime };
    if (eventEditState.day === day && eventEditState.index !== null) {
      allDayEvents[day][eventEditState.index] = eventData;
    } else {
      allDayEvents[day].push(eventData);
    }
  }

  function resetEventEditState() {
    eventEditState.day = null;
    eventEditState.index = null;
  }

  function resetEntryEditState() {
    entryEditState.member = null;
    entryEditState.day = null;
    entryEditState.index = null;
  }

  function parseHoursToMinutes(value) {
    if (value === null || value === undefined) {
      return null;
    }
    const normalized = String(value).trim().replace(",", ".");
    if (!normalized) {
      return null;
    }
    const hours = Number(normalized);
    if (!Number.isFinite(hours) || hours <= 0) {
      return null;
    }
    return Math.round(hours * 60);
  }

  D.State = {
    schedule,
    allDayEvents,
    eventEditState,
    entryEditState,
    setActiveCell,
    clearActiveCell,
    addEntry,
    addAllDayEvent,
    resetEventEditState,
    resetEntryEditState,
    parseHoursToMinutes,
    get activeCell() {
      return activeCell;
    },
    set activeCell(v) {
      activeCell = v;
    },
    get lastSubmittedFlash() {
      return lastSubmittedFlash;
    },
    set lastSubmittedFlash(v) {
      lastSubmittedFlash = v;
    },
  };
})(window.Dienstplan || (window.Dienstplan = {}));
