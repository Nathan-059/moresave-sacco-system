package com.moresave.ui;

import com.moresave.controller.MemberPortalController;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.stage.Stage;

public class MemberDividendScreen {

    private String username;

    public MemberDividendScreen(String username) {
        this.username = username;
    }

    public void show(Stage stage) {

        MemberPortalController controller =
                new MemberPortalController();

        Label title = new Label("💵 My Dividends");
        title.setFont(
                Font.font("Arial", FontWeight.BOLD, 20)
        );
        title.setTextFill(Color.WHITE);

        Label info = new Label(
                "Your dividend is calculated based on " +
                        "your proportional share of total " +
                        "SACCO savings each financial year."
        );
        info.setTextFill(Color.LIGHTGRAY);
        info.setWrapText(true);
        info.setMaxWidth(600);

        // Explicit dividend formula — concept paper requirement
        Label formulaLabel = new Label(
            "📐 DIVIDEND CALCULATION FORMULA\n\n" +
            "Your Share (%) = Your Avg Monthly Savings ÷ Total SACCO Savings × 100\n\n" +
            "Your Dividend = Your Share (%) × Total Distributable Profit\n\n" +
            "Example: If your avg savings = UGX 200,000\n" +
            "  Total SACCO savings = UGX 155,000,000\n" +
            "  Your share = 200,000 ÷ 155,000,000 × 100 = 0.129%\n" +
            "  If profit = UGX 15,000,000 → Your dividend = UGX 19,355"
        );
        formulaLabel.setTextFill(Color.web("#2ecc71"));
        formulaLabel.setFont(Font.font("Arial", 11));
        formulaLabel.setWrapText(true);
        formulaLabel.setMaxWidth(700);
        formulaLabel.setPadding(new Insets(12));
        formulaLabel.setStyle(
            "-fx-background-color:#1a3a2a;" +
            "-fx-background-radius:6;" +
            "-fx-border-color:#27ae60;" +
            "-fx-border-radius:6;" +
            "-fx-border-width:1;"
        );

        TableView<String[]> table =
                new TableView<>();
        table.setPrefHeight(350);

        table.getColumns().addAll(
                createColumn("Year", 0, 80),
                createColumn(
                        "Avg Savings (UGX)", 1, 160
                ),
                createColumn("Your Share %", 2, 120),
                createColumn(
                        "Dividend (UGX)", 3, 150
                ),
                createColumn("Status", 4, 110)
        );
        table.setItems(
                controller.getMemberDividends(username)
        );

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
            MemberDashboard dashboard =
                    new MemberDashboard(username);
            dashboard.show(stage);
        });

        VBox mainCard = new VBox(15,
                title, info, formulaLabel, table, backBtn
        );
        mainCard.setPadding(new Insets(30));
        mainCard.setStyle(
                "-fx-background-color: #1e2a3a;" +
                        "-fx-background-radius: 10;"
        );

        VBox root = new VBox(mainCard);
        root.setPadding(new Insets(30));
        root.setAlignment(Pos.CENTER);
        root.setStyle(
                "-fx-background-color: #152232;"
        );

        Scene scene = new Scene(root, 800, 550);
        stage.setTitle(
                "Moresave SACCO - My Dividends"
        );
        stage.setScene(scene);
        stage.show();
    }

    private TableColumn<String[], String>
    createColumn(String title,
                 int index, int width) {
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