package com.moresave.ui;

import com.moresave.controller.SavingsController;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.stage.Stage;

public class SavingsScreen {

    public void show(Stage stage) {

        // ---- Controller ----
        SavingsController controller =
                new SavingsController();

        // ---- Title ----
        Label title = new Label(
                "Savings & Transactions"
        );
        title.setFont(
                Font.font("Arial", FontWeight.BOLD, 20)
        );
        title.setTextFill(Color.WHITE);

        // ---- Member Search ----
        Label searchLabel = new Label(
                "Enter Member Number to Load Account"
        );
        searchLabel.setTextFill(Color.LIGHTGRAY);

        TextField memberNumberField =
                createField("Member Number e.g MRS0001");

        Button loadBtn = new Button("LOAD ACCOUNT");
        loadBtn.setStyle(
                "-fx-background-color: #2980b9;" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;" +
                        "-fx-pref-height: 40;"
        );

        // ---- Account Info Display ----
        Label memberNameLabel = new Label("");
        memberNameLabel.setTextFill(Color.WHITE);
        memberNameLabel.setFont(
                Font.font("Arial", FontWeight.BOLD, 15)
        );

        Label accountNumberLabel = new Label("");
        accountNumberLabel.setTextFill(
                Color.LIGHTGRAY
        );

        Label balanceLabel = new Label("");
        balanceLabel.setFont(
                Font.font("Arial", FontWeight.BOLD, 18)
        );
        balanceLabel.setTextFill(Color.LIGHTGREEN);

        VBox accountInfoBox = new VBox(5,
                memberNameLabel,
                accountNumberLabel,
                balanceLabel
        );
        accountInfoBox.setPadding(new Insets(15));
        accountInfoBox.setStyle(
                "-fx-background-color: #1a252f;" +
                        "-fx-background-radius: 8;"
        );
        accountInfoBox.setVisible(false);

        // ---- Transaction Section ----
        Label transactionTitle = new Label(
                "Record Transaction"
        );
        transactionTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 15)
        );
        transactionTitle.setTextFill(Color.WHITE);

        ComboBox<String> transactionTypeBox =
                new ComboBox<>();
        transactionTypeBox.getItems().addAll(
                "Deposit", "Withdrawal"
        );
        transactionTypeBox.setPromptText(
                "Select Transaction Type"
        );
        transactionTypeBox.setPrefHeight(40);
        transactionTypeBox.setPrefWidth(300);

        TextField amountField =
                createField("Amount (UGX)");

        TextField descriptionField =
                createField("Description (optional)");

        // ---- Message Label ----
        Label messageLabel = new Label("");
        messageLabel.setFont(Font.font("Arial", 13));
        messageLabel.setWrapText(true);

        // ---- Submit Button ----
        Button submitBtn = new Button(
                "RECORD TRANSACTION"
        );
        submitBtn.setPrefWidth(300);
        submitBtn.setPrefHeight(45);
        submitBtn.setStyle(
                "-fx-background-color: #27ae60;" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-font-size: 14;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );
        submitBtn.setVisible(false);

        // ---- Download Statement Button ----
        Button downloadStatementBtn = new Button(
                "📥 Download Account Statement"
        );
        downloadStatementBtn.setPrefHeight(40);
        downloadStatementBtn.setPrefWidth(280);
        downloadStatementBtn.setStyle(
                "-fx-background-color: #2980b9;" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );
        downloadStatementBtn.setVisible(false);

        // ---- Transaction History Table ----
        Label historyTitle = new Label(
                "Recent Transactions"
        );
        historyTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 15)
        );
        historyTitle.setTextFill(Color.WHITE);

        TableView<String[]> transactionTable =
                new TableView<>();
        transactionTable.setPrefHeight(200);
        transactionTable.setStyle(
                "-fx-background-color: #1a252f;"
        );

        TableColumn<String[], String> dateCol =
                new TableColumn<>("Date");
        dateCol.setCellValueFactory(data ->
                new javafx.beans.property
                        .SimpleStringProperty(
                        data.getValue()[0]
                )
        );
        dateCol.setPrefWidth(150);

        TableColumn<String[], String> typeCol =
                new TableColumn<>("Type");
        typeCol.setCellValueFactory(data ->
                new javafx.beans.property
                        .SimpleStringProperty(
                        data.getValue()[1]
                )
        );
        typeCol.setPrefWidth(100);

        TableColumn<String[], String> amountCol =
                new TableColumn<>("Amount (UGX)");
        amountCol.setCellValueFactory(data ->
                new javafx.beans.property
                        .SimpleStringProperty(
                        data.getValue()[2]
                )
        );
        amountCol.setPrefWidth(150);

        TableColumn<String[], String> balanceCol =
                new TableColumn<>("Balance After (UGX)");
        balanceCol.setCellValueFactory(data ->
                new javafx.beans.property
                        .SimpleStringProperty(
                        data.getValue()[3]
                )
        );
        balanceCol.setPrefWidth(150);

        transactionTable.getColumns().addAll(
                dateCol, typeCol,
                amountCol, balanceCol
        );
        transactionTable.setVisible(false);

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

        // ---- Load Account Action ----
        loadBtn.setOnAction(e -> {
            String memberNum =
                    memberNumberField.getText().trim();
            if (memberNum.isEmpty()) {
                messageLabel.setTextFill(Color.RED);
                messageLabel.setText(
                        "❌ Please enter a member number."
                );
                return;
            }

            String[] accountInfo =
                    controller.getAccountInfo(memberNum);

            if (accountInfo == null) {
                messageLabel.setTextFill(Color.RED);
                messageLabel.setText(
                        "❌ Member not found."
                );
                return;
            }

            memberNameLabel.setText(
                    "👤 " + accountInfo[0]
            );
            accountNumberLabel.setText(
                    "Account: " + accountInfo[1]
            );
            balanceLabel.setText(
                    "Balance: UGX " + accountInfo[2]
            );
            accountInfoBox.setVisible(true);
            submitBtn.setVisible(true);
            transactionTable.setVisible(true);
            downloadStatementBtn.setVisible(true);
            messageLabel.setText("");

            // Load transaction history
            transactionTable.setItems(
                    controller.getTransactionHistory(
                            accountInfo[1]
                    )
            );
        });

        // ---- Submit Transaction Action ----
        submitBtn.setOnAction(e -> {
            if (transactionTypeBox
                    .getValue() == null ||
                    amountField.getText().isEmpty()) {
                messageLabel.setTextFill(Color.RED);
                messageLabel.setText(
                        "❌ Please select type and amount."
                );
                return;
            }

            try {
                double amount = Double.parseDouble(
                        amountField.getText().trim()
                );
                String type = transactionTypeBox
                        .getValue().toLowerCase();
                String description =
                        descriptionField.getText().trim();

                String result =
                        controller.recordTransaction(
                                memberNumberField
                                        .getText().trim(),
                                type,
                                amount,
                                description
                        );

                if (result.startsWith("✅")) {
                    messageLabel.setTextFill(
                            Color.GREEN
                    );
                    amountField.clear();
                    descriptionField.clear();
                    transactionTypeBox.setValue(null);

                    // Refresh account info
                    String[] updated =
                            controller.getAccountInfo(
                                    memberNumberField
                                            .getText().trim()
                            );
                    if (updated != null) {
                        balanceLabel.setText(
                                "Balance: UGX " +
                                        updated[2]
                        );
                        transactionTable.setItems(
                                controller
                                        .getTransactionHistory(
                                                updated[1]
                                        )
                        );
                    }
                } else {
                    messageLabel.setTextFill(
                            Color.RED
                    );
                }
                messageLabel.setText(result);

            } catch (NumberFormatException ex) {
                messageLabel.setTextFill(Color.RED);
                messageLabel.setText(
                        "❌ Amount must be a number."
                );
            }
        });

        // ---- Download Statement Action ----
        downloadStatementBtn.setOnAction(e -> {
            String memberNum =
                    memberNumberField.getText().trim();
            String[] info =
                    controller.getAccountInfo(memberNum);

            if (info == null) {
                messageLabel.setTextFill(Color.RED);
                messageLabel.setText(
                        "❌ Please load an account first."
                );
                return;
            }

            String result =
                    com.moresave.util.PDFGenerator
                            .generateMemberStatement(
                                    memberNum,
                                    info[0],
                                    info[1],
                                    info[2],
                                    new java.util.ArrayList<>(
                                            controller
                                                    .getTransactionHistory(
                                                            info[1]
                                                    )
                                    )
                            );

            if (result.startsWith("✅")) {
                messageLabel.setTextFill(Color.GREEN);
            } else {
                messageLabel.setTextFill(Color.RED);
            }
            messageLabel.setText(result);
        });

        // ---- Layout ----
        HBox searchBox = new HBox(10,
                memberNumberField, loadBtn
        );
        searchBox.setAlignment(Pos.CENTER_LEFT);

        VBox mainCard = new VBox(15,
                title,
                searchLabel,
                searchBox,
                accountInfoBox,
                transactionTitle,
                createFormRow(
                        "Transaction Type",
                        transactionTypeBox
                ),
                createFormRow(
                        "Amount (UGX)", amountField
                ),
                createFormRow(
                        "Description", descriptionField
                ),
                messageLabel,
                submitBtn,
                downloadStatementBtn,
                historyTitle,
                transactionTable,
                backBtn
        );
        mainCard.setPadding(new Insets(30));
        mainCard.setStyle(
                "-fx-background-color: #1e2a3a;" +
                        "-fx-background-radius: 10;"
        );
        mainCard.setMaxWidth(750);

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

        Scene scene = new Scene(root, 900, 650);
        stage.setTitle(
                "Moresave SACCO - Savings & Transactions"
        );
        stage.setScene(scene);
        stage.show();
    }

    private HBox createFormRow(
            String labelText, Control field) {
        Label label = new Label(labelText);
        label.setTextFill(Color.WHITE);
        label.setFont(Font.font("Arial", 13));
        label.setMinWidth(150);
        HBox row = new HBox(15, label, field);
        row.setAlignment(Pos.CENTER_LEFT);
        return row;
    }

    private TextField createField(String prompt) {
        TextField field = new TextField();
        field.setPromptText(prompt);
        field.setPrefHeight(40);
        field.setPrefHeight(40);
        field.setPrefWidth(300);
        field.setStyle("-fx-background-radius: 5;");
        return field;
    }
}