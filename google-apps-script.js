// Google Apps Script for CodeFounders Test Results
// Deploy this as a web app and replace the script URL in test.html

function doPost(e) {
  try {
    // Get the active spreadsheet
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName('TestResults');
    
    // If sheet doesn't exist, create it
    if (!sheet) {
      createTestResultsSheet(spreadsheet);
    }
    
    // Get form data
    const formData = e.parameter;
    
    // Prepare row data
    const rowData = [
      new Date(), // Timestamp
      formData.fullName || '',
      formData.mobileNumber || '',
      formData.email || '',
      parseInt(formData.totalQuestions) || 0,
      parseInt(formData.correctAnswers) || 0,
      parseInt(formData.accuracy) || 0,
      formData.timeTaken || '',
      parseInt(formData.securityViolations) || 0,
      parseInt(formData.testDuration) || 0,
      formData.timestamp || new Date().toISOString()
    ];
    
    // Append data to sheet
    sheet.appendRow(rowData);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function createTestResultsSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('TestResults');
  
  // Set up headers
  const headers = [
    'Timestamp',
    'Full Name',
    'Mobile Number', 
    'Email',
    'Total Questions',
    'Correct Answers',
    'Accuracy (%)',
    'Time Taken',
    'Security Violations',
    'Test Duration (minutes)',
    'Original Timestamp'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format headers
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#ff6b35')
    .setFontColor('white')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Add data validation for accuracy column
  const accuracyRange = sheet.getRange(2, 8, sheet.getMaxRows() - 1, 1);
  const accuracyRule = SpreadsheetApp.newDataValidation()
    .requireNumberBetween(0, 100)
    .setAllowInvalid(false)
    .setHelpText('Accuracy must be between 0 and 100')
    .build();
  accuracyRange.setDataValidation(accuracyRule);
  
  // Add conditional formatting for accuracy
  const accuracyColumn = sheet.getRange(2, 8, sheet.getMaxRows() - 1, 1);
  const highAccuracyRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(80)
    .setBackground('#d4edda')
    .setFontColor('#155724')
    .setRanges([accuracyColumn])
    .build();
    
  const mediumAccuracyRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(60, 80)
    .setBackground('#fff3cd')
    .setFontColor('#856404')
    .setRanges([accuracyColumn])
    .build();
    
  const lowAccuracyRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(60)
    .setBackground('#f8d7da')
    .setFontColor('#721c24')
    .setRanges([accuracyColumn])
    .build();
    
  sheet.setConditionalFormatRules([highAccuracyRule, mediumAccuracyRule, lowAccuracyRule]);
}

function doGet(e) {
  return ContentService
    .createTextOutput('CodeFounders Test Results API is running')
    .setMimeType(ContentService.MimeType.TEXT);
}

// Function to manually create the sheet (run this once)
function setupTestResultsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  createTestResultsSheet(spreadsheet);
}

// Function to get test statistics
function getTestStatistics() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TestResults');
  if (!sheet) return null;
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null; // Only headers
  
  const stats = {
    totalTests: data.length - 1,
    averageAccuracy: 0,
    highPerformers: 0,
    mediumPerformers: 0,
    lowPerformers: 0
  };
  
  let totalAccuracy = 0;
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const accuracy = parseInt(row[6]) || 0; // Accuracy column (updated index)
    
    totalAccuracy += accuracy;
    
    if (accuracy >= 80) stats.highPerformers++;
    else if (accuracy >= 60) stats.mediumPerformers++;
    else stats.lowPerformers++;
  }
  
  stats.averageAccuracy = Math.round(totalAccuracy / (data.length - 1));
  
  return stats;
}

// Function to export data to CSV
function exportToCSV() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TestResults');
  if (!sheet) return null;
  
  const data = sheet.getDataRange().getValues();
  const csvContent = data.map(row => row.join(',')).join('\n');
  
  const blob = Utilities.newBlob(csvContent, 'text/csv', 'CodeFounders_Test_Results.csv');
  return blob;
} 