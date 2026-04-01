package com.moresave.ui;

import com.moresave.controller.LoanController;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.stage.Stage;

public class LoanApplication {

    public void show(Stage stage) {

        String coffeeBrown = "#6F4E37";
        String coffeeBrownDark = "#4E3526";
        String coffeeBrownSoft = "#8B6B4A";
        String warmWhite = "#FDFBF7";
        String lightCream = "#F6F1EA";
        String borderBrown = "#C7B8A7";

// ---- Title ----
        Label title = new Label("Loan Application");
        title.setFont(
                Font.font("Arial", FontWeight.BOLD, 20)
        );
        title.setTextFill(Color.web(coffeeBrownDark));

// ---- Form Fields ----
        TextField memberNumberField =
                createField("Member Number e.g MRS0001");
        TextField loanAmountField =
                createField("Loan Amount (UGX)");
        TextField repaymentPeriodField =
                createField("Repayment Period (months)");
        TextArea purposeField = new TextArea();
        purposeField.setPromptText(
                "Purpose of loan"
        );
        purposeField.setPrefHeight(80);
        purposeField.setPrefWidth(300);
        purposeField.setStyle(
                "-fx-background-color: white;" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;" +
                        "-fx-text-fill: #2b2b2b;"
        );

// ---- Interest Rate Label ----
        Label interestInfo = new Label(
                "ℹ Interest Rate: 2% per month (flat rate)"
        );
        interestInfo.setTextFill(Color.web(coffeeBrownSoft));
        interestInfo.setFont(Font.font("Arial", 12));

        Label eligibilityInfo = new Label(
                "⚠ ELIGIBILITY RULES:  Active member ≥ 2 months  |  Savings balance ≥ UGX 200,000\n" +
                "Applications that do not meet these criteria will be automatically rejected."
        );
        eligibilityInfo.setTextFill(Color.web("#c0392b"));
        eligibilityInfo.setFont(Font.font("Arial", FontWeight.BOLD, 12));
        eligibilityInfo.setWrapText(true);
        eligibilityInfo.setPadding(new Insets(8));
        eligibilityInfo.setStyle(
                "-fx-background-color: #fdf2f2;" +
                "-fx-background-radius: 5;" +
                "-fx-border-color: #e74c3c;" +
                "-fx-border-radius: 5;" +
                "-fx-border-width: 1;"
        );

// ---- Calculation Preview ----
        Label previewLabel = new Label(
                "Monthly Payment Preview:"
        );
        previewLabel.setTextFill(Color.web(coffeeBrownDark));
        previewLabel.setFont(
                Font.font("Arial", FontWeight.BOLD, 13)
        );

        Label monthlyPaymentLabel = new Label(
                "Fill in amount and period to see preview"
        );
        monthlyPaymentLabel.setTextFill(Color.web(coffeeBrownSoft));
        monthlyPaymentLabel.setFont(
                Font.font("Arial", 13)
        );

// ---- Auto Calculate Preview ----
        loanAmountField.textProperty()
                .addListener((obs, old, newVal) ->
                        updatePreview(
                                loanAmountField,
                                repaymentPeriodField,
                                monthlyPaymentLabel
                        )
                );
        repaymentPeriodField.textProperty()
                .addListener((obs, old, newVal) ->
                        updatePreview(
                                loanAmountField,
                                repaymentPeriodField,
                                monthlyPaymentLabel
                        )
                );

// ---- Message Label ----
        Label messageLabel = new Label("");
        messageLabel.setFont(Font.font("Arial", 13));
        messageLabel.setWrapText(true);

// ---- Buttons ----
        Button applyBtn = new Button("SUBMIT APPLICATION");
        applyBtn.setPrefWidth(300);
        applyBtn.setPrefHeight(45);
        applyBtn.setStyle(
                "-fx-background-color: " + coffeeBrown + ";" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-font-size: 14;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );

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

// ---- Apply Button Action ----
        applyBtn.setOnAction(e -> {
            if (memberNumberField.getText().isEmpty() ||
                    loanAmountField.getText().isEmpty() ||
                    repaymentPeriodField.getText().isEmpty() ||
                    purposeField.getText().isEmpty()) {

                messageLabel.setTextFill(Color.RED);
                messageLabel.setText(
                        "❌ Please fill in all fields."
                );
                return;
            }

            try {
                double amount = Double.parseDouble(
                        loanAmountField.getText().trim()
                );
                int period = Integer.parseInt(
                        repaymentPeriodField.getText().trim()
                );

                LoanController controller =
                        new LoanController();
                String result = controller.applyForLoan(
                        memberNumberField.getText().trim(),
                        amount,
                        period,
                        purposeField.getText().trim()
                );

                if (result.startsWith("✅")) {
                    messageLabel.setTextFill(Color.GREEN);
                    memberNumberField.clear();
                    loanAmountField.clear();
                    repaymentPeriodField.clear();
                    purposeField.clear();
                } else {
                    messageLabel.setTextFill(Color.RED);
                }
                messageLabel.setText(result);

            } catch (NumberFormatException ex) {
                messageLabel.setTextFill(Color.RED);
                messageLabel.setText(
                        "❌ Amount and period must be numbers."
                );
            }
        });

// ---- Form Layout ----
        GridPane form = new GridPane();
        form.setHgap(20);
        form.setVgap(15);
        form.setPadding(new Insets(20));

        form.add(createLabel("Member Number *"), 0, 0);
        form.add(memberNumberField, 1, 0);
        form.add(createLabel("Loan Amount (UGX) *"), 0, 1);
        form.add(loanAmountField, 1, 1);
        form.add(createLabel("Repayment Period *"), 0, 2);
        form.add(repaymentPeriodField, 1, 2);
        form.add(createLabel("Purpose *"), 0, 3);
        form.add(purposeField, 1, 3);
        form.add(interestInfo, 1, 4);
        form.add(eligibilityInfo, 1, 5);
        form.add(previewLabel, 0, 6);
        form.add(monthlyPaymentLabel, 1, 6);

        VBox formCard = new VBox(15,
                title, form, messageLabel,
                applyBtn, backBtn
        );
        formCard.setAlignment(Pos.CENTER_LEFT);
        formCard.setPadding(new Insets(30));
        formCard.setStyle(
                "-fx-background-color: " + warmWhite + ";" +
                        "-fx-background-radius: 10;"
        );
        formCard.setMaxWidth(650);

        ScrollPane scrollPane =
                new ScrollPane(formCard);
        scrollPane.setFitToWidth(true);
        scrollPane.setStyle(
                "-fx-background-color: " + warmWhite + ";"
        );

        VBox mainLayout = new VBox(scrollPane);
        mainLayout.setStyle(
                "-fx-background-color: " + warmWhite + ";"
        );
        mainLayout.setPadding(new Insets(30));
        mainLayout.setAlignment(Pos.CENTER);

        Scene scene = new Scene(mainLayout, 900, 600);
        stage.setTitle(
                "Moresave SACCO - Loan Application"
        );
        stage.setScene(scene);
        stage.show();
    }

    private void updatePreview(
            TextField amountField,
            TextField periodField,
            Label previewLabel) {

        try {
            double amount = Double.parseDouble(
                    amountField.getText().trim()
            );
            int period = Integer.parseInt(
                    periodField.getText().trim()
            );

            double interestRate = 0.02;
            double totalInterest =
                    amount * interestRate * period;
            double totalPayable =
                    amount + totalInterest;
            double monthlyPayment =
                    totalPayable / period;

            previewLabel.setText(String.format(
                    "Monthly: UGX %,.0f  |  " +
                            "Total Payable: UGX %,.0f",
                    monthlyPayment, totalPayable
            ));
            previewLabel.setTextFill(Color.web("#6F4E37"));

        } catch (NumberFormatException e) {
            previewLabel.setText(
                    "Fill in amount and period to see preview"
            );
            previewLabel.setTextFill(Color.web("#8B6B4A"));
        }
    }

    private TextField createField(String prompt) {
        TextField field = new TextField();
        field.setPromptText(prompt);
        field.setPrefHeight(40);
        field.setPrefWidth(300);
        field.setStyle(
                "-fx-background-color: white;" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: #C7B8A7;" +
                        "-fx-border-radius: 5;" +
                        "-fx-text-fill: #2b2b2b;"
        );
        return field;
    }

    private Label createLabel(String text) {
        Label label = new Label(text);
        label.setTextFill(Color.web("#4E3526"));
        label.setFont(Font.font("Arial", 13));
        return label;
    }
}