package com.moresave.util;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import java.io.FileOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class PDFGenerator {

    // Colors
    private static final BaseColor
            COFFEE_BROWN = new BaseColor(111, 78, 55);
    private static final BaseColor
            COFFEE_BROWN_DARK = new BaseColor(78, 53, 38);
    private static final BaseColor
            LIGHT_CREAM = new BaseColor(246, 241, 234);
    private static final BaseColor
            WHITE = BaseColor.WHITE;
    private static final BaseColor
            BORDER_BROWN = new BaseColor(199, 184, 167);

    // Fonts
    private static final Font TITLE_FONT =
            new Font(Font.FontFamily.HELVETICA,
                    20, Font.BOLD, WHITE);
    private static final Font SUBTITLE_FONT =
            new Font(Font.FontFamily.HELVETICA,
                    11, Font.NORMAL, WHITE);
    private static final Font HEADER_FONT =
            new Font(Font.FontFamily.HELVETICA,
                    11, Font.BOLD, WHITE);
    private static final Font BODY_FONT =
            new Font(Font.FontFamily.HELVETICA,
                    10, Font.NORMAL, BaseColor.BLACK);
    private static final Font BOLD_FONT =
            new Font(Font.FontFamily.HELVETICA,
                    10, Font.BOLD, BaseColor.BLACK);
    private static final Font SECTION_FONT =
            new Font(Font.FontFamily.HELVETICA,
                    13, Font.BOLD, COFFEE_BROWN_DARK);

// ---- Generate Members Report ----
    public static String generateMembersReport(
            java.util.List<String[]> members) {

        String filePath = getFilePath(
                "Members_Report"
        );

        try {
            Document doc = new Document(
                    PageSize.A4.rotate()
            );
            PdfWriter.getInstance(
                    doc,
                    new FileOutputStream(filePath)
            );
            doc.open();

            addHeader(doc,
                    "MORESAVE SACCO",
                    "Members Report",
                    members.size() +
                            " Active Members"
            );

            // Table
            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setSpacingBefore(15);
            table.setWidths(new float[]{
                    2f, 3f, 2f, 2.5f, 1.5f
            });

            addTableHeader(table, new String[]{
                    "Member No", "Full Name",
                    "Phone", "Balance (UGX)", "Status"
            });

            boolean alternate = false;
            for (String[] member : members) {
                BaseColor bg = alternate ?
                        LIGHT_CREAM : WHITE;
                for (String cell : member) {
                    PdfPCell c = new PdfPCell(
                            new Phrase(
                                    cell != null ? cell : "",
                                    BODY_FONT
                            )
                    );
                    c.setBackgroundColor(bg);
                    c.setPadding(6);
                    c.setBorderColor(
                            BORDER_BROWN
                    );
                    table.addCell(c);
                }
                alternate = !alternate;
            }

            doc.add(table);
            addFooter(doc);
            doc.close();

            return "✅ Report saved to:\n" + filePath;

        } catch (Exception e) {
            return "❌ Error: " + e.getMessage();
        }
    }

// ---- Generate Loans Report ----
    public static String generateLoansReport(
            java.util.List<String[]> loans) {

        String filePath = getFilePath(
                "Loans_Report"
        );

        try {
            Document doc = new Document(
                    PageSize.A4.rotate()
            );
            PdfWriter.getInstance(
                    doc,
                    new FileOutputStream(filePath)
            );
            doc.open();

            addHeader(doc,
                    "MORESAVE SACCO",
                    "Loans Report",
                    loans.size() + " Loan Records"
            );

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setSpacingBefore(15);
            table.setWidths(new float[]{
                    1.5f, 2.5f, 2f, 2f, 1.5f, 2f
            });

            addTableHeader(table, new String[]{
                    "Loan No", "Member",
                    "Amount (UGX)", "Monthly (UGX)",
                    "Status", "Applied On"
            });

            boolean alternate = false;
            for (String[] loan : loans) {
                BaseColor bg = alternate ?
                        LIGHT_CREAM : WHITE;
                for (String cell : loan) {
                    PdfPCell c = new PdfPCell(
                            new Phrase(
                                    cell != null ? cell : "",
                                    BODY_FONT
                            )
                    );
                    c.setBackgroundColor(bg);
                    c.setPadding(6);
                    c.setBorderColor(
                            BORDER_BROWN
                    );
                    table.addCell(c);
                }
                alternate = !alternate;
            }

            doc.add(table);
            addFooter(doc);
            doc.close();

            return "✅ Report saved to:\n" + filePath;

        } catch (Exception e) {
            return "❌ Error: " + e.getMessage();
        }
    }

// ---- Generate Financial Summary Report ----
    public static String generateSummaryReport(
            String[] summary) {

        String filePath = getFilePath(
                "Financial_Summary"
        );

        try {
            Document doc = new Document(
                    PageSize.A4
            );
            PdfWriter.getInstance(
                    doc,
                    new FileOutputStream(filePath)
            );
            doc.open();

            addHeader(doc,
                    "MORESAVE SACCO",
                    "Financial Summary Report",
                    "Generated: " +
                            LocalDateTime.now().format(
                                    DateTimeFormatter.ofPattern(
                                            "dd MMM yyyy HH:mm"
                                    )
                            )
            );

            doc.add(Chunk.NEWLINE);

            // Summary boxes
            doc.add(new Paragraph(
                    "FINANCIAL OVERVIEW",
                    SECTION_FONT
            ));
            doc.add(Chunk.NEWLINE);

            PdfPTable summaryTable =
                    new PdfPTable(2);
            summaryTable.setWidthPercentage(80);
            summaryTable.setSpacingBefore(10);

            addSummaryRow(summaryTable,
                    "Total Active Members",
                    summary[0]
            );
            addSummaryRow(summaryTable,
                    "Total Savings (UGX)",
                    summary[1]
            );
            addSummaryRow(summaryTable,
                    "Active Loans Outstanding (UGX)",
                    summary[2]
            );
            addSummaryRow(summaryTable,
                    "Total Deposits Received (UGX)",
                    summary[3]
            );

            doc.add(summaryTable);
            addFooter(doc);
            doc.close();

            return "✅ Report saved to:\n" + filePath;

        } catch (Exception e) {
            return "❌ Error: " + e.getMessage();
        }
    }

// ---- Generate Dividends Report ----
    public static String generateDividendsReport(
            java.util.List<String[]> dividends,
            String year) {

        String filePath = getFilePath(
                "Dividends_Report_" + year
        );

        try {
            Document doc = new Document(
                    PageSize.A4.rotate()
            );
            PdfWriter.getInstance(
                    doc,
                    new FileOutputStream(filePath)
            );
            doc.open();

            addHeader(doc,
                    "MORESAVE SACCO",
                    "Dividend Distribution Report " +
                            year,
                    dividends.size() +
                            " Members"
            );

            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setSpacingBefore(15);
            table.setWidths(new float[]{
                    1.5f, 3f, 2.5f, 1.5f, 2.5f
            });

            addTableHeader(table, new String[]{
                    "Member No", "Full Name",
                    "Avg Savings (UGX)",
                    "Share %", "Dividend (UGX)"
            });

            boolean alternate = false;
            for (String[] row : dividends) {
                BaseColor bg = alternate ?
                        LIGHT_CREAM : WHITE;
                for (String cell : row) {
                    PdfPCell c = new PdfPCell(
                            new Phrase(
                                    cell != null ? cell : "",
                                    BODY_FONT
                            )
                    );
                    c.setBackgroundColor(bg);
                    c.setPadding(6);
                    c.setBorderColor(
                            BORDER_BROWN
                    );
                    table.addCell(c);
                }
                alternate = !alternate;
            }

            doc.add(table);
            addFooter(doc);
            doc.close();

            return "✅ Report saved to:\n" + filePath;

        } catch (Exception e) {
            return "❌ Error: " + e.getMessage();
        }
    }

// ---- Generate Member Statement ----
    public static String generateMemberStatement(
            String memberNumber,
            String memberName,
            String accountNumber,
            String balance,
            java.util.List<String[]> transactions) {

        String filePath = getFilePath(
                "Statement_" + memberNumber
        );

        try {
            Document doc = new Document(
                    PageSize.A4
            );
            PdfWriter.getInstance(
                    doc,
                    new FileOutputStream(filePath)
            );
            doc.open();

            addHeader(doc,
                    "MORESAVE SACCO",
                    "Account Statement",
                    "Member: " + memberName
            );

            doc.add(Chunk.NEWLINE);

            // Member details box
            PdfPTable detailsTable =
                    new PdfPTable(2);
            detailsTable.setWidthPercentage(100);
            detailsTable.setSpacingBefore(10);

            addSummaryRow(detailsTable,
                    "Member Number", memberNumber
            );
            addSummaryRow(detailsTable,
                    "Account Number", accountNumber
            );
            addSummaryRow(detailsTable,
                    "Current Balance (UGX)", balance
            );
            addSummaryRow(detailsTable,
                    "Statement Date",
                    LocalDateTime.now().format(
                            DateTimeFormatter.ofPattern(
                                    "dd MMM yyyy"
                            )
                    )
            );

            doc.add(detailsTable);
            doc.add(Chunk.NEWLINE);

            // Transactions
            doc.add(new Paragraph(
                    "TRANSACTION HISTORY",
                    SECTION_FONT
            ));
            doc.add(Chunk.NEWLINE);

            PdfPTable txTable = new PdfPTable(4);
            txTable.setWidthPercentage(100);
            txTable.setSpacingBefore(10);
            txTable.setWidths(new float[]{
                    3f, 2f, 2f, 2f
            });

            addTableHeader(txTable, new String[]{
                    "Date", "Type",
                    "Amount (UGX)",
                    "Balance After (UGX)"
            });

            boolean alternate = false;
            for (String[] tx : transactions) {
                BaseColor bg = alternate ?
                        LIGHT_CREAM : WHITE;
                for (String cell : tx) {
                    PdfPCell c = new PdfPCell(
                            new Phrase(
                                    cell != null ? cell : "",
                                    BODY_FONT
                            )
                    );
                    c.setBackgroundColor(bg);
                    c.setPadding(6);
                    c.setBorderColor(
                            BORDER_BROWN
                    );
                    txTable.addCell(c);
                }
                alternate = !alternate;
            }

            doc.add(txTable);
            addFooter(doc);
            doc.close();

            return "✅ Statement saved to:\n" +
                    filePath;

        } catch (Exception e) {
            return "❌ Error: " + e.getMessage();
        }
    }

// ---- Helper: Add Header ----
    private static void addHeader(
            Document doc,
            String mainTitle,
            String subTitle,
            String detail)
            throws DocumentException {

        PdfPTable header = new PdfPTable(1);
        header.setWidthPercentage(100);

        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(COFFEE_BROWN_DARK);
        cell.setPadding(20);
        cell.setBorder(Rectangle.NO_BORDER);

        Paragraph p = new Paragraph();
        p.add(new Chunk(
                mainTitle + "\n", TITLE_FONT
        ));
        p.add(new Chunk(
                subTitle + "\n", SUBTITLE_FONT
        ));
        p.add(new Chunk(detail, SUBTITLE_FONT));
        p.setAlignment(Element.ALIGN_CENTER);

        cell.addElement(p);
        header.addCell(cell);
        doc.add(header);
    }

// ---- Helper: Add Table Header Row ----
    private static void addTableHeader(
            PdfPTable table,
            String[] headers) {

        for (String header : headers) {
            PdfPCell cell = new PdfPCell(
                    new Phrase(header, HEADER_FONT)
            );
            cell.setBackgroundColor(COFFEE_BROWN);
            cell.setPadding(8);
            cell.setBorderColor(COFFEE_BROWN);
            cell.setHorizontalAlignment(
                    Element.ALIGN_CENTER
            );
            table.addCell(cell);
        }
    }

// ---- Helper: Add Summary Row ----
    private static void addSummaryRow(
            PdfPTable table,
            String label,
            String value) {

        PdfPCell labelCell = new PdfPCell(
                new Phrase(label, BOLD_FONT)
        );
        labelCell.setBackgroundColor(LIGHT_CREAM);
        labelCell.setPadding(8);
        labelCell.setBorderColor(
                BORDER_BROWN
        );

        PdfPCell valueCell = new PdfPCell(
                new Phrase(value, BODY_FONT)
        );
        valueCell.setPadding(8);
        valueCell.setBorderColor(
                BORDER_BROWN
        );

        table.addCell(labelCell);
        table.addCell(valueCell);
    }

// ---- Helper: Add Footer ----
    private static void addFooter(Document doc)
            throws DocumentException {

        doc.add(Chunk.NEWLINE);
        doc.add(Chunk.NEWLINE);

        Paragraph footer = new Paragraph(
                "Generated by Moresave SACCO " +
                        "Management System  |  " +
                        LocalDateTime.now().format(
                                DateTimeFormatter.ofPattern(
                                        "dd MMM yyyy HH:mm"
                                )
                        ) + "  |  " +
                        "Kisekende LC1, Mubende Municipality",
                new Font(
                        Font.FontFamily.HELVETICA,
                        9, Font.ITALIC,
                        BaseColor.GRAY
                )
        );
        footer.setAlignment(Element.ALIGN_CENTER);
        doc.add(footer);
    }

// ---- Helper: Get Save File Path ----
    private static String getFilePath(
            String reportName) {

        String timestamp =
                LocalDateTime.now().format(
                        DateTimeFormatter.ofPattern(
                                "yyyyMMdd_HHmmss"
                        )
                );
        String home =
                System.getProperty("user.home");
        return home +
                "\\Documents\\" +
                reportName + "_" +
                timestamp + ".pdf";
    }
}