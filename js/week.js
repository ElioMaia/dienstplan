(function (D) {
  "use strict";

  const weekDays = [
    "Montag",
    "Dienstag",
    "Mittwoch",
    "Donnerstag",
    "Freitag",
  ];

  function parseWeekValue(value) {
    if (!value) {
      return null;
    }
    const parts = value.split("-W");
    if (parts.length !== 2) {
      return null;
    }
    const year = Number(parts[0]);
    const week = Number(parts[1]);
    if (!Number.isInteger(year) || !Number.isInteger(week)) {
      return null;
    }
    return { year, week };
  }

  function getIsoWeekStartDate(year, week) {
    const jan4 = new Date(year, 0, 4);
    const jan4Day = jan4.getDay() || 7;
    const mondayWeek1 = new Date(jan4);
    mondayWeek1.setDate(jan4.getDate() - jan4Day + 1);
    const mondayTarget = new Date(mondayWeek1);
    mondayTarget.setDate(mondayWeek1.getDate() + (week - 1) * 7);
    return mondayTarget;
  }

  function formatDate(date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  function updateWeekdayHeaders(weekValue, weekdayHeaders) {
    const parsed = parseWeekValue(weekValue);
    const headerMap = new Map(
      weekdayHeaders.map((header) => [
        header.getAttribute("data-day"),
        header,
      ]),
    );
    if (!parsed) {
      weekDays.forEach((day) => {
        const header = headerMap.get(day);
        if (!header) {
          return;
        }
        const dateSpan = header.querySelector(".day-date");
        if (dateSpan) {
          dateSpan.textContent = "";
          dateSpan.classList.add("d-none");
        }
      });
      return;
    }

    const monday = getIsoWeekStartDate(parsed.year, parsed.week);
    weekDays.forEach((day, index) => {
      const header = headerMap.get(day);
      if (!header) {
        return;
      }
      const current = new Date(monday);
      current.setDate(monday.getDate() + index);
      const dateSpan = header.querySelector(".day-date");
      if (dateSpan) {
        dateSpan.textContent = formatDate(current);
        dateSpan.classList.remove("d-none");
      }
    });
  }

  function getIsoWeeksInYear(year) {
    const jan1 = new Date(year, 0, 1);
    const dec31 = new Date(year, 11, 31);
    const jan1Day = jan1.getDay() || 7;
    const dec31Day = dec31.getDay() || 7;
    if (jan1Day <= 4 && dec31Day <= 4) return 53;
    if (jan1Day <= 4 || dec31Day <= 4) return 53;
    return 52;
  }

  function shiftWeek(delta, weekInput, weekdayHeaders) {
    const parsed = parseWeekValue(weekInput.value);
    if (!parsed) {
      return;
    }
    let newWeek = parsed.week + delta;
    let newYear = parsed.year;
    if (newWeek < 1) {
      newYear -= 1;
      newWeek = getIsoWeeksInYear(newYear);
    } else if (newWeek > getIsoWeeksInYear(newYear)) {
      newYear += 1;
      newWeek = 1;
    }
    const weekStr = String(newWeek).padStart(2, "0");
    weekInput.value = `${newYear}-W${weekStr}`;
    updateWeekdayHeaders(weekInput.value, weekdayHeaders);
  }

  D.Week = {
    weekDays,
    parseWeekValue,
    getIsoWeekStartDate,
    formatDate,
    updateWeekdayHeaders,
    getIsoWeeksInYear,
    shiftWeek,
  };
})(window.Dienstplan || (window.Dienstplan = {}));
