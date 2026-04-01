package com.moresave.ui;

import com.moresave.controller.MemberPortalController;
import com.moresave.util.DBConnection;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.stage.Stage;
import java.sql.*;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public class MemberLoanApplicationScreen {

    private final String username;

    public MemberLoanApplicationScreen(String username) {
        this.username = username;
    }

    public void show(Stage stage) {

        final String DARK  = "#1e2a3a";
        final String BG    = "#152232";
        final String GREEN = "#27ae60";
        final String RED   = "#e74c3c";
        final String GOLD  = "#f39c12";

        MemberPortalController controller = new MemberPortalController();

        // ── Load member eligibility status live ──────────────────────────
        double[] savingsInfo = getMemberSavingsInfo(username);
        double currentBalance  = savingsInfo[0];
        long   monthsSaving    = (long) savingsInfo[1];
        boolean balanceOk      = currentBalance >= 200000;
        boolean monthsOk       = monthsSaving >= 2;
        boolean eligible        = balanceOk && monthsOk;

        // ── ELIGIBILITY BANNER ───────────────────────────────────────────
        Label eligTitle = new Label("📋 LOAN ELIGIBILITY CHECK");
        eligTitle.setFont(Font.font("Arial", FontWeight.BOLD, 15));
        eligTitle.setTextFill(Color.WHITE);

        // Balance row
        Label balIcon  = new Label(balanceOk ? "✅" : "❌");
        balIcon.setFont(Font.font("Arial", FontWeight.BOLD, 16));
        Label balText  = new Label("Minimum savings balance: UGX 200,000");
        balText.setTextFill(Color.WHITE);
        balText.setFont(Font.font("Arial", 13));
        Label balValue = new Label("Your balance: UGX " + String.format("%,.0f", currentBalance));
        balValue.setFont(Font.font("Arial", FontWeight.BOLD, 13));
        balValue.setTextFill(balanceOk ? Color.web("#2ecc71") : Color.web("#e74c3c"));
        HBox balRow = new HBox(10, balIcon, balText, balValue);
        balRow.setAlignment(Pos.CENTER_LEFT);

        // Months row
        Label monIcon  = new Label(monthsOk ? "✅" : "❌");
        monIcon.setFont(Font.font("Arial", FontWeight.BOLD, 16));
        Label monText  = new Label("Active member for at least 2 months:");
        monText.setTextFill(Color.WHITE);
        monText.setFont(Font.font("Arial", 13));
        Label monValue = new Label("You have been saving for: " + monthsSaving + " month(s)");
        monValue.setFont(Font.font("Arial", FontWeight.BOLD, 13));
        monValue.setTextFill(monthsOk ? Color.web("#2ecc71") : Color.web("#e74c3c"));
        HBox monRow = new HBox(10, monIcon, monText, monValue);
        monRow.setAlignment(Pos.CENTER_LEFT);

        // Overall status
        Label statusLabel = new Label(eligible
            ? "✅  YOU ARE ELIGIBLE TO APPLY FOR A LOAN"
            : "🚫  YOU DO NOT MEET THE LOAN ELIGIBILITY REQUIREMENTS");
        statusLabel.setFont(Font.font("Arial", FontWeight.BOLD, 14));
        statusLabel.setTextFill(eligible ? Color.web("#2ecc71") : Color.web("#e74c3c"));
        statusLabel.setWrapText(true);

        VBox eligBox = new VBox(10, eligTitle, balRow, monRow, new Separator(), statusLabel);
        eligBox.setPadding(new Insets(16));
        eligBox.setStyle(
            "-fx-background-color:" + (eligible ? "#1a3a2a" : "#3a1a1a") + ";" +
            "-fx-background-radius:8;" +
            "-fx-border-color:" + (eligible ? "#27ae60" : "#e74c3c") + ";" +
            "-fx-border-radius:8;" +
            "-fx-border-width:2;"
        );

        // ── FORM ─────────────────────────────────────────────────────────
        Label formTitle = new Label("📝 Loan Application Form");
        formTitle.setFont(Font.font("Arial", FontWeight.BOLD, 18));
        formTitle.setTextFill(Color.WHITE);

        TextField amountField = mkField("e.g. 500000");
        TextField periodField = mkField("e.g. 12");
        TextArea  purposeField = new TextArea();
        purposeField.setPromptText("Describe the purpose of this loan");
        purposeField.setPrefHeight(80);
        purposeField.setPrefWidth(300);
        purposeField.setStyle("-fx-background-radius:5;");

        // Interest info
        Label interestInfo = new Label("ℹ  Interest Rate: 2% per month (flat rate)");
        interestInfo.setTextFill(Color.web("#3498db"));
        interestInfo.setFont(Font.font("Arial", FontWeight.BOLD, 12));

        // Live preview
        Label previewLabel = new Label("Fill in amount and period above to see payment preview");
        previewLabel.setTextFill(Color.LIGHTGRAY);
        previewLabel.setFont(Font.font("Arial", 12));
        previewLabel.setWrapText(true);

        amountField.textProperty().addListener((o, old, n) -> updatePreview(amountField, periodField, previewLabel));
        periodField.textProperty().addListener((o, old, n) -> updatePreview(amountField, periodField, previewLabel));

        GridPane form = new GridPane();
        form.setHgap(20); form.setVgap(14);
        form.add(mkLabel("Loan Amount (UGX) *"),    0, 0); form.add(amountField,  1, 0);
        form.add(mkLabel("Repayment Period (months) *"), 0, 1); form.add(periodField, 1, 1);
        form.add(mkLabel("Purpose *"),              0, 2); form.add(purposeField, 1, 2);
        form.add(interestInfo,                      1, 3);
        form.add(mkLabel("Payment Preview:"),       0, 4); form.add(previewLabel, 1, 4);

        // ── MESSAGE ───────────────────────────────────────────────────────
        Label messageLabel = new Label("");
        messageLabel.setFont(Font.font("Arial", FontWeight.BOLD, 13));
        messageLabel.setWrapText(true);
        messageLabel.setMaxWidth(540);
        messageLabel.setPadding(new Insets(10));

        // ── SUBMIT BUTTON ─────────────────────────────────────────────────
        Button applyBtn = new Button("📤  SUBMIT LOAN APPLICATION");
        applyBtn.setPrefWidth(300); applyBtn.setPrefHeight(48);
        applyBtn.setFont(Font.font("Arial", FontWeight.BOLD, 14));
        applyBtn.setStyle(
            "-fx-background-color:" + (eligible ? GREEN : "#555") + ";" +
            "-fx-text-fill:white;" +
            "-fx-background-radius:6;" +
            "-fx-cursor:" + (eligible ? "hand" : "default") + ";"
        );
        applyBtn.setDisable(!eligible);

        applyBtn.setOnAction(e -> {
            if (amountField.getText().isEmpty() || periodField.getText().isEmpty() || purposeField.getText().isEmpty()) {
                messageLabel.setStyle("-fx-background-color:#3a1a1a;-fx-background-radius:6;");
                messageLabel.setTextFill(Color.web("#e74c3c"));
                messageLabel.setText("❌  Please fill in all fields.");
                return;
            }
            try {
                double amount = Double.parseDouble(amountField.getText().trim());
                int period    = Integer.parseInt(periodField.getText().trim());
                if (amount <= 0 || period <= 0) {
                    messageLabel.setTextFill(Color.web("#e74c3c"));
                    messageLabel.setText("❌  Amount and period must be positive numbers.");
                    return;
                }
                String result = controller.applyForLoan(username, amount, period, purposeField.getText().trim());
                if (result.startsWith("✅")) {
                    messageLabel.setStyle("-fx-background-color:#1a3a2a;-fx-background-radius:6;");
                    messageLabel.setTextFill(Color.web("#2ecc71"));
                    amountField.clear(); periodField.clear(); purposeField.clear();
                } else {
                    messageLabel.setStyle("-fx-background-color:#3a1a1a;-fx-background-radius:6;");
                    messageLabel.setTextFill(Color.web("#e74c3c"));
                }
                messageLabel.setText(result);
            } catch (NumberFormatException ex) {
                messageLabel.setTextFill(Color.web("#e74c3c"));
                messageLabel.setText("❌  Amount and period must be numbers.");
            }
        });

        Button backBtn = new Button("← Back to Dashboard");
        backBtn.setStyle("-fx-background-color:transparent;-fx-text-fill:#3498db;-fx-cursor:hand;-fx-font-size:13;");
        backBtn.setOnAction(e -> new MemberDashboard(username).show(stage));

        // ── LAYOUT ────────────────────────────────────────────────────────
        VBox mainCard = new VBox(20,
            formTitle,
            eligBox,
            new Separator(),
            form,
            messageLabel,
            applyBtn,
            backBtn
        );
        mainCard.setPadding(new Insets(30));
        mainCard.setStyle("-fx-background-color:" + DARK + ";-fx-background-radius:10;");
        mainCard.setMaxWidth(640);

        ScrollPane scroll = new ScrollPane(mainCard);
        scroll.setFitToWidth(true);
        scroll.setStyle("-fx-background-color:" + BG + ";-fx-background:" + BG + ";");

        VBox root = new VBox(scroll);
        root.setPadding(new Insets(30));
        root.setAlignment(Pos.CENTER);
        root.setStyle("-fx-background-color:" + BG + ";");

        Scene scene = new Scene(root, 900, 680);
        stage.setTitle("Moresave SACCO - Apply for Loan");
        stage.setScene(scene);
        stage.show();
    }

    // ── Fetch member's balance and months saving from DB ─────────────────
    private double[] getMemberSavingsInfo(String username) {
        try (Connection conn = DBConnection.getConnection()) {
            String sql =
                "SELECT a.current_balance, a.opening_date " +
                "FROM accounts a " +
                "JOIN members m ON a.member_id = m.member_id " +
                "JOIN users u ON m.user_id = u.user_id " +
                "WHERE u.username = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, username);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                double balance = rs.getDouble("current_balance");
                LocalDate openDate = LocalDate.parse(rs.getString("opening_date"));
                long months = ChronoUnit.MONTHS.between(openDate, LocalDate.now());
                return new double[]{balance, months};
            }
        } catch (SQLException e) {
            System.out.println("Eligibility check error: " + e.getMessage());
        }
        return new double[]{0, 0};
    }

    private void updatePreview(TextField amountField, TextField periodField, Label previewLabel) {
        try {
            double amount = Double.parseDouble(amountField.getText().trim());
            int period    = Integer.parseInt(periodField.getText().trim());
            double total   = amount + (amount * 0.02 * period);
            double monthly = total / period;
            previewLabel.setText(String.format(
                "Monthly Payment: UGX %,.0f   |   Total Payable: UGX %,.0f   |   Interest: UGX %,.0f",
                monthly, total, total - amount
            ));
            previewLabel.setTextFill(Color.web("#2ecc71"));
        } catch (NumberFormatException e) {
            previewLabel.setText("Fill in amount and period above to see payment preview");
            previewLabel.setTextFill(Color.LIGHTGRAY);
        }
    }

    private TextField mkField(String prompt) {
        TextField f = new TextField();
        f.setPromptText(prompt);
        f.setPrefHeight(40); f.setPrefWidth(300);
        f.setStyle("-fx-background-radius:5;");
        return f;
    }

    private Label mkLabel(String text) {
        Label l = new Label(text);
        l.setTextFill(Color.WHITE);
        l.setFont(Font.font("Arial", 13));
        l.setMinWidth(180);
        return l;
    }
}
