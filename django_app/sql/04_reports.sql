-- Звітні представлення (виконувати після migrate)
USE bosco_scholarships;

CREATE OR REPLACE VIEW v_scholars_overview AS
SELECT u.id AS user_id,
       u.last_name, u.first_name,
       p.`group` AS student_group, p.course,
       s.academic_year,
       pr.name AS program_name, pr.kind AS program_kind,
       s.amount, s.sponsor, s.issued_at
FROM scholarships_scholarship s
JOIN auth_user u ON u.id = s.student_id
LEFT JOIN scholarships_studentprofile p ON p.user_id = u.id
JOIN scholarships_program pr ON pr.id = s.program_id;

CREATE OR REPLACE VIEW v_applications_summary AS
SELECT per.academic_year, pr.name AS program_name, c.status, COUNT(*) AS total
FROM scholarships_applicationchoice c
JOIN scholarships_application a ON a.id = c.application_id
JOIN scholarships_applicationperiod per ON per.id = a.period_id
JOIN scholarships_program pr ON pr.id = c.program_id
GROUP BY per.academic_year, pr.name, c.status;
