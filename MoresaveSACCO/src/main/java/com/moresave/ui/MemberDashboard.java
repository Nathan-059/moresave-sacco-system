package com.moresave.ui;

import com.moresave.controller.MemberPortalController;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import javafx.scene.text.*;
import javafx.stage.Stage;

public class MemberDashboard {

    private String username;

    public MemberDashboard(String username) {
        this.username = username;
    }

    public void show(Stage stage) {

        String coffeeBrown = "#6F4E37";
        String coffeeBrownDark = "#4E3526";
        String coffeeBrownSoft = "#8B6B4A";
        String warmWhite = "#FDFBF7";
        String lightCream = "#F6F1EA";

        MemberPortalController controller =
                new MemberPortalController();

        String[] memberInfo =
                controller.getMemberByUsername(username);

        String memberName = memberInfo != null ?
                memberInfo[0] : "Member";
        String memberNumber = memberInfo != null ?
                memberInfo[1] : "";
        String accountNumber = memberInfo != null ?
                memberInfo[2] : "";
        String balance = memberInfo != null ?
                memberInfo[3] : "0";

        Label systemName = new Label("MORESAVE SACCO");
        systemName.setFont(
                Font.font("Arial", FontWeight.BOLD, 20)
        );
        systemName.setTextFill(Color.web(coffeeBrownDark));

        Label welcomeLabel = new Label(
                "Welcome, " + memberName
        );
        welcomeLabel.setFont(Font.font("Arial", 13));
        welcomeLabel.setTextFill(Color.web(coffeeBrownSoft));

        Button logoutBtn = new Button("Logout");
        logoutBtn.setStyle(
                "-fx-background-color: " + coffeeBrown + ";" +
                        "-fx-text-fill: white;" +
                        "-fx-font-weight: bold;" +
                        "-fx-background-radius: 5;" +
                        "-fx-cursor: hand;"
        );
        logoutBtn.setOnAction(e -> {
            LoginApp loginApp = new LoginApp();
            loginApp.start(stage);
        });

        HBox topBar = new HBox();
        topBar.setAlignment(Pos.CENTER_LEFT);
        topBar.setPadding(new Insets(15, 20, 15, 20));
        topBar.setStyle("-fx-background-color: " + warmWhite + ";");
        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);
        topBar.getChildren().addAll(systemName, spacer, welcomeLabel, logoutBtn);

        Label balanceTitle = new Label("💰 Current Savings Balance");
        balanceTitle.setTextFill(Color.web(coffeeBrownSoft));

        Label balanceAmount = new Label("UGX " + balance);
        balanceAmount.setFont(Font.font("Arial", FontWeight.BOLD, 32));
        balanceAmount.setTextFill(Color.web(coffeeBrown));

        Label memberNumLabel = new Label(
                "Member No: " + memberNumber + "   |   Account: " + accountNumber
        );
        memberNumLabel.setTextFill(Color.web(coffeeBrownSoft));

        VBox balanceCard = new VBox(8, balanceTitle, balanceAmount, memberNumLabel);
        balanceCard.setPadding(new Insets(25));
        balanceCard.setStyle(
                "-fx-background-color: " + lightCream + ";" +
                        "-fx-background-radius: 10;"
        );

        VBox transactionsCard = createCard(
                "📋 My Transactions",
                "View your transaction history",
                coffeeBrown
        );
        VBox loanStatusCard = createCard(
                "💳 My Loans",
                "View your loan status and repayment schedule",
                coffeeBrownDark
        );
        VBox applyLoanCard = createCard(
                "📝 Apply for Loan",
                "Submit a new loan application",
                coffeeBrownSoft
        );
        VBox dividendCard = createCard(
                "💵 My Dividends",
                "View your dividend history",
                "#8B6B4A"
        );
        VBox profileCard = createCard(
                "👤 My Profile",
                "Update personal details",
                "#A67C52"
        );
        VBox statementCard = createCard(
                "📥 Download Statement",
                "Download your account statement as PDF",
                "#7A5A3A"
        );

        transactionsCard.setOnMouseClicked(e ->
                new MemberTransactionsScreen(username).show(stage)
        );
        loanStatusCard.setOnMouseClicked(e ->
                new MemberLoansScreen(username).show(stage)
        );
        applyLoanCard.setOnMouseClicked(e ->
                new MemberLoanApplicationScreen(username).show(stage)
        );
        dividendCard.setOnMouseClicked(e ->
                new MemberDividendScreen(username).show(stage)
        );
        profileCard.setOnMouseClicked(e ->
                new MemberProfileScreen(username).show(stage)
        );

        statementCard.setOnMouseClicked(e -> {
            String[] info = controller.getMemberByUsername(username);
            if (info != null) {
                String result =
                        com.moresave.util.PDFGenerator.generateMemberStatement(
                                info[1], info[0], info[2], info[3],
                                new java.util.ArrayList<>(
                                        controller.getTransactions(info[2])
                                )
                        );
                Alert alert = new Alert(Alert.AlertType.INFORMATION);
                alert.setTitle("Statement");
                alert.setHeaderText("Statement Downloaded");
                alert.setContentText(result);
                alert.showAndWait();
            }
        });

        GridPane grid = new GridPane();
        grid.setHgap(20);
        grid.setVgap(20);
        grid.setPadding(new Insets(20));
        grid.setAlignment(Pos.CENTER);
        grid.add(transactionsCard, 0, 0);
        grid.add(loanStatusCard, 1, 0);
        grid.add(applyLoanCard, 2, 0);
        grid.add(dividendCard, 0, 1);
        grid.add(profileCard, 1, 1);
        grid.add(statementCard, 2, 1);

        VBox centerContent = new VBox(20, balanceCard, grid);
        centerContent.setPadding(new Insets(20));

        BorderPane mainLayout = new BorderPane();
        mainLayout.setTop(topBar);
        mainLayout.setCenter(centerContent);
        mainLayout.setStyle("-fx-background-color: " + warmWhite + ";");

        Scene scene = new Scene(mainLayout, 900, 620);
        stage.setTitle("Moresave SACCO - Member Portal");
        stage.setScene(scene);
        stage.show();
    }

    private VBox createCard(String title, String description, String color) {
        Label titleLabel = new Label(title);
        titleLabel.setFont(Font.font("Arial", FontWeight.BOLD, 14));
        titleLabel.setTextFill(Color.web("#4E3526"));

        Label descLabel = new Label(description);
        descLabel.setFont(Font.font("Arial", 11));
        descLabel.setTextFill(Color.web("#8B6B4A"));
        descLabel.setWrapText(true);

        VBox card = new VBox(8, titleLabel, descLabel);
        card.setAlignment(Pos.CENTER_LEFT);
        card.setPadding(new Insets(20));
        card.setPrefSize(220, 100);
        card.setStyle(
                "-fx-background-color: " + color + ";" +
                        "-fx-background-radius: 10;" +
                        "-fx-cursor: hand;"
        );

        card.setOnMouseEntered(e ->
                card.setStyle(
                        "-fx-background-color: derive(" + color + ", -15%);" +
                                "-fx-background-radius: 10;" +
                                "-fx-cursor: hand;"
                )
        );
        card.setOnMouseExited(e ->
                card.setStyle(
                        "-fx-background-color: " + color + ";" +
                                "-fx-background-radius: 10;" +
                                "-fx-cursor: hand;"
                )
        );
        return card;
    }
}