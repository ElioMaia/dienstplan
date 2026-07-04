(function (D) {
  "use strict";

  function getExportFilename(extension, exportFilenameInput) {
    const rawName = exportFilenameInput
      ? exportFilenameInput.value.trim()
      : "";
    const baseName = rawName || "dienstplan";
    const safeName = baseName.replace(/[\\/:*?"<>|]+/g, "-");
    return `${safeName}${extension}`;
  }

  function getExportBaseName(exportFilenameInput) {
    const rawName = exportFilenameInput
      ? exportFilenameInput.value.trim()
      : "";
    const baseName = rawName || "dienstplan";
    return baseName.replace(/[\\/:*?"<>|]+/g, "-");
  }

  function getPixelsPerMillimeter() {
    const probe = document.createElement("div");
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.width = "100mm";
    document.body.appendChild(probe);
    const pixelsPerMillimeter = probe.getBoundingClientRect().width / 100;
    probe.remove();
    return pixelsPerMillimeter;
  }

  function preparePdfExport(printContent) {
    const pixelsPerMillimeter = getPixelsPerMillimeter();
    const printableWidth = (297 - 20) * pixelsPerMillimeter;
    const printableHeight = (210 - 20) * pixelsPerMillimeter;

    document.body.style.setProperty(
      "--print-sheet-width",
      `${printableWidth}px`,
    );
    document.body.style.setProperty("--print-scale", "1");
    document.body.classList.add("pdf-export-mode");

    const contentWidth = Math.max(printContent.scrollWidth, 1);
    const contentHeight = Math.max(printContent.scrollHeight, 1);
    const scale = Math.min(
      1,
      printableWidth / contentWidth,
      printableHeight / contentHeight,
    );
    const adjustedSheetWidth = printableWidth / scale;

    document.body.style.setProperty(
      "--print-sheet-width",
      `${adjustedSheetWidth}px`,
    );
    document.body.style.setProperty("--print-scale", scale.toFixed(4));

    return () => {
      document.body.classList.remove("pdf-export-mode");
      document.body.style.removeProperty("--print-scale");
      document.body.style.removeProperty("--print-sheet-width");
    };
  }

  function syncLegendPrintState(legendContent) {
    const legendBlock = legendContent.closest(".legend-block");
    if (!legendBlock) {
      return;
    }
    const hasContent = legendContent.innerText.trim().length > 0;
    legendBlock.classList.toggle("is-empty", !hasContent);
  }

  D.Export = {
    getExportFilename,
    getExportBaseName,
    getPixelsPerMillimeter,
    preparePdfExport,
    syncLegendPrintState,
  };
})(window.Dienstplan || (window.Dienstplan = {}));
