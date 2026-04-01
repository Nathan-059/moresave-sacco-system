package com.moresave.ui;

import com.moresave.controller.LoanController;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.stage.Stage;

public class LoanApprovalScreen {

    public void show(Stage stage) {

        String coffeeBrown = "#6F4E37";
        String coffeeBrownDark = "#4E3526";
        String coffeeBrownSoft = "#8B6B4A";
        String warmWhite = "#FDFBF7";
        String lightCream = "#F6F1EA";
        String borderBrown = "#C7B8A7";

        // ---- Title ----
        Label title = new Label(
                "Loan Approval"
        );
        title.setFont(
                Font.font("Arial", FontWeight.BOLD, 22)
        );
        title.setTextFill(Color.web(coffeeBrownDark));

        Label subtitle = new Label(
                "Review and approve pending loan applications"
        );
        subtitle.setTextFill(Color.web(coffeeBrownSoft));
        subtitle.setFont(Font.font("Arial", 13));

        // ---- Pending Loans Table ----
        Label pendingTitle = new Label(
                "⏳ Pending Loan Applications"
        );
        pendingTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 15)
        );
        pendingTitle.setTextFill(Color.web(coffeeBrownDark));

        LoanController controller =
                new LoanController();

        TableView<String[]> pendingTable =
                new TableView<>();
        pendingTable.setPrefHeight(220);

        TableColumn<String[], String> loanNumCol =
                createColumn("Loan No", 0, 100);
        TableColumn<String[], String> memberCol =
                createColumn("Member Name", 1, 160);
        TableColumn<String[], String> amountCol =
                createColumn("Amount (UGX)", 2, 130);
        TableColumn<String[], String> periodCol =
                createColumn("Period (months)", 3, 130);
        TableColumn<String[], String> monthlyCol =
                createColumn("Monthly (UGX)", 4, 130);
        TableColumn<String[], String> purposeCol =
                createColumn("Purpose", 5, 160);
        TableColumn<String[], String> dateCol =
                createColumn("Applied On", 6, 120);

        pendingTable.getColumns().addAll(
                loanNumCol, memberCol, amountCol,
                periodCol, monthlyCol,
                purposeCol, dateCol
        );
        pendingTable.setItems(
                controller.getPendingLoans()
        );

        // ---- Approve Section ----
        Label approveTitle = new Label(
                "Approve / Reject Selected Loan"
        );
        approveTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 15)
        );
        approveTitle.setTextFill(Color.web(coffeeBrownDark));

        TextField loanNumberField = new TextField();
        loanNumberField.setPromptText(
                "Loan Number e.g LN00001"
        );
        loanNumberField.setPrefHeight(40);
        loanNumberField.setPrefWidth(250);
        loanNumberField.setStyle(
                "-fx-background-color: white;" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;" +
                        "-fx-text-fill: #2b2b2b;"
        );

        // Auto fill when row is selected
        pendingTable.getSelectionModel()
                .selectedItemProperty()
                .addListener((obs, old, selected) -> {
                    if (selected != null) {
                        loanNumberField.setText(
                                selected[0]
                        );
                    }
                });

        // ---- Message Label ----
        Label messageLabel = new Label("");
        messageLabel.setFont(Font.font("Arial", 13));
        messageLabel.setWrapText(true);

        // ---- Approve Button ----
        Button approveBtn = new Button(
                "✅ APPROVE LOAN"
        );
        approveBtn.setPrefHeight(45);
        approveBtn.setPrefWidth(200);
        approveBtn.setStyle(
                "-fx-background-color: " + coffeeBrown + ";" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-font-size: 13;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );

        // ---- Reject Button ----
        Button rejectBtn = new Button(
                "❌ REJECT LOAN"
        );
        rejectBtn.setPrefHeight(45);
        rejectBtn.setPrefWidth(200);
        rejectBtn.setStyle(
                "-fx-background-color: #8A5A44;" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-font-size: 13;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );

        // ---- Approve Action ----
        approveBtn.setOnAction(e -> {
            String loanNum =
                    loanNumberField.getText().trim();
            if (loanNum.isEmpty()) {
                messageLabel.setTextFill(Color.RED);
                messageLabel.setText(
                        "❌ Please enter or select " +
                                "a loan number."
                );
                return;
            }

            Alert confirm = new Alert(
                    Alert.AlertType.CONFIRMATION
            );
            confirm.setTitle("Confirm Approval");
            confirm.setHeaderText(
                    "Approve Loan " + loanNum + "?"
            );
            confirm.setContentText(
                    "This will approve and disburse " +
                            "the loan immediately. " +
                            "A repayment schedule will be " +
                            "generated automatically."
            );

            confirm.showAndWait().ifPresent(
                    response -> {
                        if (response ==
                                ButtonType.OK) {
                            String result =
                                    controller.approveLoan(
                                            loanNum
                                    );

                            if (result.startsWith("✅")) {
                                messageLabel
                                        .setTextFill(
                                                Color.GREEN
                                        );
                                loanNumberField.clear();
                                pendingTable.setItems(
                                        controller
                                                .getPendingLoans()
                                );
                            } else {
                                messageLabel
                                        .setTextFill(
                                                Color.RED
                                        );
                            }
                            messageLabel.setText(result);
                        }
                    }
            );
        });

        // ---- Reject Action ----
        rejectBtn.setOnAction(e -> {
            String loanNum =
                    loanNumberField.getText().trim();
            if (loanNum.isEmpty()) {
                messageLabel.setTextFill(Color.RED);
                messageLabel.setText(
                        "❌ Please enter or select " +
                                "a loan number."
                );
                return;
            }

            Alert confirm = new Alert(
                    Alert.AlertType.CONFIRMATION
            );
            confirm.setTitle("Confirm Rejection");
            confirm.setHeaderText(
                    "Reject Loan " + loanNum + "?"
            );
            confirm.setContentText(
                    "This action cannot be undone."
            );

            confirm.showAndWait().ifPresent(
                    response -> {
                        if (response == ButtonType.OK) {
                            String result =
                                    controller.rejectLoan(
                                            loanNum
                                    );
                            if (result.startsWith("✅")) {
                                messageLabel
                                        .setTextFill(
                                                Color.GREEN
                                        );
                                loanNumberField.clear();
                                pendingTable.setItems(
                                        controller
                                                .getPendingLoans()
                                );
                            } else {
                                messageLabel
                                        .setTextFill(
                                                Color.RED
                                        );
                            }
                            messageLabel.setText(result);
                        }
                    }
            );
        });

        // ---- Approved Loans Table ----
        Label approvedTitle = new Label(
                "✅ Approved & Disbursed Loans"
        );
        approvedTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 15)
        );
        approvedTitle.setTextFill(Color.web(coffeeBrownDark));

        TableView<String[]> approvedTable =
                new TableView<>();
        approvedTable.setPrefHeight(180);

        TableColumn<String[], String> aLoanCol =
                createColumn("Loan No", 0, 100);
        TableColumn<String[], String> aMemberCol =
                createColumn("Member", 1, 160);
        TableColumn<String[], String> aAmountCol =
                createColumn("Amount (UGX)", 2, 130);
        TableColumn<String[], String> aMonthlyCol =
                createColumn("Monthly (UGX)", 3, 130);
        TableColumn<String[], String> aMaturityCol =
                createColumn("Maturity Date", 4, 130);
        TableColumn<String[], String> aStatusCol =
                createColumn("Status", 5, 100);

        approvedTable.getColumns().addAll(
                aLoanCol, aMemberCol, aAmountCol,
                aMonthlyCol, aMaturityCol, aStatusCol
        );
        approvedTable.setItems(
                controller.getApprovedLoans()
        );

        // ---- Record Repayment Section ----
        Label repayTitle = new Label(
                "💳 Record Loan Repayment"
        );
        repayTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 15)
        );
        repayTitle.setTextFill(Color.web(coffeeBrownDark));

        TextField repayLoanField = new TextField();
        repayLoanField.setPromptText("Loan Number e.g LN00001");
        repayLoanField.setPrefHeight(40);
        repayLoanField.setPrefWidth(200);
        repayLoanField.setStyle(
                "-fx-background-color: white;" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;" +
                        "-fx-text-fill: #2b2b2b;"
        );

        TextField repayAmountField = new TextField();
        repayAmountField.setPromptText("Amount Paid (UGX)");
        repayAmountField.setPrefHeight(40);
        repayAmountField.setPrefWidth(180);
        repayAmountField.setStyle(
                "-fx-background-color: white;" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;" +
                        "-fx-text-fill: #2b2b2b;"
        );

        Label repayMessage = new Label("");
        repayMessage.setFont(Font.font("Arial", 13));
        repayMessage.setWrapText(true);

        Button recordRepayBtn = new Button("💳 RECORD PAYMENT");
        recordRepayBtn.setPrefHeight(42);
        recordRepayBtn.setPrefWidth(180);
        recordRepayBtn.setStyle(
                "-fx-background-color: #16a085;" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-font-size: 13;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );

        // Auto-fill repay loan field from approved table (handled in collateral section listener above)

        recordRepayBtn.setOnAction(e -> {
            String ln = repayLoanField.getText().trim();
            String amtStr = repayAmountField.getText().trim();
            if (ln.isEmpty() || amtStr.isEmpty()) {
                repayMessage.setTextFill(Color.RED);
                repayMessage.setText("❌ Enter loan number and amount.");
                return;
            }
            try {
                double amt = Double.parseDouble(amtStr);
                String result = controller.recordRepayment(ln, amt);
                repayMessage.setText(result);
                repayMessage.setTextFill(
                        result.startsWith("✅") ? Color.web(coffeeBrown) : Color.RED
                );
                if (result.startsWith("✅")) {
                    repayLoanField.clear();
                    repayAmountField.clear();
                    approvedTable.setItems(controller.getApprovedLoans());
                }
            } catch (NumberFormatException ex) {
                repayMessage.setTextFill(Color.RED);
                repayMessage.setText("❌ Amount must be a number.");
            }
        });

        HBox repayRow = new HBox(10, repayLoanField, repayAmountField, recordRepayBtn);
        repayRow.setAlignment(Pos.CENTER_LEFT);

        // ---- Collateral Management Section ----
        Label collateralTitle = new Label("🔒 Collateral / Security");
        collateralTitle.setFont(Font.font("Arial", FontWeight.BOLD, 15));
        collateralTitle.setTextFill(Color.web(coffeeBrownDark));

        TextField collateralLoanField = new TextField();
        collateralLoanField.setPromptText("Loan Number e.g LN00001");
        collateralLoanField.setPrefHeight(40);
        collateralLoanField.setPrefWidth(180);
        collateralLoanField.setStyle(
                "-fx-background-color: white;" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;" +
                        "-fx-text-fill: #2b2b2b;"
        );

        ComboBox<String> collateralTypeBox = new ComboBox<>();
        collateralTypeBox.getItems().addAll(
                "Land Title", "Vehicle Logbook", "Building",
                "Equipment", "Livestock", "Salary Slip", "Guarantor", "Other"
        );
        collateralTypeBox.setPromptText("Collateral Type");
        collateralTypeBox.setPrefHeight(40);
        collateralTypeBox.setPrefWidth(160);
        collateralTypeBox.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;" +
                        "-fx-background-radius: 5;"
        );

        TextField collateralDescField = new TextField();
        collateralDescField.setPromptText("Description");
        collateralDescField.setPrefHeight(40);
        collateralDescField.setPrefWidth(200);
        collateralDescField.setStyle(
                "-fx-background-color: white;" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;" +
                        "-fx-text-fill: #2b2b2b;"
        );

        TextField collateralValueField = new TextField();
        collateralValueField.setPromptText("Estimated Value (UGX)");
        collateralValueField.setPrefHeight(40);
        collateralValueField.setPrefWidth(160);
        collateralValueField.setStyle(
                "-fx-background-color: white;" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;" +
                        "-fx-text-fill: #2b2b2b;"
        );

        TextField collateralDocField = new TextField();
        collateralDocField.setPromptText("Document Ref (optional)");
        collateralDocField.setPrefHeight(40);
        collateralDocField.setPrefWidth(160);
        collateralDocField.setStyle(
                "-fx-background-color: white;" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;" +
                        "-fx-text-fill: #2b2b2b;"
        );

        Label collateralMessage = new Label("");
        collateralMessage.setFont(Font.font("Arial", 13));
        collateralMessage.setWrapText(true);

        Button saveCollateralBtn = new Button("💾 SAVE COLLATERAL");
        saveCollateralBtn.setPrefHeight(42);
        saveCollateralBtn.setPrefWidth(180);
        saveCollateralBtn.setStyle(
                "-fx-background-color: #27ae60;" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-font-size: 13;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );

        // Collateral table
        TableView<String[]> collateralTable = new TableView<>();
        collateralTable.setPrefHeight(160);
        collateralTable.getColumns().addAll(
                createColumn("Type", 0, 120),
                createColumn("Description", 1, 200),
                createColumn("Value UGX", 2, 110),
                createColumn("Doc Ref", 3, 110),
                createColumn("Status", 4, 80)
        );

        // Auto-fill loan number from approved table selection and load collateral
        approvedTable.getSelectionModel().selectedItemProperty().addListener((obs, old, sel) -> {
            if (sel != null) {
                repayLoanField.setText(sel[0]);
                collateralLoanField.setText(sel[0]);
                int lid = controller.getLoanIdByNumber(sel[0]);
                if (lid != -1) {
                    collateralTable.setItems(controller.getCollateralForLoan(lid));
                }
            }
        });

        saveCollateralBtn.setOnAction(e -> {
            String ln = collateralLoanField.getText().trim();
            String ctype = collateralTypeBox.getValue();
            String desc = collateralDescField.getText().trim();
            String valStr = collateralValueField.getText().trim();
            String docRef = collateralDocField.getText().trim();

            if (ln.isEmpty() || ctype == null || desc.isEmpty() || valStr.isEmpty()) {
                collateralMessage.setTextFill(Color.RED);
                collateralMessage.setText("❌ Loan number, type, description and value are required.");
                return;
            }
            try {
                double val = Double.parseDouble(valStr.replace(",", ""));
                int loanId = controller.getLoanIdByNumber(ln);
                if (loanId == -1) {
                    collateralMessage.setTextFill(Color.RED);
                    collateralMessage.setText("❌ Loan number not found.");
                    return;
                }
                // Get member_id from loan
                int memberId = -1;
                try (java.sql.Connection conn = com.moresave.util.DBConnection.getConnection()) {
                    java.sql.PreparedStatement ps = conn.prepareStatement(
                            "SELECT member_id FROM loans WHERE loan_id = ?");
                    ps.setInt(1, loanId);
                    java.sql.ResultSet rs2 = ps.executeQuery();
                    if (rs2.next()) memberId = rs2.getInt("member_id");
                } catch (java.sql.SQLException ex) {
                    collateralMessage.setTextFill(Color.RED);
                    collateralMessage.setText("❌ Error: " + ex.getMessage());
                    return;
                }
                String result = controller.saveCollateral(loanId, memberId, ctype, desc, val, docRef);
                collateralMessage.setText(result);
                collateralMessage.setTextFill(result.startsWith("✅") ? Color.web("#27ae60") : Color.RED);
                if (result.startsWith("✅")) {
                    collateralDescField.clear();
                    collateralValueField.clear();
                    collateralDocField.clear();
                    collateralTable.setItems(controller.getCollateralForLoan(loanId));
                }
            } catch (NumberFormatException ex) {
                collateralMessage.setTextFill(Color.RED);
                collateralMessage.setText("❌ Estimated value must be a number.");
            }
        });

        HBox collateralInputRow = new HBox(10,
                collateralLoanField, collateralTypeBox,
                collateralDescField, collateralValueField,
                collateralDocField, saveCollateralBtn
        );
        collateralInputRow.setAlignment(Pos.CENTER_LEFT);

        // ---- Back Button ----
        Button backBtn = new Button(
                "← Back to Dashboard"
        );
        backBtn.setStyle(
                "-fx-background-color: transparent;" +
                        "-fx-text-fill: " + coffeeBrown + ";" +
                        "-fx-cursor: hand;" +
                        "-fx-font-size: 13;"
        );
        backBtn.setOnAction(e -> {
            AdminDashboard dashboard =
                    new AdminDashboard();
            dashboard.show(stage);
        });

        // ---- Action Row ----
        HBox actionRow = new HBox(15,
                loanNumberField,
                approveBtn,
                rejectBtn
        );
        actionRow.setAlignment(Pos.CENTER_LEFT);

        // ---- Main Layout ----
        VBox mainCard = new VBox(20,
                title,
                subtitle,
                pendingTitle,
                pendingTable,
                approveTitle,
                actionRow,
                messageLabel,
                approvedTitle,
                approvedTable,
                repayTitle,
                repayRow,
                repayMessage,
                collateralTitle,
                collateralInputRow,
                collateralMessage,
                collateralTable,
                backBtn
        );        mainCard.setPadding(new Insets(30));
        mainCard.setStyle(
                "-fx-background-color: " + warmWhite + ";" +
                        "-fx-background-radius: 10;"
        );

        ScrollPane scrollPane =
                new ScrollPane(mainCard);
        scrollPane.setFitToWidth(true);
        scrollPane.setStyle(
                "-fx-background-color: " + warmWhite + ";"
        );

        VBox root = new VBox(scrollPane);
        root.setPadding(new Insets(30));
        root.setAlignment(Pos.CENTER);
        root.setStyle(
                "-fx-background-color: " + warmWhite + ";"
        );

        Scene scene = new Scene(root, 950, 700);
        stage.setTitle(
                "Moresave SACCO - Loan Approval"
        );
        stage.setScene(scene);
        stage.show();
    }

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
}