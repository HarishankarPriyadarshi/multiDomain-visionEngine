const IIT_LOGO_URL = new URL(
  "../../../assets/images/iitLogo.png",
  import.meta.url,
).href;
const VLABS_LOGO_URL = new URL(
  "../../../assets/images/vlabsLogo.png",
  import.meta.url,
).href;
const RLE_REPORT_KEY = "vlab_exp8_run_length_encoding_report";


function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
      character
      ],
  );
}

function formatClockTime(timestamp) {
  if (!timestamp) return "--:--:--";
  const date = new Date(timestamp);
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDuration(startTime, endTime) {
  if (!startTime || !endTime) return "--:--:--";
  const seconds = Math.max(
    0,
    Math.floor((new Date(endTime) - new Date(startTime)) / 1000),
  );
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
}

function formatDateTime(timestamp) {
  return timestamp ? new Date(timestamp).toLocaleString() : "--";
}

function rleRunLabel(run) {
  return `(${escapeHTML(run.value === " " ? "space" : run.value)}, ${run.count})`;
}

function renderBinaryMatrix(matrix) {
  if (!matrix?.length) return "<p>No matrix data available.</p>";
  return `<div class="binary-matrix" style="grid-template-columns:repeat(${matrix[0].length}, 22px);">${matrix
    .flatMap((row) => row)
    .map(
      (cell) =>
        `<div class="matrix-cell ${cell === 1 ? "one-cell" : "zero-cell"}">${cell}</div>`,
    )
    .join("")}</div>`;
}

function readRleReportData() {
  try {
    const data = JSON.parse(localStorage.getItem(RLE_REPORT_KEY) || "{}");
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

function getDynamicSummary(data) {
  const summaries = [];
  if (data.image)
    summaries.push(
      "The selected binary image was processed using Run Length Encoding. The image was scanned horizontally, and consecutive pixels with the same binary value were grouped into runs represented by value-count pairs. A minimum run length was applied to determine when repeated pixels should be represented as compressed runs. The encoded output and compression statistics were displayed after completion of the simulation.",
    );
  if (data.text)
    summaries.push(
      "The entered text was processed using Run Length Encoding. The text was scanned sequentially, and consecutive identical characters were grouped into runs represented by value-count pairs. A minimum run length was applied to determine when repeated characters should be represented as compressed runs. The encoded output and compression statistics were displayed after completion of the simulation.",
    );
  return summaries.map((summary) => `<p>${summary}</p>`).join("");
}

function buildStatisticsSection(entry, originalLabel) {
  const stats = entry.stats;
  const observation =
    stats.spaceSaved >= 0
      ? "Repeated values reduce the amount of encoded data; short runs may increase the encoded representation."
      : "This input has many short runs, so the value-count representation is larger than the original input.";
  return `<div class="section"><h2>Compression Statistics</h2><div class="info-grid"><div class="info-card"><span class="label">${originalLabel}:</span>${stats.originalSize}</div><div class="info-card"><span class="label">Encoded Runs:</span>${stats.encodedRuns}</div><div class="info-card"><span class="label">Encoded Symbols:</span>${stats.encodedSize}</div><div class="info-card"><span class="label">Compression Ratio:</span>${Number(stats.compressionRatio).toFixed(2)}</div><div class="info-card"><span class="label">Space Saved:</span>${Number(stats.spaceSaved).toFixed(1)}%</div></div><h3 style="margin-top:20px;">Observation</h3><p>${observation}</p><h3>Conclusion</h3><p>Run Length Encoding is lossless: the original input can be reconstructed exactly from its value-count pairs.</p></div>`;
}

function buildImageSection(entry) {
  const configurationRows = [
    ["Input Type", "Binary Image"],
    ["Input Pattern", entry.inputPattern || "Custom"],
    ["Image Size", `${entry.input.length} × ${entry.input[0]?.length || 0}`],
    ["Scan Direction", entry.scanDirection],
    ["Minimum Run Length", entry.minRunLength],
  ]
    .map(
      ([label, value]) =>
        `<tr><td>${escapeHTML(label)}</td><td>${escapeHTML(value)}</td></tr>`,
    )
    .join("");
  const outputRows = entry.encodedGroups
    .map(
      (group) =>
        `<tr><td>${escapeHTML(group.groupLabel)}</td><td>${group.runs.map(rleRunLabel).join(" ") || "No runs"}</td></tr>`,
    )
    .join("");
  return `<div class="report-page"><div class="section"><div class="report-overview-top"><p class="badge">Binary Image Encoding</p><p class="report-stamp">${escapeHTML(formatDateTime(entry.completedAt))}</p></div><h2>Binary Image Encoding</h2><p>The selected binary image was scanned using Run Length Encoding. Consecutive pixels with the same binary value were grouped into value-count pairs, and the completed encoded output and compression statistics were recorded.</p></div><div class="section results-section"><h2>Encoding Configuration</h2><div class="table-shell"><table class="compact-table"><thead><tr><th>Setting</th><th>Value</th></tr></thead><tbody>${configurationRows}</tbody></table></div></div><div class="section results-section"><div class="matrix-row"><div class="results-card matrix-card"><h3>Input Binary Image</h3>${renderBinaryMatrix(entry.input)}</div><div class="results-card matrix-card"><h3>Encoded Output</h3><div class="table-shell"><table class="compact-table"><thead><tr><th>Scan Line</th><th>Value-Count Pairs</th></tr></thead><tbody>${outputRows}</tbody></table></div></div></div></div>${buildStatisticsSection(entry, "Original Pixels")}</div>`;
}

function buildTextSection(entry) {
  const configurationRows = [
    ["Input Type", "Text"],
    ["Minimum Run Length", entry.minRunLength],
  ]
    .map(
      ([label, value]) =>
        `<tr><td>${escapeHTML(label)}</td><td>${escapeHTML(value)}</td></tr>`,
    )
    .join("");
  const encodedText = entry.encodedRuns.map(rleRunLabel).join(" ");
  return `<div class="report-page"><div class="section"><div class="report-overview-top"><p class="badge">Text Encoding</p><p class="report-stamp">${escapeHTML(formatDateTime(entry.completedAt))}</p></div><h2>Text Encoding</h2><p>The entered text was scanned sequentially using Run Length Encoding. Consecutive repeated characters were grouped into value-count pairs, and the completed encoded output and compression statistics were recorded.</p></div><div class="section results-section"><h2>Encoding Configuration</h2><div class="table-shell"><table class="compact-table"><thead><tr><th>Setting</th><th>Value</th></tr></thead><tbody>${configurationRows}</tbody></table></div></div><div class="section results-section"><div class="results-card"><h3>Input Text</h3><p class="text-content">${escapeHTML(entry.input)}</p><h3>Encoded Output</h3><p class="encoded-runs">${encodedText}</p></div></div>${buildStatisticsSection(entry, "Original Characters")}</div>`;
}

function buildRleReportHtml(data) {
  const records = [data.image, data.text].filter(Boolean);
  if (!records.length) return null;
  const firstTime = records[0].startedAt || records[0].completedAt;
  const lastTime = records[records.length - 1].completedAt;
  const generatedOn = new Date(data.updatedAt || Date.now()).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" },
  );
  const sections = [
    data.image && buildImageSection(data.image),
    data.text && buildTextSection(data.text),
  ]
    .filter(Boolean)
    .join("");
  return `<!DOCTYPE html><html><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js">
  </script><script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js">
  </script><style>* { box-sizing: border-box; } html { -webkit-text-size-adjust: 100%; } body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #eef4fb; color: #1f2d3d; margin: 0; padding: 0; line-height: 1.65; overflow-x: hidden; } #report-viewport { width: 100%; overflow: hidden; position: relative; } #report-scale-inner { width: 944px; transform-origin: top left; padding: 30px 22px 44px; } .report-page { width: 100%; max-width: 900px; margin: 0 auto 16px; padding: 26px 28px 22px; background: #fff; border-radius: 18px; } .report-page:last-of-type { margin-bottom: 0; } h1, h2, h3 { color: #1f2d3d; margin-top: 0; font-weight: 700; } h2 { font-size: 23px; margin-bottom: 16px; color: #243b53; } h3 { font-size: 17px; margin-bottom: 10px; color: #2d4b68; } p { margin: 0 0 12px; font-size: 15px; } .vl-logo { height: 70px; width: 78px; object-fit: contain; flex-shrink: 0; } .header-row { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; } .report-title-block { flex: 1 1 220px; min-width: 0; text-align: center; margin: 0; padding-bottom: 14px; border-bottom: 3px solid #2f7bfa; } .report-overview-top { display: flex; justify-content: space-between; align-items: center; gap: 14px; margin-bottom: 12px; flex-wrap: wrap; } .badge { margin: 0; padding: 8px 14px; border-radius: 20px; background: #e8f1ff; color: #1f62d0; font-weight: 600; font-size: 13px; } .report-stamp { margin: 0; padding: 8px 12px; border-radius: 999px; background: #fff; border: 1px solid #dce5ef; color: #50657c; font-size: 13px; font-weight: 600; } .report-experiment-label { margin: 0 0 6px; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #60778f; font-weight: 700; } .report-experiment-title { margin: 0 0 18px; font-size: 25px; line-height: 1.3; font-weight: 700; color: #16324b; } .info-grid { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 12px; } .info-card { background: #fff; border: 1px solid #e5e9f2; border-radius: 10px; padding: 12px 14px; font-size: 14px; min-height: 60px; flex: 1 1 150px; min-width: 130px; display: flex; flex-direction: column; justify-content: center; gap: 4px; } .label { font-weight: 600; color: #1f2d3d; display: block; margin-bottom: 2px; } .section { background: #f6f9fc; padding: 22px 24px; margin-bottom: 24px; border-radius: 14px; border: 1px solid #e0e8f2; } .results-card { background: #fff; border: 1px solid #dde6f0; border-radius: 14px; padding: 18px; page-break-inside: avoid !important; break-inside: avoid !important; } .results-card h3 { margin-bottom: 12px; text-align: left; } .matrix-row { display: flex; flex-wrap: wrap; gap: 16px; align-items: stretch; } .matrix-card { flex: 1 1 380px; min-width: 0; overflow-x: auto; } .table-shell { overflow-x: auto; overflow-y: hidden; border: 1px solid #dce6f2; border-radius: 12px; page-break-inside: avoid !important; break-inside: avoid !important; } table.compact-table { width: 100%; min-width: 360px; border-collapse: collapse; table-layout: fixed; } .compact-table th, .compact-table td { border: 1px solid #e5e9f2; padding: 10px 12px; text-align: center; font-size: 14px; vertical-align: middle; overflow-wrap: anywhere; } .compact-table th { background: #1f62d0; color: #fff; font-weight: 700; } .compact-table tr:nth-child(even) { background: #f8fbff; } .binary-matrix { display: grid; gap: 2px; width: max-content; border: 1px solid #d1d5db; padding: 8px; background: #f9fafb; } .matrix-cell { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border: 1px solid #d1d5db; font-size: 11px; font-weight: 700; } .zero-cell { background: #111827; color: #fff; } .one-cell { background: #fff; color: #111827; } .text-content, .encoded-runs { white-space: pre-wrap; overflow-wrap: anywhere; padding: 12px; border: 1px solid #dce6f2; border-radius: 10px; background: #f8fbff; } .encoded-runs { color: #16324b; font-family: Consolas, monospace; } @media print { body { margin: 0; padding: 0; background: #fff; } .report-page { margin: 0 0 14px; padding: 24px 26px 22px; border: none !important; border-radius: 0 !important; } #report-scale-inner { transform: none !important; width: 100% !important; } #report-viewport { height: auto !important; width: 100% !important; } }</style></head><body id="report-root"><div id="report-viewport"><div id="report-scale-inner"><div id="pdf-export-root"><div class="report-page"><div class="header-row"><img src="${IIT_LOGO_URL}" class="vl-logo"><div class="report-title-block"><h2>Virtual Labs Simulation Report</h2></div><img src="${VLABS_LOGO_URL}" class="vl-logo"></div><div class="section report-overview"><div class="report-overview-top"><p class="badge">Image Processing Lab</p><p class="report-stamp">Generated on ${generatedOn}</p></div><p class="report-experiment-label">Experiment Title</p><p class="report-experiment-title">Run Length Encoding - Simulation</p><div class="info-grid"><div class="info-card"><span class="label">Start Time:</span>${formatClockTime(firstTime)}</div><div class="info-card"><span class="label">End Time:</span>${formatClockTime(lastTime)}</div><div class="info-card"><span class="label">Total Time Spent:</span>${formatDuration(firstTime, lastTime)}</div></div></div><div class="section"><h2>Aim</h2><p>To study Run Length Encoding (RLE) for lossless compression of binary images by identifying consecutive runs of pixels and representing them using value-count pairs.</p><h2>Summary</h2>${getDynamicSummary(data)}</div></div>${sections}</div></div></div></body></html>`;
}

export function hasRunLengthReportData() {
  const data = readRleReportData();
  return Boolean(data.image || data.text);
}

export function appendRunLengthEncoding(entry) {
  if (!entry?.input || !entry?.encodedRuns) return null;
  const current = readRleReportData();
  const data = {
    ...current,
    [entry.inputType === "Binary Image" ? "image" : "text"]: entry,
    updatedAt: entry.completedAt || new Date().toISOString(),
  };
  const html = buildRleReportHtml(data);
    try {
    const reportJson = JSON.stringify(data);
    const updatedAt = data.updatedAt || new Date().toISOString();

    // ---------------------------------------------------------
    // Common/current Exp-8 simulation report
    // ---------------------------------------------------------
    localStorage.setItem(
      "vlab_exp8_simulation_report_html",
      html
    );

    localStorage.setItem(
      "vlab_exp8_simulation_report_updated_at",
      updatedAt
    );

    // ---------------------------------------------------------
    // User-scoped Exp-8 simulation report
    // Common active-user hash is intentionally Exp-2
    // ---------------------------------------------------------
    const activeHash = localStorage.getItem(
      "vlab_exp2_active_user_hash"
    );

    if (activeHash) {
      localStorage.setItem(
        `vlab_exp8_user_${activeHash}_simulation_report_html`,
        html
      );

      localStorage.setItem(
        `vlab_exp8_user_${activeHash}_simulation_report_updated_at`,
        updatedAt
      );
    }

    // Keep the RLE internal report data if these constants
    // are already used elsewhere in reportGenerator.jsx.
    localStorage.setItem(
      RLE_REPORT_KEY,
      reportJson
    );

    

  } catch (error) {
    console.error("Could not save RLE simulation report", error);
  }
  return data;
}

export function downloadRunLengthReport() {
  const html = buildRleReportHtml(readRleReportData());
  if (!html) return false;
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;left:-99999px;top:0;width:944px;height:1400px;border:0;";
  iframe.onload = () => {
    setTimeout(async () => {
      try {
        const win = iframe.contentWindow;
        const doc = iframe.contentDocument;
        const root = doc.getElementById("pdf-export-root");
        let waited = 0;
        while (
          (!root ||
            typeof win.html2canvas === "undefined" ||
            typeof (win.jspdf?.jsPDF || win.jsPDF) === "undefined") &&
          waited < 5000
        ) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          waited += 100;
        }
        if (
          !root ||
          typeof win.html2canvas === "undefined" ||
          typeof (win.jspdf?.jsPDF || win.jsPDF) === "undefined"
        )
          throw new Error("PDF libraries did not load");
        if (doc.fonts?.ready) await doc.fonts.ready;
        const canvas = await win.html2canvas(root, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          windowWidth: 944,
          windowHeight: root.scrollHeight,
          scrollX: 0,
          scrollY: 0,
        });
        const Pdf = win.jspdf ? win.jspdf.jsPDF : win.jsPDF;
        const pdf = new Pdf({
          unit: "pt",
          format: "a4",
          orientation: "portrait",
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;
        const imageHeight = (canvas.height * usableWidth) / canvas.width;
        const scaleRatio = imageHeight / canvas.height;
        let renderedCanvasY = 0;
        let firstPage = true;

        while (renderedCanvasY < canvas.height) {
          const canvasPageHeight = usableHeight / scaleRatio;
          const breakAt = Math.min(
            renderedCanvasY + canvasPageHeight,
            canvas.height,
          );
          const sliceHeightPx = breakAt - renderedCanvasY;
          const pageCanvas = doc.createElement("canvas");
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
            usableWidth,
            sliceHeightPx * scaleRatio,
          );
          renderedCanvasY = breakAt;
          firstPage = false;
        }

        const pdfBlob = pdf.output("blob");
        const url = URL.createObjectURL(pdfBlob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `run_length_encoding_simulation_report_${Date.now()}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) {
        console.error("Could not download RLE report", error);
        window.alert(
          "Could not generate the PDF report. Please check your internet connection and try again.",
        );
      } finally {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }
    }, 1200);
  };
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
  return true;
}
