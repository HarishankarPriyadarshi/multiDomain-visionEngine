function opGlyph(op) {
  const common =
    'style="display:inline-block;vertical-align:middle;margin:0 3px;"';
  if (op === "+") {
    return `<svg width="13" height="13" viewBox="0 0 12 12" ${common} aria-hidden="true"><rect x="5" y="1" width="2" height="10" rx="1" fill="currentColor"/><rect x="1" y="5" width="10" height="2" rx="1" fill="currentColor"/></svg>`;
  }
  if (op === "-") {
    return `<svg width="13" height="13" viewBox="0 0 12 12" ${common} aria-hidden="true"><rect x="1" y="5" width="10" height="2" rx="1" fill="currentColor"/></svg>`;
  }
  if (op === "*" || op === "×") {
    return `<svg width="13" height="13" viewBox="0 0 12 12" ${common} aria-hidden="true"><line x1="1.5" y1="1.5" x2="10.5" y2="10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="10.5" y1="1.5" x2="1.5" y2="10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  }
  if (op === "/" || op === "÷") {
    return `<svg width="13" height="13" viewBox="0 0 12 12" ${common} aria-hidden="true"><circle cx="6" cy="2.6" r="1.3" fill="currentColor"/><rect x="1" y="5" width="10" height="2" rx="1" fill="currentColor"/><circle cx="6" cy="9.4" r="1.3" fill="currentColor"/></svg>`;
  }
  return op;
}

function escapeHTML(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

const MORPHOLOGY_HISTORY_KEY = "vlab_exp4_morphology_operation_history";
const MORPHOLOGY_HTML_KEY = "vlab_exp4_morphology_simulation_report_html";
const MORPHOLOGY_UPDATED_KEY = "vlab_exp4_morphology_simulation_report_updated_at";

function formatOperationName(operation) {
  const names = {
    dilation: "Dilation",
    erosion: "Erosion",
    opening: "Opening",
    closing: "Closing",
  };
  return names[operation] || operation;
}

function countForeground(matrix) {
  return (matrix || []).reduce(
    (total, row) =>
      total + row.reduce((sum, cell) => sum + (cell === 1 ? 1 : 0), 0),
    0,
  );
}

function formatClockTime(ts) {
  if (!ts) return "--:--:--";
  const date = new Date(ts);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDateTime(ts) {
  if (!ts) return "--";
  return new Date(ts).toLocaleString();
}

function renderBinaryMatrix(matrix) {
  if (!matrix || !matrix.length) return "<p>No matrix data available.</p>";

  const size = matrix.length;
  const cells = matrix
    .map((row, rowIndex) =>
      row
        .map((cell, colIndex) => {
          const isPadding =
            size === 9 &&
            row.length === 9 &&
            rowIndex === 0 ||
            (size === 9 &&
              row.length === 9 &&
              (rowIndex === size - 1 ||
                colIndex === 0 ||
                colIndex === row.length - 1));
          return `<div class="matrix-cell ${isPadding ? "padding-cell" : ""} ${
            cell === 1 ? "one-cell" : "zero-cell"
          }">${cell}</div>`;
        })
        .join(""),
    )
    .join("");

  return `<div class="binary-matrix" style="grid-template-columns:repeat(${matrix[0].length}, 22px);">${cells}</div>`;
}

function getActiveUserHash() {
  try {
    return localStorage.getItem("vlab_exp2_active_user_hash");
  } catch (e) {
    return null;
  }
}

function readMorphologyHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MORPHOLOGY_HISTORY_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeMorphologyHistory(history) {
  try {
    localStorage.setItem(MORPHOLOGY_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Could not save morphology operation history", e);
  }
}

function buildOperationSection(entry) {
  const stageRows = entry.stages
    .map(
      (stage, index) => `<tr>
        <td>${index + 1}</td>
        <td>${escapeHTML(stage.label)}</td>
        <td>${countForeground(stage.image)}</td>
      </tr>`,
    )
    .join("");

  const stageBlocks = entry.stages
    .map(
      (stage, index) => `<div class="results-card matrix-card">
        <h3>Stage ${index + 1}: ${escapeHTML(stage.label)}</h3>
        ${renderBinaryMatrix(stage.image)}
      </div>`,
    )
    .join("");

  return `<div class="report-page">
    <div class="section">
      <div class="report-overview-top">
        <p class="badge">Operation ${entry.sequence}</p>
        <p class="report-stamp">${escapeHTML(formatDateTime(entry.completedAt))}</p>
      </div>
      <h2>${escapeHTML(entry.operationName)}</h2>
      <p class="desc">${escapeHTML(entry.operationName)} was completed on the ${escapeHTML(
        entry.imageName || "selected",
      )} pattern using a ${entry.kernel.length}${opGlyph("×")}${
        entry.kernel[0].length
      } structuring element.</p>
      <div class="info-grid">
        <div class="info-card"><span class="label">Input Foreground:</span>${
          entry.stats.inputForeground
        }</div>
        <div class="info-card"><span class="label">Output Foreground:</span>${
          entry.stats.outputForeground
        }</div>
        <div class="info-card"><span class="label">Foreground Change:</span>${
          entry.stats.foregroundChange
        }</div>
        <div class="info-card"><span class="label">Steps:</span>${entry.totalSteps}</div>
      </div>
    </div>

    <div class="section results-section">
      <h2>Input, Kernel, and Output</h2>
      <div class="matrix-row">
        <div class="results-card matrix-card"><h3>Input A</h3>${renderBinaryMatrix(
          entry.inputImage,
        )}</div>
        <div class="results-card matrix-card"><h3>Kernel B</h3>${renderBinaryMatrix(
          entry.kernel,
        )}</div>
        <div class="results-card matrix-card"><h3>Output</h3>${renderBinaryMatrix(
          entry.outputImage,
        )}</div>
      </div>
    </div>

    <div class="section results-section">
      <h2>Stage Summary</h2>
      <div class="table-shell">
        <table class="compact-table">
          <thead><tr><th>#</th><th>Stage</th><th>Foreground Pixels</th></tr></thead>
          <tbody>${
            stageRows ||
            `<tr><td>1</td><td>${escapeHTML(entry.operationName)}</td><td>${entry.stats.outputForeground}</td></tr>`
          }</tbody>
        </table>
      </div>
      <div class="stage-grid">${stageBlocks}</div>
    </div>
  </div>`;
}

function buildMorphologyReportHtml(history) {
  const generatedOn = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const firstTime = history[0]?.startedAt || history[0]?.completedAt;
  const lastTime = history[history.length - 1]?.completedAt;
  const operationList = history
    .map((entry) => `<li>${entry.sequence}. ${escapeHTML(entry.operationName)}</li>`)
    .join("");
  const totalInputForeground = history.reduce(
    (sum, entry) => sum + entry.stats.inputForeground,
    0,
  );
  const totalOutputForeground = history.reduce(
    (sum, entry) => sum + entry.stats.outputForeground,
    0,
  );

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<style>
  * { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body {
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    background: #eef4fb;
    color: #1f2d3d;
    margin: 0;
    padding: 0;
    line-height: 1.65;
    overflow-x: hidden;
  }
  #report-viewport { width: 100%; overflow: hidden; position: relative; }
  #report-scale-inner { width: 944px; transform-origin: top left; padding: 30px 22px 44px; box-sizing: border-box; }
  .report-page { width: 100%; max-width: 900px; margin: 0 auto 16px; padding: 26px 28px 22px; background-color: #ffffff; border-radius: 18px; box-sizing: border-box; }
  .report-page:last-of-type { margin-bottom: 0; }
  h1, h2, h3 { color: #1f2d3d; margin-top: 0; font-weight: 700; }
  h2 { font-size: 23px; margin-bottom: 16px; color: #243b53; }
  h3 { font-size: 17px; margin-bottom: 10px; color: #2d4b68; }
  p { margin: 0 0 12px; font-size: 15px; }
  li { margin-bottom: 6px; }
  .header-row { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; }
  .report-title-block { flex: 1 1 220px; min-width: 0; text-align: center; margin: 0; padding-bottom: 14px; border-bottom: 3px solid #2f7bfa; }
  .report-subtitle { margin: 8px 0 0; font-size: 14px; color: #5c6f84; }
  .report-overview-top { display: flex; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 12px; flex-wrap: wrap; }
  .badge { margin: 0; padding: 8px 14px; border-radius: 20px; background: #e8f1ff; color: #1f62d0; font-weight: 600; font-size: 13px; }
  .report-stamp { margin: 0; padding: 8px 12px; border-radius: 999px; background: #ffffff; border: 1px solid #dce5ef; color: #50657c; font-size: 13px; font-weight: 600; }
  .report-experiment-label { margin: 0 0 6px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #60778f; font-weight: 700; }
  .report-experiment-title { margin: 0 0 18px; font-size: 25px; line-height: 1.3; font-weight: 700; color: #16324b; overflow-wrap: break-word; }
  .info-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
  .info-card { background: #fff; border: 1px solid #e5e9f2; border-radius: 10px; padding: 12px 14px; font-size: 14px; min-height: 60px; box-sizing: border-box; flex: 1 1 150px; min-width: 130px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
  .label { font-weight: 600; color: #1f2d3d; display: block; margin-bottom: 2px; }
  .section { background-color: #f6f9fc; padding: 22px 24px; margin-bottom: 24px; border-radius: 14px; border: 1px solid #e0e8f2; }
  .section:last-child { margin-bottom: 0; }
  .results-card { background: #ffffff; border: 1px solid #dde6f0; border-radius: 14px; padding: 18px; box-sizing: border-box; page-break-inside: avoid !important; break-inside: avoid !important; }
  .results-card h3 { margin-bottom: 12px; text-align: left; }
  .table-shell { overflow-x: auto; overflow-y: hidden; border: 1px solid #dce6f2; border-radius: 12px; -webkit-overflow-scrolling: touch; page-break-inside: avoid !important; break-inside: avoid !important; }
  table.compact-table { width: 100%; min-width: 420px; border-collapse: collapse; table-layout: fixed; margin-top: 0; }
  .compact-table th, .compact-table td { border: 1px solid #e5e9f2; padding: 10px 12px; text-align: center; font-size: 14px; vertical-align: middle; }
  .compact-table th { background-color: #1f62d0; color: #fff; font-weight: 700; }
  .compact-table tr:nth-child(even) { background-color: #f8fbff; }
  .matrix-row { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
  .matrix-card { flex: 1 1 230px; min-width: 230px; overflow-x: auto; }
  .stage-grid { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px; }
  .binary-matrix { display: grid; gap: 2px; width: max-content; border: 1px solid #d1d5db; padding: 8px; background: #f9fafb; }
  .matrix-cell { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border: 1px solid #d1d5db; font-size: 11px; font-weight: 700; }
  .zero-cell { background: #111827; color: #ffffff; }
  .one-cell { background: #ffffff; color: #111827; }
  .padding-cell { background: #374151; color: #ffffff; }
  .report-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 12px; max-width: 900px; margin: 30px auto 10px; padding: 0 22px; }
  .print-btn, .download-btn { flex: 0 1 140px; min-width: 0; padding: 10px 18px; font-size: 14px; border: none; border-radius: 30px; color: white; cursor: pointer; transition: all 0.25s ease; }
  .print-btn { background-color: #1f62d0; }
  .download-btn { background-color: #1f8d38; }
  .print-btn:hover, .download-btn:hover { transform: translateY(-2px); }
  .print-btn:disabled, .download-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  @media print {
    .print-btn, .download-btn, .report-actions { display: none !important; }
    body { margin: 0; padding: 0; background: #ffffff; }
    .report-page { margin: 0 0 14px; padding: 24px 26px 22px; border: none !important; border-radius: 0 !important; box-shadow: none !important; }
    #report-scale-inner { transform: none !important; width: 100% !important; }
    #report-viewport { height: auto !important; width: 100% !important; }
  }
</style>
</head>
<body id="report-root">
  <div id="report-viewport">
    <div id="report-scale-inner">
      <div id="pdf-export-root">
        <div class="report-page">
          <div class="header-row">
            <div class="report-title-block">
              <h2>Virtual Labs Simulation Report</h2>
              <p class="report-subtitle">Morphological Operations</p>
            </div>
          </div>
          <div class="section report-overview">
            <div class="report-overview-top">
              <p class="badge">Image Processing Lab</p>
              <p class="report-stamp">Generated on ${generatedOn}</p>
            </div>
            <p class="report-experiment-label">Experiment Title</p>
            <p class="report-experiment-title">Morphological Operations on Binary Images</p>
            <div class="info-grid">
              <div class="info-card"><span class="label">Start Time:</span>${formatClockTime(
                firstTime,
              )}</div>
              <div class="info-card"><span class="label">End Time:</span>${formatClockTime(
                lastTime,
              )}</div>
              <div class="info-card"><span class="label">Completed Operations:</span>${
                history.length
              }</div>
            </div>
          </div>
          <div class="section">
            <h2>Summary</h2>
            <p>This report records every completed morphology operation from the current simulation session in execution order. Unfinished operations cancelled by reset are not included.</p>
            <h3>Execution Order</h3>
            <ul>${operationList}</ul>
            <div class="info-grid">
              <div class="info-card"><span class="label">Total Input Foreground:</span>${totalInputForeground}</div>
              <div class="info-card"><span class="label">Total Output Foreground:</span>${totalOutputForeground}</div>
              <div class="info-card"><span class="label">Net Foreground Change:</span>${
                totalOutputForeground - totalInputForeground
              }</div>
            </div>
          </div>
        </div>
        ${history.map(buildOperationSection).join("")}
      </div>
      <div class="report-actions">
        <button class="download-btn" onclick="downloadPdfReport(this)">DOWNLOAD</button>
        <button class="print-btn" onclick="window.print()">PRINT</button>
      </div>
    </div>
  </div>
  <script>
    async function downloadPdfReport(btn) {
      if (typeof html2canvas === 'undefined' || typeof (window.jspdf ? window.jspdf.jsPDF : window.jsPDF) === 'undefined') {
        alert('PDF library is still loading. Please try again in a moment.');
        return;
      }
      btn.disabled = true;
      var originalText = btn.textContent;
      btn.textContent = 'Preparing PDF...';
      var root = document.getElementById('pdf-export-root');
      try {
        const canvas = await html2canvas(root, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: 944,
          windowHeight: root.scrollHeight,
          scrollX: 0,
          scrollY: 0,
        });
        const JsPDFCtor = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
        const pdf = new JsPDFCtor({ unit: 'pt', format: 'a4', orientation: 'portrait' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;
        const imgWidth = usableWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const scaleRatio = imgHeight / canvas.height;
        let renderedCanvasY = 0;
        let firstPage = true;
        while (renderedCanvasY < canvas.height) {
          const canvasPageHeight = usableHeight / scaleRatio;
          const breakAt = Math.min(renderedCanvasY + canvasPageHeight, canvas.height);
          const sliceHeightPx = breakAt - renderedCanvasY;
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeightPx;
          pageCanvas
            .getContext('2d')
            .drawImage(canvas, 0, renderedCanvasY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
          if (!firstPage) pdf.addPage();
          pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.98), 'JPEG', margin, margin, imgWidth, sliceHeightPx * scaleRatio);
          renderedCanvasY = breakAt;
          firstPage = false;
        }
        pdf.save('morphology_simulation_report_' + Date.now() + '.pdf');
      } catch (err) {
        console.error(err);
        alert('Could not generate the PDF report.');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    }
  </script>
</body>
</html>`;
}

function persistMorphologyReport(history) {
  const html = buildMorphologyReportHtml(history);
  const updatedAt = String(Date.now());

  try {
    localStorage.setItem(MORPHOLOGY_HTML_KEY, html);
    localStorage.setItem(MORPHOLOGY_UPDATED_KEY, updatedAt);
    localStorage.setItem("progressreport.html", html);
    localStorage.setItem("vlab:simulation_report_html", html);
    localStorage.setItem(
      "vlab:simulation_report_data",
      JSON.stringify({
        source: "morphology",
        experiment: "morphology",
        updatedAt,
        operations: history,
      }),
    );

    const activeHash = getActiveUserHash();
    if (activeHash) {
      localStorage.setItem(
        `vlab_exp2_user_${activeHash}_simulation_report_html`,
        html,
      );
      localStorage.setItem(
        `vlab_exp2_user_${activeHash}_simulation_report_updated_at`,
        updatedAt,
      );
    }
  } catch (e) {
    console.error("Could not persist morphology report", e);
  }

  try {
    window.parent?.postMessage(
      {
        type: "vlab:simulation_report_generated",
        html,
        updatedAt,
        source: "morphology",
      },
      "*",
    );
    window.opener?.postMessage(
      {
        type: "vlab:simulation_report_generated",
        html,
        updatedAt,
        source: "morphology",
      },
      "*",
    );
  } catch (e) {}

  return html;
}

export function startMorphologyReportSession() {
  writeMorphologyHistory([]);
  try {
    localStorage.removeItem(MORPHOLOGY_HTML_KEY);
    localStorage.removeItem(MORPHOLOGY_UPDATED_KEY);
    localStorage.removeItem("progressreport.html");
    localStorage.removeItem("vlab:simulation_report_html");
    localStorage.removeItem("vlab:simulation_report_data");
  } catch (e) {}
}

export function getMorphologyOperationHistory() {
  return readMorphologyHistory();
}

export function hasMorphologyReportHistory() {
  return readMorphologyHistory().length > 0;
}

export function appendMorphologyOperation({
  operation,
  imageName,
  inputImage,
  kernel,
  outputImage,
  stages = [],
  totalSteps = 49,
  startedAt,
  completedAt = new Date().toISOString(),
}) {
  if (!inputImage || !kernel || !outputImage) {
    console.warn("appendMorphologyOperation: missing completed operation data.");
    return null;
  }

  const history = readMorphologyHistory();
  const stats = {
    inputForeground: countForeground(inputImage),
    outputForeground: countForeground(outputImage),
  };
  stats.foregroundChange = stats.outputForeground - stats.inputForeground;

  const entry = {
    sequence: history.length + 1,
    experiment: "morphology",
    operation,
    operationName: formatOperationName(operation),
    imageName,
    inputImage,
    kernel,
    outputImage,
    stages,
    totalSteps,
    startedAt: startedAt || completedAt,
    completedAt,
    stats,
  };

  const nextHistory = [...history, entry];
  writeMorphologyHistory(nextHistory);
  persistMorphologyReport(nextHistory);
  return entry;
}

export function buildCurrentMorphologyReport() {
  const history = readMorphologyHistory();
  if (!history.length) return null;
  return persistMorphologyReport(history);
}

export function downloadMorphologyReport() {
  const html = buildCurrentMorphologyReport();
  if (!html) return false;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-99999px";
  iframe.style.top = "0";
  iframe.style.width = "944px";
  iframe.style.height = "1400px";
  iframe.style.border = "none";

  iframe.onload = () => {
    setTimeout(async () => {
      try {
        const win = iframe.contentWindow;
        const doc = iframe.contentDocument;
        const root = doc.getElementById("pdf-export-root");
        if (!root) {
          document.body.removeChild(iframe);
          return;
        }

        let waited = 0;
        while (
          (typeof win.html2canvas === "undefined" ||
            typeof (win.jspdf?.jsPDF || win.jsPDF) === "undefined") &&
          waited < 5000
        ) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          waited += 100;
        }

        if (
          typeof win.html2canvas === "undefined" ||
          typeof (win.jspdf?.jsPDF || win.jsPDF) === "undefined"
        ) {
          document.body.removeChild(iframe);
          return;
        }

        if (doc.fonts && doc.fonts.ready) {
          try {
            await doc.fonts.ready;
          } catch (e) {}
        }

        void root.offsetHeight;
        await new Promise((resolve) => setTimeout(resolve, 200));

        const canvas = await win.html2canvas(root, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          windowWidth: 944,
          windowHeight: root.scrollHeight,
          scrollX: 0,
          scrollY: 0,
        });

        const JsPDFCtor = win.jspdf ? win.jspdf.jsPDF : win.jsPDF;
        const pdf = new JsPDFCtor({
          unit: "pt",
          format: "a4",
          orientation: "portrait",
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;
        const imgWidth = usableWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const scaleRatio = imgHeight / canvas.height;
        let renderedCanvasY = 0;
        let firstPage = true;

        while (renderedCanvasY < canvas.height) {
          const canvasPageHeight = usableHeight / scaleRatio;
          const breakAt = Math.min(renderedCanvasY + canvasPageHeight, canvas.height);
          const sliceHeightPx = breakAt - renderedCanvasY;
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeightPx;
          pageCanvas
            .getContext("2d")
            .drawImage(
              canvas,
              0,
              renderedCanvasY,
              canvas.width,
              sliceHeightPx,
              0,
              0,
              canvas.width,
              sliceHeightPx,
            );

          if (!firstPage) pdf.addPage();
          pdf.addImage(
            pageCanvas.toDataURL("image/jpeg", 0.98),
            "JPEG",
            margin,
            margin,
            imgWidth,
            sliceHeightPx * scaleRatio,
          );
          renderedCanvasY = breakAt;
          firstPage = false;
        }

        const pdfBlob = pdf.output("blob");
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `morphology_simulation_report_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        document.body.removeChild(iframe);
      } catch (err) {
        console.error("Could not download morphology report", err);
        document.body.removeChild(iframe);
      }
    }, 1200);
  };

  iframe.srcdoc = html;
  document.body.appendChild(iframe);
  return true;
}

export function generateMorphologyReport(params) {
  return appendMorphologyOperation(params);
}

// ---------- Huffman core (generic over any key: characters OR gray levels) ----------
function buildFrequencyMap(values) {
  const freq = {};
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    freq[v] = (freq[v] || 0) + 1;
  }
  return freq;
}

function buildHuffmanTree(freq) {
  let nodes = Object.entries(freq).map(([key, f]) => ({
    key,
    freq: f,
    left: null,
    right: null,
  }));
  if (nodes.length === 0) return null;
  if (nodes.length === 1) {
    nodes.push({
      key: null,
      freq: 0,
      left: null,
      right: null,
      placeholder: true,
    });
  }
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    const left = nodes.shift();
    const right = nodes.shift();
    nodes.push({ key: null, freq: left.freq + right.freq, left, right });
  }
  return nodes[0];
}

function buildCodes(node, prefix = "", codes = {}) {
  if (!node) return codes;
  if (node.key !== null && node.key !== undefined) {
    codes[node.key] = prefix || "0";
    return codes;
  }
  buildCodes(node.left, prefix + "0", codes);
  buildCodes(node.right, prefix + "1", codes);
  return codes;
}

// ---------- Tree layout + SVG (illustrative subtree only - see note below) ----------
function layoutTree(root) {
  let leafIndex = 0;
  const positions = new Map();
  function assignX(node, depth) {
    if (!node) return;
    const isLeaf = !node.left && !node.right;
    if (isLeaf) {
      positions.set(node, { x: leafIndex, y: depth });
      leafIndex++;
      return;
    }
    assignX(node.left, depth + 1);
    assignX(node.right, depth + 1);
    const lx = node.left ? positions.get(node.left)?.x : undefined;
    const rx = node.right ? positions.get(node.right)?.x : undefined;
    const x =
      lx !== undefined && rx !== undefined ? (lx + rx) / 2 : (lx ?? rx ?? 0);
    positions.set(node, { x, y: depth });
  }
  assignX(root, 0);
  return positions;
}

function renderHuffmanTreeSVG(root) {
  if (!root) return "<p>No data to build a tree from.</p>";
  const positions = layoutTree(root);
  const entries = Array.from(positions.values());
  const maxX = Math.max(0, ...entries.map((p) => p.x));
  const maxY = Math.max(0, ...entries.map((p) => p.y));

  const spacingX = 62;
  const spacingY = 82;
  const padX = 44;
  const padY = 34;
  const width = maxX * spacingX + padX * 2 + 20;
  const height = maxY * spacingY + padY * 2 + 30;

  const px = (p) => padX + p.x * spacingX;
  const py = (p) => padY + p.y * spacingY;

  let edges = "";
  let nodesSvg = "";

  function walk(node) {
    if (!node || node.placeholder) return;
    const p = positions.get(node);

    if (node.left && !node.left.placeholder) {
      const lp = positions.get(node.left);
      edges += `<line x1="${px(p)}" y1="${py(p)}" x2="${px(lp)}" y2="${py(lp)}" stroke="#94a3b8" stroke-width="2"/>`;
      edges += `<text x="${(px(p) + px(lp)) / 2 - 10}" y="${(py(p) + py(lp)) / 2}" font-size="12" fill="#1f2937" font-weight="700">0</text>`;
      walk(node.left);
    }
    if (node.right && !node.right.placeholder) {
      const rp = positions.get(node.right);
      edges += `<line x1="${px(p)}" y1="${py(p)}" x2="${px(rp)}" y2="${py(rp)}" stroke="#94a3b8" stroke-width="2"/>`;
      edges += `<text x="${(px(p) + px(rp)) / 2 + 6}" y="${(py(p) + py(rp)) / 2}" font-size="12" fill="#1f2937" font-weight="700">1</text>`;
      walk(node.right);
    }

    const isLeaf = !node.left && !node.right;
    if (isLeaf) {
      nodesSvg += `<circle cx="${px(p)}" cy="${py(p)}" r="18" fill="#1f2937" stroke="#1f2937" stroke-width="1.5"/>`;
      nodesSvg += `<text x="${px(p)}" y="${py(p) + 4}" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">${escapeHTML(node.key)}</text>`;
      nodesSvg += `<text x="${px(p)}" y="${py(p) + 32}" font-size="10" fill="#4b5563" text-anchor="middle">${node.freq}</text>`;
    } else {
      nodesSvg += `<circle cx="${px(p)}" cy="${py(p)}" r="14" fill="#ffffff" stroke="#1f2937" stroke-width="1.5"/>`;
      nodesSvg += `<text x="${px(p)}" y="${py(p) + 3}" font-size="9" fill="#111827" text-anchor="middle">${node.freq}</text>`;
    }
  }
  walk(root);

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${Math.max(200, height)}" xmlns="http://www.w3.org/2000/svg">${edges}${nodesSvg}</svg>`;
}

/**
 * Builds the full report HTML (Huffman Tree + Frequency Table + Compression
 * Statistics) from the quantized (compressed) image's grayscale pixel data,
 * saves it into the localStorage key progressreport.html already reads from,
 * and notifies the Progress Report page to refresh.
 *
 * @param {Object} params
 * @param {Uint8Array|number[]} params.pixelData - grayscale bytes (0-255) of
 *   the QUANTIZED image (call this BEFORE quantized.delete() in OpenCV code).
 * @param {number} params.width
 * @param {number} params.height
 * @param {number} params.qfactor - the Quantization Factor used
 * @param {string} params.imageName - display name of the image processed
 * @param {number} params.lossyCompressionRatio - the (8 - log2(q))/8 ratio
 *   you already compute in lossyHuffmanEncode(), passed through for context
 */
export function generateLossyHuffmanReport({
  pixelData,
  width,
  height,
  qfactor,
  imageName,
  lossyCompressionRatio,
}) {
  if (!pixelData || !pixelData.length) {
    console.warn("generateLossyHuffmanReport: no pixel data supplied.");
    return null;
  }

  // Full histogram over every gray level actually present -> tree/codes/stats
  // computed here are numerically accurate for the whole image.
  const freq = buildFrequencyMap(pixelData);
  const tree = buildHuffmanTree(freq);
  const codes = buildCodes(tree);

  const totalPixels = pixelData.length;
  const originalBits = totalPixels * 8;
  const compressedBits = Object.entries(freq).reduce(
    (sum, [val, f]) => sum + f * (codes[val] ? codes[val].length : 0),
    0,
  );
  const huffmanRatio = originalBits ? compressedBits / originalBits : 0;
  const huffmanSavedPercent = (1 - huffmanRatio) * 100;
  const savedBits = originalBits - compressedBits;

  // Full sorted list, for the frequency table + illustrative tree.
  const sortedEntries = Object.entries(freq).sort((a, b) => b[1] - a[1]);

  // Table: show the top 20 gray levels by frequency; summarize the rest so
  // nothing is silently hidden.
  const TOP_N_TABLE = 20;
  const topForTable = sortedEntries.slice(0, TOP_N_TABLE);
  const remainingCount = sortedEntries.length - topForTable.length;
  const remainingPixelSum = sortedEntries
    .slice(TOP_N_TABLE)
    .reduce((sum, [, f]) => sum + f, 0);

  const freqRows = topForTable
    .map(([val, f]) => {
      const code = codes[val] || "-";
      return `<tr>
        <td class="cell-strong">${val}</td>
        <td>${f}</td>
        <td><code>${code}</code></td>
        <td>${code.length} bits</td>
      </tr>`;
    })
    .join("");

  const remainingRow =
    remainingCount > 0
      ? `<tr><td colspan="4" style="color:#4b5563;font-style:italic;">+ ${remainingCount} more gray levels (${remainingPixelSum} pixels total) not shown here, but included in the statistics below.</td></tr>`
      : "";

  // Tree: a 256-leaf tree is unreadable, so the SVG only illustrates the
  // TOP_N_TREE most frequent gray levels as their own small Huffman tree.
  // The Compression Statistics above/below still reflect the REAL, full
  // histogram - the diagram is for visual intuition only.
  const TOP_N_TREE = 10;
  const topFreqForTree = {};
  sortedEntries.slice(0, TOP_N_TREE).forEach(([val, f]) => {
    topFreqForTree[val] = f;
  });
  const illustrativeTree = buildHuffmanTree(topFreqForTree);
  const treeSvg = renderHuffmanTreeSVG(illustrativeTree);

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  body { font-family:'Inter',sans-serif; margin:0; color:#111827; background:#fff; }
  .report-page { padding:20px 4px 28px; }
  h2 { font-size:18px; margin:0 0 10px; color:#111827; }
  p.desc { color:#4b5563; font-size:13px; margin:0 0 14px; }
  table { width:100%; border-collapse:collapse; font-size:14px; }
  th, td { border-bottom:1px solid #e5e7eb; padding:8px 10px; text-align:left; }
  th { background:#f9fafb; font-weight:600; }
  .cell-strong { font-weight:600; }
  code { background:#f3f4f6; padding:1px 6px; border-radius:4px; font-size:13px; }
  .stat-row { display:flex; align-items:center; gap:4px; font-size:14px; margin:8px 0; flex-wrap:wrap; }
  .stat-label { font-weight:600; min-width:200px; }
  .stat-highlight { font-size:22px; font-weight:700; margin-top:4px; }
  .tree-wrap { border:1px solid #d1d5db; border-radius:6px; padding:10px; background:#ffffff; }
  .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; font-size:14px; margin-bottom:14px; }
</style>
</head>
<body>
<div id="report-root">

  <div class="report-page">
    <h2>Image &amp; Quantization Details</h2>
    <div class="meta-grid">
      <div><strong>Image:</strong> ${escapeHTML(imageName || "Sample Image")}</div>
      <div><strong>Dimensions:</strong> ${width} ${opGlyph("×")} ${height} px</div>
      <div><strong>Quantization Factor:</strong> ${escapeHTML(qfactor)}</div>
      <div><strong>Lossy Compression Ratio:</strong> ${Number(lossyCompressionRatio || 0).toFixed(4)}</div>
    </div>
    <h2>Huffman Tree (Top ${Math.min(TOP_N_TREE, sortedEntries.length)} Gray Levels)</h2>
    <p class="desc">Built from the quantized image's gray-level histogram. Left edge = 0, right edge = 1; each leaf shows a gray-level value and its pixel frequency. Only the most frequent levels are drawn here for readability - the statistics below reflect the complete histogram.</p>
    <div class="tree-wrap">${treeSvg}</div>
  </div>

  <div class="report-page">
    <h2>Frequency Table</h2>
    <p class="desc">Pixel frequency of each gray level (0${opGlyph("-")}255) in the quantized image and its assigned Huffman code.</p>
    <table>
      <thead><tr><th>Gray Level</th><th>Pixel Frequency</th><th>Huffman Code</th><th>Code Length</th></tr></thead>
      <tbody>${freqRows}${remainingRow}</tbody>
    </table>
  </div>

  <div class="report-page">
    <h2>Compression Statistics</h2>
    <div class="stat-row"><span class="stat-label">Total Pixels</span><span>${totalPixels}</span></div>
    <div class="stat-row">
      <span class="stat-label">Original Size</span>
      <span>${totalPixels} ${opGlyph("×")} 8 bits = ${originalBits} bits</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Huffman-Compressed Size</span>
      <span>&#931; (frequency ${opGlyph("×")} code length) = ${compressedBits} bits</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Space Saved</span>
      <span>${originalBits} ${opGlyph("-")} ${compressedBits} = ${savedBits} bits</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Huffman Compression Ratio</span>
      <span>${compressedBits} ${opGlyph("/")} ${originalBits} ${opGlyph("×")} 100 = ${huffmanRatio > 0 ? (huffmanRatio * 100).toFixed(2) : "0.00"}%</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Quantization Compression Ratio</span>
      <span>${Number(lossyCompressionRatio || 0).toFixed(4)}</span>
    </div>
    <div class="stat-highlight">${huffmanSavedPercent.toFixed(2)}% space saved (Huffman coding on quantized data)</div>
  </div>

</div>
</body></html>`;

  try {
    window.parent.postMessage(
      {
        type: "vlab:simulation_report_generated",
        html: html,
        updatedAt: String(Date.now()),
      },
      window.location.origin,
    );
  } catch (e) {
    console.error("Could not save Huffman report to localStorage", e);
  }

  // Notify whichever host actually exists - popup opener OR parent iframe -
  // instead of assuming only window.opener (which silently no-ops when this
  // page is embedded as an iframe rather than opened as a popup).
  try {
    if (window.opener) {
      window.opener.postMessage(
        { type: "vlab:simulation_report_generated" },
        "*",
      );
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        { type: "vlab:simulation_report_generated" },
        "*",
      );
    }
  } catch (e) {}

  return html;
}
