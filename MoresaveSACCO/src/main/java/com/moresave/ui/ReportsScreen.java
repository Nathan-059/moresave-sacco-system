package com.moresave.ui;

import com.moresave.controller.ReportsController;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.stage.Stage;

public class ReportsScreen {

    public void show(Stage stage) {

        // ---- Title ----
        Label title = new Label(
                "Financial Reports"
        );
        title.setFont(
                Font.font("Arial", FontWeight.BOLD, 22)
        );
        title.setTextFill(Color.WHITE);

        // ---- Summary Cards ----
        ReportsController controller =
                new ReportsController();
        String[] summary = controller.getSummary();

        VBox totalMembersCard = createSummaryCard(
                "👥 Total Members",
                summary[0],
                "#2980b9"
        );
        VBox totalSavingsCard = createSummaryCard(
                "🏦 Total Savings (UGX)",
                summary[1],
                "#27ae60"
        );
        VBox activeLoansCard = createSummaryCard(
                "💰 Active Loans (UGX)",
                summary[2],
                "#8e44ad"
        );
        VBox totalRepaidCard = createSummaryCard(
                "✅ Total Repaid (UGX)",
                summary[3],
                "#16a085"
        );

        HBox summaryRow1 = new HBox(20,
                totalMembersCard, totalSavingsCard
        );
        HBox summaryRow2 = new HBox(20,
                activeLoansCard, totalRepaidCard
        );

        // ---- Members Table ----
        Label membersTitle = new Label(
                "All Members"
        );
        membersTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 16)
        );
        membersTitle.setTextFill(Color.WHITE);

        TableView<String[]> membersTable =
                buildMembersTable(controller);

        // ---- Loans Table ----
        Label loansTitle = new Label(
                "All Loans"
        );
        loansTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 16)
        );
        loansTitle.setTextFill(Color.WHITE);

        TableView<String[]> loansTable =
                buildLoansTable(controller);

        // ---- Overdue Loans Table ----
        Label overdueTitle = new Label(
                "⚠ Overdue Loans"
        );
        overdueTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 16)
        );
        overdueTitle.setTextFill(Color.ORANGE);

        TableView<String[]> overdueTable =
                buildOverdueTable(controller);

        // ---- Download Buttons ----
        Label downloadTitle = new Label(
                "📥 Download Reports as PDF"
        );
        downloadTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 15)
        );
        downloadTitle.setTextFill(Color.WHITE);

        Label downloadMessage = new Label("");
        downloadMessage.setFont(Font.font("Arial", 13));
        downloadMessage.setWrapText(true);

        Button downloadMembersBtn = new Button(
                "📥 Download Members Report"
        );
        downloadMembersBtn.setPrefHeight(40);
        downloadMembersBtn.setPrefWidth(250);
        downloadMembersBtn.setStyle(
                "-fx-background-color: #2980b9;" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );

        Button downloadLoansBtn = new Button(
                "📥 Download Loans Report"
        );
        downloadLoansBtn.setPrefHeight(40);
        downloadLoansBtn.setPrefWidth(250);
        downloadLoansBtn.setStyle(
                "-fx-background-color: #8e44ad;" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );

        Button downloadSummaryBtn = new Button(
                "📥 Download Financial Summary"
        );
        downloadSummaryBtn.setPrefHeight(40);
        downloadSummaryBtn.setPrefWidth(250);
        downloadSummaryBtn.setStyle(
                "-fx-background-color: #16a085;" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );

// ---- Button Actions ----
        downloadMembersBtn.setOnAction(e -> {
            String result =
                    com.moresave.util.PDFGenerator
                            .generateMembersReport(
                                    new java.util.ArrayList<>(
                                            controller.getAllMembers()
                                    )
                            );
            if (result.startsWith("✅")) {
                downloadMessage.setTextFill(Color.GREEN);
            } else {
                downloadMessage.setTextFill(Color.RED);
            }
            downloadMessage.setText(result);
        });

        downloadLoansBtn.setOnAction(e -> {
            String result =
                    com.moresave.util.PDFGenerator
                            .generateLoansReport(
                                    new java.util.ArrayList<>(
                                            controller.getAllLoans()
                                    )
                            );
            if (result.startsWith("✅")) {
                downloadMessage.setTextFill(Color.GREEN);
            } else {
                downloadMessage.setTextFill(Color.RED);
            }
            downloadMessage.setText(result);
        });

        downloadSummaryBtn.setOnAction(e -> {
            String result =
                    com.moresave.util.PDFGenerator
                            .generateSummaryReport(
                                    controller.getSummary()
                            );
            if (result.startsWith("✅")) {
                downloadMessage.setTextFill(Color.GREEN);
            } else {
                downloadMessage.setTextFill(Color.RED);
            }
            downloadMessage.setText(result);
        });

        HBox downloadButtons = new HBox(15,
                downloadMembersBtn,
                downloadLoansBtn,
                downloadSummaryBtn
        );
        downloadButtons.setAlignment(Pos.CENTER_LEFT);


        // ---- Back Button ----
        Button backBtn = new Button(
                "← Back to Dashboard"
        );
        backBtn.setStyle(
                "-fx-background-color: transparent;" +
                        "-fx-text-fill: #3498db;" +
                        "-fx-cursor: hand;" +
                        "-fx-font-size: 13;"
        );
        backBtn.setOnAction(e -> {
            AdminDashboard dashboard =
                    new AdminDashboard();
            dashboard.show(stage);
        });




// ---- Main Layout ----
        VBox mainCard = new VBox(20,
                title,
                summaryRow1,
                summaryRow2,
                membersTitle,
                membersTable,
                loansTitle,
                loansTable,
                overdueTitle,
                overdueTable,
                downloadTitle,       // ← new
                downloadButtons,     // ← new
                downloadMessage,     // ← new
                backBtn
        );
        mainCard.setPadding(new Insets(30));
        mainCard.setStyle(
                "-fx-background-color: #1e2a3a;" +
                        "-fx-background-radius: 10;"
        );

        mainCard.setPadding(new Insets(30));
        mainCard.setStyle(
                "-fx-background-color: #1e2a3a;" +
                        "-fx-background-radius: 10;"
        );

        ScrollPane scrollPane =
                new ScrollPane(mainCard);
        scrollPane.setFitToWidth(true);
        scrollPane.setStyle(
                "-fx-background-color: #152232;"
        );

        VBox root = new VBox(scrollPane);
        root.setPadding(new Insets(30));
        root.setAlignment(Pos.CENTER);
        root.setStyle(
                "-fx-background-color: #152232;"
        );

        Scene scene = new Scene(root, 950, 700);
        stage.setTitle(
                "Moresave SACCO - Financial Reports"
        );
        stage.setScene(scene);
        stage.show();
    }

    // ---- Members Table ----
    private TableView<String[]> buildMembersTable(
            ReportsController controller) {

        TableView<String[]> table =
                new TableView<>();
        table.setPrefHeight(200);

        TableColumn<String[], String> numCol =
                createColumn("Member No", 0, 120);
        TableColumn<String[], String> nameCol =
                createColumn("Full Name", 1, 200);
        TableColumn<String[], String> phoneCol =
                createColumn("Phone", 2, 120);
        TableColumn<String[], String> balanceCol =
                createColumn("Balance (UGX)", 3, 150);
        TableColumn<String[], String> statusCol =
                createColumn("Status", 4, 100);

        table.getColumns().addAll(
                numCol, nameCol, phoneCol,
                balanceCol, statusCol
        );
        table.setItems(
                controller.getAllMembers()
        );
        return table;
    }

    // ---- Loans Table ----
    private TableView<String[]> buildLoansTable(
            ReportsController controller) {

        TableView<String[]> table =
                new TableView<>();
        table.setPrefHeight(200);

        TableColumn<String[], String> loanNumCol =
                createColumn("Loan No", 0, 100);
        TableColumn<String[], String> memberCol =
                createColumn("Member", 1, 150);
        TableColumn<String[], String> amountCol =
                createColumn("Amount (UGX)", 2, 130);
        TableColumn<String[], String> monthlyCol =
                createColumn("Monthly (UGX)", 3, 130);
        TableColumn<String[], String> statusCol =
                createColumn("Status", 4, 100);
        TableColumn<String[], String> dateCol =
                createColumn("Applied", 5, 120);

        table.getColumns().addAll(
                loanNumCol, memberCol, amountCol,
                monthlyCol, statusCol, dateCol
        );
        table.setItems(
                controller.getAllLoans()
        );
        return table;
    }

    // ---- Overdue Table ----
    private TableView<String[]> buildOverdueTable(
            ReportsController controller) {

        TableView<String[]> table =
                new TableView<>();
        table.setPrefHeight(150);

        TableColumn<String[], String> loanCol =
                createColumn("Loan No", 0, 100);
        TableColumn<String[], String> memberCol =
                createColumn("Member", 1, 150);
        TableColumn<String[], String> dueCol =
                createColumn("Due Date", 2, 120);
        TableColumn<String[], String> amountCol =
                createColumn("Amount Due (UGX)", 3, 150);
        TableColumn<String[], String> penaltyCol =
                createColumn("Penalty (UGX)", 4, 130);

        table.getColumns().addAll(
                loanCol, memberCol, dueCol,
                amountCol, penaltyCol
        );
        table.setItems(
                controller.getOverdueLoans()
        );
        return table;
    }

    // ---- Helper: Create Table Column ----
    private TableColumn<String[], String>
    createColumn(String title,
                 int index,
                 int width) {

        TableColumn<String[], String> col =
                new TableColumn<>(title);
        col.setCellValueFactory(data ->
                new javafx.beans.property
                        .SimpleStringProperty(
                        data.getValue()[index]
                )
        );
        col.setPrefWidth(width);
        return col;
    }

    // ---- Helper: Create Summary Card ----
    private VBox createSummaryCard(
            String label,
            String value,
            String color) {

        Label valueLabel = new Label(value);
        valueLabel.setFont(
                Font.font("Arial", FontWeight.BOLD, 22)
        );
        valueLabel.setTextFill(Color.WHITE);

        Label nameLabel = new Label(label);
        nameLabel.setFont(Font.font("Arial", 13));
        nameLabel.setTextFill(Color.LIGHTGRAY);

        VBox card = new VBox(8,
                valueLabel, nameLabel
        );
        card.setAlignment(Pos.CENTER_LEFT);
        card.setPadding(new Insets(20));
        card.setPrefSize(280, 90);
        card.setStyle(
                "-fx-background-color: " + color + ";" +
                        "-fx-background-radius: 10;"
        );
        return card;
    }
}