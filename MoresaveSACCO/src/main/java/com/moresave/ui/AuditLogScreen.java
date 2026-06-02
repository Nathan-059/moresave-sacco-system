package com.moresave.ui;

import com.moresave.util.AuditService;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.stage.Stage;

public class AuditLogScreen {

    public void show(Stage stage) {

        final String DARK_BROWN = "#4E3526";
        final String MID_BROWN  = "#6F4E37";
        final String WARM_WHITE = "#FDFBF7";
        final String CREAM      = "#F6F1EA";

        Label title = new Label("🔍 Audit Trail Log");
        title.setFont(Font.font("Arial", FontWeight.BOLD, 22));
        title.setTextFill(Color.web(DARK_BROWN));

        Label subtitle = new Label(
            "Complete record of all system actions — who did what and when."
        );
        subtitle.setTextFill(Color.web(MID_BROWN));
        subtitle.setFont(Font.font("Arial", 13));

        // Filter controls
        ComboBox<String> filterBox = new ComboBox<>();
        filterBox.getItems().addAll(
            "All Actions", "LOGIN", "LOGOUT", "MEMBER_REGISTERED",
            "LOAN_APPLIED", "LOAN_APPROVED", "LOAN_REJECTED",
            "DEPOSIT", "WITHDRAWAL", "PASSWORD_CHANGED", "PROFILE_UPDATED"
        );
        filterBox.setValue("All Actions");
        filterBox.setPrefHeight(36);

        ComboBox<String> limitBox = new ComboBox<>();
        limitBox.getItems().addAll("50 records", "100 records", "200 records", "500 records");
        limitBox.setValue("100 records");
        limitBox.setPrefHeight(36);

        Button refreshBtn = new Button("🔄 Refresh");
        refreshBtn.setStyle(
            "-fx-background-color:" + MID_BROWN + ";-fx-text-fill:white;" +
            "-fx-font-weight:bold;-fx-background-radius:5;-fx-cursor:hand;-fx-pref-height:36;"
        );

        HBox filterBar = new HBox(10,
            new Label("Filter:") {{ setTextFill(Color.web(DARK_BROWN)); }},
            filterBox,
            new Label("Show:") {{ setTextFill(Color.web(DARK_BROWN)); }},
            limitBox,
            refreshBtn
        );
        filterBar.setAlignment(Pos.CENTER_LEFT);
        filterBar.setPadding(new Insets(10, 15, 10, 15));

        // Table
        TableView<String[]> table = new TableView<>();
        table.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        VBox.setVgrow(table, Priority.ALWAYS);

        table.getColumns().addAll(
            col("Date & Time",  0, 160),
            col("User",         1, 100),
            col("Action",       2, 140),
            col("Table",        3,  90),
            col("Record ID",    4,  90),
            col("Description",  5, 300)
        );

        // Load data
        Runnable loadData = () -> {
            int limit = Integer.parseInt(limitBox.getValue().split(" ")[0]);
            var data = AuditService.getRecentLogs(limit);
            String filter = filterBox.getValue();
            if (!"All Actions".equals(filter)) {
                data.removeIf(row -> !filter.equals(row[2]));
            }
            table.setItems(data);
        };
        loadData.run();

        refreshBtn.setOnAction(e -> loadData.run());
        filterBox.setOnAction(e -> loadData.run());
        limitBox.setOnAction(e -> loadData.run());

        // Stats strip
        Label countLabel = new Label();
        table.itemsProperty().addListener((obs, o, n) ->
            countLabel.setText("Showing " + table.getItems().size() + " records")
        );
        countLabel.setText("Showing " + table.getItems().size() + " records");
        countLabel.setTextFill(Color.web(MID_BROWN));
        countLabel.setFont(Font.font("Arial", 12));

        Button backBtn = new Button("← Back to Dashboard");
        backBtn.setStyle(
            "-fx-background-color:transparent;-fx-text-fill:" + MID_BROWN + ";" +
            "-fx-cursor:hand;-fx-font-size:13;"
        );
        backBtn.setOnAction(e -> new AdminDashboard().show(stage));

        VBox mainCard = new VBox(12,
            title, subtitle, filterBar, countLabel, table, backBtn
        );
        mainCard.setPadding(new Insets(24));
        mainCard.setStyle("-fx-background-color:" + WARM_WHITE + ";");
        VBox.setVgrow(table, Priority.ALWAYS);

        Scene scene = new Scene(mainCard, 1100, 700);
        stage.setTitle("Moresave SACCO - Audit Trail");
        stage.setScene(scene);
        stage.setResizable(true);
        stage.show();
    }

    private TableColumn<String[], String> col(String title, int idx, int width) {
        TableColumn<String[], String> c = new TableColumn<>(title);
        c.setCellValueFactory(d ->
            new javafx.beans.property.SimpleStringProperty(d.getValue()[idx]));
        c.setPrefWidth(width);
        return c;
    }
}
