package com.moresave.ui;

import com.moresave.controller.MemberController;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import javafx.scene.text.FontWeight;
import javafx.stage.Stage;

public class MemberSelfRegistration {

    private boolean fromAdmin = false;

    public MemberSelfRegistration() {}

    public MemberSelfRegistration(boolean fromAdmin) {
        this.fromAdmin = fromAdmin;
    }

    public void show(Stage stage) {

        String coffeeBrown = "#6F4E37";
        String coffeeBrownDark = "#4E3526";
        String coffeeBrownSoft = "#8B6B4A";
        String warmWhite = "#FDFBF7";
        String lightCream = "#F6F1EA";
        String borderBrown = "#C7B8A7";

        Label title = new Label(fromAdmin ? "Register New Member" : "Member Self Registration");
        title.setFont(Font.font("Arial", FontWeight.BOLD, 22));
        title.setTextFill(Color.web(coffeeBrownDark));

        Label subtitle = new Label(fromAdmin
                ? "Register a new member into the SACCO system."
                : "Create your member account if you don't have one yet."
        );
        subtitle.setFont(Font.font("Arial", 13));
        subtitle.setTextFill(Color.web(coffeeBrownSoft));

        TextField fullNameField = createField("Full Name", borderBrown);
        TextField phoneField = createField("Phone Number", borderBrown);
        TextField emailField = createField("Email (optional)", borderBrown);
        TextField nationalIdField = createField("National ID", borderBrown);
        TextField addressField = createField("Address", borderBrown);
        TextField occupationField = createField("Occupation", borderBrown);

        // ---- Next of Kin Fields ----
        TextField kinNameField = createField("NOK Full Name", borderBrown);
        ComboBox<String> kinRelationshipBox = new ComboBox<>();
        kinRelationshipBox.getItems().addAll("Spouse", "Parent", "Sibling", "Child", "Friend", "Other");
        kinRelationshipBox.setPromptText("Select Relationship");
        kinRelationshipBox.setPrefHeight(40);
        kinRelationshipBox.setPrefWidth(300);
        kinRelationshipBox.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;" +
                        "-fx-background-radius: 5;"
        );
        TextField kinPhoneField = createField("NOK Phone Number", borderBrown);
        TextField kinNationalIdField = createField("NOK National ID (optional)", borderBrown);
        TextField kinAddressField = createField("NOK Address (optional)", borderBrown);

        DatePicker dobPicker = new DatePicker();
        dobPicker.setPromptText("Date of Birth");
        dobPicker.setPrefHeight(40);
        dobPicker.setPrefWidth(300);
        dobPicker.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;" +
                        "-fx-background-radius: 5;"
        );

        ComboBox<String> genderBox = new ComboBox<>();
        genderBox.getItems().addAll("Male", "Female", "Other");
        genderBox.setPromptText("Select Gender");
        genderBox.setPrefHeight(40);
        genderBox.setPrefWidth(300);
        genderBox.setStyle(
                "-fx-background-color: white;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;" +
                        "-fx-background-radius: 5;"
        );

        Label messageLabel = new Label("");
        messageLabel.setFont(Font.font("Arial", 13));
        messageLabel.setWrapText(true);

        Button registerBtn = new Button("REGISTER");
        registerBtn.setPrefWidth(300);
        registerBtn.setPrefHeight(45);
        registerBtn.setStyle(
                "-fx-background-color: " + coffeeBrown + ";" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-font-size: 14;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );

        Button backBtn = new Button(fromAdmin ? "← Back to Dashboard" : "← Back to Login");
        backBtn.setStyle(
                "-fx-background-color: transparent;" +
                        "-fx-text-fill: " + coffeeBrown + ";" +
                        "-fx-cursor: hand;" +
                        "-fx-font-size: 13;"
        );
        backBtn.setOnAction(e -> {
            if (fromAdmin) new AdminDashboard().show(stage);
            else new MemberLoginApp().show(stage);
        });

        registerBtn.setOnAction(e -> {
            if (fullNameField.getText().trim().isEmpty() ||
                    phoneField.getText().trim().isEmpty() ||
                    nationalIdField.getText().trim().isEmpty() ||
                    addressField.getText().trim().isEmpty() ||
                    dobPicker.getValue() == null ||
                    genderBox.getValue() == null ||
                    kinNameField.getText().trim().isEmpty() ||
                    kinRelationshipBox.getValue() == null ||
                    kinPhoneField.getText().trim().isEmpty()) {

                messageLabel.setTextFill(Color.RED);
                messageLabel.setText("❌ Please fill in all required fields.");
                return;
            }

            MemberController controller = new MemberController();
            String result = controller.registerMember(
                    fullNameField.getText().trim(),
                    phoneField.getText().trim(),
                    emailField.getText().trim(),
                    nationalIdField.getText().trim(),
                    addressField.getText().trim(),
                    occupationField.getText().trim(),
                    dobPicker.getValue().toString(),
                    genderBox.getValue()
            );

            if (result.startsWith("✅")) {
                // Extract member number from result and save NOK
                String memberNumber = "";
                for (String part : result.split("\n")) {
                    if (part.contains("Member Number:")) {
                        memberNumber = part.replace("Member Number:", "").trim();
                        break;
                    }
                }
                if (!memberNumber.isEmpty()) {
                    int memberId = controller.getMemberIdByNumber(memberNumber);
                    if (memberId != -1) {
                        controller.saveNextOfKin(
                                memberId,
                                kinNameField.getText().trim(),
                                kinRelationshipBox.getValue(),
                                kinPhoneField.getText().trim(),
                                kinNationalIdField.getText().trim(),
                                kinAddressField.getText().trim()
                        );
                    }
                }

                Alert alert = new Alert(Alert.AlertType.INFORMATION);
                alert.setTitle("Registration Successful");
                alert.setHeaderText(fromAdmin ? "Member registered!" : "Your account has been created!");
                alert.setContentText(result);
                alert.showAndWait();

                if (fromAdmin) new AdminDashboard().show(stage);
                else new MemberLoginApp().show(stage);
            } else {
                messageLabel.setTextFill(Color.RED);
                messageLabel.setText(result);
            }
        });

        GridPane form = new GridPane();
        form.setHgap(20);
        form.setVgap(15);
        form.setPadding(new Insets(20));

        form.add(createLabel("Full Name *"), 0, 0);
        form.add(fullNameField, 1, 0);

        form.add(createLabel("Phone Number *"), 0, 1);
        form.add(phoneField, 1, 1);

        form.add(createLabel("Email"), 0, 2);
        form.add(emailField, 1, 2);

        form.add(createLabel("National ID *"), 0, 3);
        form.add(nationalIdField, 1, 3);

        form.add(createLabel("Date of Birth *"), 0, 4);
        form.add(dobPicker, 1, 4);

        form.add(createLabel("Gender *"), 0, 5);
        form.add(genderBox, 1, 5);

        form.add(createLabel("Address *"), 0, 6);
        form.add(addressField, 1, 6);

        form.add(createLabel("Occupation"), 0, 7);
        form.add(occupationField, 1, 7);

        Label nokSectionLabel = createLabel("── Next of Kin ──");
        nokSectionLabel.setFont(Font.font("Arial", FontWeight.BOLD, 13));
        form.add(nokSectionLabel, 0, 8);
        form.add(kinNameField, 1, 8);

        form.add(createLabel("Relationship *"), 0, 9);
        form.add(kinRelationshipBox, 1, 9);

        form.add(createLabel("NOK Phone *"), 0, 10);
        form.add(kinPhoneField, 1, 10);

        form.add(createLabel("NOK National ID"), 0, 11);
        form.add(kinNationalIdField, 1, 11);

        form.add(createLabel("NOK Address"), 0, 12);
        form.add(kinAddressField, 1, 12);

        VBox formCard = new VBox(15,
                title, subtitle, form, messageLabel, registerBtn, backBtn
        );
        formCard.setAlignment(Pos.CENTER_LEFT);
        formCard.setPadding(new Insets(30));
        formCard.setMaxWidth(650);
        formCard.setStyle(
                "-fx-background-color: " + warmWhite + ";" +
                        "-fx-background-radius: 10;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 10;"
        );

        ScrollPane scrollPane = new ScrollPane(formCard);
        scrollPane.setFitToWidth(true);
        scrollPane.setStyle(
                "-fx-background-color: " + warmWhite + ";"
        );

        VBox mainLayout = new VBox(scrollPane);
        mainLayout.setPadding(new Insets(30));
        mainLayout.setAlignment(Pos.CENTER);
        mainLayout.setStyle(
                "-fx-background-color: " + warmWhite + ";"
        );

        Scene scene = new Scene(mainLayout, 900, 600);
        stage.setTitle("Moresave SACCO - Member Self Registration");
        stage.setScene(scene);
        stage.show();
    }

    private TextField createField(String prompt, String borderBrown) {
        TextField field = new TextField();
        field.setPromptText(prompt);
        field.setPrefHeight(40);
        field.setPrefWidth(300);
        field.setStyle(
                "-fx-background-color: white;" +
                        "-fx-text-fill: #2b2b2b;" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;"
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
