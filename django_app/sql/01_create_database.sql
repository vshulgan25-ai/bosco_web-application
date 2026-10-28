-- Створення бази даних і користувача MySQL (виконується від імені root)
CREATE DATABASE IF NOT EXISTS bosco_scholarships
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'bosco'@'localhost' IDENTIFIED BY 'bosco_password';
GRANT ALL PRIVILEGES ON bosco_scholarships.* TO 'bosco'@'localhost';
FLUSH PRIVILEGES;
