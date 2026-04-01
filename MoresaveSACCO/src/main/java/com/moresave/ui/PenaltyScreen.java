package com.moresave.ui;

import com.moresave.util.PenaltyEngine;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.stage.Stage;

public class PenaltyScreen {

    public void show(Stage stage) {

        String coffeeBrown = "#6F4E37";
        String coffeeBrownDark = "#4E3526";
        String coffeeBrownSoft = "#8B6B4A";
        String warmWhite = "#FDFBF7";
        String lightCream = "#F6F1EA";
        String borderBrown = "#C7B8A7";

        // ---- Title ----
        Label title = new Label(
                "Penalty Management"
        );
        title.setFont(
                Font.font("Arial", FontWeight.BOLD, 22)
        );
        title.setTextFill(Color.web(coffeeBrownDark));

        Label subtitle = new Label(
                "Automatically detects overdue loans " +
                        "and applies 2% monthly penalty"
        );
        subtitle.setTextFill(Color.web(coffeeBrownSoft));
        subtitle.setFont(Font.font("Arial", 13));

        // ---- Info Box ----
        Label infoBox = new Label(
                "ℹ The penalty engine runs automatically " +
                        "every time the system starts.\n" +
                        "You can also manually trigger it " +
                        "below at any time."
        );
        infoBox.setTextFill(Color.web(coffeeBrownSoft));
        infoBox.setFont(Font.font("Arial", 12));
        infoBox.setWrapText(true);
        infoBox.setPadding(new Insets(10));
        infoBox.setStyle(
                "-fx-background-color: " + lightCream + ";" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;"
        );

        // ---- Message Label ----
        Label messageLabel = new Label("");
        messageLabel.setFont(Font.font("Arial", 14));
        messageLabel.setWrapText(true);

        // ---- Run Penalty Button ----
        Button runBtn = new Button(
                "⚡ RUN PENALTY CHECK NOW"
        );
        runBtn.setPrefHeight(45);
        runBtn.setPrefWidth(280);
        runBtn.setStyle(
                "-fx-background-color: " + coffeeBrown + ";" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-font-size: 13;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );

        runBtn.setOnAction(e -> {
            String result =
                    PenaltyEngine.runPenaltyCheck();
            if (result.startsWith("⚠")) {
                messageLabel.setTextFill(Color.ORANGE);
            } else {
                messageLabel.setTextFill(
                        Color.web(coffeeBrown)
                );
            }
            messageLabel.setText(result);

            // Refresh overdue table
            overdueTable.setItems(
                    PenaltyEngine.getOverdueSummary()
            );
        });

        // ---- Overdue Loans Table ----
        Label overdueTitle = new Label(
                "⚠ Overdue Loans with Penalties"
        );
        overdueTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 16)
        );
        overdueTitle.setTextFill(Color.web(coffeeBrownDark));

        overdueTable = new TableView<>();
        overdueTable.setPrefHeight(300);

        TableColumn<String[], String> loanCol =
                createColumn("Loan No", 0, 90);
        TableColumn<String[], String> memberCol =
                createColumn("Member Name", 1, 160);
        TableColumn<String[], String> phoneCol =
                createColumn("Phone", 2, 120);
        TableColumn<String[], String> dueDateCol =
                createColumn("Due Date", 3, 110);
        TableColumn<String[], String> amountCol =
                createColumn("Amount Due", 4, 110);
        TableColumn<String[], String> penaltyCol =
                createColumn("Penalty (2%)", 5, 110);
        TableColumn<String[], String> totalCol =
                createColumn("Total Owed", 6, 110);
        TableColumn<String[], String> daysCol =
                createColumn("Days Overdue", 7, 110);

        overdueTable.getColumns().addAll(
                loanCol, memberCol, phoneCol,
                dueDateCol, amountCol, penaltyCol,
                totalCol, daysCol
        );
        overdueTable.setItems(
                PenaltyEngine.getOverdueSummary()
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

        // ---- Main Layout ----
        VBox mainCard = new VBox(20,
                title, subtitle, infoBox,
                runBtn, messageLabel,
                overdueTitle, overdueTable,
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
                "Moresave SACCO - Penalty Management"
        );
        stage.setScene(scene);
        stage.show();
    }

    private TableView<String[]> overdueTable;

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