-- ============================================================
-- MORESAVE SACCO MANAGEMENT SYSTEM
-- Database: SACCO  |  MySQL 9.x
-- 1,000 members | ~155M savings | 200 disbursed loans | 50 pending
-- Name format: Surname GivenName  e.g. Nabunya Sandra, Kaggwa Peter
-- 10% have: Surname CulturalName GivenName
-- Uganda NIN: C + M/F + YY(birth) + 7 digits + letter = 14 chars
-- ============================================================

DROP DATABASE IF EXISTS SACCO;
CREATE DATABASE SACCO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE SACCO;

CREATE TABLE users (
    user_id        INT AUTO_INCREMENT PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           ENUM('admin','staff','member') NOT NULL DEFAULT 'member',
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login     DATETIME NULL
);

CREATE TABLE members (
    member_id          INT AUTO_INCREMENT PRIMARY KEY,
    member_number      VARCHAR(20)  NOT NULL UNIQUE,
    full_name          VARCHAR(150) NOT NULL,
    date_of_birth      DATE         NULL,
    gender             ENUM('Male','Female','Other') NULL,
    national_id        VARCHAR(20)  NOT NULL UNIQUE,
    phone_number       VARCHAR(20)  NOT NULL,
    email              VARCHAR(100) NULL,
    address            VARCHAR(255) NULL,
    occupation         VARCHAR(100) NULL,
    joining_date       DATE         NOT NULL,
    membership_status  ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
    user_id            INT NULL,
    CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE accounts (
    account_id      INT AUTO_INCREMENT PRIMARY KEY,
    account_number  VARCHAR(30)  NOT NULL UNIQUE,
    member_id       INT          NOT NULL,
    account_type    ENUM('savings','fixed') NOT NULL DEFAULT 'savings',
    opening_date    DATE         NOT NULL,
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status          ENUM('active','closed','frozen') NOT NULL DEFAULT 'active',
    CONSTRAINT fk_account_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
);

CREATE TABLE transactions (
    transaction_id    INT AUTO_INCREMENT PRIMARY KEY,
    account_id        INT          NOT NULL,
    transaction_type  ENUM('deposit','withdrawal') NOT NULL,
    amount            DECIMAL(15,2) NOT NULL,
    balance_after     DECIMAL(15,2) NOT NULL,
    description       VARCHAR(255) NULL,
    recorded_by       INT          NULL,
    transaction_date  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tx_account FOREIGN KEY (account_id) REFERENCES accounts(account_id) ON DELETE CASCADE,
    CONSTRAINT fk_tx_user FOREIGN KEY (recorded_by) REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE loans (
    loan_id             INT AUTO_INCREMENT PRIMARY KEY,
    loan_number         VARCHAR(20)   NOT NULL UNIQUE,
    member_id           INT           NOT NULL,
    loan_amount         DECIMAL(15,2) NOT NULL,
    interest_rate       DECIMAL(5,2)  NOT NULL DEFAULT 2.00,
    repayment_period    INT           NOT NULL COMMENT 'months',
    monthly_payment     DECIMAL(15,2) NOT NULL,
    total_payable       DECIMAL(15,2) NOT NULL,
    purpose             VARCHAR(255)  NULL,
    application_date    DATE          NOT NULL,
    approval_date       DATE          NULL,
    disbursement_date   DATE          NULL,
    maturity_date       DATE          NULL,
    outstanding_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status              ENUM('pending','approved','disbursed','rejected','closed') NOT NULL DEFAULT 'pending',
    CONSTRAINT fk_loan_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
);

CREATE TABLE loan_repayments (
    repayment_id      INT AUTO_INCREMENT PRIMARY KEY,
    loan_id           INT           NOT NULL,
    due_date          DATE          NOT NULL,
    amount_due        DECIMAL(15,2) NOT NULL,
    amount_paid       DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    principal_portion DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    interest_portion  DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    remaining_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    penalty_amount    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    payment_status    ENUM('pending','paid','overdue','partial') NOT NULL DEFAULT 'pending',
    payment_date      DATETIME      NULL,
    CONSTRAINT fk_repayment_loan FOREIGN KEY (loan_id) REFERENCES loans(loan_id) ON DELETE CASCADE
);

CREATE TABLE dividends (
    dividend_id         INT AUTO_INCREMENT PRIMARY KEY,
    member_id           INT           NOT NULL,
    financial_year      VARCHAR(10)   NOT NULL,
    average_savings     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_sacco_savings DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    savings_percentage  DECIMAL(8,4)  NOT NULL DEFAULT 0.00,
    total_profit        DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    dividend_amount     DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    payment_status      ENUM('pending','approved','paid') NOT NULL DEFAULT 'pending',
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dividend_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE,
    CONSTRAINT uq_dividend_member_year UNIQUE (member_id, financial_year)
);

CREATE TABLE next_of_kin (
    kin_id          INT AUTO_INCREMENT PRIMARY KEY,
    member_id       INT          NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    relationship    VARCHAR(50)  NOT NULL,
    phone_number    VARCHAR(20)  NOT NULL,
    national_id     VARCHAR(20)  NULL,
    address         VARCHAR(255) NULL,
    CONSTRAINT fk_kin_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
);

CREATE TABLE collateral (
    collateral_id   INT AUTO_INCREMENT PRIMARY KEY,
    loan_id         INT          NOT NULL,
    member_id       INT          NOT NULL,
    collateral_type ENUM('Land Title','Vehicle Logbook','Building','Equipment','Livestock','Salary Slip','Guarantor','Other') NOT NULL,
    description     VARCHAR(255) NOT NULL,
    estimated_value DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    document_ref    VARCHAR(100) NULL COMMENT 'Reference number of supporting document',
    status          ENUM('active','released','forfeited') NOT NULL DEFAULT 'active',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_collateral_loan   FOREIGN KEY (loan_id)   REFERENCES loans(loan_id)   ON DELETE CASCADE,
    CONSTRAINT fk_collateral_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE CASCADE
);

CREATE INDEX idx_members_number   ON members(member_number);
CREATE INDEX idx_members_national ON members(national_id);
CREATE INDEX idx_accounts_member  ON accounts(member_id);
CREATE INDEX idx_loans_member     ON loans(member_id);
CREATE INDEX idx_loans_status     ON loans(status);
CREATE INDEX idx_repayments_loan  ON loan_repayments(loan_id);
CREATE INDEX idx_repayments_due   ON loan_repayments(due_date);
CREATE INDEX idx_transactions_acc ON transactions(account_id);
CREATE INDEX idx_dividends_member ON dividends(member_id);
CREATE INDEX idx_kin_member         ON next_of_kin(member_id);
CREATE INDEX idx_collateral_loan    ON collateral(loan_id);
CREATE INDEX idx_collateral_member  ON collateral(member_id);

INSERT INTO users (username, password_hash, role, is_active, created_at)
VALUES ('admin', 'admin123', 'admin', TRUE, '2024-01-01 08:00:00');

-- ============================================================
-- SEED MEMBERS (1,000)
-- Format: Surname GivenName  e.g. Nabunya Sandra, Kaggwa Peter
-- 10%: Surname CulturalName GivenName
-- ============================================================
DELIMITER $$

CREATE PROCEDURE seed_members()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE v_mn VARCHAR(20);
    DECLARE v_uid INT; DECLARE v_mid INT; DECLARE v_aid INT;
    DECLARE v_bal DECIMAL(15,2);
    DECLARE v_join DATE; DECLARE v_dob DATE;
    DECLARE v_byy INT; DECLARE v_byys VARCHAR(2);
    DECLARE v_gender ENUM('Male','Female','Other');
    DECLARE v_gc VARCHAR(1);
    DECLARE v_name VARCHAR(150);
    DECLARE v_phone VARCHAR(20); DECLARE v_nin VARCHAR(20);
    DECLARE v_occ VARCHAR(100); DECLARE v_addr VARCHAR(255);
    DECLARE v_sn VARCHAR(80);
    DECLARE v_gn VARCHAR(80);
    DECLARE v_cn VARCHAR(80);
    DECLARE v_si INT; DECLARE v_gi INT; DECLARE v_ci INT;

    -- 80 MALE UGANDAN SURNAMES
    DECLARE msn VARCHAR(2500) DEFAULT 'Kaggwa,Ssemakula,Kiggundu,Mugerwa,Kibuuka,Mutebi,Ssebunya,Kiwanuka,Mulindwa,Kibirige,Ssenyonga,Kiberu,Mutyaba,Kibuka,Byamugisha,Tumwine,Mugisha,Asiimwe,Tumusiime,Atuhaire,Okello,Ojok,Odongo,Opio,Otim,Ocen,Oryem,Ogwang,Akena,Okot,Waiswa,Wandera,Wamala,Wasswa,Wafula,Kakooza,Kasozi,Katende,Kavuma,Kayondo,Lubega,Lule,Lutalo,Lutwama,Musoke,Mubiru,Sserwadda,Nsubuga,Kyeyune,Ssemanda,Ssebagala,Ssekandi,Mukalazi,Ssemwanga,Ssemujju,Ssekitoleko,Rwabuhinga,Kabagambe,Nuwagaba,Barigye,Turyasingura,Muhwezi,Tibamwenda,Bwire,Ogenga,Obua,Omara,Olweny,Ssali,Ssentamu,Sserunjogi,Walusimbi,Wabwire,Wanyama,Kazibwe,Kizito,Kaketo,Kayiwa,Birungi';

    -- 80 FEMALE UGANDAN SURNAMES (Na- prefix = female in Luganda)
    DECLARE fsn VARCHAR(2500) DEFAULT 'Nabunya,Nakigozi,Namukasa,Namutebi,Namusoke,Nabirye,Namubiru,Nakafeero,Nalumansi,Nakawunde,Namazzi,Nakayima,Nalunga,Nantege,Namono,Nasiche,Nabulungi,Najja,Nakisisa,Nakyeyune,Nalwoga,Namirembe,Nansubuga,Nankya,Nansamba,Nantume,Nakaggwa,Namugenyi,Namuganza,Nangobi,Nakato,Nakabugo,Nakalanzi,Nakibuule,Nakirya,Nabatanzi,Nabukenya,Nabuuma,Nabwire,Nafuna,Nagawa,Naggayi,Nagginda,Nakabuye,Nakacwa,Nakaddu,Nakafero,Nakagolo,Nakaima,Nakajubi,Nakakande,Nakalema,Nakamya,Nakangu,Nakanjako,Nakaweesi,Nakayenze,Nakazibwe,Nakibinge,Nakibuuka,Nakirijja,Nakisanze,Nakisige,Nakisozi,Nakitende,Nakitto,Nakiyaga,Nakiyimba,Nakiyingi,Nakyagaba,Nakyejwe,Nakyobe,Nakyuka,Nakyuma,Nalubega,Nalubwama,Nalugwa,Nalukwago,Nalumansi';

    -- 50 MALE CHRISTIAN/GIVEN NAMES
    DECLARE mgn VARCHAR(1500) DEFAULT 'John,Peter,Paul,James,Robert,Michael,Joseph,Charles,George,Henry,Samuel,Daniel,Emmanuel,Patrick,Richard,Andrew,Stephen,Francis,Moses,Isaac,Joshua,Benjamin,Simon,Mark,Luke,Matthew,Philip,Thomas,Abraham,Elijah,Caleb,Aaron,Alex,Brian,Calvin,Dennis,Edward,Felix,Gerald,Ivan,Jacob,Kevin,Leonard,Martin,Nicholas,David,Nathan,Timothy,Jonathan,Solomon';

    -- 50 FEMALE CHRISTIAN/GIVEN NAMES
    DECLARE fgn VARCHAR(1500) DEFAULT 'Mary,Grace,Sarah,Ruth,Esther,Miriam,Deborah,Lydia,Priscilla,Hannah,Naomi,Rachel,Leah,Abigail,Elizabeth,Rebecca,Judith,Dorcas,Phoebe,Eunice,Joanna,Susanna,Martha,Anna,Tabitha,Beatrice,Christine,Diana,Edith,Florence,Harriet,Irene,Janet,Josephine,Lillian,Margaret,Norah,Olivia,Patricia,Rosemary,Sylvia,Theresa,Violet,Winnie,Annet,Gloria,Brenda,Doreen,Juliet,Agnes';

    -- CULTURAL MIDDLE NAMES (10% only)
    DECLARE mcult VARCHAR(800) DEFAULT 'Ssemakula,Kiggundu,Ssebagala,Mugerwa,Kibuuka,Mutebi,Ssebunya,Kiwanuka,Mulindwa,Kibirige,Ssenyonga,Kiberu,Mutyaba,Kibuka,Byamugisha,Tumwine,Mugisha,Asiimwe,Tumusiime,Atuhaire,Okello,Ojok,Odongo,Opio,Otim,Ocen,Oryem,Ogwang,Akena,Okot,Waiswa,Wandera,Wamala,Wasswa,Wafula,Kakooza,Kasozi,Katende,Kavuma,Kayondo,Lubega,Lule,Lutalo,Lutwama,Musoke';
    DECLARE fcult VARCHAR(800) DEFAULT 'Nakato,Namukasa,Namutebi,Namusoke,Nabirye,Namubiru,Nakafeero,Nalumansi,Nakawunde,Namazzi,Nakayima,Nalunga,Nakigozi,Nantege,Namono,Nasiche,Nabulungi,Najja,Nakisisa,Nakyeyune,Nalwoga,Namirembe,Nansubuga,Nankya,Nansamba,Nantume,Nakaggwa,Namugenyi,Namuganza,Nangobi,Akello,Auma,Aber,Adong,Acen,Atim,Akot,Alum,Apiyo,Apio,Arach,Achola,Akidi,Amuge,Anena,Angom';

    DECLARE occ VARCHAR(800) DEFAULT 'Farmer,Trader,Teacher,Nurse,Driver,Carpenter,Tailor,Mechanic,Boda Boda Rider,Shopkeeper,Accountant,Electrician,Plumber,Mason,Welder,Barber,Hairdresser,Butcher,Fisherman,Poultry Farmer,Dairy Farmer,Market Vendor,Security Guard,Cleaner,Cook,Receptionist,Pharmacist,Lab Technician,Social Worker,Pastor,Catechist,Brick Layer,Painter,Photographer,Journalist,Banker,Lawyer,Doctor,Midwife,Veterinarian,Agronomist,Forester,Weaver,Potter,Blacksmith,Cobbler,Hawker,Broker';

    DECLARE addr VARCHAR(600) DEFAULT 'Kisekende LC1,Mubende Town,Kasambya,Kitenga,Kalungu,Madudu,Butoloogo,Kiganda,Bagezza,Myanzi,Bukuya,Kassanda,Kiwoko,Kyegonza,Nalutuntu,Wattuba,Bukomero,Kiryokya,Lwamata,Mityana Road,Kakumiro,Kyankwanzi,Kiboga,Hoima Road,Mubende Hill,Butoloogo TC,Kiganda Sub-county,Kasambya TC,Madudu TC,Kalungu Village';

    WHILE i <= 1000 DO
        SET v_mn = CONCAT('MRS', LPAD(i, 4, '0'));

        -- Break repetition: add floor(i/50) shifts the cycle at every 50 members
        SET v_si = 1 + ((i * 37 + 11 + FLOOR(i / 80)) % 80);
        SET v_gi = 1 + ((i * 47 + 7  + FLOOR(i / 50)) % 50);
        SET v_ci = 1 + ((i * 41 + 13 + FLOOR(i / 45)) % 45);

        IF (i % 2 = 0) THEN
            SET v_gender = 'Female'; SET v_gc = 'F';
            SET v_sn = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fsn,   ',', v_si), ',', -1));
            SET v_gn = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fgn,   ',', v_gi), ',', -1));
            SET v_cn = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(fcult, ',', v_ci), ',', -1));
        ELSE
            SET v_gender = 'Male'; SET v_gc = 'M';
            SET v_sn = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(msn,   ',', v_si), ',', -1));
            SET v_gn = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(mgn,   ',', v_gi), ',', -1));
            SET v_cn = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(mcult, ',', v_ci), ',', -1));
        END IF;

        -- 90%: "Surname GivenName"  e.g. Nabunya Sandra, Kaggwa Peter
        -- 10%: "Surname CulturalName GivenName"  e.g. Ssemakula Kiggundu John
        IF (i % 10 = 0) THEN
            SET v_name = CONCAT(v_sn, ' ', v_cn, ' ', v_gn);
        ELSE
            SET v_name = CONCAT(v_sn, ' ', v_gn);
        END IF;

        SET v_phone = CONCAT(
            ELT(1 + (i % 8), '0700','0752','0772','0782','0756','0776','0701','0703'),
            LPAD(i + 100000, 6, '0')
        );

        SET v_join = DATE_ADD('2020-01-15', INTERVAL FLOOR(i * 1.8) DAY);
        IF v_join > '2025-12-31' THEN SET v_join = '2025-12-31'; END IF;

        SET v_dob  = DATE_SUB(v_join, INTERVAL (20 + (i % 45)) YEAR);
        SET v_byy  = YEAR(v_dob);
        SET v_byys = RIGHT(CAST(v_byy AS CHAR), 2);

        -- Uganda NIN: C + M/F + YY(birth) + 7 digits + letter = 14 chars
        SET v_nin = CONCAT('C', v_gc, v_byys, LPAD(i, 7, '0'), ELT(1 + (i % 3), 'A', 'B', 'C'));

        SET v_occ  = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(occ,  ',', 1 + (i % 48)), ',', -1));
        SET v_addr = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(addr, ',', 1 + (i % 30)), ',', -1));
        SET v_bal  = 100000 + ((i % 10) * 10000) + ((i % 5) * 5000);

        INSERT INTO users (username, password_hash, role, is_active, created_at)
        VALUES (v_mn, v_mn, 'member', TRUE, v_join);
        SET v_uid = LAST_INSERT_ID();

        INSERT INTO members (member_number, full_name, date_of_birth, gender, national_id,
            phone_number, email, address, occupation, joining_date, membership_status, user_id)
        VALUES (v_mn, v_name, v_dob, v_gender, v_nin,
            v_phone, CONCAT(LOWER(REPLACE(v_name,' ','.')), i, '@gmail.com'),
            v_addr, v_occ, v_join, 'active', v_uid);
        SET v_mid = LAST_INSERT_ID();

        INSERT INTO accounts (account_number, member_id, account_type, opening_date, current_balance, status)
        VALUES (CONCAT('ACC', v_mn), v_mid, 'savings', v_join, v_bal, 'active');
        SET v_aid = LAST_INSERT_ID();

        INSERT INTO transactions (account_id, transaction_type, amount, balance_after,
            description, recorded_by, transaction_date)
        VALUES (v_aid, 'deposit', v_bal, v_bal, 'Initial savings deposit', 1,
            CONCAT(v_join, ' 09:00:00'));

        SET i = i + 1;
    END WHILE;
END$$

DELIMITER ;

CALL seed_members();
DROP PROCEDURE IF EXISTS seed_members;

-- ============================================================
-- SEED LOANS: 200 disbursed + 50 pending
-- ============================================================
DELIMITER $$

CREATE PROCEDURE seed_loans()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE v_ln VARCHAR(20); DECLARE v_mid INT;
    DECLARE v_amt DECIMAL(15,2); DECLARE v_per INT;
    DECLARE v_tot DECIMAL(15,2); DECLARE v_mth DECIMAL(15,2);
    DECLARE v_app DATE; DECLARE v_dis DATE; DECLARE v_mat DATE;
    DECLARE v_lid INT; DECLARE v_rem DECIMAL(15,2);
    DECLARE j INT; DECLARE v_due DATE; DECLARE v_pur VARCHAR(100);
    DECLARE purposes VARCHAR(600) DEFAULT 'Business capital,School fees,Medical expenses,Home improvement,Agriculture inputs,Livestock purchase,Land purchase,Vehicle repair,Equipment purchase,Wedding expenses,Funeral expenses,Rent payment,Stock purchase,Boda Boda purchase,Sewing machine,Grinding mill,Water tank,Solar panel,Poultry project,Dairy cow purchase';

    WHILE i <= 200 DO
        SET v_ln = CONCAT('LN', LPAD(i, 5, '0'));
        SET v_mid = i;
        IF (i % 20 = 0) THEN SET v_amt = 5000000;
        ELSEIF (i % 10 = 0) THEN SET v_amt = 2000000;
        ELSEIF (i % 5 = 0) THEN SET v_amt = 1000000;
        ELSE SET v_amt = 700000; END IF;
        SET v_per = 6 + ((i % 4) * 3);
        SET v_tot = v_amt + (v_amt * 2.00 / 100 * v_per);
        SET v_mth = ROUND(v_tot / v_per, 0);
        SET v_app = DATE_ADD('2023-01-01', INTERVAL FLOOR(i * 3.5) DAY);
        IF v_app > '2025-06-30' THEN SET v_app = '2025-06-30'; END IF;
        SET v_dis = DATE_ADD(v_app, INTERVAL 2 DAY);
        SET v_mat = DATE_ADD(v_dis, INTERVAL v_per MONTH);
        SET v_pur = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(purposes, ',', 1 + (i % 20)), ',', -1));
        INSERT INTO loans (loan_number, member_id, loan_amount, interest_rate, repayment_period,
            monthly_payment, total_payable, purpose, application_date, approval_date,
            disbursement_date, maturity_date, outstanding_balance, status)
        VALUES (v_ln, v_mid, v_amt, 2.00, v_per, v_mth, v_tot, v_pur,
            v_app, v_app, v_dis, v_mat, v_tot, 'disbursed');
        SET v_lid = LAST_INSERT_ID();
        SET j = 1; SET v_rem = v_tot;
        WHILE j <= v_per DO
            SET v_due = DATE_ADD(v_dis, INTERVAL j MONTH);
            SET v_rem = v_rem - v_mth;
            IF v_rem < 0 THEN SET v_rem = 0; END IF;
            INSERT INTO loan_repayments (loan_id, due_date, amount_due, amount_paid,
                principal_portion, interest_portion, remaining_balance, penalty_amount, payment_status)
            VALUES (v_lid, v_due, v_mth, 0,
                ROUND(v_amt / v_per, 0), ROUND(v_amt * 2.00 / 100, 0),
                v_rem, 0, IF(v_due < CURDATE(), 'overdue', 'pending'));
            SET j = j + 1;
        END WHILE;
        SET i = i + 1;
    END WHILE;

    SET i = 1;
    WHILE i <= 50 DO
        SET v_ln = CONCAT('LN', LPAD(200 + i, 5, '0'));
        SET v_mid = 200 + i;
        SET v_amt = 300000 + ((i % 5) * 200000);
        SET v_per = 6 + ((i % 3) * 3);
        SET v_tot = v_amt + (v_amt * 2.00 / 100 * v_per);
        SET v_mth = ROUND(v_tot / v_per, 0);
        SET v_app = DATE_ADD('2025-10-01', INTERVAL i DAY);
        SET v_pur = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(purposes, ',', 1 + (i % 20)), ',', -1));
        INSERT INTO loans (loan_number, member_id, loan_amount, interest_rate, repayment_period,
            monthly_payment, total_payable, purpose, application_date, outstanding_balance, status)
        VALUES (v_ln, v_mid, v_amt, 2.00, v_per, v_mth, v_tot, v_pur, v_app, v_tot, 'pending');
        SET i = i + 1;
    END WHILE;
END$$

DELIMITER ;

CALL seed_loans();
DROP PROCEDURE IF EXISTS seed_loans;

-- ============================================================
-- OVERDUE LOAN REPAYMENTS (for penalty demo)
-- Mark repayments for loans 1-30 as overdue with 2% monthly penalty
-- ============================================================
UPDATE loan_repayments lr
JOIN loans l ON lr.loan_id = l.loan_id
SET
    lr.payment_status = 'overdue',
    lr.penalty_amount = ROUND(
        lr.amount_due * 0.02 * GREATEST(1, TIMESTAMPDIFF(MONTH, lr.due_date, CURDATE())),
        0
    )
WHERE l.loan_id BETWEEN 1 AND 30
  AND lr.due_date < DATE_SUB(CURDATE(), INTERVAL 1 MONTH);

-- Update outstanding balance on those loans to include penalties
UPDATE loans l
JOIN (
    SELECT loan_id, SUM(penalty_amount) AS total_penalty
    FROM loan_repayments
    WHERE loan_id BETWEEN 1 AND 30
      AND payment_status = 'overdue'
    GROUP BY loan_id
) p ON l.loan_id = p.loan_id
SET l.outstanding_balance = l.total_payable + p.total_penalty
WHERE l.loan_id BETWEEN 1 AND 30;

-- ============================================================
-- DIVIDENDS 2024 (15,000,000 UGX profit)
-- ============================================================
INSERT INTO dividends (member_id, financial_year, average_savings, total_sacco_savings,
    savings_percentage, total_profit, dividend_amount, payment_status)
SELECT a.member_id, '2024', a.current_balance,
    (SELECT SUM(current_balance) FROM accounts),
    ROUND((a.current_balance / (SELECT SUM(current_balance) FROM accounts)) * 100, 4),
    15000000,
    ROUND((a.current_balance / (SELECT SUM(current_balance) FROM accounts)) * 15000000, 0),
    'approved'
FROM accounts a
JOIN members m ON a.member_id = m.member_id
WHERE m.membership_status = 'active'
LIMIT 1000;

-- ============================================================
-- VERIFICATION
-- SELECT COUNT(*) FROM members;                    -- 1000
-- SELECT FORMAT(SUM(current_balance),0) FROM accounts; -- ~155,000,000
-- SELECT COUNT(*) FROM loans WHERE status='disbursed'; -- 200
-- SELECT COUNT(*) FROM loans WHERE status='pending';   -- 50
-- SELECT member_number,full_name,gender,national_id FROM members LIMIT 20;
-- ============================================================

-- ============================================================
-- SEED NEXT OF KIN (one per member, members 1-200)
-- ============================================================
DELIMITER $

CREATE PROCEDURE seed_next_of_kin()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE v_name VARCHAR(150);
    DECLARE v_rel  VARCHAR(50);
    DECLARE v_phone VARCHAR(20);
    DECLARE v_nid   VARCHAR(20);

    -- Male names pool
    DECLARE male_names VARCHAR(1000) DEFAULT 'Kaggwa John,Ssemakula Peter,Kiggundu Paul,Mugerwa James,Kibuuka Robert,Mutebi Michael,Ssebunya Joseph,Kiwanuka Charles,Mulindwa George,Okello Henry,Ojok Samuel,Odongo Daniel,Opio Emmanuel,Otim Patrick,Ocen Richard,Oryem Andrew,Ogwang Stephen,Akena Francis,Okot Moses,Waiswa Isaac';
    -- Female names pool
    DECLARE female_names VARCHAR(1000) DEFAULT 'Nabunya Mary,Nakigozi Grace,Namukasa Sarah,Namutebi Ruth,Namusoke Esther,Nabirye Miriam,Namubiru Deborah,Nakafeero Lydia,Nalumansi Priscilla,Nakayima Hannah,Nalunga Naomi,Nantege Rachel,Namono Leah,Nasiche Abigail,Nabulungi Elizabeth,Najja Rebecca,Nakisisa Judith,Nakyeyune Dorcas,Nalwoga Phoebe,Namirembe Eunice';

    DECLARE relationships VARCHAR(100) DEFAULT 'Spouse,Parent,Sibling,Child';
    DECLARE prefixes VARCHAR(100) DEFAULT '0700,0752,0772,0782,0756,0776,0701,0703';

    WHILE i <= 200 DO
        -- Alternate male/female
        IF (i % 2 = 1) THEN
            SET v_name = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(male_names, ',', 1 + ((i-1) % 20)), ',', -1));
        ELSE
            SET v_name = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(female_names, ',', 1 + ((i-1) % 20)), ',', -1));
        END IF;

        SET v_rel   = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(relationships, ',', 1 + ((i-1) % 4)), ',', -1));
        SET v_phone = CONCAT(
            TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(prefixes, ',', 1 + ((i-1) % 8)), ',', -1)),
            LPAD(900000 + i, 6, '0')
        );
        SET v_nid = CONCAT('CM', LPAD(i + 5000, 7, '0'), 'A');

        INSERT INTO next_of_kin (member_id, full_name, relationship, phone_number, national_id, address)
        VALUES (i, v_name, v_rel, v_phone, v_nid,
            CONCAT('Village ', i, ', Mubende District, Uganda'));

        SET i = i + 1;
    END WHILE;
END$

DELIMITER ;

CALL seed_next_of_kin();
DROP PROCEDURE IF EXISTS seed_next_of_kin;

-- ============================================================
-- SEED COLLATERAL (one per disbursed loan, loans 1-200)
-- ============================================================
DELIMITER $

CREATE PROCEDURE seed_collateral()
BEGIN
    DECLARE i INT DEFAULT 1;
    DECLARE v_lid INT;
    DECLARE v_mid INT;
    DECLARE v_amt DECIMAL(15,2);
    DECLARE v_ctype VARCHAR(50);
    DECLARE v_desc  VARCHAR(255);
    DECLARE v_val   DECIMAL(15,2);
    DECLARE v_docref VARCHAR(100);

    DECLARE ctypes VARCHAR(300) DEFAULT 'Land Title,Vehicle Logbook,Building,Equipment,Livestock,Salary Slip,Guarantor';
    DECLARE multipliers VARCHAR(100) DEFAULT '2.5,2.0,3.0,1.8,1.5,1.6,2.2';

    WHILE i <= 200 DO
        -- Get loan details
        SELECT loan_id, member_id, loan_amount
        INTO v_lid, v_mid, v_amt
        FROM loans WHERE loan_id = i LIMIT 1;

        IF v_lid IS NOT NULL THEN
            SET v_ctype = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(ctypes, ',', 1 + ((i-1) % 7)), ',', -1));

            CASE v_ctype
                WHEN 'Land Title' THEN
                    SET v_desc = CONCAT('Land title for plot in ', ELT(1+(i%5),'Mubende','Kasambya','Kitenga','Madudu','Kiganda'), ' measuring ', 50+(i%50), ' decimals');
                WHEN 'Vehicle Logbook' THEN
                    SET v_desc = CONCAT('Vehicle logbook - ', ELT(1+(i%4),'Toyota Corolla','Nissan Hardbody','Toyota Hiace','Isuzu Pickup'), ' Reg. U', LPAD(i+100, 4,'0'), 'X');
                WHEN 'Building' THEN
                    SET v_desc = CONCAT('Residential building at ', ELT(1+(i%5),'Mubende Town','Kasambya TC','Kitenga','Madudu TC','Butoloogo'), ', ', 2+(i%4), ' rooms');
                WHEN 'Equipment' THEN
                    SET v_desc = CONCAT(ELT(1+(i%4),'Grinding mill','Welding machine','Generator set','Water pump'), ' SN-', LPAD(i*7, 6,'0'));
                WHEN 'Livestock' THEN
                    SET v_desc = CONCAT(3+(i%5), ' ', ELT(1+(i%3),'dairy cows','goats','pigs'), ' at ', ELT(1+(i%4),'Kasambya','Kitenga','Madudu','Kiganda'), ' farm');
                WHEN 'Salary Slip' THEN
                    SET v_desc = CONCAT('Salary slip - ', ELT(1+(i%4),'Teacher','Nurse','Civil Servant','Bank Staff'), ', ', ELT(1+(i%3),'Mubende District','Kasambya Sub-county','Kitenga Health Centre'), ', 3 months');
                ELSE
                    SET v_desc = CONCAT('Guarantor: ', ELT(1+(i%4),'Kaggwa John','Nabunya Mary','Ssemakula Peter','Nakigozi Grace'), ' - Member MRS', LPAD(200+i, 4,'0'));
            END CASE;

            -- Estimated value: 1.5x to 3x loan amount
            SET v_val = ROUND(v_amt * (1.5 + ((i % 4) * 0.5)), 0);
            SET v_docref = CONCAT(UPPER(LEFT(v_ctype,3)), '-', YEAR(CURDATE()), '-', LPAD(i, 5,'0'));

            INSERT INTO collateral (loan_id, member_id, collateral_type, description, estimated_value, document_ref, status)
            VALUES (v_lid, v_mid, v_ctype, v_desc, v_val, v_docref, 'active');
        END IF;

        SET v_lid = NULL;
        SET i = i + 1;
    END WHILE;
END$

DELIMITER ;

CALL seed_collateral();
DROP PROCEDURE IF EXISTS seed_collateral;
