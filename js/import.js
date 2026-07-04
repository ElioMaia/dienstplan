(function (D) {
  "use strict";

  const weekDays = D.Week.weekDays;

  function processImportedFile(file, opts) {
    if (!file) return;
    const fileName = file.name ? file.name.replace(/\.csv$/i, "") : "";
    if (fileName) {
      opts.exportFilenameInput.value = fileName;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const parsed = D.Csv.parseCsvText(text);
      if (!parsed.rows || parsed.rows.length <= 1) {
        return;
      }

      const { schedule, allDayEvents } = D.State;

      Object.keys(schedule).forEach((member) => {
        delete schedule[member];
      });
      weekDays.forEach((day) => {
        allDayEvents[day] = [];
      });

      const [, ...dataRows] = parsed.rows;
      const header = parsed.rows[0].map((cell) =>
        cell.toLowerCase().trim(),
      );
      const typeIndex = header.indexOf("typ");
      const memberIndex = header.indexOf("mitarbeitende");
      const dayIndex = header.indexOf("tag");
      const startIndex = header.indexOf("startzeit");
      const endIndex = header.indexOf("endzeit");
      const locationIndex = header.indexOf("rolle/notizen");
      const eventIndex = header.indexOf("ereignis");
      const hoursIndex = header.indexOf("stunden (dezimal)");

      dataRows.forEach((row) => {
        if (typeIndex !== -1) {
          const rowType = (row[typeIndex] || "").toLowerCase();
          if (rowType === "meta") {
            const metaKey =
              (locationIndex !== -1 && row[locationIndex]) ||
              (eventIndex !== -1 && row[eventIndex]) ||
              "";
            const metaValue =
              (eventIndex !== -1 && row[eventIndex]) ||
              (locationIndex !== -1 && row[locationIndex]) ||
              "";
            if (!metaKey) {
              return;
            }
            const normalizedKey = metaKey.toLowerCase().trim();
            if (normalizedKey === "week") {
              opts.weekInput.value = metaValue;
              D.Week.updateWeekdayHeaders(metaValue, opts.weekdayHeaders);
            }
            if (normalizedKey === "legend") {
              opts.legendContent.innerHTML = metaValue;
            }
            return;
          }
          const day = row[dayIndex] || "";
          if (!day) {
            return;
          }
          if (rowType === "ereignis") {
            const eventText =
              (eventIndex !== -1 && row[eventIndex]) ||
              (locationIndex !== -1 && row[locationIndex]) ||
              "";
            const startTime = (startIndex !== -1 && row[startIndex]) || "";
            const endTime = (endIndex !== -1 && row[endIndex]) || "";
            if (!eventText) {
              return;
            }
            D.State.addAllDayEvent({
              day,
              title: eventText,
              startTime,
              endTime,
            });
            return;
          }
          if (
            rowType === "urlaub" ||
            rowType === "krank" ||
            rowType === "feiertag"
          ) {
            const member = row[memberIndex] || "";
            const hoursValue = hoursIndex !== -1 ? row[hoursIndex] : "";
            const absenceMinutes =
              D.State.parseHoursToMinutes(hoursValue) || D.BreakRules.DEFAULT_FULL_DAY_MINUTES;
            if (!member) {
              return;
            }
            D.State.addEntry({
              member,
              day,
              startTime: "",
              endTime: "",
              location: "",
              entryType:
                rowType === "urlaub"
                  ? "Urlaub"
                  : rowType === "krank"
                    ? "Krank"
                    : "Feiertag",
              absenceMinutes,
            });
            return;
          }
          const member = row[memberIndex] || "";
          const startTime = row[startIndex] || "";
          const endTime = row[endIndex] || "";
          const location =
            (locationIndex !== -1 && row[locationIndex]) || "";
          if (!member) {
            return;
          }
          if ((startTime && !endTime) || (!startTime && endTime)) {
            return;
          }
          D.State.addEntry({
            member,
            day,
            startTime,
            endTime,
            location,
            entryType: "Dienst",
          });
          return;
        }

        const [member, day, startTime, endTime, location] = row;
        if (!member || !day) {
          return;
        }
        if ((startTime && !endTime) || (!startTime && endTime)) {
          return;
        }
        D.State.addEntry({
          member,
          day,
          startTime,
          endTime,
          location: location || "",
          entryType: "Dienst",
        });
      });

      D.Render.renderTable(opts.scheduleBody, D.State.schedule, D.State.allDayEvents);
      D.Export.syncLegendPrintState(opts.legendContent);
    };
    reader.readAsText(file, "utf-8");
  }

  D.Import = {
    processImportedFile,
  };
})(window.Dienstplan || (window.Dienstplan = {}));
