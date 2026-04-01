package com.moresave.util;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {

    private static final String URL      = "jdbc:mysql://localhost:3306/SACCO";
    private static final String USERNAME = "root";
    private static final String PASSWORD = "";

    // ✅ FIX: Always return a fresh connection — no singleton.
    //    A shared static connection gets stuck in a broken transaction
    //    state after any failure, corrupting all subsequent DB calls.
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USERNAME, PASSWORD);
    }

    // Keep for backward compatibility — now a no-op since we use fresh connections
    public static void closeConnection() {
        // No-op: each caller is responsible for closing their own connection
    }
}