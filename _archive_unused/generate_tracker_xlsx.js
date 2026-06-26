const fs = require('fs');
const XLSX = require('xlsx');

// Read raw screens data
const screens = JSON.parse(fs.readFileSync('screens_utf8.json', 'utf8'));

// Format data for the sheet
// Columns: Module,Screen/Modal Name,Type,Task Description,UI Design Link (Figma/AI),Documentation Link (Before/After),PR Link,Status (Done?),Date Completed
const headers = [
  "Module",
  "Screen/Modal Name",
  "Type",
  "Task Description",
  "UI Design Link (Figma/AI)",
  "Documentation Link (Before/After)",
  "PR Link",
  "Status (Done?)",
  "Date Completed"
];

const rows = [headers];

// Build sheet data
screens.forEach((screen) => {
  rows.push([
    screen.module,
    screen.name,
    screen.type,
    "Create design -> Apply code -> PR -> Docs",
    "", // UI Design Link (Figma/AI)
    "", // Documentation Link (Before/After)
    "", // PR Link
    "[]", // Status (Done?)
    ""  // Date Completed
  ]);
});

// Create Workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(rows);

// Basic styling/formatting for headers if needed
// SheetJS Community edition does not support full styling directly without XLSX-Style, 
// but we can set column widths so it looks neat and professional.
const colWidths = [
  { wch: 15 }, // Module
  { wch: 30 }, // Screen/Modal Name
  { wch: 10 }, // Type
  { wch: 45 }, // Task Description
  { wch: 30 }, // UI Design Link
  { wch: 35 }, // Documentation Link
  { wch: 25 }, // PR Link
  { wch: 15 }, // Status (Done?)
  { wch: 18 }  // Date Completed
];
ws['!cols'] = colWidths;

XLSX.utils.book_append_sheet(wb, ws, "UI Revamp Tracker");

// Save file
XLSX.writeFile(wb, "Kridaz_UI_Revamp_Tracker.xlsx");
console.log("Successfully generated Kridaz_UI_Revamp_Tracker.xlsx with " + screens.length + " screens.");
