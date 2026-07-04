(function (D) {
  "use strict";

  const scheduleForm = document.getElementById("scheduleForm");
  const memberInput = document.getElementById("memberName");
  const weekdaySelect = document.getElementById("weekday");
  const weekInput = document.getElementById("weekSelect");
  const startTimeInput = document.getElementById("startTime");
  const endTimeInput = document.getElementById("endTime");
  const locationInput = document.getElementById("location");
  const entryTypeSelect = document.getElementById("entryType");
  const absenceHoursInput = document.getElementById("absenceHours");
  const allDayEventToggle = document.getElementById("allDayEvent");
  const eventTitleInput = document.getElementById("eventTitle");
  const clearBtn = document.getElementById("clearBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const submitBtn = document.getElementById("submitBtn");
  const allDaysToggle = document.getElementById("allDaysToggle");
  const pdfBtn = document.getElementById("pdfBtn");
  const csvExportBtn = document.getElementById("csvExportBtn");
  const csvImportBtn = document.getElementById("csvImportBtn");
  const csvFileInput = document.getElementById("csvFileInput");
  const saveBtn = document.getElementById("saveBtn");
  const exportFilenameInput = document.getElementById("exportFilename");
  const scheduleBody = document.getElementById("scheduleBody");
  const legendContent = document.getElementById("legendContent");
  const printContent = document.getElementById("printContent");
  const weekdayHeaders = Array.from(
    document.querySelectorAll("th[data-day]"),
  );
  const weekPrevBtn = document.getElementById("weekPrevBtn");
  const weekNextBtn = document.getElementById("weekNextBtn");

  const els = {
    scheduleForm,
    memberInput,
    weekdaySelect,
    weekInput,
    startTimeInput,
    endTimeInput,
    locationInput,
    entryTypeSelect,
    absenceHoursInput,
    allDayEventToggle,
    eventTitleInput,
    clearBtn,
    deleteBtn,
    submitBtn,
    allDaysToggle,
    pdfBtn,
    csvExportBtn,
    csvImportBtn,
    csvFileInput,
    saveBtn,
    exportFilenameInput,
    scheduleBody,
    legendContent,
    printContent,
    weekdayHeaders,
    weekPrevBtn,
    weekNextBtn,
  };

  const { weekDays, absenceTypes } = {
    weekDays: D.Week.weekDays,
    absenceTypes: D.BreakRules.absenceTypes,
  };

  const State = D.State;
  const Form = D.Form;
  let importedFileHandle = null;

  function resetForm() {
    Form.resetFormExceptMember(els);
  }

  function updateDeleteBtn() {
    Form.updateDeleteButtonState(deleteBtn, State.entryEditState, State.eventEditState);
  }

  function hasPendingEditSelection() {
    const hasEntrySelection =
      State.entryEditState.member !== null &&
      State.entryEditState.day !== null &&
      State.entryEditState.index !== null;
    const hasEventSelection =
      State.eventEditState.day !== null && State.eventEditState.index !== null;
    return hasEntrySelection || hasEventSelection;
  }

  function commitPendingEditSelection() {
    if (!hasPendingEditSelection()) {
      return true;
    }
    if (!scheduleForm.reportValidity()) {
      return false;
    }
    if (typeof scheduleForm.requestSubmit === "function") {
      scheduleForm.requestSubmit(submitBtn);
    } else {
      submitBtn.click();
    }
    return !hasPendingEditSelection();
  }

  function generateCurrentCsvContent() {
    return D.Csv.generateCsvContent({
      weekInput,
      legendContent,
      schedule: State.schedule,
      allDayEvents: State.allDayEvents,
    });
  }

  scheduleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const member = memberInput.value.trim();
    const day = weekdaySelect.value;
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;
    const location = locationInput.value.trim();
    const entryType = entryTypeSelect.value;
    const absenceMinutes = State.parseHoursToMinutes(absenceHoursInput.value);
    const eventTitle = eventTitleInput.value.trim();
    const isAllDayEvent = allDayEventToggle.checked;
    const applyAllDays = allDaysToggle.checked && !isAllDayEvent && State.entryEditState.index === null;

    if (!day && !applyAllDays) {
      return;
    }

    if (
      !isAllDayEvent &&
      !absenceTypes.has(entryType) &&
      startTime &&
      endTime
    ) {
      const startMin = D.Time.parseTimeToMinutes(startTime);
      const endMin = D.Time.parseTimeToMinutes(endTime);
      if (endMin < startMin) {
        return;
      }
    }

    const targetDays = applyAllDays ? weekDays : [day];

    if (isAllDayEvent) {
      if (!eventTitle) {
        return;
      }
      const hasStart = Boolean(startTime);
      const hasEnd = Boolean(endTime);
      if (hasStart !== hasEnd) {
        return;
      }
      State.addAllDayEvent({
        day,
        title: eventTitle,
        startTime: startTime || "",
        endTime: endTime || "",
      });
    } else {
      if (!member) {
        return;
      }
      targetDays.forEach((targetDay) => {
        if (absenceTypes.has(entryType)) {
          const resolvedAbsenceMinutes =
            absenceMinutes || D.BreakRules.DEFAULT_FULL_DAY_MINUTES;
          State.addEntry({
            member,
            day: targetDay,
            startTime: "",
            endTime: "",
            location: "",
            entryType,
            absenceMinutes: resolvedAbsenceMinutes,
          });
        } else {
          const hasStart = Boolean(startTime);
          const hasEnd = Boolean(endTime);
          if (hasStart !== hasEnd) {
            return;
          }
          State.addEntry({
            member,
            day: targetDay,
            startTime,
            endTime,
            location,
            entryType,
          });
        }
      });
    }

    State.lastSubmittedFlash = {
      member: isAllDayEvent ? null : member,
      days: isAllDayEvent ? [] : targetDays.slice(),
    };

    resetForm();
    State.resetEntryEditState();
    State.resetEventEditState();
    updateDeleteBtn();
    State.clearActiveCell();
    D.Render.renderTable(scheduleBody, State.schedule, State.allDayEvents);
    Form.updateMemberDatalist(State.schedule);
    D.Render.flashSubmittedCells(State.lastSubmittedFlash);
  });

  clearBtn.addEventListener("click", () => {
    const hasData =
      Object.keys(State.schedule).length > 0 ||
      weekDays.some((day) => State.allDayEvents[day].length > 0);
    if (hasData && !confirm("Möchtest du wirklich die gesamte Woche leeren?")) {
      return;
    }
    Object.keys(State.schedule).forEach((member) => {
      delete State.schedule[member];
    });
    weekDays.forEach((day) => {
      State.allDayEvents[day] = [];
    });
    resetForm();
    State.resetEntryEditState();
    State.resetEventEditState();
    updateDeleteBtn();
    State.clearActiveCell();
    D.Render.renderTable(scheduleBody, State.schedule, State.allDayEvents);
    Form.updateMemberDatalist(State.schedule);
  });

  deleteBtn.addEventListener("click", () => {
    const isEvent = allDayEventToggle.checked;
    let didDelete = false;
    if (
      isEvent &&
      State.eventEditState.day !== null &&
      State.eventEditState.index !== null
    ) {
      const events = State.allDayEvents[State.eventEditState.day];
      if (events && events[State.eventEditState.index]) {
        events.splice(State.eventEditState.index, 1);
        didDelete = true;
      }
      State.resetEventEditState();
    } else if (
      State.entryEditState.member !== null &&
      State.entryEditState.day !== null &&
      State.entryEditState.index !== null
    ) {
      const entries =
        State.schedule[State.entryEditState.member] &&
        State.schedule[State.entryEditState.member][State.entryEditState.day];
      if (entries && entries[State.entryEditState.index]) {
        entries.splice(State.entryEditState.index, 1);
        if (entries.length === 0) {
          delete State.schedule[State.entryEditState.member][State.entryEditState.day];
        }
        didDelete = true;
      }
      State.resetEntryEditState();
    }

    if (didDelete) {
      resetForm();
      D.Render.renderTable(scheduleBody, State.schedule, State.allDayEvents);
    }
    updateDeleteBtn();
  });

  pdfBtn.addEventListener("click", () => {
    D.Export.syncLegendPrintState(legendContent);
    const originalTitle = document.title;
    document.title = D.Export.getExportBaseName(exportFilenameInput);
    const restorePdfExport = D.Export.preparePdfExport(printContent);
    let didCleanup = false;
    const cleanupAfterPrint = () => {
      if (didCleanup) {
        return;
      }
      didCleanup = true;
      document.title = originalTitle;
      restorePdfExport();
    };

    window.addEventListener("afterprint", cleanupAfterPrint, {
      once: true,
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          window.print();
        } finally {
          setTimeout(cleanupAfterPrint, 1000);
        }
      });
    });
  });

  csvExportBtn.addEventListener("click", () => {
    if (!commitPendingEditSelection()) {
      return;
    }
    const csvContent = generateCurrentCsvContent();
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = D.Export.getExportFilename(".csv", exportFilenameInput);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  saveBtn.addEventListener("click", async () => {
    if (!commitPendingEditSelection()) {
      return;
    }
    const csvContent = generateCurrentCsvContent();
    if (importedFileHandle) {
      try {
        const writable = await importedFileHandle.createWritable();
        await writable.write(csvContent);
        await writable.close();
        return;
      } catch (err) {
        importedFileHandle = null;
      }
    }

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: D.Export.getExportFilename(".csv", exportFilenameInput),
          types: [{ description: "CSV", accept: { "text/csv": [".csv"] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(csvContent);
        await writable.close();
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
        // SecurityError or other — fall through to download
      }
    }

    // Fallback: download as file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = D.Export.getExportFilename(".csv", exportFilenameInput);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  csvImportBtn.addEventListener("click", () => {
    if (window.showOpenFilePicker) {
      (async () => {
        try {
          const [handle] = await window.showOpenFilePicker({
            multiple: false,
            types: [{ description: "CSV", accept: { "text/csv": [".csv"] } }],
          });
          const file = await handle.getFile();
          importedFileHandle = handle;
          saveBtn.disabled = false;
          D.Import.processImportedFile(file, {
            exportFilenameInput,
            weekInput,
            weekdayHeaders,
            legendContent,
            scheduleBody,
          });
        } catch (err) {
          if (err.name !== "AbortError") {
            importedFileHandle = null;
          }
        }
      })();
      return;
    }
    csvFileInput.value = "";
    csvFileInput.click();
  });

  csvFileInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    importedFileHandle = null;
    saveBtn.disabled = false;
    D.Import.processImportedFile(file, {
      exportFilenameInput,
      weekInput,
      weekdayHeaders,
      legendContent,
      scheduleBody,
    });
  });

  scheduleBody.addEventListener("click", (event) => {
    const cell = event.target.closest("td[data-day]");
    if (!cell) {
      return;
    }

    State.setActiveCell(cell);
    const row = cell.parentElement;
    const wasAlreadyActive = State.activeCell === null && cell.classList.contains("cell-active") === false;

    if (row.getAttribute("data-row-type") === "events") {
      const day = cell.getAttribute("data-day");
      const eventItem = event.target.closest("[data-event-index]");
      if (!day) {
        return;
      }

      if (!cell.classList.contains("cell-active") && allDayEventToggle.checked) {
        allDayEventToggle.checked = false;
        Form.toggleEventMode(false, els);
        State.resetEventEditState();
        eventTitleInput.value = "";
        startTimeInput.value = "";
        endTimeInput.value = "";
        weekdaySelect.value = "";
        updateDeleteBtn();
        return;
      }

      allDayEventToggle.checked = true;
      Form.toggleEventMode(true, els);
      State.resetEntryEditState();
      if (eventItem) {
        const index = Number(eventItem.getAttribute("data-event-index"));
        const eventData = State.allDayEvents[day] && State.allDayEvents[day][index];
        if (eventData) {
          eventTitleInput.value = eventData.title;
          startTimeInput.value = eventData.startTime || "";
          endTimeInput.value = eventData.endTime || "";
          State.eventEditState.day = day;
          State.eventEditState.index = Number.isNaN(index) ? null : index;
        }
      } else {
        eventTitleInput.value = "";
        startTimeInput.value = "";
        endTimeInput.value = "";
        State.resetEventEditState();
      }
      weekdaySelect.value = day;
      eventTitleInput.focus();
      updateDeleteBtn();
      return;
    }

    const member = row.getAttribute("data-member");
    const day = cell.getAttribute("data-day");
    const entryIndexElement = event.target.closest("[data-entry-index]");
    const entries = State.schedule[member] && State.schedule[member][day];
    allDayEventToggle.checked = false;
    Form.toggleEventMode(false, els);
    State.resetEventEditState();
    State.resetEntryEditState();
    memberInput.value = member;
    weekdaySelect.value = day;
    const selectedEntryIndex = entryIndexElement
      ? Number(entryIndexElement.getAttribute("data-entry-index"))
      : entries && entries.length === 1
        ? 0
        : null;
    if (entries && selectedEntryIndex !== null) {
      const index = selectedEntryIndex;
      const entry = entries[index];
      if (entry) {
        entryTypeSelect.value = entry.type || "Dienst";
        startTimeInput.value = entry.startTime || "";
        endTimeInput.value = entry.endTime || "";
        locationInput.value = entry.location || "";
        absenceHoursInput.value = D.Time.formatHoursDecimalInput(
          entry.absenceMinutes || D.BreakRules.DEFAULT_FULL_DAY_MINUTES,
        );
        State.entryEditState.member = member;
        State.entryEditState.day = day;
        State.entryEditState.index = Number.isNaN(index) ? null : index;
        allDaysToggle.disabled = true;
        allDaysToggle.checked = false;
        Form.updateEntryTypeMode(els);
      }
    } else {
      startTimeInput.value = "";
      endTimeInput.value = "";
      locationInput.value = "";
      entryTypeSelect.value = "Dienst";
      absenceHoursInput.value = "7,8";
      allDaysToggle.disabled = false;
      State.resetEntryEditState();
      Form.updateEntryTypeMode(els);
    }
    updateDeleteBtn();
    if (absenceTypes.has(entryTypeSelect.value)) {
      entryTypeSelect.focus();
    } else {
      startTimeInput.focus();
    }
  });

  weekInput.addEventListener("change", () => {
    D.Week.updateWeekdayHeaders(weekInput.value, weekdayHeaders);
  });

  weekPrevBtn.addEventListener("click", () => D.Week.shiftWeek(-1, weekInput, weekdayHeaders));
  weekNextBtn.addEventListener("click", () => D.Week.shiftWeek(1, weekInput, weekdayHeaders));

  allDayEventToggle.addEventListener("change", () => {
    Form.toggleEventMode(allDayEventToggle.checked, els);
    Form.updateSubmitButtonText(submitBtn, allDayEventToggle, entryTypeSelect);
    if (allDayEventToggle.checked) {
      State.resetEntryEditState();
    }
    if (!allDayEventToggle.checked) {
      State.resetEventEditState();
      eventTitleInput.value = "";
      startTimeInput.value = "";
      endTimeInput.value = "";
    }
    updateDeleteBtn();
  });

  entryTypeSelect.addEventListener("change", () => {
    Form.updateEntryTypeMode(els);
    Form.updateSubmitButtonText(submitBtn, allDayEventToggle, entryTypeSelect);
    if (absenceTypes.has(entryTypeSelect.value)) {
      startTimeInput.value = "";
      endTimeInput.value = "";
      locationInput.value = "";
      if (!absenceHoursInput.value) {
        absenceHoursInput.value = "7,8";
      }
    }
  });

  startTimeInput.addEventListener("input", () => Form.validateTimeRange(startTimeInput, endTimeInput));
  endTimeInput.addEventListener("input", () => Form.validateTimeRange(startTimeInput, endTimeInput));

  startTimeInput.addEventListener("change", () => {
    if (!startTimeInput.value || endTimeInput.value) {
      return;
    }
    if (absenceTypes.has(entryTypeSelect.value) || allDayEventToggle.checked) {
      return;
    }
    const start = D.Time.parseTimeToMinutes(startTimeInput.value);
    if (start === null) return;
    const defaultNetHours = 7.8;
    const breakMinutes = 30;
    const endMinutes = Math.round(start + defaultNetHours * 60 + breakMinutes);
    endTimeInput.value = D.Time.formatTimeFromMinutes(endMinutes);
  });

  document.addEventListener("keydown", (event) => {
    const isFormElement =
      event.target.tagName === "INPUT" ||
      event.target.tagName === "SELECT" ||
      event.target.tagName === "TEXTAREA" ||
      event.target.isContentEditable;

    if (event.key === "Escape" && !isFormElement) {
      resetForm();
      State.resetEntryEditState();
      State.resetEventEditState();
      updateDeleteBtn();
      State.clearActiveCell();
      return;
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "Backspace" &&
      !isFormElement
    ) {
      event.preventDefault();
      clearBtn.click();
      return;
    }
  });

  legendContent.addEventListener("input", () => {
    D.Export.syncLegendPrintState(legendContent);
  });

  D.Week.updateWeekdayHeaders(weekInput.value, weekdayHeaders);
  Form.toggleEventMode(false, els);
  Form.updateSubmitButtonText(submitBtn, allDayEventToggle, entryTypeSelect);
  D.Export.syncLegendPrintState(legendContent);
  D.Render.renderTable(scheduleBody, State.schedule, State.allDayEvents);
})(window.Dienstplan || (window.Dienstplan = {}));
