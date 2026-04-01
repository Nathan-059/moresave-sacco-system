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
                title, info, table, backBtn
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