package com.moresave.ui;

import com.moresave.util.AppConfig;
import com.moresave.util.EmailService;
import com.moresave.util.SmsService;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.stage.Stage;

public class SettingsScreen {

    public void show(Stage stage) {

        final String DARK  = "#4E3526";
        final String MID   = "#6F4E37";
        final String SOFT  = "#8B6B4A";
        final String WHITE = "#FDFBF7";
        final String CREAM = "#F6F1EA";
        final String BB    = "#C7B8A7";

        Label title = new Label("⚙ System Settings");
        title.setFont(Font.font("Arial", FontWeight.BOLD, 22));
        title.setTextFill(Color.web(DARK));

        Label subtitle = new Label("Configure email, SMS and mobile money notifications.");
        subtitle.setTextFill(Color.web(SOFT));

        TabPane tabs = new TabPane();
        tabs.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);
        tabs.getTabs().addAll(
            buildEmailTab(BB, DARK, SOFT, WHITE),
            buildSmsTab(BB, DARK, SOFT, WHITE),
            buildMobileMoneyTab(BB, DARK, SOFT, WHITE)
        );

        Button backBtn = new Button("← Back to Dashboard");
        backBtn.setStyle("-fx-background-color:transparent;-fx-text-fill:" + MID +
                         ";-fx-cursor:hand;-fx-font-size:13;");
        backBtn.setOnAction(e -> new AdminDashboard().show(stage));

        VBox root = new VBox(16, title, subtitle, tabs, backBtn);
        root.setPadding(new Insets(28));
        root.setStyle("-fx-background-color:" + WHITE + ";");

        Scene scene = new Scene(root, 700, 600);
        stage.setTitle("Moresave SACCO - Settings");
        stage.setScene(scene);
        stage.show();
    }

    private Tab buildEmailTab(String BB, String DARK, String SOFT, String WHITE) {
        Tab tab = new Tab("📧 Email (Gmail)");

        CheckBox enabledBox = new CheckBox("Enable Email Notifications");
        enabledBox.setSelected(AppConfig.getBool("email.enabled"));
        enabledBox.setFont(Font.font("Arial", FontWeight.BOLD, 13));

        TextField hostField = mkField(AppConfig.get("email.host"), BB);
        TextField portField = mkField(AppConfig.get("email.port"), BB);
        TextField addrField = mkField(AppConfig.get("email.address"), BB);
        PasswordField passField = new PasswordField();
        passField.setText(AppConfig.get("email.password"));
        passField.setPrefHeight(40); passField.setPrefWidth(300);
        passField.setStyle("-fx-background-color:white;-fx-background-radius:5;" +
                           "-fx-border-color:" + BB + ";-fx-border-radius:5;");

        Label helpLabel = new Label(
            "ℹ Gmail setup:\n" +
            "1. Go to myaccount.google.com → Security → 2-Step Verification → App Passwords\n" +
            "2. Create an App Password for 'Mail'\n" +
            "3. Paste the 16-character password above\n" +
            "4. Use your full Gmail address as the email"
        );
        helpLabel.setTextFill(Color.web(SOFT));
        helpLabel.setFont(Font.font("Arial", 11));
        helpLabel.setWrapText(true);

        Label msgLabel = new Label("");
        msgLabel.setFont(Font.font("Arial", 13));

        Button testBtn = new Button("📧 Send Test Email");
        testBtn.setStyle("-fx-background-color:#2980b9;-fx-text-fill:white;-fx-font-weight:bold;" +
                         "-fx-background-radius:5;-fx-cursor:hand;-fx-pref-height:38;");

        Button saveBtn = new Button("💾 SAVE EMAIL SETTINGS");
        saveBtn.setStyle("-fx-background-color:#27ae60;-fx-text-fill:white;-fx-font-weight:bold;" +
                         "-fx-background-radius:5;-fx-cursor:hand;-fx-pref-height:42;-fx-pref-width:220;");

        saveBtn.setOnAction(e -> {
            AppConfig.set("email.enabled",  String.valueOf(enabledBox.isSelected()));
            AppConfig.set("email.host",     hostField.getText().trim());
            AppConfig.set("email.port",     portField.getText().trim());
            AppConfig.set("email.address",  addrField.getText().trim());
            AppConfig.set("email.password", passField.getText().trim());
            if (AppConfig.save()) {
                AppConfig.reload();
                msgLabel.setTextFill(Color.web("#27ae60"));
                msgLabel.setText("✅ Email settings saved successfully.");
            } else {
                msgLabel.setTextFill(Color.RED);
                msgLabel.setText("❌ Failed to save settings.");
            }
        });

        testBtn.setOnAction(e -> {
            String addr = addrField.getText().trim();
            if (addr.isEmpty()) { msgLabel.setTextFill(Color.RED); msgLabel.setText("❌ Enter email address first."); return; }
            boolean ok = EmailService.send(addr, "Moresave SACCO - Test Email",
                "This is a test email from Moresave SACCO Management System.\n\nEmail notifications are working correctly.");
            msgLabel.setTextFill(ok ? Color.web("#27ae60") : Color.RED);
            msgLabel.setText(ok ? "✅ Test email sent to " + addr : "❌ Failed. Check credentials and try again.");
        });

        GridPane form = new GridPane(); form.setHgap(20); form.setVgap(12);
        form.add(lbl("SMTP Host:", DARK),     0, 0); form.add(hostField, 1, 0);
        form.add(lbl("SMTP Port:", DARK),     0, 1); form.add(portField, 1, 1);
        form.add(lbl("Gmail Address:", DARK), 0, 2); form.add(addrField, 1, 2);
        form.add(lbl("App Password:", DARK),  0, 3); form.add(passField, 1, 3);

        HBox btnRow = new HBox(10, saveBtn, testBtn);

        VBox content = new VBox(14, enabledBox, form, helpLabel, btnRow, msgLabel);
        content.setPadding(new Insets(20));
        content.setStyle("-fx-background-color:" + WHITE + ";");
        tab.setContent(new ScrollPane(content) {{ setFitToWidth(true); setStyle("-fx-background-color:" + WHITE + ";"); }});
        return tab;
    }

    private Tab buildSmsTab(String BB, String DARK, String SOFT, String WHITE) {
        Tab tab = new Tab("📱 SMS (Africa's Talking)");

        CheckBox enabledBox = new CheckBox("Enable SMS Notifications");
        enabledBox.setSelected(AppConfig.getBool("sms.enabled") ||
            AppConfig.get("sms.enabled").isEmpty()); // default ON since credentials are set
        enabledBox.setFont(Font.font("Arial", FontWeight.BOLD, 13));

        // Pre-fill with production credentials
        String defaultUser   = "wxmzjtxepa";
        String defaultApiKey = "atsk_d9f9c118d6f3b1b4d492aa92d51ae3f7f1a98d40f5f4c3c7e9e8de35cc81c1a4ad1aac6a";
        String defaultSender = "MORESAVE";

        TextField userField   = mkField(AppConfig.get("sms.username").isEmpty()   ? defaultUser   : AppConfig.get("sms.username"),   BB);
        TextField apiKeyField = mkField(AppConfig.get("sms.apikey").isEmpty()     ? defaultApiKey : AppConfig.get("sms.apikey"),     BB);
        TextField senderField = mkField(AppConfig.get("sms.senderid").isEmpty()   ? defaultSender : AppConfig.get("sms.senderid"),   BB);
        TextField testPhoneField = mkField("e.g. 0772123456", BB);

        Label helpLabel = new Label(
            "ℹ Africa's Talking setup (supports MTN & Airtel Uganda):\n" +
            "1. Register at africastalking.com\n" +
            "2. Create an app and get your API Key\n" +
            "3. Use 'sandbox' as username for testing\n" +
            "4. For production, use your real AT username\n" +
            "5. Sender ID: your registered shortcode or 'MORESAVE'"
        );
        helpLabel.setTextFill(Color.web(SOFT));
        helpLabel.setFont(Font.font("Arial", 11));
        helpLabel.setWrapText(true);

        Label msgLabel = new Label(""); msgLabel.setFont(Font.font("Arial", 13));

        Button testBtn = new Button("📱 Send Test SMS");
        testBtn.setStyle("-fx-background-color:#2980b9;-fx-text-fill:white;-fx-font-weight:bold;" +
                         "-fx-background-radius:5;-fx-cursor:hand;-fx-pref-height:38;");

        Button saveBtn = new Button("💾 SAVE SMS SETTINGS");
        saveBtn.setStyle("-fx-background-color:#27ae60;-fx-text-fill:white;-fx-font-weight:bold;" +
                         "-fx-background-radius:5;-fx-cursor:hand;-fx-pref-height:42;-fx-pref-width:220;");

        saveBtn.setOnAction(e -> {
            AppConfig.set("sms.enabled",  String.valueOf(enabledBox.isSelected()));
            AppConfig.set("sms.username", userField.getText().trim());
            AppConfig.set("sms.apikey",   apiKeyField.getText().trim());
            AppConfig.set("sms.senderid", senderField.getText().trim());
            if (AppConfig.save()) {
                AppConfig.reload();
                msgLabel.setTextFill(Color.web("#27ae60"));
                msgLabel.setText("✅ SMS settings saved.");
            } else {
                msgLabel.setTextFill(Color.RED); msgLabel.setText("❌ Failed to save.");
            }
        });

        testBtn.setOnAction(e -> {
            String phone = testPhoneField.getText().trim();
            if (phone.isEmpty()) { msgLabel.setTextFill(Color.RED); msgLabel.setText("❌ Enter test phone number."); return; }
            boolean ok = SmsService.send(phone, "Moresave SACCO test SMS. Notifications are working!");
            msgLabel.setTextFill(ok ? Color.web("#27ae60") : Color.RED);
            msgLabel.setText(ok ? "✅ Test SMS sent to " + phone : "❌ Failed. Check credentials.");
        });

        GridPane form = new GridPane(); form.setHgap(20); form.setVgap(12);
        form.add(lbl("AT Username:", DARK),  0, 0); form.add(userField,    1, 0);
        form.add(lbl("API Key:", DARK),      0, 1); form.add(apiKeyField,  1, 1);
        form.add(lbl("Sender ID:", DARK),    0, 2); form.add(senderField,  1, 2);
        form.add(lbl("Test Phone:", DARK),   0, 3); form.add(testPhoneField, 1, 3);

        HBox btnRow = new HBox(10, saveBtn, testBtn);
        VBox content = new VBox(14, enabledBox, form, helpLabel, btnRow, msgLabel);
        content.setPadding(new Insets(20));
        content.setStyle("-fx-background-color:" + WHITE + ";");
        tab.setContent(new ScrollPane(content) {{ setFitToWidth(true); setStyle("-fx-background-color:" + WHITE + ";"); }});
        return tab;
    }

    private Tab buildMobileMoneyTab(String BB, String DARK, String SOFT, String WHITE) {
        Tab tab = new Tab("💳 Mobile Money");

        CheckBox enabledBox = new CheckBox("Enable Mobile Money Payments (Africa's Talking Payments)");
        enabledBox.setSelected(AppConfig.getBool("mobilemoney.enabled"));
        enabledBox.setFont(Font.font("Arial", FontWeight.BOLD, 13));

        TextField userField   = mkField(AppConfig.get("mobilemoney.username"), BB);
        TextField apiKeyField = mkField(AppConfig.get("mobilemoney.apikey"), BB);

        Label helpLabel = new Label(
            "ℹ Mobile Money setup:\n" +
            "1. Register at africastalking.com\n" +
            "2. Enable the 'Payments' product in your AT dashboard\n" +
            "3. Create a Payment Product named 'MoresaveSACCO'\n" +
            "4. Enter your AT username and API key above\n" +
            "5. Members will receive a USSD push on their phone to approve payments\n\n" +
            "Supports: MTN Mobile Money Uganda, Airtel Money Uganda"
        );
        helpLabel.setTextFill(Color.web(SOFT));
        helpLabel.setFont(Font.font("Arial", 11));
        helpLabel.setWrapText(true);

        Label msgLabel = new Label(""); msgLabel.setFont(Font.font("Arial", 13));

        Button saveBtn = new Button("💾 SAVE MOBILE MONEY SETTINGS");
        saveBtn.setStyle("-fx-background-color:#27ae60;-fx-text-fill:white;-fx-font-weight:bold;" +
                         "-fx-background-radius:5;-fx-cursor:hand;-fx-pref-height:42;");

        saveBtn.setOnAction(e -> {
            AppConfig.set("mobilemoney.enabled",  String.valueOf(enabledBox.isSelected()));
            AppConfig.set("mobilemoney.username", userField.getText().trim());
            AppConfig.set("mobilemoney.apikey",   apiKeyField.getText().trim());
            if (AppConfig.save()) {
                AppConfig.reload();
                msgLabel.setTextFill(Color.web("#27ae60"));
                msgLabel.setText("✅ Mobile Money settings saved.");
            } else {
                msgLabel.setTextFill(Color.RED); msgLabel.setText("❌ Failed to save.");
            }
        });

        GridPane form = new GridPane(); form.setHgap(20); form.setVgap(12);
        form.add(lbl("AT Username:", DARK), 0, 0); form.add(userField,   1, 0);
        form.add(lbl("API Key:", DARK),     0, 1); form.add(apiKeyField, 1, 1);

        VBox content = new VBox(14, enabledBox, form, helpLabel, saveBtn, msgLabel);
        content.setPadding(new Insets(20));
        content.setStyle("-fx-background-color:" + WHITE + ";");
        tab.setContent(new ScrollPane(content) {{ setFitToWidth(true); setStyle("-fx-background-color:" + WHITE + ";"); }});
        return tab;
    }

    private TextField mkField(String val, String bb) {
        TextField f = new TextField(val);
        f.setPrefHeight(40); f.setPrefWidth(300);
        f.setStyle("-fx-background-color:white;-fx-text-fill:#2b2b2b;-fx-background-radius:5;" +
                   "-fx-border-color:" + bb + ";-fx-border-radius:5;");
        return f;
    }

    private Label lbl(String text, String color) {
        Label l = new Label(text);
        l.setTextFill(Color.web(color));
        l.setFont(Font.font("Arial", 13));
        l.setMinWidth(130);
        return l;
    }
}
