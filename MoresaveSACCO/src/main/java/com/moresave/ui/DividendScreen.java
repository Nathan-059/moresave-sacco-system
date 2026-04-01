package com.moresave.ui;

import com.moresave.controller.DividendController;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.stage.Stage;

public class DividendScreen {

    public void show(Stage stage) {

        String coffeeBrown = "#6F4E37";
        String coffeeBrownDark = "#4E3526";
        String coffeeBrownSoft = "#8B6B4A";
        String warmWhite = "#FDFBF7";
        String lightCream = "#F6F1EA";
        String borderBrown = "#C7B8A7";

// ---- Title ----
        Label title = new Label(
                "Dividend Management"
        );
        title.setFont(
                Font.font("Arial", FontWeight.BOLD, 22)
        );
        title.setTextFill(Color.web(coffeeBrownDark));

        Label subtitle = new Label(
                "Calculate and distribute year-end " +
                        "dividends to all members"
        );
        subtitle.setTextFill(Color.web(coffeeBrownSoft));
        subtitle.setFont(Font.font("Arial", 13));

// ---- Input Section ----
        Label inputTitle = new Label(
                "Calculate Dividends"
        );
        inputTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 15)
        );
        inputTitle.setTextFill(Color.web(coffeeBrownDark));

// Financial Year
        Label yearLabel = new Label(
                "Financial Year:"
        );
        yearLabel.setTextFill(Color.web(coffeeBrownDark));
        yearLabel.setFont(Font.font("Arial", 13));

        ComboBox<String> yearBox =
                new ComboBox<>();
        yearBox.getItems().addAll(
                "2024", "2025", "2026"
        );
        yearBox.setValue("2025");
        yearBox.setPrefHeight(40);
        yearBox.setPrefWidth(200);
        yearBox.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;" +
                        "-fx-background-radius: 5;"
        );

// Total Profit
        Label profitLabel = new Label(
                "Total Distributable Profit (UGX):"
        );
        profitLabel.setTextFill(Color.web(coffeeBrownDark));
        profitLabel.setFont(Font.font("Arial", 13));

        TextField profitField = new TextField();
        profitField.setPromptText(
                "Enter total profit amount"
        );
        profitField.setPrefHeight(40);
        profitField.setPrefWidth(250);
        profitField.setStyle(
                "-fx-background-color: white;" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;" +
                        "-fx-text-fill: #2b2b2b;"
        );

// Info label
        Label infoLabel = new Label(
                "ℹ Each member receives a share " +
                        "proportional to their average " +
                        "savings for the year"
        );
        infoLabel.setTextFill(Color.web(coffeeBrownSoft));
        infoLabel.setFont(Font.font("Arial", 12));
        infoLabel.setWrapText(true);

// ---- Message Label ----
        Label messageLabel = new Label("");
        messageLabel.setFont(Font.font("Arial", 13));
        messageLabel.setWrapText(true);

// ---- Calculate Button ----
        Button calculateBtn = new Button(
                "📊 CALCULATE DIVIDENDS"
        );
        calculateBtn.setPrefHeight(45);
        calculateBtn.setPrefWidth(250);
        calculateBtn.setStyle(
                "-fx-background-color: " + coffeeBrown + ";" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-font-size: 13;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );

// ---- Dividends Preview Table ----
        Label previewTitle = new Label(
                "Dividend Preview"
        );
        previewTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 15)
        );
        previewTitle.setTextFill(Color.web(coffeeBrownDark));
        previewTitle.setVisible(false);

        TableView<String[]> dividendTable =
                new TableView<>();
        dividendTable.setPrefHeight(250);
        dividendTable.setVisible(false);

        TableColumn<String[], String> memberNumCol =
                createColumn("Member No", 0, 110);
        TableColumn<String[], String> nameCol =
                createColumn("Full Name", 1, 180);
        TableColumn<String[], String> savingsCol =
                createColumn("Avg Savings (UGX)", 2, 150);
        TableColumn<String[], String> percentCol =
                createColumn("Share %", 3, 90);
        TableColumn<String[], String> dividendCol =
                createColumn("Dividend (UGX)", 4, 140);

        dividendTable.getColumns().addAll(
                memberNumCol, nameCol, savingsCol,
                percentCol, dividendCol
        );

// ---- Approve Button ----
        Button approveBtn = new Button(
                "✅ APPROVE & DISTRIBUTE"
        );
        approveBtn.setPrefHeight(45);
        approveBtn.setPrefWidth(250);
        approveBtn.setStyle(
                "-fx-background-color: " + coffeeBrownDark + ";" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-font-size: 13;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );
        approveBtn.setVisible(false);

// ---- Calculate Button Action ----
        DividendController controller =
                new DividendController();

        calculateBtn.setOnAction(e -> {
            if (profitField.getText().isEmpty()) {
                messageLabel.setTextFill(Color.RED);
                messageLabel.setText(
                        "❌ Please enter the " +
                                "total profit amount."
                );
                return;
            }

            try {
                double profit = Double.parseDouble(
                        profitField.getText().trim()
                );
                String year = yearBox.getValue();

                javafx.collections.ObservableList
                        <String[]> preview =
                        controller.calculateDividends(
                                year, profit
                        );

                if (preview.isEmpty()) {
                    messageLabel.setTextFill(
                            Color.RED
                    );
                    messageLabel.setText(
                            "❌ No members found " +
                                    "with savings records."
                    );
                    return;
                }

                dividendTable.setItems(preview);
                dividendTable.setVisible(true);
                previewTitle.setVisible(true);
                approveBtn.setVisible(true);
                messageLabel.setTextFill(
                        Color.LIGHTGREEN
                );
                messageLabel.setText(
                        "✅ Preview calculated for " +
                                preview.size() +
                                " members. Review and approve."
                );

            } catch (NumberFormatException ex) {
                messageLabel.setTextFill(Color.RED);
                messageLabel.setText(
                        "❌ Profit must be a number."
                );
            }
        });

// ---- Approve Button Action ----
        approveBtn.setOnAction(e -> {
            Alert confirm = new Alert(
                    Alert.AlertType.CONFIRMATION
            );
            confirm.setTitle(
                    "Confirm Distribution"
            );
            confirm.setHeaderText(
                    "Approve dividend distribution?"
            );
            confirm.setContentText(
                    "This will save dividend records " +
                            "for all members shown. " +
                            "This cannot be undone."
            );

            confirm.showAndWait().ifPresent(
                    response -> {
                        if (response == ButtonType.OK) {
                            try {
                                double profit =
                                        Double.parseDouble(
                                                profitField
                                                        .getText()
                                                        .trim()
                                        );
                                String year =
                                        yearBox.getValue();

                                String result =
                                        controller
                                                .approveDividends(
                                                        year, profit
                                                );

                                if (result.startsWith(
                                        "✅")) {
                                    messageLabel
                                            .setTextFill(
                                                    Color.GREEN
                                            );
                                    profitField.clear();
                                    dividendTable
                                            .setVisible(false);
                                    previewTitle
                                            .setVisible(false);
                                    approveBtn
                                            .setVisible(false);
                                } else {
                                    messageLabel
                                            .setTextFill(
                                                    Color.RED
                                            );
                                }
                                messageLabel
                                        .setText(result);

                            } catch (
                                    NumberFormatException ex) {
                                messageLabel
                                        .setTextFill(Color.RED);
                                messageLabel.setText(
                                        "❌ Invalid profit amount."
                                );
                            }
                        }
                    }
            );
        });

// ---- History Table ----
        Label historyTitle = new Label(
                "📋 Dividend History"
        );
        historyTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 15)
        );
        historyTitle.setTextFill(Color.web(coffeeBrownDark));

        TableView<String[]> historyTable =
                new TableView<>();
        historyTable.setPrefHeight(180);

        TableColumn<String[], String> hYearCol =
                createColumn("Year", 0, 80);
        TableColumn<String[], String> hMemberCol =
                createColumn("Member", 1, 180);
        TableColumn<String[], String> hSavingsCol =
                createColumn("Avg Savings (UGX)", 2, 150);
        TableColumn<String[], String> hDivCol =
                createColumn("Dividend (UGX)", 3, 140);
        TableColumn<String[], String> hStatusCol =
                createColumn("Status", 4, 100);

        historyTable.getColumns().addAll(
                hYearCol, hMemberCol, hSavingsCol,
                hDivCol, hStatusCol
        );
        historyTable.setItems(
                controller.getDividendHistory()
        );

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

// ---- Input Form Layout ----
        GridPane inputForm = new GridPane();
        inputForm.setHgap(20);
        inputForm.setVgap(15);
        inputForm.add(yearLabel, 0, 0);
        inputForm.add(yearBox, 1, 0);
        inputForm.add(profitLabel, 0, 1);
        inputForm.add(profitField, 1, 1);
        inputForm.add(infoLabel, 1, 2);

// ---- Main Layout ----
        VBox mainCard = new VBox(20,
                title, subtitle,
                inputTitle, inputForm,
                calculateBtn,
                messageLabel,
                previewTitle,
                dividendTable,
                approveBtn,
                historyTitle,
                historyTable,
                backBtn
        );
        mainCard.setPadding(new Insets(30));
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
                "Moresave SACCO - Dividends"
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