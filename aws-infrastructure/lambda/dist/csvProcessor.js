"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSVProcessor = void 0;
class CSVProcessor {
    static processCSVContent(fileContent, threshold) {
        const lines = fileContent.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            throw new Error('CSV file appears to be empty');
        }
        // Extract headers
        const headers = lines[0].split(',').map(h => h.trim());
        if (headers.length === 0) {
            throw new Error('Invalid CSV format: No headers found');
        }
        // Process data rows
        const dataRows = lines.slice(1);
        const validRows = dataRows.filter(row => {
            const cells = row.split(',');
            return cells.length === headers.length && cells.some(cell => cell.trim() !== '');
        });
        // Identify usage columns
        const usageColumns = headers.filter(header => /usage|consumption|amount|quantity|value|kwh|units/i.test(header));
        // Identify date columns
        const dateColumns = headers.filter(header => /date|day|month|time|period|billing/i.test(header));
        // Generate summary data
        const summary = this.generateSummary(validRows, headers, usageColumns, dateColumns, threshold);
        let processedData = {
            totalRows: validRows.length,
            invalidRows: dataRows.length - validRows.length,
            headers: headers,
            usageColumns: usageColumns,
            threshold: threshold,
            thresholdAnalysis: null,
            summary: summary
        };
        // Analyze threshold if usage columns exist
        if (usageColumns.length > 0) {
            const usageColumnIndex = headers.indexOf(usageColumns[0]);
            const aboveThreshold = validRows.filter(row => {
                const cells = row.split(',');
                const value = parseFloat(cells[usageColumnIndex]?.trim() || '0');
                return !isNaN(value) && value > threshold;
            });
            processedData.thresholdAnalysis = {
                usageColumn: usageColumns[0],
                rowsAboveThreshold: aboveThreshold.length,
                percentageAboveThreshold: ((aboveThreshold.length / validRows.length) * 100).toFixed(1)
            };
        }
        return processedData;
    }
    static generateSummary(validRows, headers, usageColumns, dateColumns, threshold) {
        if (usageColumns.length === 0) {
            return {
                totalDaysProcessed: validRows.length,
                daysExceedingThreshold: 0,
                highestUsageDay: null,
                totalUsage: 0,
                averageUsage: 0
            };
        }
        const usageColumnIndex = headers.indexOf(usageColumns[0]);
        const dateColumnIndex = dateColumns.length > 0 ? headers.indexOf(dateColumns[0]) : -1;
        const customerNameIndex = headers.findIndex(h => /name/i.test(h));
        const customerIdIndex = headers.findIndex(h => /id|customer.*id/i.test(h));
        const usageRecords = [];
        let totalUsage = 0;
        let daysExceedingThreshold = 0;
        let highestUsageRecord = null;
        validRows.forEach((row, index) => {
            const cells = row.split(',');
            const usage = parseFloat(cells[usageColumnIndex]?.trim() || '0');
            if (!isNaN(usage)) {
                const date = dateColumnIndex >= 0 ? cells[dateColumnIndex]?.trim() || `Row ${index + 1}` : `Row ${index + 1}`;
                const customerName = customerNameIndex >= 0 ? cells[customerNameIndex]?.trim() : undefined;
                const customerId = customerIdIndex >= 0 ? cells[customerIdIndex]?.trim() : undefined;
                const record = {
                    date,
                    usage,
                    customerName,
                    customerId
                };
                usageRecords.push(record);
                totalUsage += usage;
                if (usage > threshold) {
                    daysExceedingThreshold++;
                }
                if (!highestUsageRecord || usage > highestUsageRecord.usage) {
                    highestUsageRecord = record;
                }
            }
        });
        const averageUsage = usageRecords.length > 0 ? totalUsage / usageRecords.length : 0;
        return {
            totalDaysProcessed: usageRecords.length,
            daysExceedingThreshold,
            highestUsageDay: highestUsageRecord,
            totalUsage: Math.round(totalUsage * 100) / 100, // Round to 2 decimal places
            averageUsage: Math.round(averageUsage * 100) / 100 // Round to 2 decimal places
        };
    }
    static validateCSVFile(fileName, fileSize) {
        // Validate file extension
        if (!fileName.toLowerCase().endsWith('.csv')) {
            throw new Error('Invalid file type. Please upload a CSV file.');
        }
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (fileSize > maxSize) {
            throw new Error('File size exceeds 10MB limit.');
        }
    }
    static validateThreshold(threshold) {
        if (isNaN(threshold)) {
            throw new Error('Threshold must be a valid number');
        }
        if (threshold < 0) {
            throw new Error('Threshold must be a positive number');
        }
    }
}
exports.CSVProcessor = CSVProcessor;
//# sourceMappingURL=csvProcessor.js.map