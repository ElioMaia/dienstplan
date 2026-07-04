(function (D) {
  "use strict";

  function resetFormExceptMember(els) {
    const savedMember = els.memberInput.value;
    els.scheduleForm.reset();
    els.memberInput.value = savedMember;
    els.weekdaySelect.value = "";
    els.startTimeInput.value = "";
    els.endTimeInput.value = "";
    els.locationInput.value = "";
    els.eventTitleInput.value = "";
    els.entryTypeSelect.value = "Dienst";
    els.absenceHoursInput.value = "7,8";
    els.allDayEventToggle.checked = false;
    els.allDaysToggle.checked = false;
    els.allDaysToggle.disabled = false;
    toggleEventMode(false, els);
  }

  function updateMemberDatalist(schedule) {
    const datalist = document.getElementById("memberList");
    if (!datalist) return;
    const members = Object.keys(schedule);
    datalist.innerHTML = members
      .map((m) => `<option value="${D.Csv.escapeHtml(m)}"></option>`)
      .join("");
  }

  function updateDeleteButtonState(deleteBtn, entryEditState, eventEditState) {
    const hasEntrySelection =
      entryEditState.member !== null &&
      entryEditState.day !== null &&
      entryEditState.index !== null;
    const hasEventSelection =
      eventEditState.day !== null && eventEditState.index !== null;
    deleteBtn.disabled = !(hasEntrySelection || hasEventSelection);
  }

  function updateEntryTypeMode(els) {
    const isEvent = els.allDayEventToggle.checked;
    const isAbsence = D.BreakRules.absenceTypes.has(els.entryTypeSelect.value);
    if (isEvent) {
      els.entryTypeSelect.disabled = true;
      els.locationInput.disabled = true;
      els.startTimeInput.disabled = false;
      els.endTimeInput.disabled = false;
      els.absenceHoursInput.disabled = true;
      els.absenceHoursInput.removeAttribute("required");
      return;
    }
    els.entryTypeSelect.disabled = false;
    els.locationInput.disabled = isAbsence;
    els.startTimeInput.disabled = isAbsence;
    els.endTimeInput.disabled = isAbsence;
    els.absenceHoursInput.disabled = !isAbsence;
    if (isAbsence) {
      els.absenceHoursInput.setAttribute("required", "required");
    } else {
      els.absenceHoursInput.removeAttribute("required");
    }
  }

  function updateSubmitButtonText(submitBtn, allDayEventToggle, entryTypeSelect) {
    if (!submitBtn) return;
    if (allDayEventToggle.checked) {
      submitBtn.textContent = "Ereignis hinzufügen";
      return;
    }
    const entryType = entryTypeSelect.value;
    submitBtn.textContent = `${entryType} hinzufügen`;
  }

  function toggleEventMode(isEvent, els) {
    els.memberInput.disabled = isEvent;
    els.eventTitleInput.disabled = !isEvent;
    els.allDaysToggle.disabled = isEvent;
    if (isEvent) {
      els.allDaysToggle.checked = false;
      els.eventTitleInput.setAttribute("required", "required");
      els.memberInput.removeAttribute("required");
      els.startTimeInput.removeAttribute("required");
      els.endTimeInput.removeAttribute("required");
    } else {
      els.eventTitleInput.removeAttribute("required");
      els.memberInput.setAttribute("required", "required");
    }
    updateEntryTypeMode(els);
    updateDeleteButtonState(
      els.deleteBtn,
      D.State.entryEditState,
      D.State.eventEditState,
    );
    updateSubmitButtonText(els.submitBtn, els.allDayEventToggle, els.entryTypeSelect);
  }

  function validateTimeRange(startTimeInput, endTimeInput) {
    const start = startTimeInput.value;
    const end = endTimeInput.value;
    if (start && end) {
      const startMin = D.Time.parseTimeToMinutes(start);
      const endMin = D.Time.parseTimeToMinutes(end);
      if (endMin < startMin) {
        endTimeInput.classList.add("is-invalid");
        return false;
      }
    }
    endTimeInput.classList.remove("is-invalid");
    return true;
  }

  D.Form = {
    resetFormExceptMember,
    updateMemberDatalist,
    updateDeleteButtonState,
    updateEntryTypeMode,
    updateSubmitButtonText,
    toggleEventMode,
    validateTimeRange,
  };
})(window.Dienstplan || (window.Dienstplan = {}));
