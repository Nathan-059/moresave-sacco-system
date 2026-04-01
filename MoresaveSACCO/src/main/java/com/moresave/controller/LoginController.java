package com.moresave.controller;

import com.moresave.util.DBConnection;
import com.moresave.ui.AdminDashboard;
import com.moresave.ui.MemberDashboard;
import javafx.stage.Stage;
import java.sql.*;

public class LoginController {

    private String username;
    private String memberNumber;

    // Staff login
    public String staffLogin(
            String username,
            String password,
            Stage stage) {
        this.username = username;
        try {
            Connection conn =
                    DBConnection.getConnection();

            String sql =
                    "SELECT username, role, is_active " +
                            "FROM users WHERE username = ? " +
                            "AND password_hash = ? " +
                            "AND is_active = TRUE";

            PreparedStatement stmt =
                    conn.prepareStatement(sql);
            stmt.setString(1, username);
            stmt.setString(2, password);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                String update =
                        "UPDATE users SET last_login = NOW() " +
                                "WHERE username = ?";
                PreparedStatement updateStmt =
                        conn.prepareStatement(update);
                updateStmt.setString(1, username);
                updateStmt.executeUpdate();

                AdminDashboard dashboard =
                        new AdminDashboard();
                dashboard.show(stage);
                return null;

            } else {
                return "❌ Incorrect username or password.";
            }

        } catch (SQLException e) {
            return "❌ Database error: " + e.getMessage();
        }
    }

    // Member login using full name + member number + password
    public String memberLogin(
            String fullName,
            String memberNumber,
            String password,
            Stage stage) {
        this.memberNumber = memberNumber;
        try {
            Connection conn =
                    DBConnection.getConnection();

            // First check member exists
            String sql =
                    "SELECT m.member_id, m.full_name, " +
                            "m.member_number, u.username, " +
                            "u.password_hash, u.is_active, u.role " +
                            "FROM members m " +
                            "LEFT JOIN users u " +
                            "ON m.user_id = u.user_id " +
                            "WHERE m.member_number = ?";

            PreparedStatement stmt =
                    conn.prepareStatement(sql);
            stmt.setString(1, memberNumber.trim());
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                String storedName =
                        rs.getString("full_name")
                                .toLowerCase().trim();
                String enteredName =
                        fullName.toLowerCase().trim();
                String storedUsername =
                        rs.getString("username");
                String storedPassword =
                        rs.getString("password_hash");
                boolean isActive =
                        rs.getBoolean("is_active");
                String role =
                        rs.getString("role");

                if (storedUsername == null ||
                        storedPassword == null) {
                    return "❌ Member found, but login " +
                            "account is not linked.";
                }

                if (!isActive ||
                        !"member".equalsIgnoreCase(role)) {
                    return "❌ Member account is not active.";
                }

                if (!storedName.contains(enteredName) &&
                        !enteredName.contains(storedName)) {
                    return "❌ Name does not match our records.";
                }

                if (!storedPassword.equals(password)) {
                    return "❌ Incorrect password.";
                }

                String update =
                        "UPDATE users SET last_login = NOW() " +
                                "WHERE username = ?";
                PreparedStatement updateStmt =
                        conn.prepareStatement(update);
                updateStmt.setString(1, storedUsername);
                updateStmt.executeUpdate();

                this.username = storedUsername;
                MemberDashboard dashboard =
                        new MemberDashboard(storedUsername);
                dashboard.show(stage);
                return null;

            } else {
                return "❌ Member number not found.";
            }

        } catch (SQLException e) {
            return "❌ Database error: " + e.getMessage();
        }
    }
}