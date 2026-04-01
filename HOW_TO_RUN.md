# Moresave SACCO - How to Run in IntelliJ IDEA

## Prerequisites
- IntelliJ IDEA (Community or Ultimate)
- Java JDK 20 (already installed)
- MySQL Server running on localhost:3306
- Maven (bundled with IntelliJ)

---

## Step 1: Set Up the Database

1. Open **MySQL Workbench** or any MySQL client
2. Open the file: `database/SACCO.sql`
3. Run the entire script (Ctrl+Shift+Enter or click the lightning bolt)
4. Wait ~30 seconds for 1,000 members + loans to be seeded
5. Verify with: `SELECT COUNT(*) FROM SACCO.members;` → should return **1000**

**Database credentials (default):**
- Host: `localhost:3306`
- Database: `SACCO`
- Username: `root`
- Password: *(empty)*

> If your MySQL password is different, edit:
> `src/main/java/com/moresave/util/DBConnection.java`
> Change the `PASSWORD` field to your password.

---

## Step 2: Open in IntelliJ IDEA

1. Open IntelliJ IDEA
2. Click **File → Open** and select the `MoresaveSACCO` folder
3. IntelliJ will detect the `pom.xml` — click **Trust Project**
4. Wait for Maven to download dependencies (needs internet for JavaFX + iText)

---

## Step 3: Run the Application

### Option A — Maven (Recommended)
In the IntelliJ terminal or Maven panel:
```
mvn javafx:run
```

### Option B — Run Configuration
1. Open `src/main/java/com/moresave/util/Main.java`
2. Right-click → **Run 'Main'**
3. If you get a JavaFX error, add these VM options in Run → Edit Configurations:
```
--add-modules javafx.controls,javafx.fxml
```

---

## Step 4: Login

### Staff/Admin Login
- Username: `admin`
- Password: `admin123`

### Member Login (any of the 1,000 members)
- Full Name: e.g. `Nathan Tumwine`
- Member Number: `MRS0001`
- Password: `MRS0001` (default password = member number)

---

## System Summary (from Concept Paper)
| Item | Value |
|------|-------|
| Total Members | 1,000 active |
| Total Savings | ~150,000,000 UGX |
| Total Loans Disbursed | 200 loans (~200M UGX) |
| Pending Loan Applications | 50 |
| Dividends (2024) | Distributed to all 1,000 members |
| Interest Rate | 2% per month (flat) |
| Penalty Rate | 2% per month on overdue |

---

## Troubleshooting

**"Communications link failure"** → MySQL is not running. Start MySQL service.

**"Access denied for user 'root'"** → Wrong password. Update `DBConnection.java`.

**"JavaFX runtime components are missing"** → Add VM args:
`--add-modules javafx.controls,javafx.fxml`

**"itextpdf not found"** → Run `mvn install` first to download dependencies.
