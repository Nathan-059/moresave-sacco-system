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

public class MemberLoansScreen {

    private String username;

    public MemberLoansScreen(String username) {
        this.username = username;
    }

    public void show(Stage stage) {

        String coffeeBrown = "#6F4E37";
        String coffeeBrownDark = "#4E3526";
        String coffeeBrownSoft = "#8B6B4A";
        String warmWhite = "#FDFBF7";
        String lightCream = "#F6F1EA";
        String borderBrown = "#C7B8A7";

        MemberPortalController controller =
                new MemberPortalController();

        Label title = new Label("💳 My Loans");
        title.setFont(
                Font.font("Arial", FontWeight.BOLD, 20)
        );
        title.setTextFill(Color.web(coffeeBrownDark));

        Label loansTitle = new Label(
                "Loan History"
        );
        loansTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 15)
        );
        loansTitle.setTextFill(Color.web(coffeeBrownDark));

        TableView<String[]> loansTable =
                new TableView<>();
        loansTable.setPrefHeight(200);

        loansTable.getColumns().addAll(
                createColumn("Loan No", 0, 100),
                createColumn("Amount (UGX)", 1, 130),
                createColumn("Monthly (UGX)", 2, 130),
                createColumn(
                        "Outstanding (UGX)", 3, 150
                ),
                createColumn("Status", 4, 100),
                createColumn("Applied", 5, 110),
                createColumn("Maturity", 6, 110),
                createColumn("Interest", 7, 80)
        );
        loansTable.setItems(
                controller.getMemberLoans(username)
        );

        Label scheduleTitle = new Label(
                "Repayment Schedule"
        );
        scheduleTitle.setFont(
                Font.font("Arial", FontWeight.BOLD, 15)
        );
        scheduleTitle.setTextFill(Color.web(coffeeBrownDark));

        Label selectInfo = new Label(
                "Click a loan above to see " +
                        "its repayment schedule"
        );
        selectInfo.setTextFill(Color.web(coffeeBrownSoft));

        TableView<String[]> scheduleTable =
                new TableView<>();
        scheduleTable.setPrefHeight(250);

        scheduleTable.getColumns().addAll(
                createColumn("Due Date", 0, 120),
                createColumn(
                        "Amount Due (UGX)", 1, 140
                ),
                createColumn(
                        "Amount Paid (UGX)", 2, 140
                ),
                createColumn("Penalty (UGX)", 3, 120),
                createColumn(
                        "Total Owed (UGX)", 4, 130
                ),
                createColumn("Status", 5, 100)
        );

        loansTable.getSelectionModel()
                .selectedItemProperty()
                .addListener((obs, old, selected) -> {
                    if (selected != null) {
                        scheduleTable.setItems(
                                controller
                                        .getRepaymentSchedule(
                                                selected[0]
                                        )
                        );
                        selectInfo.setText(
                                "Showing schedule for: " +
                                        selected[0]
                        );
                    }
                });

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
                title, loansTitle, loansTable,
                scheduleTitle, selectInfo,
                scheduleTable, backBtn
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

        Scene scene = new Scene(root, 900, 650);
        stage.setTitle(
                "Moresave SACCO - My Loans"
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