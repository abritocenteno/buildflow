/**
 * Tabular export helpers — CSV (RFC 4180) and Excel (SpreadsheetML 2003).
 *
 * Both formats are driven by the same `Column[]` definition so a table's
 * columns are declared once (see `lib/export-columns.ts`) and stay in sync.
 */

import { getCurrencySymbol } from "./utils";

export type ColumnType = "text" | "number" | "currency" | "date" | "boolean";

export interface Column<T> {
    header: string;
    accessor: (row: T) => unknown;
    type?: ColumnType;
    /** Approximate column width in characters. Used by the Excel export. */
    width?: number;
}

export interface ExportOptions {
    /** Base filename, without extension. */
    filename: string;
    /** Worksheet name for Excel. Defaults to the filename. */
    sheetName?: string;
    /** ISO currency code used for currency columns. Defaults to EUR. */
    currency?: string;
}

type CellValue = string | number | Date | null;

function normalize<T>(row: T, col: Column<T>): CellValue {
    const raw = col.accessor(row);
    if (raw === null || raw === undefined || raw === "") return null;

    switch (col.type) {
        case "number":
        case "currency": {
            const n = typeof raw === "number" ? raw : Number(raw);
            return Number.isFinite(n) ? n : null;
        }
        case "date": {
            const d = raw instanceof Date ? raw : new Date(raw as number);
            return Number.isNaN(d.getTime()) ? null : d;
        }
        case "boolean":
            return raw ? "Yes" : "No";
        default:
            return String(raw);
    }
}

/* ------------------------------------------------------------------ */
/* CSV                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Escapes a field per RFC 4180: wrap in double quotes when the value contains
 * a delimiter, quote or line break, and double any embedded quotes.
 */
function csvEscape(value: CellValue): string {
    if (value === null) return "";

    let s: string;
    if (value instanceof Date) {
        // ISO date — unambiguous across locales when re-imported.
        s = value.toISOString().slice(0, 10);
    } else if (typeof value === "number") {
        s = String(value);
    } else {
        s = value;
    }

    if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
}

export function toCsv<T>(rows: T[], columns: Column<T>[], currency = "EUR"): string {
    const symbol = getCurrencySymbol(currency);
    const headers = columns.map((c) =>
        csvEscape(c.type === "currency" ? `${c.header} (${symbol})` : c.header)
    );

    const lines = [
        headers.join(","),
        ...rows.map((row) => columns.map((col) => csvEscape(normalize(row, col))).join(",")),
    ];

    // CRLF per spec; BOM so Excel detects UTF-8 and renders accents correctly.
    return "﻿" + lines.join("\r\n");
}

/* ------------------------------------------------------------------ */
/* Excel (SpreadsheetML 2003)                                          */
/* ------------------------------------------------------------------ */

function xmlEscape(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        // Strip control characters Excel rejects outright.
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

/** Excel caps sheet names at 31 chars and forbids : \ / ? * [ ] */
function safeSheetName(name: string): string {
    const cleaned = name.replace(/[:\\/?*[\]]/g, "-").trim();
    return (cleaned || "Sheet1").slice(0, 31);
}

function excelCell(value: CellValue, styleId?: string): string {
    const style = styleId ? ` ss:StyleID="${styleId}"` : "";
    if (value === null) return `<Cell${style}/>`;

    if (value instanceof Date) {
        // SpreadsheetML wants a local, timezone-free datetime.
        const pad = (n: number) => String(n).padStart(2, "0");
        const iso =
            `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}` +
            `T00:00:00.000`;
        return `<Cell${style}><Data ss:Type="DateTime">${iso}</Data></Cell>`;
    }

    if (typeof value === "number") {
        return `<Cell${style}><Data ss:Type="Number">${value}</Data></Cell>`;
    }

    return `<Cell${style}><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
}

function styleFor(type: ColumnType | undefined): string | undefined {
    switch (type) {
        case "currency":
            return "sCurrency";
        case "number":
            return "sNumber";
        case "date":
            return "sDate";
        default:
            return undefined;
    }
}

export function toExcelXml<T>(
    rows: T[],
    columns: Column<T>[],
    sheetName: string,
    currency = "EUR"
): string {
    const symbol = getCurrencySymbol(currency);
    // Excel number-format string, e.g. "€"#,##0.00
    const currencyFormat = xmlEscape(`"${symbol}"#,##0.00`);

    const cols = columns
        .map((c) => `<Column ss:AutoFitWidth="0" ss:Width="${(c.width ?? 18) * 7}"/>`)
        .join("");

    const headerRow =
        `<Row ss:Height="22">` +
        columns.map((c) => excelCell(c.header, "sHeader")).join("") +
        `</Row>`;

    const bodyRows = rows
        .map(
            (row) =>
                `<Row>` +
                columns.map((col) => excelCell(normalize(row, col), styleFor(col.type))).join("") +
                `</Row>`
        )
        .join("");

    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#18181B"/>
  </Style>
  <Style ss:ID="sHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#0EA5E9" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center" ss:Horizontal="Left"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0284C7"/>
   </Borders>
  </Style>
  <Style ss:ID="sCurrency">
   <NumberFormat ss:Format="${currencyFormat}"/>
  </Style>
  <Style ss:ID="sNumber">
   <NumberFormat ss:Format="#,##0.##"/>
  </Style>
  <Style ss:ID="sDate">
   <NumberFormat ss:Format="dd\\-mmm\\-yyyy"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${xmlEscape(safeSheetName(sheetName))}">
  <Table ss:ExpandedColumnCount="${columns.length}" ss:ExpandedRowCount="${rows.length + 1}" x:FullColumns="1" x:FullRows="1">
   ${cols}
   ${headerRow}
   ${bodyRows}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <PageSetup><Layout x:Orientation="Landscape"/></PageSetup>
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
   <ActivePane>2</ActivePane>
   <Selected/>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;
}

/* ------------------------------------------------------------------ */
/* Download                                                            */
/* ------------------------------------------------------------------ */

export function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    // Give the browser a beat to start the download before releasing the URL —
    // revoking synchronously drops the download in Firefox and Safari.
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 1000);
}

/** Timestamp suffix so repeated exports don't overwrite each other. */
export function dateStamp(d = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function exportRows<T>(
    format: "csv" | "xls",
    rows: T[],
    columns: Column<T>[],
    { filename, sheetName, currency = "EUR" }: ExportOptions
) {
    const stamped = `${filename}-${dateStamp()}`;

    if (format === "csv") {
        const blob = new Blob([toCsv(rows, columns, currency)], {
            type: "text/csv;charset=utf-8",
        });
        downloadBlob(blob, `${stamped}.csv`);
        return;
    }

    const xml = toExcelXml(rows, columns, sheetName ?? filename, currency);
    const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
    downloadBlob(blob, `${stamped}.xls`);
}
