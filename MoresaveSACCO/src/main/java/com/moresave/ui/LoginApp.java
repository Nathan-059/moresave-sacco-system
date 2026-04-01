package com.moresave.ui;

import com.moresave.util.DBConnection;
import com.moresave.util.PenaltyEngine;
import javafx.application.Application;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.stage.Stage;
import java.sql.*;

/**
 * Unified login screen.
 * Staff (admin/staff role) → AdminDashboard
 * Member (member role)     → MemberDashboard
 * Auto-detected from the users table role column.
 */
public class LoginApp extends Application {

    @Override
    public void start(Stage stage) {

        final String DARK_BROWN  = "#4E3526";
        final String MID_BROWN   = "#6F4E37";
        final String SOFT_BROWN  = "#8B6B4A";
        final String WARM_WHITE  = "#FDFBF7";
        final String LIGHT_CREAM = "#F6F1EA";
        final String BORDER      = "#C7B8A7";

        // ── HEADER ────────────────────────────────────────────────────────
        Label logo = new Label("MORESAVE SACCO");
        logo.setFont(Font.font("Arial", FontWeight.BOLD, 28));
        logo.setTextFill(Color.WHITE);

        Label tagline = new Label("Savings & Credit Cooperative — Mubende, Uganda");
        tagline.setFont(Font.font("Arial", FontPosture.ITALIC, 12));
        tagline.setTextFill(Color.web("#D4C5B5"));

        VBox header = new VBox(4, logo, tagline);
        header.setAlignment(Pos.CENTER);
        header.setPadding(new Insets(24, 20, 20, 20));
        header.setStyle("-fx-background-color:" + DARK_BROWN + ";");

        // ── FORM ──────────────────────────────────────────────────────────
        Label formTitle = new Label("Sign In to Your Account");
        formTitle.setFont(Font.font("Arial", FontWeight.BOLD, 18));
        formTitle.setTextFill(Color.web(DARK_BROWN));

        Label usernameLabel = new Label("Username / Member Number");
        usernameLabel.setTextFill(Color.web(DARK_BROWN));
        usernameLabel.setFont(Font.font("Arial", FontWeight.BOLD, 13));

        TextField usernameField = new TextField();
        usernameField.setPromptText("e.g. admin  or  MRS0001");
        usernameField.setPrefHeight(44);
        usernameField.setStyle(fieldStyle(BORDER));

        Label passwordLabel = new Label("Password");
        passwordLabel.setTextFill(Color.web(DARK_BROWN));
        passwordLabel.setFont(Font.font("Arial", FontWeight.BOLD, 13));

        PasswordField passwordField = new PasswordField();
        passwordField.setPromptText("Enter your password");
        passwordField.setPrefHeight(44);
        passwordField.setStyle(fieldStyle(BORDER));

        Label messageLabel = new Label("");
        messageLabel.setFont(Font.font("Arial", 13));
        messageLabel.setWrapText(true);
        messageLabel.setMaxWidth(340);

        Button loginBtn = new Button("SIGN IN  →");
        loginBtn.setPrefWidth(340);
        loginBtn.setPrefHeight(46);
        loginBtn.setFont(Font.font("Arial", FontWeight.BOLD, 14));
        loginBtn.setStyle(
            "-fx-background-color:" + MID_BROWN + ";" +
            "-fx-text-fill:white;" +
            "-fx-background-radius:6;" +
            "-fx-cursor:hand;"
        );
        loginBtn.setOnMouseEntered(e -> loginBtn.setStyle(
            "-fx-background-color:" + DARK_BROWN + ";" +
            "-fx-text-fill:white;-fx-background-radius:6;-fx-cursor:hand;"
        ));
        loginBtn.setOnMouseExited(e -> loginBtn.setStyle(
            "-fx-background-color:" + MID_BROWN + ";" +
            "-fx-text-fill:white;-fx-background-radius:6;-fx-cursor:hand;"
        ));

        // Register link for new members
        Hyperlink registerLink = new Hyperlink("New member? Register here");
        registerLink.setTextFill(Color.web(MID_BROWN));
        registerLink.setFont(Font.font("Arial", 13));
        registerLink.setOnAction(e -> new MemberSelfRegistration().show(stage));

        // ── LOGIN ACTION ──────────────────────────────────────────────────
        Runnable doLogin = () -> {
            String user = usernameField.getText().trim();
            String pass = passwordField.getText().trim();

            if (user.isEmpty() || pass.isEmpty()) {
                messageLabel.setTextFill(Color.RED);
                messageLabel.setText("❌ Please enter username and password.");
                return;
            }

            String result = login(user, pass, stage);
            if (result != null) {
                messageLabel.setTextFill(Color.RED);
                messageLabel.setText(result);
            }
        };

        loginBtn.setOnAction(e -> doLogin.run());
        passwordField.setOnAction(e -> doLogin.run());

        // ── LAYOUT ────────────────────────────────────────────────────────
        VBox form = new VBox(12,
            formTitle,
            usernameLabel, usernameField,
            passwordLabel, passwordField,
            messageLabel,
            loginBtn,
            registerLink
        );
        form.setAlignment(Pos.CENTER_LEFT);
        form.setPadding(new Insets(28, 32, 28, 32));
        form.setMaxWidth(400);
        form.setStyle(
            "-fx-background-color:" + WARM_WHITE + ";" +
            "-fx-background-radius:0 0 10 10;"
        );

        // Info strip
        Label infoStrip = new Label(
            "Staff login: use your admin username  |  Members: use your Member Number (e.g. MRS0001)"
        );
        infoStrip.setFont(Font.font("Arial", 11));
        infoStrip.setTextFill(Color.web(SOFT_BROWN));
        infoStrip.setWrapText(true);
        infoStrip.setPadding(new Insets(8, 32, 8, 32));
        infoStrip.setStyle("-fx-background-color:" + LIGHT_CREAM + ";");

        VBox root = new VBox(header, form, infoStrip);
        root.setAlignment(Pos.TOP_CENTER);
        root.setStyle("-fx-background-color:" + WARM_WHITE + ";");

        Scene scene = new Scene(root, 440, 520);
        stage.setTitle("Moresave SACCO - Login");
        stage.setScene(scene);
        stage.setResizable(false);
        stage.show();
    }

    /**
     * Unified login: looks up role and routes accordingly.
     * admin/staff → AdminDashboard
     * member      → MemberDashboard
     */
    private String login(String username, String password, Stage stage) {
        try (Connection conn = DBConnection.getConnection()) {
            String sql =
                "SELECT u.user_id, u.username, u.role, u.is_active, " +
                "m.member_number, m.full_name, m.membership_status " +
                "FROM users u " +
                "LEFT JOIN members m ON m.user_id = u.user_id " +
                "WHERE u.username = ? AND u.password_hash = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, username);
            stmt.setString(2, password);
            ResultSet rs = stmt.executeQuery();

            if (!rs.next()) {
                return "❌ Incorrect username or password.";
            }

            boolean isActive = rs.getBoolean("is_active");
            if (!isActive) {
                return "❌ This account has been deactivated. Contact the SACCO office.";
            }

            String role = rs.getString("role");
            String storedUsername = rs.getString("username");

            // Update last login
            PreparedStatement upd = conn.prepareStatement(
                "UPDATE users SET last_login = NOW() WHERE username = ?");
            upd.setString(1, storedUsername);
            upd.executeUpdate();

            if ("admin".equalsIgnoreCase(role) || "staff".equalsIgnoreCase(role)) {
                // Run penalty engine on admin login
                PenaltyEngine.runPenaltyCheck();
                new AdminDashboard().show(stage);
                return null;
            }

            if ("member".equalsIgnoreCase(role)) {
                String memberStatus = rs.getString("membership_status");
                if (!"active".equalsIgnoreCase(memberStatus)) {
                    return "❌ Your membership is " + memberStatus + ". Contact the SACCO office.";
                }
                new MemberDashboard(storedUsername).show(stage);
                return null;
            }

            return "❌ Unknown account role. Contact the SACCO office.";

        } catch (SQLException e) {
            return "❌ Database error: " + e.getMessage();
        }
    }

    private String fieldStyle(String border) {
        return "-fx-background-color:white;" +
               "-fx-text-fill:#2b2b2b;" +
               "-fx-background-radius:6;" +
               "-fx-border-color:" + border + ";" +
               "-fx-border-radius:6;" +
               "-fx-font-size:13;";
    }

    public static void main(String[] args) {
        launch(args);
    }
}
