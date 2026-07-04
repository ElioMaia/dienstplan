(function (D) {
  "use strict";

  const TARGET_WEEKLY_MINUTES = 39 * 60;
  const TOLERANCE_MINUTES = 30;
  const weekDays = D.Week.weekDays;
  const { formatHours, formatHoursDecimal, formatHoursDecimalInput } = D.Time;
  const { formatEventTitle, escapeHtml } = D.Csv;
  const {
    DEFAULT_FULL_DAY_MINUTES,
    calculateDayTotals,
    isAbsenceEntry,
  } = D.BreakRules;

  function renderEventsRow(scheduleBody, allDayEvents) {
    const eventsRow = document.createElement("tr");
    eventsRow.setAttribute("data-row-type", "events");

    const eventsLabelCell = document.createElement("td");
    eventsLabelCell.innerHTML = "<strong>Ereignisse</strong>";
    eventsRow.appendChild(eventsLabelCell);

    const eventsStandCell = document.createElement("td");
    eventsStandCell.className = "stand-vz-cell";
    eventsStandCell.textContent = "";
    eventsRow.appendChild(eventsStandCell);

    weekDays.forEach((day) => {
      const cell = document.createElement("td");
      cell.setAttribute("data-day", day);
      cell.className = "events-cell";
      const events = allDayEvents[day];
      if (!events || events.length === 0) {
        cell.textContent = "—";
      } else {
        cell.textContent = "";
        events.forEach((eventData, index) => {
          const item = document.createElement("div");
          item.className = "event-item";
          const timeLabel =
            eventData.startTime && eventData.endTime
              ? `${eventData.startTime}–${eventData.endTime}`
              : "";
          if (timeLabel == "") {
            item.innerHTML = formatEventTitle(eventData.title);
          } else {
            item.innerHTML = `<span class="event-time">${escapeHtml(
              timeLabel,
            )}</span> · ${formatEventTitle(eventData.title)}`;
          }
          item.setAttribute("data-event-index", String(index));
          cell.appendChild(item);
        });
      }
      eventsRow.appendChild(cell);
    });

    const eventsTotalCell = document.createElement("td");
    eventsTotalCell.textContent = "";
    eventsRow.appendChild(eventsTotalCell);
    scheduleBody.appendChild(eventsRow);
  }

  function renderEntryCell(cell, entries) {
    const {
      netMinutes,
      hasBreak,
      shiftMinutes,
      hasCountableEntry,
      breakEntries,
      breakDeductionEntries,
    } = calculateDayTotals(entries);

    entries.forEach((entry, index) => {
      const line = document.createElement("div");
      line.className = "entry-line d-flex align-items-center flex-wrap";
      line.setAttribute("data-entry-index", String(index));

      if (isAbsenceEntry(entry)) {
        const absenceMinutes =
          entry.absenceMinutes || DEFAULT_FULL_DAY_MINUTES;
        const label = document.createElement("span");
        label.className = "fw-semibold";
        label.textContent = entry.type;
        line.appendChild(label);

        const duration = document.createElement("span");
        duration.className = "text-muted duration-text";
        duration.textContent = ` (${formatHours(absenceMinutes)})`;
        line.appendChild(duration);
      } else {
        const hasTimes = entry.startTime && entry.endTime;
        if (hasTimes) {
          const timeRange = document.createElement("span");
          timeRange.className = "fw-semibold time-range";
          timeRange.textContent = `${entry.startTime}–${entry.endTime}`;
          line.appendChild(timeRange);

          const entryMinutes = D.Time.calculateDurationMinutes(
            entry.startTime,
            entry.endTime,
          );
          const duration = document.createElement("span");
          duration.className = "text-muted duration-text";
          const isSingleShiftEntry =
            entries.length === 1 && !isAbsenceEntry(entries[0]);
          let displayMinutes = isSingleShiftEntry
            ? shiftMinutes
            : entryMinutes;
          if (
            !isSingleShiftEntry &&
            hasBreak &&
            breakDeductionEntries.has(entry)
          ) {
            displayMinutes = Math.max(0, entryMinutes - 30);
          }
          duration.textContent = ` (${formatHours(displayMinutes)})`;
          line.appendChild(duration);
        }

        if (entry.location) {
          const note = document.createElement("div");
          note.className = "text-muted small w-100";
          note.textContent = entry.location;
          line.appendChild(note);
        }
      }

      cell.appendChild(line);
      if (
        hasBreak &&
        breakEntries.has(entry)
      ) {
        const breakNote = document.createElement("div");
        breakNote.className = "text-muted small";
        breakNote.textContent = "Pause";
        cell.appendChild(breakNote);
      }
    });

    if (entries.some((entry) => !isAbsenceEntry(entry))) {
      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "entry-add-btn";
      addButton.textContent = "+ Weiterer Dienst";
      addButton.setAttribute("aria-label", "Weiteren Dienst hinzufügen");
      addButton.setAttribute("title", "Weiteren Dienst hinzufügen");
      addButton.setAttribute("data-add-entry", "true");
      cell.appendChild(addButton);
    }
  }

  function renderMemberRow(scheduleBody, schedule, member) {
    const row = document.createElement("tr");
    row.setAttribute("data-member", member);

    const nameCell = document.createElement("td");
    nameCell.innerHTML = `<strong>${member}</strong>`;
    row.appendChild(nameCell);

    const standCell = document.createElement("td");
    standCell.className = "stand-vz-cell";
    standCell.textContent = "";
    row.appendChild(standCell);

    let memberMinutes = 0;
    let memberEligible = true;

    weekDays.forEach((day) => {
      const cell = document.createElement("td");
      cell.setAttribute("data-day", day);
      const entries = schedule[member][day];

      if (!entries || entries.length === 0) {
        memberEligible = false;
        const placeholder = document.createElement("div");
        placeholder.className = "text-muted";
        placeholder.textContent = "—";
        cell.appendChild(placeholder);
      } else {
        const { netMinutes, hasCountableEntry } = calculateDayTotals(entries);
        if (!hasCountableEntry) {
          memberEligible = false;
        }
        memberMinutes += netMinutes;

        renderEntryCell(cell, entries);
      }

      row.appendChild(cell);
    });

    const totalCell = document.createElement("td");
    totalCell.className = "fw-semibold total-cell";
    if (memberEligible && memberMinutes > 0) {
      totalCell.textContent = formatHours(memberMinutes);
      if (memberMinutes < TARGET_WEEKLY_MINUTES - TOLERANCE_MINUTES) {
        totalCell.classList.add("total-under");
      } else if (memberMinutes > TARGET_WEEKLY_MINUTES + TOLERANCE_MINUTES) {
        totalCell.classList.add("total-over");
      } else {
        totalCell.classList.add("total-ok");
      }
    } else {
      totalCell.textContent = "—";
    }
    row.appendChild(totalCell);

    scheduleBody.appendChild(row);
  }

  function renderTable(scheduleBody, schedule, allDayEvents) {
    scheduleBody.innerHTML = "";
    renderEventsRow(scheduleBody, allDayEvents);

    const members = Object.keys(schedule);
    members.forEach((member) => {
      renderMemberRow(scheduleBody, schedule, member);
    });
  }

  function flashSubmittedCells(lastSubmittedFlash) {
    if (!lastSubmittedFlash.member || lastSubmittedFlash.days.length === 0) {
      return;
    }
    requestAnimationFrame(() => {
      lastSubmittedFlash.days.forEach((day) => {
        const cell = document.querySelector(
          `#scheduleBody tr[data-member="${CSS.escape(lastSubmittedFlash.member)}"] td[data-day="${day}"]`,
        );
        if (cell) {
          cell.classList.remove("cell-flash");
          void cell.offsetWidth;
          cell.classList.add("cell-flash");
        }
      });
    });
  }

  D.Render = {
    renderTable,
    flashSubmittedCells,
  };
})(window.Dienstplan || (window.Dienstplan = {}));
