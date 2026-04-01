package com.moresave.controller;

import com.moresave.util.DBConnection;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import java.sql.*;

public class MemberManagementController {

    // Get all members with full details
    public ObservableList<String[]> getAllMembers() {
        ObservableList<String[]> list = FXCollections.observableArrayList();
        try (Connection conn = DBConnection.getConnection()) {
            String sql =
                "SELECT m.member_number, m.full_name, m.phone_number, " +
                "m.email, m.gender, m.national_id, m.address, " +
                "m.occupation, m.date_of_birth, m.joining_date, " +
                "m.membership_status, " +
                "COALESCE(a.current_balance, 0) AS balance " +
                "FROM members m " +
                "LEFT JOIN accounts a ON m.member_id = a.member_id " +
                "ORDER BY m.member_number";
            ResultSet rs = conn.prepareStatement(sql).executeQuery();
            while (rs.next()) {
                list.add(new String[]{
                    rs.getString("member_number"),
                    rs.getString("full_name"),
                    rs.getString("phone_number"),
                    rs.getString("email") != null ? rs.getString("email") : "",
                    rs.getString("gender") != null ? rs.getString("gender") : "",
                    rs.getString("national_id"),
                    rs.getString("address") != null ? rs.getString("address") : "",
                    rs.getString("occupation") != null ? rs.getString("occupation") : "",
                    rs.getString("date_of_birth") != null ? rs.getString("date_of_birth") : "",
                    rs.getString("joining_date"),
                    rs.getString("membership_status").toUpperCase(),
                    String.format("%,.0f", rs.getDouble("balance"))
                });
            }
        } catch (SQLException e) {
            System.out.println("Error: " + e.getMessage());
        }
        return list;
    }

    // Get members filtered by status
    public ObservableList<String[]> getMembersByStatus(String status) {
        ObservableList<String[]> list = FXCollections.observableArrayList();
        try (Connection conn = DBConnection.getConnection()) {
            String sql =
                "SELECT m.member_number, m.full_name, m.phone_number, " +
                "m.email, m.gender, m.national_id, m.address, " +
                "m.occupation, m.date_of_birth, m.joining_date, " +
                "m.membership_status, " +
                "COALESCE(a.current_balance, 0) AS balance " +
                "FROM members m " +
                "LEFT JOIN accounts a ON m.member_id = a.member_id " +
                "WHERE m.membership_status = ? " +
                "ORDER BY m.member_number";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, status);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                list.add(new String[]{
                    rs.getString("member_number"),
                    rs.getString("full_name"),
                    rs.getString("phone_number"),
                    rs.getString("email") != null ? rs.getString("email") : "",
                    rs.getString("gender") != null ? rs.getString("gender") : "",
                    rs.getString("national_id"),
                    rs.getString("address") != null ? rs.getString("address") : "",
                    rs.getString("occupation") != null ? rs.getString("occupation") : "",
                    rs.getString("date_of_birth") != null ? rs.getString("date_of_birth") : "",
                    rs.getString("joining_date"),
                    rs.getString("membership_status").toUpperCase(),
                    String.format("%,.0f", rs.getDouble("balance"))
                });
            }
        } catch (SQLException e) {
            System.out.println("Error: " + e.getMessage());
        }
        return list;
    }

    // Search members by name or member number
    public ObservableList<String[]> searchMembers(String query) {
        ObservableList<String[]> list = FXCollections.observableArrayList();
        try (Connection conn = DBConnection.getConnection()) {
            String sql =
                "SELECT m.member_number, m.full_name, m.phone_number, " +
                "m.email, m.gender, m.national_id, m.address, " +
                "m.occupation, m.date_of_birth, m.joining_date, " +
                "m.membership_status, " +
                "COALESCE(a.current_balance, 0) AS balance " +
                "FROM members m " +
                "LEFT JOIN accounts a ON m.member_id = a.member_id " +
                "WHERE m.full_name LIKE ? OR m.member_number LIKE ? " +
                "OR m.phone_number LIKE ? OR m.national_id LIKE ? " +
                "ORDER BY m.member_number";
            PreparedStatement stmt = conn.prepareStatement(sql);
            String q = "%" + query + "%";
            stmt.setString(1, q);
            stmt.setString(2, q);
            stmt.setString(3, q);
            stmt.setString(4, q);
            ResultSet rs = stmt.executeQuery();
            while (rs.next()) {
                list.add(new String[]{
                    rs.getString("member_number"),
                    rs.getString("full_name"),
                    rs.getString("phone_number"),
                    rs.getString("email") != null ? rs.getString("email") : "",
                    rs.getString("gender") != null ? rs.getString("gender") : "",
                    rs.getString("national_id"),
                    rs.getString("address") != null ? rs.getString("address") : "",
                    rs.getString("occupation") != null ? rs.getString("occupation") : "",
                    rs.getString("date_of_birth") != null ? rs.getString("date_of_birth") : "",
                    rs.getString("joining_date"),
                    rs.getString("membership_status").toUpperCase(),
                    String.format("%,.0f", rs.getDouble("balance"))
                });
            }
        } catch (SQLException e) {
            System.out.println("Error: " + e.getMessage());
        }
        return list;
    }

    // Activate a member
    public String activateMember(String memberNumber) {
        return setMemberStatus(memberNumber, "active");
    }

    // Suspend a member
    public String suspendMember(String memberNumber) {
        return setMemberStatus(memberNumber, "suspended");
    }

    // Deactivate a member
    public String deactivateMember(String memberNumber) {
        return setMemberStatus(memberNumber, "inactive");
    }

    private String setMemberStatus(String memberNumber, String status) {
        try (Connection conn = DBConnection.getConnection()) {
            String sql = "UPDATE members SET membership_status = ? WHERE member_number = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, status);
            stmt.setString(2, memberNumber);
            int rows = stmt.executeUpdate();
            if (rows > 0) {
                // Also update user account active status
                String userSql =
                    "UPDATE users u JOIN members m ON u.user_id = m.user_id " +
                    "SET u.is_active = ? WHERE m.member_number = ?";
                PreparedStatement userStmt = conn.prepareStatement(userSql);
                userStmt.setBoolean(1, status.equals("active"));
                userStmt.setString(2, memberNumber);
                userStmt.executeUpdate();
                return "✅ Member " + memberNumber + " status set to " + status + ".";
            }
            return "❌ Member not found.";
        } catch (SQLException e) {
            return "❌ Error: " + e.getMessage();
        }
    }

    // Get full member details for a single member
    public String[] getMemberDetails(String memberNumber) {
        try (Connection conn = DBConnection.getConnection()) {
            String sql =
                "SELECT m.member_number, m.full_name, m.phone_number, " +
                "m.email, m.gender, m.national_id, m.address, " +
                "m.occupation, m.date_of_birth, m.joining_date, " +
                "m.membership_status, " +
                "COALESCE(a.current_balance, 0) AS balance, " +
                "a.account_number, " +
                "(SELECT COUNT(*) FROM loans l WHERE l.member_id = m.member_id) AS total_loans, " +
                "(SELECT COUNT(*) FROM loans l WHERE l.member_id = m.member_id AND l.status IN ('disbursed','approved')) AS active_loans " +
                "FROM members m " +
                "LEFT JOIN accounts a ON m.member_id = a.member_id " +
                "WHERE m.member_number = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, memberNumber);
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                return new String[]{
                    rs.getString("member_number"),
                    rs.getString("full_name"),
                    rs.getString("phone_number"),
                    rs.getString("email") != null ? rs.getString("email") : "N/A",
                    rs.getString("gender") != null ? rs.getString("gender") : "N/A",
                    rs.getString("national_id"),
                    rs.getString("address") != null ? rs.getString("address") : "N/A",
                    rs.getString("occupation") != null ? rs.getString("occupation") : "N/A",
                    rs.getString("date_of_birth") != null ? rs.getString("date_of_birth") : "N/A",
                    rs.getString("joining_date"),
                    rs.getString("membership_status").toUpperCase(),
                    String.format("%,.0f", rs.getDouble("balance")),
                    rs.getString("account_number") != null ? rs.getString("account_number") : "N/A",
                    rs.getString("total_loans"),
                    rs.getString("active_loans")
                };
            }
        } catch (SQLException e) {
            System.out.println("Error: " + e.getMessage());
        }
        return null;
    }

    // Get counts for dashboard
    public int[] getMemberCounts() {
        // returns [total, active, inactive, suspended]
        int[] counts = {0, 0, 0, 0};
        try (Connection conn = DBConnection.getConnection()) {
            ResultSet r1 = conn.prepareStatement("SELECT COUNT(*) FROM members").executeQuery();
            if (r1.next()) counts[0] = r1.getInt(1);
            ResultSet r2 = conn.prepareStatement("SELECT COUNT(*) FROM members WHERE membership_status='active'").executeQuery();
            if (r2.next()) counts[1] = r2.getInt(1);
            ResultSet r3 = conn.prepareStatement("SELECT COUNT(*) FROM members WHERE membership_status='inactive'").executeQuery();
            if (r3.next()) counts[2] = r3.getInt(1);
            ResultSet r4 = conn.prepareStatement("SELECT COUNT(*) FROM members WHERE membership_status='suspended'").executeQuery();
            if (r4.next()) counts[3] = r4.getInt(1);
        } catch (SQLException e) {
            System.out.println("Error: " + e.getMessage());
        }
        return counts;
    }
}
