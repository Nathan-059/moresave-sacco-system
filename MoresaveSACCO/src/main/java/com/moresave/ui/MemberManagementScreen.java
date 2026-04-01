package com.moresave.ui;

import com.moresave.controller.MemberManagementController;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.stage.Stage;

public class MemberManagementScreen {

    private final String CB  = "#6F4E37";
    private final String CBD = "#4E3526";
    private final String CBS = "#8B6B4A";
    private final String WW  = "#FDFBF7";
    private final String LC  = "#F6F1EA";
    private final String BB  = "#C7B8A7";

    public void show(Stage stage) {
        MemberManagementController ctrl = new MemberManagementController();

        // ---- Title bar ----
        Label title = new Label("👥 Member Management");
        title.setFont(Font.font("Arial", FontWeight.BOLD, 22));
        title.setTextFill(Color.web(CBD));

        Button backBtn = mkBackBtn(stage);

        Region sp = new Region(); HBox.setHgrow(sp, Priority.ALWAYS);
        HBox titleBar = new HBox(10, title, sp, backBtn);
        titleBar.setAlignment(Pos.CENTER_LEFT);
        titleBar.setPadding(new Insets(15, 20, 10, 20));
        titleBar.setStyle("-fx-background-color:" + WW + ";");

        // ---- Stats row ----
        int[] counts = ctrl.getMemberCounts();
        HBox statsRow = new HBox(20,
            statCard("Total",     String.valueOf(counts[0]), "#2980b9"),
            statCard("Active",    String.valueOf(counts[1]), "#27ae60"),
            statCard("Inactive",  String.valueOf(counts[2]), "#e67e22"),
            statCard("Suspended", String.valueOf(counts[3]), "#c0392b")
        );
        statsRow.setPadding(new Insets(0, 20, 10, 20));

        // ---- Tabs ----
        TabPane tabs = new TabPane();
        tabs.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);
        tabs.getTabs().addAll(
            buildAllMembersTab(ctrl, stage),
            buildRegisterTab(stage),
            buildSearchTab(ctrl, stage)
        );

        VBox root = new VBox(0, titleBar, statsRow, tabs);
        root.setStyle("-fx-background-color:" + WW + ";");

        Scene scene = new Scene(root, 1050, 700);
        stage.setTitle("Moresave SACCO - Member Management");
        stage.setScene(scene);
        stage.setResizable(true);
        stage.show();
    }

    // ---- TAB 1: All Members ----
    private Tab buildAllMembersTab(MemberManagementController ctrl, Stage stage) {
        Tab tab = new Tab("📋 All Members");

        // Filter bar
        ComboBox<String> filterBox = new ComboBox<>();
        filterBox.getItems().addAll("All", "Active", "Inactive", "Suspended");
        filterBox.setValue("All");
        filterBox.setPrefHeight(36);

        Button refreshBtn = mkBtn("🔄 Refresh", "#2980b9");
        Button exportBtn  = mkBtn("📥 Export PDF", "#16a085");

        HBox filterBar = new HBox(10, new Label("Filter:"), filterBox, refreshBtn, exportBtn);
        filterBar.setAlignment(Pos.CENTER_LEFT);
        filterBar.setPadding(new Insets(10, 15, 10, 15));

        // Table
        TableView<String[]> table = buildMemberTable();
        table.setItems(ctrl.getAllMembers());
        VBox.setVgrow(table, Priority.ALWAYS);

        // Action buttons
        Label msgLabel = new Label("");
        msgLabel.setFont(Font.font("Arial", 13));
        msgLabel.setWrapText(true);

        Button activateBtn  = mkBtn("✅ Activate",  "#27ae60");
        Button suspendBtn   = mkBtn("⛔ Suspend",   "#e67e22");
        Button deactivateBtn= mkBtn("❌ Deactivate","#c0392b");
        Button viewBtn      = mkBtn("🔍 View Details","#2980b9");

        HBox actionRow = new HBox(10, activateBtn, suspendBtn, deactivateBtn, viewBtn, msgLabel);
        actionRow.setAlignment(Pos.CENTER_LEFT);
        actionRow.setPadding(new Insets(10, 15, 10, 15));

        // Filter action
        filterBox.setOnAction(e -> {
            String f = filterBox.getValue();
            if ("All".equals(f)) table.setItems(ctrl.getAllMembers());
            else table.setItems(ctrl.getMembersByStatus(f.toLowerCase()));
        });

        refreshBtn.setOnAction(e -> {
            String f = filterBox.getValue();
            if ("All".equals(f)) table.setItems(ctrl.getAllMembers());
            else table.setItems(ctrl.getMembersByStatus(f.toLowerCase()));
            msgLabel.setText("");
        });

        exportBtn.setOnAction(e -> {
            String result = com.moresave.util.PDFGenerator.generateMembersReport(
                new java.util.ArrayList<>(table.getItems()));
            msgLabel.setTextFill(result.startsWith("✅") ? Color.web("#27ae60") : Color.RED);
            msgLabel.setText(result);
        });

        activateBtn.setOnAction(e -> {
            String[] sel = table.getSelectionModel().getSelectedItem();
            if (sel == null) { msgLabel.setTextFill(Color.RED); msgLabel.setText("❌ Select a member first."); return; }
            String r = ctrl.activateMember(sel[0]);
            msgLabel.setTextFill(r.startsWith("✅") ? Color.web("#27ae60") : Color.RED);
            msgLabel.setText(r);
            table.setItems(ctrl.getAllMembers());
        });

        suspendBtn.setOnAction(e -> {
            String[] sel = table.getSelectionModel().getSelectedItem();
            if (sel == null) { msgLabel.setTextFill(Color.RED); msgLabel.setText("❌ Select a member first."); return; }
            Alert confirm = new Alert(Alert.AlertType.CONFIRMATION, "Suspend member " + sel[0] + "?", ButtonType.OK, ButtonType.CANCEL);
            confirm.setHeaderText("Confirm Suspension");
            confirm.showAndWait().ifPresent(btn -> {
                if (btn == ButtonType.OK) {
                    String r = ctrl.suspendMember(sel[0]);
                    msgLabel.setTextFill(r.startsWith("✅") ? Color.web("#e67e22") : Color.RED);
                    msgLabel.setText(r);
                    table.setItems(ctrl.getAllMembers());
                }
            });
        });

        deactivateBtn.setOnAction(e -> {
            String[] sel = table.getSelectionModel().getSelectedItem();
            if (sel == null) { msgLabel.setTextFill(Color.RED); msgLabel.setText("❌ Select a member first."); return; }
            Alert confirm = new Alert(Alert.AlertType.CONFIRMATION, "Deactivate member " + sel[0] + "?", ButtonType.OK, ButtonType.CANCEL);
            confirm.setHeaderText("Confirm Deactivation");
            confirm.showAndWait().ifPresent(btn -> {
                if (btn == ButtonType.OK) {
                    String r = ctrl.deactivateMember(sel[0]);
                    msgLabel.setTextFill(r.startsWith("✅") ? Color.web("#c0392b") : Color.RED);
                    msgLabel.setText(r);
                    table.setItems(ctrl.getAllMembers());
                }
            });
        });

        viewBtn.setOnAction(e -> {
            String[] sel = table.getSelectionModel().getSelectedItem();
            if (sel == null) { msgLabel.setTextFill(Color.RED); msgLabel.setText("❌ Select a member first."); return; }
            showMemberDetailsDialog(sel[0], new MemberManagementController());
        });

        // Double-click to view details
        table.setOnMouseClicked(e -> {
            if (e.getClickCount() == 2) {
                String[] sel = table.getSelectionModel().getSelectedItem();
                if (sel != null) showMemberDetailsDialog(sel[0], new MemberManagementController());
            }
        });

        VBox content = new VBox(0, filterBar, table, actionRow);
        VBox.setVgrow(table, Priority.ALWAYS);
        content.setStyle("-fx-background-color:" + WW + ";");
        tab.setContent(content);
        return tab;
    }

    // ---- TAB 2: Register New Member ----
    private Tab buildRegisterTab(Stage stage) {
        Tab tab = new Tab("➕ Register Member");

        Label subtitle = new Label("Fill in the form below to register a new SACCO member.");
        subtitle.setTextFill(Color.web(CBS));
        subtitle.setFont(Font.font("Arial", 13));
        subtitle.setPadding(new Insets(10, 15, 5, 15));

        TextField fullNameField    = mkField("Full Name *");
        TextField phoneField       = mkField("Phone Number *");
        TextField emailField       = mkField("Email (optional)");
        TextField nationalIdField  = mkField("National ID *");
        TextField addressField     = mkField("Address *");
        TextField occupationField  = mkField("Occupation");

        DatePicker dobPicker = new DatePicker();
        dobPicker.setPromptText("Date of Birth *");
        dobPicker.setPrefHeight(40); dobPicker.setPrefWidth(300);
        dobPicker.setStyle("-fx-background-color:white;-fx-border-color:" + BB + ";-fx-border-radius:5;-fx-background-radius:5;");

        ComboBox<String> genderBox = new ComboBox<>();
        genderBox.getItems().addAll("Male", "Female", "Other");
        genderBox.setPromptText("Select Gender *");
        genderBox.setPrefHeight(40); genderBox.setPrefWidth(300);
        genderBox.setStyle("-fx-background-color:white;-fx-border-color:" + BB + ";-fx-border-radius:5;-fx-background-radius:5;");

        Label msgLabel = new Label("");
        msgLabel.setFont(Font.font("Arial", 13));
        msgLabel.setWrapText(true);

        Button registerBtn = mkBtn("✅ REGISTER MEMBER", CB);
        registerBtn.setPrefWidth(220); registerBtn.setPrefHeight(44);

        Button clearBtn = mkBtn("🗑 Clear Form", "#95a5a6");

        registerBtn.setOnAction(e -> {
            if (fullNameField.getText().trim().isEmpty() || phoneField.getText().trim().isEmpty()
                || nationalIdField.getText().trim().isEmpty() || addressField.getText().trim().isEmpty()
                || dobPicker.getValue() == null || genderBox.getValue() == null) {
                msgLabel.setTextFill(Color.RED);
                msgLabel.setText("❌ Please fill in all required fields (marked *).");
                return;
            }
            com.moresave.controller.MemberController ctrl = new com.moresave.controller.MemberController();
            String result = ctrl.registerMember(
                fullNameField.getText().trim(), phoneField.getText().trim(),
                emailField.getText().trim(), nationalIdField.getText().trim(),
                addressField.getText().trim(), occupationField.getText().trim(),
                dobPicker.getValue().toString(), genderBox.getValue()
            );
            if (result.startsWith("✅")) {
                msgLabel.setTextFill(Color.web("#27ae60"));
                fullNameField.clear(); phoneField.clear(); emailField.clear();
                nationalIdField.clear(); addressField.clear(); occupationField.clear();
                dobPicker.setValue(null); genderBox.setValue(null);
            } else {
                msgLabel.setTextFill(Color.RED);
            }
            msgLabel.setText(result);
        });

        clearBtn.setOnAction(e -> {
            fullNameField.clear(); phoneField.clear(); emailField.clear();
            nationalIdField.clear(); addressField.clear(); occupationField.clear();
            dobPicker.setValue(null); genderBox.setValue(null); msgLabel.setText("");
        });

        GridPane form = new GridPane();
        form.setHgap(20); form.setVgap(14);
        form.setPadding(new Insets(15, 20, 15, 20));
        form.add(mkLabel("Full Name *"),     0, 0); form.add(fullNameField,   1, 0);
        form.add(mkLabel("Phone Number *"),  0, 1); form.add(phoneField,      1, 1);
        form.add(mkLabel("Email"),           0, 2); form.add(emailField,      1, 2);
        form.add(mkLabel("National ID *"),   0, 3); form.add(nationalIdField, 1, 3);
        form.add(mkLabel("Date of Birth *"), 0, 4); form.add(dobPicker,       1, 4);
        form.add(mkLabel("Gender *"),        0, 5); form.add(genderBox,       1, 5);
        form.add(mkLabel("Address *"),       0, 6); form.add(addressField,    1, 6);
        form.add(mkLabel("Occupation"),      0, 7); form.add(occupationField, 1, 7);

        HBox btnRow = new HBox(10, registerBtn, clearBtn);
        btnRow.setPadding(new Insets(5, 20, 10, 20));

        ScrollPane scroll = new ScrollPane(new VBox(10, subtitle, form, btnRow, msgLabel));
        scroll.setFitToWidth(true);
        scroll.setStyle("-fx-background-color:" + WW + ";");
        tab.setContent(scroll);
        return tab;
    }

    // ---- TAB 3: Search ----
    private Tab buildSearchTab(MemberManagementController ctrl, Stage stage) {
        Tab tab = new Tab("🔍 Search Member");

        TextField searchField = mkField("Search by name, member number, phone or national ID...");
        searchField.setPrefWidth(400);
        Button searchBtn = mkBtn("🔍 Search", CB);
        Button clearBtn  = mkBtn("✖ Clear", "#95a5a6");

        HBox searchBar = new HBox(10, searchField, searchBtn, clearBtn);
        searchBar.setAlignment(Pos.CENTER_LEFT);
        searchBar.setPadding(new Insets(15, 15, 10, 15));

        TableView<String[]> table = buildMemberTable();
        VBox.setVgrow(table, Priority.ALWAYS);

        Label msgLabel = new Label("Enter a search term above.");
        msgLabel.setTextFill(Color.web(CBS));
        msgLabel.setPadding(new Insets(5, 15, 5, 15));

        Button viewBtn = mkBtn("🔍 View Details", "#2980b9");
        viewBtn.setOnAction(e -> {
            String[] sel = table.getSelectionModel().getSelectedItem();
            if (sel != null) showMemberDetailsDialog(sel[0], ctrl);
        });
        table.setOnMouseClicked(e -> {
            if (e.getClickCount() == 2) {
                String[] sel = table.getSelectionModel().getSelectedItem();
                if (sel != null) showMemberDetailsDialog(sel[0], ctrl);
            }
        });

        HBox actionRow = new HBox(10, viewBtn);
        actionRow.setPadding(new Insets(8, 15, 8, 15));

        searchBtn.setOnAction(e -> {
            String q = searchField.getText().trim();
            if (q.isEmpty()) { msgLabel.setText("❌ Enter a search term."); return; }
            table.setItems(ctrl.searchMembers(q));
            msgLabel.setText("Results for: \"" + q + "\"  (" + table.getItems().size() + " found)");
        });
        searchField.setOnAction(e -> searchBtn.fire());
        clearBtn.setOnAction(e -> { searchField.clear(); table.getItems().clear(); msgLabel.setText("Enter a search term above."); });

        VBox content = new VBox(0, searchBar, msgLabel, table, actionRow);
        VBox.setVgrow(table, Priority.ALWAYS);
        content.setStyle("-fx-background-color:" + WW + ";");
        tab.setContent(content);
        return tab;
    }

    // ---- Member Details Dialog ----
    private void showMemberDetailsDialog(String memberNumber, MemberManagementController ctrl) {
        String[] d = ctrl.getMemberDetails(memberNumber);
        if (d == null) return;

        Stage dialog = new Stage();
        dialog.setTitle("Member Details - " + d[0]);

        GridPane grid = new GridPane();
        grid.setHgap(20); grid.setVgap(10);
        grid.setPadding(new Insets(20));

        String[][] rows = {
            {"Member Number", d[0]},  {"Full Name", d[1]},
            {"Phone",         d[2]},  {"Email",     d[3]},
            {"Gender",        d[4]},  {"National ID",d[5]},
            {"Address",       d[6]},  {"Occupation", d[7]},
            {"Date of Birth", d[8]},  {"Joining Date",d[9]},
            {"Status",        d[10]}, {"Savings Balance (UGX)", d[11]},
            {"Account Number",d[12]}, {"Total Loans", d[13]},
            {"Active Loans",  d[14]}
        };

        for (int i = 0; i < rows.length; i++) {
            Label lbl = new Label(rows[i][0] + ":");
            lbl.setFont(Font.font("Arial", FontWeight.BOLD, 13));
            lbl.setTextFill(Color.web(CBD));
            Label val = new Label(rows[i][1]);
            val.setFont(Font.font("Arial", 13));
            val.setTextFill(Color.web(CB));
            grid.add(lbl, 0, i);
            grid.add(val, 1, i);
        }

        Button closeBtn = mkBtn("Close", CB);
        closeBtn.setOnAction(e -> dialog.close());

        VBox root = new VBox(15, new Label("Member Profile") {{
            setFont(Font.font("Arial", FontWeight.BOLD, 18));
            setTextFill(Color.web(CBD));
        }}, grid, closeBtn);
        root.setPadding(new Insets(20));
        root.setStyle("-fx-background-color:" + WW + ";");

        dialog.setScene(new Scene(root, 480, 560));
        dialog.show();
    }

    // ---- Shared table builder ----
    private TableView<String[]> buildMemberTable() {
        TableView<String[]> t = new TableView<>();
        t.setPrefHeight(400);
        t.getColumns().addAll(
            col("Member No",   0, 100), col("Full Name",    1, 170),
            col("Phone",       2, 110), col("Email",        3, 160),
            col("Gender",      4,  70), col("National ID",  5, 130),
            col("Address",     6, 130), col("Occupation",   7, 120),
            col("DOB",         8,  95), col("Joined",       9,  95),
            col("Status",     10,  90), col("Balance (UGX)",11, 120)
        );
        return t;
    }

    private TableColumn<String[], String> col(String title, int idx, int w) {
        TableColumn<String[], String> c = new TableColumn<>(title);
        c.setCellValueFactory(d -> new javafx.beans.property.SimpleStringProperty(d.getValue()[idx]));
        c.setPrefWidth(w);
        return c;
    }

    // ---- Helpers ----
    private Button mkBackBtn(Stage stage) {
        Button b = new Button("← Back to Dashboard");
        b.setStyle("-fx-background-color:transparent;-fx-text-fill:" + CB + ";-fx-cursor:hand;-fx-font-size:13;");
        b.setOnAction(e -> new AdminDashboard().show(stage));
        return b;
    }

    private Button mkBtn(String text, String color) {
        Button b = new Button(text);
        b.setStyle("-fx-background-color:" + color + ";-fx-text-fill:white;-fx-font-weight:bold;" +
                   "-fx-background-radius:5;-fx-cursor:hand;-fx-pref-height:36;");
        return b;
    }

    private TextField mkField(String prompt) {
        TextField f = new TextField();
        f.setPromptText(prompt);
        f.setPrefHeight(40); f.setPrefWidth(300);
        f.setStyle("-fx-background-color:white;-fx-text-fill:#2b2b2b;-fx-background-radius:5;" +
                   "-fx-border-color:" + BB + ";-fx-border-radius:5;");
        return f;
    }

    private Label mkLabel(String text) {
        Label l = new Label(text);
        l.setTextFill(Color.web(CBD));
        l.setFont(Font.font("Arial", 13));
        l.setMinWidth(130);
        return l;
    }

    private VBox statCard(String label, String value, String color) {
        Label v = new Label(value);
        v.setFont(Font.font("Arial", FontWeight.BOLD, 22));
        v.setTextFill(Color.WHITE);
        Label l = new Label(label);
        l.setFont(Font.font("Arial", 12));
        l.setTextFill(Color.WHITE);
        VBox card = new VBox(4, v, l);
        card.setAlignment(Pos.CENTER);
        card.setPadding(new Insets(12, 25, 12, 25));
        card.setStyle("-fx-background-color:" + color + ";-fx-background-radius:8;");
        return card;
    }
}
