package com.moresave.ui;

import com.moresave.controller.LoginController;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.stage.Stage;

public class MemberLoginApp {

    public void show(Stage stage) {

        String coffeeBrown = "#6F4E37";
        String coffeeBrownDark = "#4E3526";
        String coffeeBrownSoft = "#8B6B4A";
        String warmWhite = "#FDFBF7";
        String lightCream = "#F6F1EA";
        String borderBrown = "#C7B8A7";

        Label title = new Label("Member Login");
        title.setFont(Font.font("Arial", FontWeight.BOLD, 24));
        title.setTextFill(Color.web(coffeeBrownDark));

        Label subtitle = new Label("Sign in to your member portal");
        subtitle.setFont(Font.font("Arial", 13));
        subtitle.setTextFill(Color.web(coffeeBrownSoft));

        Label nameLabel = new Label("Full Name");
        nameLabel.setTextFill(Color.web(coffeeBrownDark));

        TextField fullNameField = new TextField();
        fullNameField.setPromptText("Enter your full name");
        fullNameField.setPrefHeight(42);
        fullNameField.setStyle(
                "-fx-background-color: white;" +
                        "-fx-text-fill: #2b2b2b;" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;"
        );

        Label memberNumLabel = new Label("Member Number");
        memberNumLabel.setTextFill(Color.web(coffeeBrownDark));

        TextField memberNumberField = new TextField();
        memberNumberField.setPromptText("e.g MRS0001");
        memberNumberField.setPrefHeight(42);
        memberNumberField.setStyle(
                "-fx-background-color: white;" +
                        "-fx-text-fill: #2b2b2b;" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;"
        );

        Label passwordLabel = new Label("Password");
        passwordLabel.setTextFill(Color.web(coffeeBrownDark));

        PasswordField passwordField = new PasswordField();
        passwordField.setPromptText("Enter your password");
        passwordField.setPrefHeight(42);
        passwordField.setStyle(
                "-fx-background-color: white;" +
                        "-fx-text-fill: #2b2b2b;" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;"
        );

        Label messageLabel = new Label("");
        messageLabel.setWrapText(true);
        messageLabel.setFont(Font.font("Arial", 12));

        Button loginBtn = new Button("SIGN IN");
        loginBtn.setPrefWidth(220);
        loginBtn.setPrefHeight(44);
        loginBtn.setStyle(
                "-fx-background-color: " + coffeeBrown + ";" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-background-radius: 6;" +
                        "-fx-cursor: hand;"
        );

        Button registerBtn = new Button("No account? Register here");
        registerBtn.setStyle(
                "-fx-background-color: transparent;" +
                        "-fx-text-fill: " + coffeeBrown + ";" +
                        "-fx-cursor: hand;" +
                        "-fx-font-size: 13;" +
                        "-fx-underline: true;"
        );
        registerBtn.setOnAction(e -> new MemberSelfRegistration().show(stage));

        Button backBtn = new Button("← Back");
        backBtn.setStyle(
                "-fx-background-color: transparent;" +
                        "-fx-text-fill: " + coffeeBrown + ";" +
                        "-fx-cursor: hand;"
        );
        backBtn.setOnAction(e -> new LoginApp().start(stage));

        LoginController controller = new LoginController();

        loginBtn.setOnAction(e -> {
            String fullName = fullNameField.getText().trim();
            String memberNumber = memberNumberField.getText().trim();
            String password = passwordField.getText().trim();

            if (fullName.isEmpty() || memberNumber.isEmpty() || password.isEmpty()) {
                messageLabel.setTextFill(Color.RED);
                messageLabel.setText("❌ Please fill in all fields.");
                return;
            }

            String result = controller.memberLogin(
                    fullName, memberNumber, password, stage
            );
            if (result != null) {
                messageLabel.setTextFill(Color.RED);
                messageLabel.setText(result);
            }
        });

        VBox card = new VBox(14,
                title, subtitle,
                nameLabel, fullNameField,
                memberNumLabel, memberNumberField,
                passwordLabel, passwordField,
                messageLabel, loginBtn, registerBtn, backBtn
        );
        card.setAlignment(Pos.CENTER_LEFT);
        card.setPadding(new Insets(30));
        card.setMaxWidth(360);
        card.setStyle(
                "-fx-background-color: " + warmWhite + ";" +
                        "-fx-background-radius: 10;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 10;"
        );

        VBox root = new VBox(card);
        root.setAlignment(Pos.CENTER);
        root.setPadding(new Insets(30));
        root.setStyle("-fx-background-color: " + warmWhite + ";");

        Scene scene = new Scene(root, 520, 480);
        stage.setTitle("Moresave SACCO - Member Login");
        stage.setScene(scene);
        stage.setResizable(false);
        stage.show();
    }
}
