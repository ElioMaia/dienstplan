(function (D) {
  "use strict";

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatEventTitle(value) {
    const escaped = escapeHtml(value);
    return escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }

  function escapeCsvValue(value, delimiter) {
    if (value === null || value === undefined) {
      return "";
    }
    const stringValue = String(value);
    if (
      stringValue.includes('"') ||
      stringValue.includes("\n") ||
      stringValue.includes("\r") ||
      stringValue.includes(delimiter)
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  function parseCsvLine(line, delimiter) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
        continue;
      }

      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (char === delimiter && !inQuotes) {
        values.push(current);
        current = "";
        continue;
      }

      current += char;
    }

    values.push(current);
    return values.map((value) => value.trim());
  }

  function parseCsvText(text) {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (!lines.length) {
      return [];
    }

    const delimiter = lines[0].includes(";") ? ";" : ",";
    const rows = lines.map((line) => parseCsvLine(line, delimiter));

    return { delimiter, rows };
  }

  function generateCsvContent(opts) {
    const delimiter = ";";
    const header = [
      "Typ",
      "Mitarbeitende",
      "Tag",
      "Startzeit",
      "Endzeit",
      "Rolle/Notizen",
      "Ereignis",
      "Stunden (dezimal)",
    ];
    const rows = [header];

    if (opts.weekInput.value) {
      rows.push(["Meta", "", "", "", "", "Week", opts.weekInput.value, ""]);
    }

    const legendHtml = opts.legendContent.innerHTML.trim();
    const legendExport = legendHtml.replace(/\r?\n/g, "");
    if (legendExport) {
      rows.push(["Meta", "", "", "", "", "Legend", legendExport, ""]);
    }

    D.Week.weekDays.forEach((day) => {
      const events = opts.allDayEvents[day];
      if (!events || events.length === 0) {
        return;
      }
      events.forEach((eventData) => {
        rows.push([
          "Ereignis",
          "",
          day,
          eventData.startTime || "",
          eventData.endTime || "",
          "",
          eventData.title,
          "",
        ]);
      });
    });

    Object.keys(opts.schedule).forEach((member) => {
      D.Week.weekDays.forEach((day) => {
        const entry = opts.schedule[member][day];
        if (!entry || entry.length === 0) {
          return;
        }
        const {
          netMinutes,
          hasBreak,
          breakDeductionEntries,
        } = D.BreakRules.calculateDayTotals(entry);
        entry.forEach((segment) => {
          if (D.BreakRules.isAbsenceEntry(segment)) {
            const absenceMinutes =
              segment.absenceMinutes || D.BreakRules.DEFAULT_FULL_DAY_MINUTES;
            rows.push([
              segment.type,
              member,
              day,
              "",
              "",
              "",
              "",
              "",
              D.Time.formatHoursDecimal(absenceMinutes),
            ]);
            return;
          }
          const hasTimes = segment.startTime && segment.endTime;
          const minutes = D.Time.calculateDurationMinutes(
            segment.startTime,
            segment.endTime,
          );
          let exportMinutes = entry.length === 1 ? netMinutes : minutes;
          if (
            hasBreak &&
            breakDeductionEntries.has(segment) &&
            entry.length > 1
          ) {
            exportMinutes = Math.max(0, minutes - 30);
          }
          rows.push([
            segment.type || "Dienst",
            member,
            day,
            segment.startTime,
            segment.endTime,
            segment.location || "",
            "",
            hasTimes ? D.Time.formatHoursDecimal(exportMinutes) : "",
          ]);
        });
      });
    });

    return rows
      .map((row) =>
        row
          .map((value) => escapeCsvValue(value, delimiter))
          .join(delimiter),
      )
      .join("\n");
  }

  D.Csv = {
    generateCsvContent,
    parseCsvText,
    parseCsvLine,
    escapeCsvValue,
    escapeHtml,
    formatEventTitle,
  };
})(window.Dienstplan || (window.Dienstplan = {}));
