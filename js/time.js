(function (D) {
  "use strict";

  function parseTimeToMinutes(value) {
    if (!value) {
      return null;
    }
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function calculateDurationMinutes(startValue, endValue) {
    const start = parseTimeToMinutes(startValue);
    const end = parseTimeToMinutes(endValue);
    if (start === null || end === null) {
      return 0;
    }
    if (end >= start) {
      return end - start;
    }
    return 24 * 60 - start + end;
  }

  function formatHours(minutes) {
    const totalMinutes = Math.round(minutes);
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} h`;
    }
    return `${hours} h ${remainingMinutes} min`;
  }

  function formatHoursDecimal(minutes) {
    return (minutes / 60).toFixed(2);
  }

  function formatHoursDecimalInput(minutes) {
    return formatHoursDecimal(minutes).replace(".", ",");
  }

  function formatTimeFromMinutes(totalMinutes) {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  D.Time = {
    parseTimeToMinutes,
    calculateDurationMinutes,
    formatHours,
    formatHoursDecimal,
    formatHoursDecimalInput,
    formatTimeFromMinutes,
  };
})(window.Dienstplan || (window.Dienstplan = {}));
