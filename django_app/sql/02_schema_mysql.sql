-- Довідкова DDL-схема таблиць застосунку scholarships (підсумок міграцій 0001–0004).
-- Штатний спосіб створення схеми: python manage.py migrate
USE bosco_scholarships;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS scholarships_applicationperiod (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    academic_year VARCHAR(9) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    results_date DATE NOT NULL,
    results_published TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scholarships_program (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    kind VARCHAR(20) NOT NULL,
    description LONGTEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    amount_note VARCHAR(50) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scholarships_studentprofile (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    `group` VARCHAR(20) NOT NULL DEFAULT '',
    course SMALLINT UNSIGNED NULL,  -- 1 або 2
    patronymic VARCHAR(100) NOT NULL DEFAULT '',
    phone VARCHAR(20) NOT NULL DEFAULT '',
    photo VARCHAR(100) NOT NULL DEFAULT '',
    user_id INT NOT NULL UNIQUE,
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES auth_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scholarships_application (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    motivation LONGTEXT NOT NULL,
    submitted_at DATETIME(6) NOT NULL,
    student_id INT NOT NULL,
    period_id BIGINT NOT NULL,
    UNIQUE KEY uq_application_student_period (student_id, period_id),
    CONSTRAINT fk_app_student FOREIGN KEY (student_id) REFERENCES auth_user (id) ON DELETE CASCADE,
    CONSTRAINT fk_app_period FOREIGN KEY (period_id) REFERENCES scholarships_applicationperiod (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scholarships_portfolioitem (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    file VARCHAR(100) NOT NULL,
    application_id BIGINT NOT NULL,
    CONSTRAINT fk_portfolio_app FOREIGN KEY (application_id) REFERENCES scholarships_application (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scholarships_applicationchoice (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    status VARCHAR(10) NOT NULL DEFAULT 'pending',
    comment LONGTEXT NOT NULL,
    decided_at DATETIME(6) NULL,
    application_id BIGINT NOT NULL,
    program_id BIGINT NOT NULL,
    UNIQUE KEY uq_choice_app_program (application_id, program_id),
    CONSTRAINT fk_choice_app FOREIGN KEY (application_id) REFERENCES scholarships_application (id) ON DELETE CASCADE,
    CONSTRAINT fk_choice_program FOREIGN KEY (program_id) REFERENCES scholarships_program (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS scholarships_scholarship (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    academic_year VARCHAR(9) NOT NULL,
    sponsor VARCHAR(200) NOT NULL DEFAULT '',
    issued_at DATE NOT NULL,
    choice_id BIGINT NULL UNIQUE,
    program_id BIGINT NOT NULL,
    student_id INT NOT NULL,
    KEY idx_scholarship_year (academic_year),
    CONSTRAINT fk_sch_choice FOREIGN KEY (choice_id) REFERENCES scholarships_applicationchoice (id) ON DELETE SET NULL,
    CONSTRAINT fk_sch_program FOREIGN KEY (program_id) REFERENCES scholarships_program (id),
    CONSTRAINT fk_sch_student FOREIGN KEY (student_id) REFERENCES auth_user (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
