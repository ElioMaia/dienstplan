(function (D) {
  "use strict";

  const DEFAULT_FULL_DAY_MINUTES = 8 * 60;
  const absenceTypes = new Set(["Urlaub", "Krank", "Feiertag"]);

  function isAbsenceEntry(entry) {
    return entry && absenceTypes.has(entry.type);
  }

  function isTimedEntry(entry) {
    return Boolean(entry && entry.startTime && entry.endTime);
  }

  function getEntryWindowMinutes(entry) {
    const start = D.Time.parseTimeToMinutes(entry.startTime);
    const end = D.Time.parseTimeToMinutes(entry.endTime);
    if (start === null || end === null) {
      return null;
    }
    const normalizedEnd = end >= start ? end : end + 24 * 60;
    return { start, end: normalizedEnd };
  }

  function applyBreakRule(entries) {
    if (!entries || entries.length === 0) {
      return {
        netMinutes: 0,
        hasBreak: false,
        breakEntries: new Set(),
        breakDeductionEntries: new Set(),
      };
    }
    const entryWindows = entries
      .filter(isTimedEntry)
      .map((entry) => {
        const window = getEntryWindowMinutes(entry);
        if (!window) {
          return null;
        }
        return {
          entry,
          start: window.start,
          end: window.end,
          duration: window.end - window.start,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);

    const totalMinutes = entryWindows.reduce(
      (sum, entry) => sum + entry.duration,
      0,
    );

    if (entryWindows.length > 0) {
      let netMinutes = totalMinutes;
      let hasBreak = false;
      const breakEntries = new Set();
      const breakDeductionEntries = new Set();
      const blocks = [];
      let currentBlock = [];

      entryWindows.forEach((entry, index) => {
        if (index === 0) {
          currentBlock.push(entry);
          return;
        }

        const previous = entryWindows[index - 1];
        if (entry.start - previous.end >= 30) {
          blocks.push(currentBlock);
          currentBlock = [entry];
          return;
        }

        currentBlock.push(entry);
      });

      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
      }

      blocks.forEach((block) => {
        const blockMinutes = block.reduce(
          (sum, entry) => sum + entry.duration,
          0,
        );

        if (blockMinutes <= 6 * 60) {
          return;
        }

        hasBreak = true;
        netMinutes = Math.max(0, netMinutes - 30);

        let cumulativeMinutes = 0;
        let breakWindow = block[block.length - 1];
        block.forEach((entry) => {
          if (breakWindow !== block[block.length - 1]) {
            return;
          }
          if (cumulativeMinutes + entry.duration > 6 * 60) {
            breakWindow = entry;
          }
          cumulativeMinutes += entry.duration;
        });

        breakEntries.add(breakWindow.entry);
        breakDeductionEntries.add(breakWindow.entry);
      });

      return {
        netMinutes,
        hasBreak,
        breakEntries,
        breakDeductionEntries,
      };
    }
    return {
      netMinutes: totalMinutes,
      hasBreak: false,
      breakEntries: new Set(),
      breakDeductionEntries: new Set(),
    };
  }

  function calculateDayTotals(entries) {
    if (!entries || entries.length === 0) {
      return {
        netMinutes: 0,
        hasBreak: false,
        shiftMinutes: 0,
        hasCountableEntry: false,
        breakEntries: new Set(),
        breakDeductionEntries: new Set(),
      };
    }
    const absenceMinutes = entries
      .filter(isAbsenceEntry)
      .reduce(
        (sum, entry) =>
          sum + (entry.absenceMinutes || DEFAULT_FULL_DAY_MINUTES),
        0,
      );
    const shiftEntries = entries.filter((entry) => !isAbsenceEntry(entry));
    const {
      netMinutes: shiftMinutes,
      hasBreak,
      breakEntries,
      breakDeductionEntries,
    } = applyBreakRule(shiftEntries);
    const timedShiftEntries = shiftEntries.filter(isTimedEntry);
    const hasCountableEntry =
      timedShiftEntries.length > 0 || absenceMinutes > 0;
    return {
      netMinutes: shiftMinutes + absenceMinutes,
      hasBreak,
      shiftMinutes,
      hasCountableEntry,
      breakEntries,
      breakDeductionEntries,
    };
  }

  D.BreakRules = {
    DEFAULT_FULL_DAY_MINUTES,
    absenceTypes,
    getEntryWindowMinutes,
    applyBreakRule,
    calculateDayTotals,
    isAbsenceEntry,
    isTimedEntry,
  };
})(window.Dienstplan || (window.Dienstplan = {}));
