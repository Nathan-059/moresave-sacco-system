package com.moresave.ui;

import javafx.stage.Stage;

public class MemberRegistration {

    public void show(Stage stage) {
        new MemberSelfRegistration(true).show(stage);
    }
}