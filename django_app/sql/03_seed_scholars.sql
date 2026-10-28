-- Початкові дані: програми, набір 2025/2026 та стипендіати (виконувати після migrate).
-- Паролі збережено у вигляді PBKDF2-SHA256 хешів Django (початковий пароль: Bosco2026!).
USE bosco_scholarships;
SET NAMES utf8mb4;
START TRANSACTION;

INSERT INTO scholarships_program (name, kind, description, amount, amount_note)
SELECT 'Стипендія на навчання','tuition','Часткова оплата навчання в Центрі професійної освіти Боско за модуль.',10000,'за модуль' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM scholarships_program WHERE kind='tuition');
INSERT INTO scholarships_program (name, kind, description, amount, amount_note)
SELECT 'Стипендія на колегіум','collegium','Покриття проживання в колегіумі.',4000,'' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM scholarships_program WHERE kind='collegium');
INSERT INTO scholarships_program (name, kind, description, amount, amount_note)
SELECT 'Харчування в кафе «Мама Маргарита»','cafe','Харчування в кафе «Мама Маргарита».',200,'щодня' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM scholarships_program WHERE kind='cafe');

INSERT INTO scholarships_applicationperiod (title, academic_year, start_date, end_date, results_date, results_published)
SELECT 'Набір на стипендії 2025/2026','2025/2026','2025-09-01','2025-12-24','2026-01-31',1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM scholarships_applicationperiod WHERE title='Набір на стипендії 2025/2026');


-- Шульган Вероніка
INSERT INTO auth_user (password, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined)
SELECT 'pbkdf2_sha256$1000000$cmF1bClwCxODcPFimkFnwW$cE9fLunkJ/S32dKwPs7zHGB7aG5CiyPadolFmpje/ZU=',0,'shulhan.veronika','Вероніка','Шульган','',0,1,NOW(6) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM auth_user WHERE username='shulhan.veronika');
INSERT INTO scholarships_studentprofile (`group`, course, patronymic, phone, photo, user_id)
SELECT 'ІТ-22',2,'','','',id FROM auth_user WHERE username='shulhan.veronika'
ON DUPLICATE KEY UPDATE `group`=VALUES(`group`), course=VALUES(course);
INSERT INTO scholarships_application (motivation, submitted_at, student_id, period_id)
SELECT 'Заявка стипендіата 2025/2026 навчального року.', '2025-09-15 10:00:00', u.id, p.id
FROM auth_user u JOIN scholarships_applicationperiod p ON p.title='Набір на стипендії 2025/2026'
WHERE u.username='shulhan.veronika' AND NOT EXISTS (SELECT 1 FROM scholarships_application a WHERE a.student_id=u.id AND a.period_id=p.id);
INSERT INTO scholarships_applicationchoice (status, comment, decided_at, application_id, program_id)
SELECT 'approved','Вітаємо зі стипендією!','2026-01-31 09:00:00', a.id, pr.id
FROM scholarships_application a JOIN auth_user u ON u.id=a.student_id JOIN scholarships_program pr ON pr.kind='collegium'
WHERE u.username='shulhan.veronika' AND NOT EXISTS (SELECT 1 FROM scholarships_applicationchoice c WHERE c.application_id=a.id AND c.program_id=pr.id);
INSERT INTO scholarships_scholarship (amount, academic_year, sponsor, issued_at, choice_id, program_id, student_id)
SELECT pr.amount,'2025/2026','','2026-01-31', c.id, pr.id, u.id
FROM scholarships_applicationchoice c JOIN scholarships_application a ON a.id=c.application_id
JOIN auth_user u ON u.id=a.student_id JOIN scholarships_program pr ON pr.id=c.program_id
WHERE u.username='shulhan.veronika' AND pr.kind='collegium' AND NOT EXISTS (SELECT 1 FROM scholarships_scholarship x WHERE x.choice_id=c.id);
INSERT INTO scholarships_applicationchoice (status, comment, decided_at, application_id, program_id)
SELECT 'approved','Вітаємо зі стипендією!','2026-01-31 09:00:00', a.id, pr.id
FROM scholarships_application a JOIN auth_user u ON u.id=a.student_id JOIN scholarships_program pr ON pr.kind='tuition'
WHERE u.username='shulhan.veronika' AND NOT EXISTS (SELECT 1 FROM scholarships_applicationchoice c WHERE c.application_id=a.id AND c.program_id=pr.id);
INSERT INTO scholarships_scholarship (amount, academic_year, sponsor, issued_at, choice_id, program_id, student_id)
SELECT pr.amount,'2025/2026','','2026-01-31', c.id, pr.id, u.id
FROM scholarships_applicationchoice c JOIN scholarships_application a ON a.id=c.application_id
JOIN auth_user u ON u.id=a.student_id JOIN scholarships_program pr ON pr.id=c.program_id
WHERE u.username='shulhan.veronika' AND pr.kind='tuition' AND NOT EXISTS (SELECT 1 FROM scholarships_scholarship x WHERE x.choice_id=c.id);
INSERT INTO scholarships_applicationchoice (status, comment, decided_at, application_id, program_id)
SELECT 'approved','Вітаємо зі стипендією!','2026-01-31 09:00:00', a.id, pr.id
FROM scholarships_application a JOIN auth_user u ON u.id=a.student_id JOIN scholarships_program pr ON pr.kind='cafe'
WHERE u.username='shulhan.veronika' AND NOT EXISTS (SELECT 1 FROM scholarships_applicationchoice c WHERE c.application_id=a.id AND c.program_id=pr.id);
INSERT INTO scholarships_scholarship (amount, academic_year, sponsor, issued_at, choice_id, program_id, student_id)
SELECT pr.amount,'2025/2026','','2026-01-31', c.id, pr.id, u.id
FROM scholarships_applicationchoice c JOIN scholarships_application a ON a.id=c.application_id
JOIN auth_user u ON u.id=a.student_id JOIN scholarships_program pr ON pr.id=c.program_id
WHERE u.username='shulhan.veronika' AND pr.kind='cafe' AND NOT EXISTS (SELECT 1 FROM scholarships_scholarship x WHERE x.choice_id=c.id);

-- Федаш Тереза
INSERT INTO auth_user (password, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined)
SELECT 'pbkdf2_sha256$1000000$cmF1bClwCxODcPFimkFnwW$cE9fLunkJ/S32dKwPs7zHGB7aG5CiyPadolFmpje/ZU=',0,'fedash.tereza','Тереза','Федаш','',0,1,NOW(6) FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM auth_user WHERE username='fedash.tereza');
INSERT INTO scholarships_studentprofile (`group`, course, patronymic, phone, photo, user_id)
SELECT 'ІТ-21',2,'','','',id FROM auth_user WHERE username='fedash.tereza'
ON DUPLICATE KEY UPDATE `group`=VALUES(`group`), course=VALUES(course);
INSERT INTO scholarships_application (motivation, submitted_at, student_id, period_id)
SELECT 'Заявка стипендіата 2025/2026 навчального року.', '2025-09-15 10:00:00', u.id, p.id
FROM auth_user u JOIN scholarships_applicationperiod p ON p.title='Набір на стипендії 2025/2026'
WHERE u.username='fedash.tereza' AND NOT EXISTS (SELECT 1 FROM scholarships_application a WHERE a.student_id=u.id AND a.period_id=p.id);
INSERT INTO scholarships_applicationchoice (status, comment, decided_at, application_id, program_id)
SELECT 'approved','Вітаємо зі стипендією!','2026-01-31 09:00:00', a.id, pr.id
FROM scholarships_application a JOIN auth_user u ON u.id=a.student_id JOIN scholarships_program pr ON pr.kind='tuition'
WHERE u.username='fedash.tereza' AND NOT EXISTS (SELECT 1 FROM scholarships_applicationchoice c WHERE c.application_id=a.id AND c.program_id=pr.id);
INSERT INTO scholarships_scholarship (amount, academic_year, sponsor, issued_at, choice_id, program_id, student_id)
SELECT pr.amount,'2025/2026','','2026-01-31', c.id, pr.id, u.id
FROM scholarships_applicationchoice c JOIN scholarships_application a ON a.id=c.application_id
JOIN auth_user u ON u.id=a.student_id JOIN scholarships_program pr ON pr.id=c.program_id
WHERE u.username='fedash.tereza' AND pr.kind='tuition' AND NOT EXISTS (SELECT 1 FROM scholarships_scholarship x WHERE x.choice_id=c.id);
INSERT INTO scholarships_applicationchoice (status, comment, decided_at, application_id, program_id)
SELECT 'approved','Вітаємо зі стипендією!','2026-01-31 09:00:00', a.id, pr.id
FROM scholarships_application a JOIN auth_user u ON u.id=a.student_id JOIN scholarships_program pr ON pr.kind='cafe'
WHERE u.username='fedash.tereza' AND NOT EXISTS (SELECT 1 FROM scholarships_applicationchoice c WHERE c.application_id=a.id AND c.program_id=pr.id);
INSERT INTO scholarships_scholarship (amount, academic_year, sponsor, issued_at, choice_id, program_id, student_id)
SELECT pr.amount,'2025/2026','','2026-01-31', c.id, pr.id, u.id
FROM scholarships_applicationchoice c JOIN scholarships_application a ON a.id=c.application_id
JOIN auth_user u ON u.id=a.student_id JOIN scholarships_program pr ON pr.id=c.program_id
WHERE u.username='fedash.tereza' AND pr.kind='cafe' AND NOT EXISTS (SELECT 1 FROM scholarships_scholarship x WHERE x.choice_id=c.id);

COMMIT;
