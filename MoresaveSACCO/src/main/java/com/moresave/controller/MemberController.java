package com.moresave.controller;

import com.moresave.util.DBConnection;
import java.sql.*;
import java.time.LocalDate;

public class MemberController {

    public String registerMember(
            String fullName,
            String phone,
            String email,
            String nationalId,
            String address,
            String occupation,
            String dob,
            String gender) {

        try (Connection conn = DBConnection.getConnection()) {
            conn.setAutoCommit(false);

            // Check for duplicate National ID BEFORE inserting
            String checkSql = "SELECT COUNT(*) FROM members WHERE TRIM(LOWER(national_id)) = TRIM(LOWER(?))";
            try (PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
                checkStmt.setString(1, nationalId.trim());
                ResultSet checkRs = checkStmt.executeQuery();
                if (checkRs.next() && checkRs.getInt(1) > 0) {
                    conn.rollback();
                    return "❌ National ID already exists in system.";
                }
            }

            // Generate member number automatically
            String memberNumber = generateMemberNumber(conn);

            // Insert into members table
            String memberSql =
                    "INSERT INTO members " +
                            "(member_number, full_name, date_of_birth, " +
                            "gender, national_id, phone_number, email, " +
                            "address, occupation, joining_date, membership_status) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            int memberId;
            try (PreparedStatement memberStmt = conn.prepareStatement(memberSql, Statement.RETURN_GENERATED_KEYS)) {
                memberStmt.setString(1, memberNumber);
                memberStmt.setString(2, fullName);
                memberStmt.setString(3, dob);
                memberStmt.setString(4, gender);
                memberStmt.setString(5, nationalId);
                memberStmt.setString(6, phone);
                memberStmt.setString(7, email);
                memberStmt.setString(8, address);
                memberStmt.setString(9, occupation);
                memberStmt.setString(10, LocalDate.now().toString());
                memberStmt.setString(11, "active");
                memberStmt.executeUpdate();

                try (ResultSet memberKeys = memberStmt.getGeneratedKeys()) {
                    if (memberKeys.next()) {
                        memberId = memberKeys.getInt(1);
                    } else {
                        conn.rollback();
                        return "❌ Could not create member record.";
                    }
                }
            }

            // Create login account for this member
            String defaultPassword = memberNumber;
            String userSql =
                    "INSERT INTO users " +
                            "(username, password_hash, role, is_active, created_at) " +
                            "VALUES (?, ?, ?, ?, NOW())";

            int userId;
            try (PreparedStatement userStmt = conn.prepareStatement(userSql, Statement.RETURN_GENERATED_KEYS)) {
                userStmt.setString(1, memberNumber);
                userStmt.setString(2, defaultPassword);
                userStmt.setString(3, "member");
                userStmt.setBoolean(4, true);
                userStmt.executeUpdate();

                try (ResultSet userKeys = userStmt.getGeneratedKeys()) {
                    if (userKeys.next()) {
                        userId = userKeys.getInt(1);
                    } else {
                        conn.rollback();
                        return "❌ Could not create member login account.";
                    }
                }
            }

            // Link member to user
            String linkSql = "UPDATE members SET user_id = ? WHERE member_id = ?";
            try (PreparedStatement linkStmt = conn.prepareStatement(linkSql)) {
                linkStmt.setInt(1, userId);
                linkStmt.setInt(2, memberId);
                linkStmt.executeUpdate();
            }

            // Create savings account for member
            createSavingsAccount(conn, memberNumber);

            conn.commit();

            // Send welcome email
            com.moresave.util.EmailService.sendWelcome(
                email.trim(), fullName, memberNumber, defaultPassword
            );

            return "✅ Member registered successfully! " +
                    "Member Number: " + memberNumber +
                    "\nDefault Password: " + defaultPassword;

        } catch (SQLIntegrityConstraintViolationException e) {
            String msg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";
            if (msg.contains("national_id")) {
                return "❌ National ID already exists in system.";
            } else if (msg.contains("username") || msg.contains("users")) {
                return "❌ A login account with this member number already exists.";
            } else if (msg.contains("account_number") || msg.contains("accounts")) {
                return "❌ A savings account with this number already exists.";
            } else {
                return "❌ Duplicate entry error: " + e.getMessage();
            }
        } catch (SQLException e) {
            return "❌ Error: " + e.getMessage();
        }
    }

    private void createSavingsAccount(
            Connection conn,
            String memberNumber) throws SQLException {

        String getMember = "SELECT member_id FROM members WHERE member_number = ?";
        try (PreparedStatement stmt = conn.prepareStatement(getMember)) {
            stmt.setString(1, memberNumber);
            ResultSet rs = stmt.executeQuery();

            if (rs.next()) {
                int memberId = rs.getInt("member_id");
                String accountNumber = "ACC" + memberNumber;

                String sql =
                        "INSERT INTO accounts " +
                                "(account_number, member_id, account_type, " +
                                "opening_date, current_balance, status) " +
                                "VALUES (?, ?, ?, ?, ?, ?)";

                try (PreparedStatement accStmt = conn.prepareStatement(sql)) {
                    accStmt.setString(1, accountNumber);
                    accStmt.setInt(2, memberId);
                    accStmt.setString(3, "savings");
                    accStmt.setString(4, LocalDate.now().toString());
                    accStmt.setDouble(5, 0.00);
                    accStmt.setString(6, "active");
                    accStmt.executeUpdate();
                }
            }
        }
    }

    private String generateMemberNumber(Connection conn) throws SQLException {
        // ✅ Use MAX instead of COUNT to avoid duplicates when records are deleted
        String sql = "SELECT MAX(CAST(SUBSTRING(member_number, 4) AS UNSIGNED)) as maxNum FROM members";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            ResultSet rs = stmt.executeQuery();
            int next = 1;
            if (rs.next() && rs.getObject("maxNum") != null) {
                next = rs.getInt("maxNum") + 1;
            }
            return "MRS" + String.format("%04d", next);
        }
    }

    public String saveNextOfKin(int memberId, String fullName, String relationship,
            String phone, String nationalId, String address) {
        try (Connection conn = DBConnection.getConnection()) {
            // Delete existing and re-insert (one NOK per member)
            String del = "DELETE FROM next_of_kin WHERE member_id = ?";
            PreparedStatement delStmt = conn.prepareStatement(del);
            delStmt.setInt(1, memberId);
            delStmt.executeUpdate();

            String sql = "INSERT INTO next_of_kin (member_id, full_name, relationship, " +
                         "phone_number, national_id, address) VALUES (?,?,?,?,?,?)";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setInt(1, memberId);
            stmt.setString(2, fullName);
            stmt.setString(3, relationship);
            stmt.setString(4, phone);
            stmt.setString(5, nationalId.isEmpty() ? null : nationalId);
            stmt.setString(6, address);
            stmt.executeUpdate();
            return "✅ Next of kin saved successfully.";
        } catch (SQLException e) {
            return "❌ Error: " + e.getMessage();
        }
    }

    public String[] getNextOfKin(int memberId) {
        try (Connection conn = DBConnection.getConnection()) {
            String sql = "SELECT full_name, relationship, phone_number, national_id, address " +
                         "FROM next_of_kin WHERE member_id = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setInt(1, memberId);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                return new String[]{
                    rs.getString("full_name"),
                    rs.getString("relationship"),
                    rs.getString("phone_number"),
                    rs.getString("national_id") != null ? rs.getString("national_id") : "",
                    rs.getString("address") != null ? rs.getString("address") : ""
                };
            }
        } catch (SQLException e) {
            System.out.println("Error: " + e.getMessage());
        }
        return null;
    }

    public int getMemberIdByNumber(String memberNumber) {
        try (Connection conn = DBConnection.getConnection()) {
            PreparedStatement stmt = conn.prepareStatement(
                "SELECT member_id FROM members WHERE member_number = ?");
            stmt.setString(1, memberNumber);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) return rs.getInt("member_id");
        } catch (SQLException e) {
            System.out.println("Error: " + e.getMessage());
        }
        return -1;
    }
}