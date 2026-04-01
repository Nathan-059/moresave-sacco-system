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

public class MemberTransactionsScreen {

    private String username;

    public MemberTransactionsScreen(
            String username) {
        this.username = username;
    }

    public void show(Stage stage) {

        String coffeeBrown = "#6F4E37";
        String coffeeBrownDark = "#4E3526";
        String coffeeBrownSoft = "#8B6B4A";
        String warmWhite = "#FDFBF7";
        String lightCream = "#F6F1EA";

        MemberPortalController controller =
                new MemberPortalController();
        String[] info =
                controller.getMemberByUsername(username);

        Label title = new Label(
                "📋 My Transactions"
        );
        title.setFont(
                Font.font("Arial", FontWeight.BOLD, 20)
        );
        title.setTextFill(Color.web(coffeeBrownDark));

        Label balanceLabel = new Label(
                "Current Balance: UGX " +
                        (info != null ? info[3] : "0")
        );
        balanceLabel.setFont(
                Font.font("Arial", FontWeight.BOLD, 16)
        );
        balanceLabel.setTextFill(Color.web(coffeeBrown));

        TableView<String[]> table =
                new TableView<>();
        table.setPrefHeight(400);

        table.getColumns().addAll(
                createColumn("Date", 0, 160),
                createColumn("Type", 1, 110),
                createColumn("Amount (UGX)", 2, 140),
                createColumn(
                        "Balance After (UGX)", 3, 160
                ),
                createColumn("Description", 4, 200)
        );

        if (info != null) {
            table.setItems(
                    controller.getTransactions(info[2])
            );
        }

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
            MemberDashboard dashboard =
                    new MemberDashboard(username);
            dashboard.show(stage);
        });

        VBox mainCard = new VBox(15,
                title, balanceLabel, table, backBtn
        );
        mainCard.setPadding(new Insets(30));
        mainCard.setStyle(
                "-fx-background-color: " + warmWhite + ";" +
                        "-fx-background-radius: 10;"
        );

        ScrollPane scroll =
                new ScrollPane(mainCard);
        scroll.setFitToWidth(true);
        scroll.setStyle(
                "-fx-background-color: " + warmWhite + ";"
        );

        VBox root = new VBox(scroll);
        root.setPadding(new Insets(30));
        root.setStyle(
                "-fx-background-color: " + warmWhite + ";"
        );

        Scene scene = new Scene(root, 900, 600);
        stage.setTitle(
                "Moresave SACCO - My Transactions"
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