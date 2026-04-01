package com.moresave.ui;

import com.moresave.controller.MemberPortalController;
import com.moresave.controller.MemberController;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.stage.Stage;

public class MemberProfileScreen {

    private String username;

    public MemberProfileScreen(String username) {
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
        String[] info = controller.getMemberByUsername(username);

        Label title = new Label("👤 My Profile");
        title.setFont(Font.font("Arial", FontWeight.BOLD, 20));
        title.setTextFill(Color.web(coffeeBrownDark));

        Label nameVal = createValueLabel(info != null ? info[0] : "");
        Label memberNumVal = createValueLabel(info != null ? info[1] : "");
        Label dobVal = createValueLabel(info != null ? info[8] : "");
        Label genderVal = createValueLabel(info != null ? info[9] : "");
        Label joiningVal = createValueLabel(info != null ? info[10] : "");

        TextField phoneField = createField(info != null ? info[4] : "", borderBrown);
        TextField emailField = createField(info != null ? info[5] : "", borderBrown);
        TextField addressField = createField(info != null ? info[6] : "", borderBrown);
        TextField occupationField = createField(info != null ? info[7] : "", borderBrown);

        Label messageLabel = new Label("");
        messageLabel.setFont(Font.font("Arial", 13));

        Button saveBtn = new Button("💾 SAVE CHANGES");
        saveBtn.setPrefWidth(200);
        saveBtn.setPrefHeight(42);
        saveBtn.setStyle(
                "-fx-background-color: " + coffeeBrown + ";" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );

        saveBtn.setOnAction(e -> {
            String result = controller.updateProfile(
                    username,
                    phoneField.getText().trim(),
                    emailField.getText().trim(),
                    addressField.getText().trim(),
                    occupationField.getText().trim()
            );
            messageLabel.setText(result);
            messageLabel.setTextFill(result.startsWith("✅")
                    ? Color.web(coffeeBrown)
                    : Color.RED);
        });

        Button backBtn = new Button("← Back to Dashboard");
        backBtn.setStyle(
                "-fx-background-color: transparent;" +
                        "-fx-text-fill: " + coffeeBrown + ";" +
                        "-fx-cursor: hand;" +
                        "-fx-font-size: 13;"
        );
        backBtn.setOnAction(e -> new MemberDashboard(username).show(stage));

        GridPane form = new GridPane();
        form.setHgap(20);
        form.setVgap(12);

        form.add(createLabel("Full Name:"), 0, 0);
        form.add(nameVal, 1, 0);
        form.add(createLabel("Member Number:"), 0, 1);
        form.add(memberNumVal, 1, 1);
        form.add(createLabel("Date of Birth:"), 0, 2);
        form.add(dobVal, 1, 2);
        form.add(createLabel("Gender:"), 0, 3);
        form.add(genderVal, 1, 3);
        form.add(createLabel("Joining Date:"), 0, 4);
        form.add(joiningVal, 1, 4);

        Separator sep = new Separator();

        Label editTitle = new Label("✏ Editable Information");
        editTitle.setFont(Font.font("Arial", FontWeight.BOLD, 14));
        editTitle.setTextFill(Color.web(coffeeBrownDark));

        GridPane editForm = new GridPane();
        editForm.setHgap(20);
        editForm.setVgap(12);
        editForm.add(createLabel("Phone Number:"), 0, 0);
        editForm.add(phoneField, 1, 0);
        editForm.add(createLabel("Email:"), 0, 1);
        editForm.add(emailField, 1, 1);
        editForm.add(createLabel("Address:"), 0, 2);
        editForm.add(addressField, 1, 2);
        editForm.add(createLabel("Occupation:"), 0, 3);
        editForm.add(occupationField, 1, 3);

        // ---- Change Password Section ----
        Separator sep2 = new Separator();
        Label pwTitle = new Label("🔒 Change Password");
        pwTitle.setFont(Font.font("Arial", FontWeight.BOLD, 14));
        pwTitle.setTextFill(Color.web(coffeeBrownDark));

        PasswordField currentPwField = new PasswordField();
        currentPwField.setPromptText("Current password");
        currentPwField.setPrefHeight(38);
        currentPwField.setPrefWidth(250);
        currentPwField.setStyle("-fx-background-color: white;-fx-text-fill: #2b2b2b;-fx-background-radius: 5;-fx-border-color: " + borderBrown + ";-fx-border-radius: 5;");

        PasswordField newPwField = new PasswordField();
        newPwField.setPromptText("New password");
        newPwField.setPrefHeight(38);
        newPwField.setPrefWidth(250);
        newPwField.setStyle("-fx-background-color: white;-fx-text-fill: #2b2b2b;-fx-background-radius: 5;-fx-border-color: " + borderBrown + ";-fx-border-radius: 5;");

        PasswordField confirmPwField = new PasswordField();
        confirmPwField.setPromptText("Confirm new password");
        confirmPwField.setPrefHeight(38);
        confirmPwField.setPrefWidth(250);
        confirmPwField.setStyle("-fx-background-color: white;-fx-text-fill: #2b2b2b;-fx-background-radius: 5;-fx-border-color: " + borderBrown + ";-fx-border-radius: 5;");

        Label pwMessage = new Label("");
        pwMessage.setFont(Font.font("Arial", 13));

        Button changePwBtn = new Button("🔒 CHANGE PASSWORD");
        changePwBtn.setPrefWidth(200);
        changePwBtn.setPrefHeight(40);
        changePwBtn.setStyle("-fx-background-color: #8B6B4A;-fx-text-fill: white;-fx-font-weight: bold;-fx-background-radius: 5;-fx-cursor: hand;");

        changePwBtn.setOnAction(e -> {
            String current = currentPwField.getText();
            String newPw = newPwField.getText();
            String confirm = confirmPwField.getText();
            if (current.isEmpty() || newPw.isEmpty() || confirm.isEmpty()) {
                pwMessage.setTextFill(Color.RED);
                pwMessage.setText("❌ Please fill all password fields.");
                return;
            }
            if (!newPw.equals(confirm)) {
                pwMessage.setTextFill(Color.RED);
                pwMessage.setText("❌ New passwords do not match.");
                return;
            }
            if (newPw.length() < 4) {
                pwMessage.setTextFill(Color.RED);
                pwMessage.setText("❌ Password must be at least 4 characters.");
                return;
            }
            String result = controller.changePassword(username, current, newPw);
            pwMessage.setText(result);
            pwMessage.setTextFill(result.startsWith("✅") ? Color.web(coffeeBrown) : Color.RED);
            if (result.startsWith("✅")) {
                currentPwField.clear();
                newPwField.clear();
                confirmPwField.clear();
            }
        });

        GridPane pwForm = new GridPane();
        pwForm.setHgap(20);
        pwForm.setVgap(12);
        pwForm.add(createLabel("Current Password:"), 0, 0);
        pwForm.add(currentPwField, 1, 0);
        pwForm.add(createLabel("New Password:"), 0, 1);
        pwForm.add(newPwField, 1, 1);
        pwForm.add(createLabel("Confirm Password:"), 0, 2);
        pwForm.add(confirmPwField, 1, 2);

        // ---- Next of Kin Section ----
        Separator sep3 = new Separator();
        Label nokTitle = new Label("👨‍👩‍👧 Next of Kin");
        nokTitle.setFont(Font.font("Arial", FontWeight.BOLD, 14));
        nokTitle.setTextFill(Color.web(coffeeBrownDark));

        MemberController memberController = new MemberController();
        int memberId = controller.getMemberIdByUsername(username);
        String[] nokData = memberId != -1 ? memberController.getNextOfKin(memberId) : null;

        // Read-only display
        Label nokNameVal    = createValueLabel(nokData != null ? nokData[0] : "Not set");
        Label nokRelVal     = createValueLabel(nokData != null ? nokData[1] : "");
        Label nokPhoneVal   = createValueLabel(nokData != null ? nokData[2] : "");
        Label nokNidVal     = createValueLabel(nokData != null ? nokData[3] : "");
        Label nokAddrVal    = createValueLabel(nokData != null ? nokData[4] : "");

        GridPane nokDisplayForm = new GridPane();
        nokDisplayForm.setHgap(20);
        nokDisplayForm.setVgap(10);
        nokDisplayForm.add(createLabel("NOK Name:"),         0, 0);
        nokDisplayForm.add(nokNameVal,                       1, 0);
        nokDisplayForm.add(createLabel("Relationship:"),     0, 1);
        nokDisplayForm.add(nokRelVal,                        1, 1);
        nokDisplayForm.add(createLabel("NOK Phone:"),        0, 2);
        nokDisplayForm.add(nokPhoneVal,                      1, 2);
        nokDisplayForm.add(createLabel("NOK National ID:"),  0, 3);
        nokDisplayForm.add(nokNidVal,                        1, 3);
        nokDisplayForm.add(createLabel("NOK Address:"),      0, 4);
        nokDisplayForm.add(nokAddrVal,                       1, 4);

        // Edit fields
        Label nokEditTitle = new Label("✏ Update Next of Kin");
        nokEditTitle.setFont(Font.font("Arial", FontWeight.BOLD, 13));
        nokEditTitle.setTextFill(Color.web(coffeeBrownSoft));

        TextField nokNameField  = createField(nokData != null ? nokData[0] : "", borderBrown);
        ComboBox<String> nokRelBox = new ComboBox<>();
        nokRelBox.getItems().addAll("Spouse", "Parent", "Sibling", "Child", "Friend", "Other");
        nokRelBox.setValue(nokData != null ? nokData[1] : null);
        nokRelBox.setPromptText("Select Relationship");
        nokRelBox.setPrefHeight(38);
        nokRelBox.setPrefWidth(250);
        nokRelBox.setStyle("-fx-background-color: white;-fx-border-color: " + borderBrown + ";-fx-border-radius: 5;-fx-background-radius: 5;");

        TextField nokPhoneField = createField(nokData != null ? nokData[2] : "", borderBrown);
        TextField nokNidField   = createField(nokData != null ? nokData[3] : "", borderBrown);
        TextField nokAddrField  = createField(nokData != null ? nokData[4] : "", borderBrown);

        Label nokMessage = new Label("");
        nokMessage.setFont(Font.font("Arial", 13));

        Button saveNokBtn = new Button("💾 SAVE NEXT OF KIN");
        saveNokBtn.setPrefWidth(200);
        saveNokBtn.setPrefHeight(40);
        saveNokBtn.setStyle("-fx-background-color: #27ae60;-fx-text-fill: white;-fx-font-weight: bold;-fx-background-radius: 5;-fx-cursor: hand;");

        saveNokBtn.setOnAction(e -> {
            if (nokNameField.getText().trim().isEmpty() ||
                    nokRelBox.getValue() == null ||
                    nokPhoneField.getText().trim().isEmpty()) {
                nokMessage.setTextFill(Color.RED);
                nokMessage.setText("❌ NOK name, relationship and phone are required.");
                return;
            }
            if (memberId == -1) {
                nokMessage.setTextFill(Color.RED);
                nokMessage.setText("❌ Could not determine member ID.");
                return;
            }
            String result = memberController.saveNextOfKin(
                    memberId,
                    nokNameField.getText().trim(),
                    nokRelBox.getValue(),
                    nokPhoneField.getText().trim(),
                    nokNidField.getText().trim(),
                    nokAddrField.getText().trim()
            );
            nokMessage.setText(result);
            nokMessage.setTextFill(result.startsWith("✅") ? Color.web("#27ae60") : Color.RED);
            if (result.startsWith("✅")) {
                nokNameVal.setText(nokNameField.getText().trim());
                nokRelVal.setText(nokRelBox.getValue());
                nokPhoneVal.setText(nokPhoneField.getText().trim());
                nokNidVal.setText(nokNidField.getText().trim());
                nokAddrVal.setText(nokAddrField.getText().trim());
            }
        });

        GridPane nokEditForm = new GridPane();
        nokEditForm.setHgap(20);
        nokEditForm.setVgap(12);
        nokEditForm.add(createLabel("NOK Full Name *:"),    0, 0);
        nokEditForm.add(nokNameField,                       1, 0);
        nokEditForm.add(createLabel("Relationship *:"),     0, 1);
        nokEditForm.add(nokRelBox,                          1, 1);
        nokEditForm.add(createLabel("NOK Phone *:"),        0, 2);
        nokEditForm.add(nokPhoneField,                      1, 2);
        nokEditForm.add(createLabel("NOK National ID:"),    0, 3);
        nokEditForm.add(nokNidField,                        1, 3);
        nokEditForm.add(createLabel("NOK Address:"),        0, 4);
        nokEditForm.add(nokAddrField,                       1, 4);

        VBox mainCard = new VBox(15,
                title, form, sep, editTitle, editForm,
                messageLabel, saveBtn,
                sep2, pwTitle, pwForm, pwMessage, changePwBtn,
                sep3, nokTitle, nokDisplayForm,
                nokEditTitle, nokEditForm, nokMessage, saveNokBtn,
                backBtn
        );        mainCard.setPadding(new Insets(30));
        mainCard.setStyle(
                "-fx-background-color: " + warmWhite + ";" +
                        "-fx-background-radius: 10;"
        );
        mainCard.setMaxWidth(600);

        ScrollPane scroll = new ScrollPane(mainCard);
        scroll.setFitToWidth(true);
        scroll.setStyle("-fx-background-color: " + warmWhite + ";");

        VBox root = new VBox(scroll);
        root.setPadding(new Insets(30));
        root.setAlignment(Pos.CENTER);
        root.setStyle("-fx-background-color: " + warmWhite + ";");

        Scene scene = new Scene(root, 800, 780);
        stage.setTitle("Moresave SACCO - My Profile");
        stage.setScene(scene);
        stage.show();
    }

    private Label createLabel(String text) {
        Label l = new Label(text);
        l.setTextFill(Color.web("#4E3526"));
        l.setFont(Font.font("Arial", 13));
        l.setMinWidth(130);
        return l;
    }

    private Label createValueLabel(String text) {
        Label l = new Label(text);
        l.setTextFill(Color.web("#6F4E37"));
        l.setFont(Font.font("Arial", FontWeight.BOLD, 13));
        return l;
    }

    private TextField createField(String value, String borderBrown) {
        TextField field = new TextField(value);
        field.setPrefHeight(38);
        field.setPrefWidth(250);
        field.setStyle(
                "-fx-background-color: white;" +
                        "-fx-text-fill: #2b2b2b;" +
                        "-fx-background-radius: 5;" +
                        "-fx-border-color: " + borderBrown + ";" +
                        "-fx-border-radius: 5;"
        );
        return field;
    }
}