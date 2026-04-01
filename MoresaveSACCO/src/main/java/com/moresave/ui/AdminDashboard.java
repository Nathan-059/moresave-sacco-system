package com.moresave.ui;

import com.moresave.controller.LoanController;
import com.moresave.controller.ReportsController;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.stage.Stage;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class AdminDashboard {

    public void show(Stage stage) {

        final String DARK_BROWN = "#4E3526";
        final String MID_BROWN  = "#6F4E37";
        final String CREAM_BG   = "#F6F1EA";

        ReportsController reportsCtrl = new ReportsController();
        LoanController loanCtrl = new LoanController();
        String[] summary = reportsCtrl.getSummary();
        ObservableList<String[]> pendingLoans = loanCtrl.getPendingLoans();
        String pendingCount = String.valueOf(pendingLoans.size());

        // ── TOP NAVBAR ───────────────────────────────────────────────────
        Label logoLabel = new Label("MORESAVE SACCO");
        logoLabel.setFont(Font.font("Arial", FontWeight.BOLD, 18));
        logoLabel.setTextFill(Color.WHITE);

        Label mgmtLabel = new Label("Management System");
        mgmtLabel.setFont(Font.font("Arial", FontPosture.ITALIC, 13));
        mgmtLabel.setTextFill(Color.web("#D4C5B5"));

        VBox logoBox = new VBox(2, logoLabel, mgmtLabel);
        logoBox.setAlignment(Pos.CENTER_LEFT);

        Label adminLabel = new Label("👤 Admin");
        adminLabel.setFont(Font.font("Arial", FontWeight.BOLD, 13));
        adminLabel.setTextFill(Color.WHITE);

        Label dateLabel = new Label(
            LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy"))
        );
        dateLabel.setFont(Font.font("Arial", 12));
        dateLabel.setTextFill(Color.web("#D4C5B5"));

        Button logoutBtn = new Button("🚪 Logout");
        logoutBtn.setStyle(
            "-fx-background-color:#c0392b;-fx-text-fill:white;-fx-font-weight:bold;" +
            "-fx-background-radius:5;-fx-cursor:hand;-fx-padding:6 14 6 14;"
        );
        logoutBtn.setOnAction(e -> new LoginApp().start(stage));

        HBox rightNav = new HBox(14, adminLabel, dateLabel, logoutBtn);
        rightNav.setAlignment(Pos.CENTER_RIGHT);
        Region navSpacer = new Region();
        HBox.setHgrow(navSpacer, Priority.ALWAYS);

        HBox navbar = new HBox(20, logoBox, navSpacer, rightNav);
        navbar.setAlignment(Pos.CENTER_LEFT);
        navbar.setPadding(new Insets(14, 20, 14, 20));
        navbar.setStyle("-fx-background-color:" + DARK_BROWN + ";");

        // ── LEFT SIDEBAR ─────────────────────────────────────────────────
        VBox sidebar = new VBox(2);
        sidebar.setPrefWidth(200);
        sidebar.setPadding(new Insets(16, 0, 16, 0));
        sidebar.setStyle("-fx-background-color:" + MID_BROWN + ";");

        String[][] menuItems = {
            {"📊 Dashboard"}, {"👥 Members"}, {"💰 Loans"},
            {"📝 Apply Loan"}, {"🏦 Savings"}, {"💵 Dividends"},
            {"⚠️ Penalties"}, {"📋 Reports"}, {"🚪 Logout"}
        };
        for (String[] item : menuItems) {
            boolean active = item[0].contains("Dashboard");
            Button btn = sidebarBtn(item[0], active);
            String key = item[0].replaceAll("[^a-zA-Z ]", "").trim();
            btn.setOnAction(e -> handleNav(key, stage));
            sidebar.getChildren().add(btn);
        }

        // ── KPI CARDS ────────────────────────────────────────────────────
        HBox kpiRow = new HBox(14,
            kpiCard("👥 Total Members",       summary[0],          "#2980b9"),
            kpiCard("🏦 Total Savings (UGX)", "UGX " + summary[1], "#27ae60"),
            kpiCard("💰 Active Loans (UGX)",  "UGX " + summary[2], "#e67e22"),
            kpiCard("⏳ Pending Loans",        pendingCount,        "#c0392b")
        );
        for (javafx.scene.Node n : kpiRow.getChildren()) HBox.setHgrow(n, Priority.ALWAYS);

        // ── RECENT LOAN APPLICATIONS ──────────────────────────────────────
        TableView<String[]> loanTable = new TableView<>();
        loanTable.setPrefHeight(170);
        loanTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        loanTable.getColumns().addAll(
            col("Loan No", 0), col("Member", 1), col("Amount (UGX)", 2), col("Applied", 6)
        );
        ObservableList<String[]> recentPending =
            javafx.collections.FXCollections.observableArrayList();
        for (int i = 0; i < Math.min(5, pendingLoans.size()); i++) recentPending.add(pendingLoans.get(i));
        loanTable.setItems(recentPending);

        VBox loanPanel = panel("⏳ Recent Loan Applications", loanTable);

        // ── RECENT MEMBERS ────────────────────────────────────────────────
        TableView<String[]> membTable = new TableView<>();
        membTable.setPrefHeight(170);
        membTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        membTable.getColumns().addAll(
            col("Member No", 0), col("Full Name", 1), col("Phone", 2), col("Status", 4)
        );
        ObservableList<String[]> allMembers = reportsCtrl.getAllMembers();
        ObservableList<String[]> recentMembers =
            javafx.collections.FXCollections.observableArrayList();
        int start = Math.max(0, allMembers.size() - 5);
        for (int i = start; i < allMembers.size(); i++) recentMembers.add(allMembers.get(i));
        membTable.setItems(recentMembers);

        VBox membPanel = panel("👥 Recently Registered Members", membTable);

        HBox row2 = new HBox(14, loanPanel, membPanel);
        HBox.setHgrow(loanPanel, Priority.ALWAYS);
        HBox.setHgrow(membPanel, Priority.ALWAYS);

        // ── QUICK ACTIONS ─────────────────────────────────────────────────
        Button[] qaBtns = {
            actionBtn("👥 Members",       "#2980b9"),
            actionBtn("💰 Loan Approvals","#27ae60"),
            actionBtn("🏦 Savings",       "#8e44ad"),
            actionBtn("📋 Reports",       "#e67e22"),
            actionBtn("💵 Dividends",     "#16a085"),
            actionBtn("⚠️ Penalties",     "#c0392b")
        };
        qaBtns[0].setOnAction(e -> new MemberManagementScreen().show(stage));
        qaBtns[1].setOnAction(e -> new LoanApprovalScreen().show(stage));
        qaBtns[2].setOnAction(e -> new SavingsScreen().show(stage));
        qaBtns[3].setOnAction(e -> new ReportsScreen().show(stage));
        qaBtns[4].setOnAction(e -> new DividendScreen().show(stage));
        qaBtns[5].setOnAction(e -> new PenaltyScreen().show(stage));

        HBox qaRow = new HBox(10, qaBtns);
        qaRow.setAlignment(Pos.CENTER_LEFT);

        Label qaTitle = new Label("Quick Actions");
        qaTitle.setFont(Font.font("Arial", FontWeight.BOLD, 14));
        qaTitle.setTextFill(Color.web(DARK_BROWN));

        VBox qaPanel = new VBox(10, qaTitle, qaRow);
        qaPanel.setPadding(new Insets(16));
        qaPanel.setStyle(
            "-fx-background-color:white;-fx-background-radius:8;" +
            "-fx-effect:dropshadow(gaussian,rgba(0,0,0,0.08),6,0,0,2);"
        );

        // ── MAIN CONTENT ──────────────────────────────────────────────────
        VBox mainContent = new VBox(16, kpiRow, row2, qaPanel);
        mainContent.setPadding(new Insets(20));
        mainContent.setStyle("-fx-background-color:" + CREAM_BG + ";");

        ScrollPane scroll = new ScrollPane(mainContent);
        scroll.setFitToWidth(true);
        scroll.setStyle("-fx-background-color:" + CREAM_BG + ";-fx-background:" + CREAM_BG + ";");

        BorderPane root = new BorderPane();
        root.setTop(navbar);
        root.setLeft(sidebar);
        root.setCenter(scroll);

        Scene scene = new Scene(root, 1100, 720);
        stage.setTitle("Moresave SACCO - Admin Dashboard");
        stage.setScene(scene);
        stage.setResizable(true);
        stage.show();
    }

    private void handleNav(String item, Stage stage) {
        if (item.contains("Dashboard"))  show(stage);
        else if (item.contains("Members"))    new MemberManagementScreen().show(stage);
        else if (item.contains("Loans"))      new LoanApprovalScreen().show(stage);
        else if (item.contains("Apply"))      new LoanApplication().show(stage);
        else if (item.contains("Savings"))    new SavingsScreen().show(stage);
        else if (item.contains("Dividends"))  new DividendScreen().show(stage);
        else if (item.contains("Penalties"))  new PenaltyScreen().show(stage);
        else if (item.contains("Reports"))    new ReportsScreen().show(stage);
        else if (item.contains("Logout"))     new LoginApp().start(stage);
    }

    private Button sidebarBtn(String text, boolean active) {
        Button btn = new Button(text);
        btn.setMaxWidth(Double.MAX_VALUE);
        btn.setAlignment(Pos.CENTER_LEFT);
        btn.setPadding(new Insets(11, 16, 11, 16));
        String base = active ? "-fx-background-color:rgba(0,0,0,0.25);" : "-fx-background-color:transparent;";
        btn.setStyle(base + "-fx-text-fill:white;-fx-font-size:13;-fx-cursor:hand;-fx-border-width:0;");
        btn.setOnMouseEntered(e -> btn.setStyle("-fx-background-color:rgba(0,0,0,0.2);-fx-text-fill:white;-fx-font-size:13;-fx-cursor:hand;"));
        btn.setOnMouseExited(e  -> btn.setStyle(base + "-fx-text-fill:white;-fx-font-size:13;-fx-cursor:hand;"));
        return btn;
    }

    private VBox kpiCard(String title, String value, String color) {
        Label t = new Label(title);
        t.setFont(Font.font("Arial", 12));
        t.setTextFill(Color.web("rgba(255,255,255,0.85)"));
        Label v = new Label(value);
        v.setFont(Font.font("Arial", FontWeight.BOLD, 20));
        v.setTextFill(Color.WHITE);
        v.setWrapText(true);
        VBox card = new VBox(6, t, v);
        card.setPadding(new Insets(18));
        card.setStyle("-fx-background-color:" + color + ";-fx-background-radius:8;");
        return card;
    }

    private VBox panel(String title, javafx.scene.Node content) {
        Label lbl = new Label(title);
        lbl.setFont(Font.font("Arial", FontWeight.BOLD, 14));
        lbl.setTextFill(Color.web("#4E3526"));
        VBox p = new VBox(10, lbl, content);
        p.setPadding(new Insets(16));
        p.setStyle("-fx-background-color:white;-fx-background-radius:8;-fx-effect:dropshadow(gaussian,rgba(0,0,0,0.08),6,0,0,2);");
        return p;
    }

    private TableColumn<String[], String> col(String title, int idx) {
        TableColumn<String[], String> c = new TableColumn<>(title);
        c.setCellValueFactory(d -> new javafx.beans.property.SimpleStringProperty(d.getValue()[idx]));
        return c;
    }

    private Button actionBtn(String text, String color) {
        Button btn = new Button(text);
        btn.setStyle("-fx-background-color:" + color + ";-fx-text-fill:white;-fx-font-weight:bold;-fx-background-radius:6;-fx-cursor:hand;-fx-padding:10 16 10 16;");
        btn.setOnMouseEntered(e -> btn.setStyle("-fx-background-color:derive(" + color + ",-15%);-fx-text-fill:white;-fx-font-weight:bold;-fx-background-radius:6;-fx-cursor:hand;-fx-padding:10 16 10 16;"));
        btn.setOnMouseExited(e  -> btn.setStyle("-fx-background-color:" + color + ";-fx-text-fill:white;-fx-font-weight:bold;-fx-background-radius:6;-fx-cursor:hand;-fx-padding:10 16 10 16;"));
        return btn;
    }
}
