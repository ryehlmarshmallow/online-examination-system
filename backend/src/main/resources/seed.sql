-- noinspection SqlWithoutWhereForFile

-- Seed credentials for testing:
-- All accounts use password: password
-- Main User: test / password
-- Staff: staff_01, staff_02, staff_03
-- Students: student_01, student_02, ..., student_10

-- Cleanup existing data (Resilient Cleanup)
DROP TABLE IF EXISTS pool_question_groups CASCADE;
DROP TABLE IF EXISTS exam_template_question_groups CASCADE;
DROP TABLE IF EXISTS pools CASCADE;
DROP TABLE IF EXISTS pool_folders CASCADE;
DROP TABLE IF EXISTS exam_templates CASCADE;
DROP TABLE IF EXISTS exam_template_folders CASCADE;

DELETE
FROM question_responses;
DELETE
FROM exam_attempts;
DELETE
FROM notifications;
DELETE
FROM classroom_invites;
DELETE
FROM question_set_question_groups;
DELETE
FROM question_sets;
DELETE
FROM base_contents;
DELETE
FROM hierarchy_nodes;
DELETE
FROM classroom_members;
DELETE
FROM exam_question_groups;
DELETE
FROM exams;
DELETE
FROM exam_groups;
DELETE
FROM classrooms;
DELETE
FROM classroom_groups;
DELETE
FROM questions;
DELETE
FROM question_groups;
DELETE
FROM users;

-- Users
INSERT INTO users (id, username, first_name, middle_name, last_name, password_hash, email, created_at, role_name,
                   is_enabled, is_locked)
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'test', 'Test', 'Account', 'Main',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'test@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('b8b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b301', 'staff_01', 'Staff', 'Role', 'One',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'staff01@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('b8b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b302', 'staff_02', 'Staff', 'Role', 'Two',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'staff02@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('b8b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b303', 'staff_03', 'Staff', 'Role', 'Three',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'staff03@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('b8b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b304', 'owner_01', 'Owner', 'Role', 'One',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'owner01@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('c1b2c3d4-e5f6-4a5b-8c9d-000000000001', 'student_01', 'Student', NULL, '01',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'student01@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('c1b2c3d4-e5f6-4a5b-8c9d-000000000002', 'student_02', 'Student', NULL, '02',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'student02@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('c1b2c3d4-e5f6-4a5b-8c9d-000000000003', 'student_03', 'Student', NULL, '03',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'student03@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('c1b2c3d4-e5f6-4a5b-8c9d-000000000004', 'student_04', 'Student', NULL, '04',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'student04@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('c1b2c3d4-e5f6-4a5b-8c9d-000000000005', 'student_05', 'Student', NULL, '05',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'student05@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('c1b2c3d4-e5f6-4a5b-8c9d-000000000006', 'student_06', 'Student', NULL, '06',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'student06@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('c1b2c3d4-e5f6-4a5b-8c9d-000000000007', 'student_07', 'Student', NULL, '07',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'student07@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('c1b2c3d4-e5f6-4a5b-8c9d-000000000008', 'student_08', 'Student', NULL, '08',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'student08@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('c1b2c3d4-e5f6-4a5b-8c9d-000000000009', 'student_09', 'Student', NULL, '09',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'student09@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('c1b2c3d4-e5f6-4a5b-8c9d-000000000010', 'student_10', 'Student', NULL, '10',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'student10@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('c1b2c3d4-e5f6-4a5b-8c9d-000000000011', 'student_11', 'Student', NULL, '11',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'student11@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('c1b2c3d4-e5f6-4a5b-8c9d-000000000012', 'student_12', 'Student', NULL, '12',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'student12@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE),
       ('c1b2c3d4-e5f6-4a5b-8c9d-000000000013', 'student_13', 'Student', NULL, '13',
        '$2a$12$dqJ/zqpUjtgjjMXMsfKL1eaKep9wByK9xHkx8AEuWA7ei987YikCO', 'student13@example.com', '2026-01-01T00:00:00Z',
        'USER', TRUE, FALSE);

-- Classroom Groups
INSERT INTO classroom_groups (id, name, owner_user_id, created_at, order_index)
VALUES ('d1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a1', 'Standard Group', '550e8400-e29b-41d4-a716-446655440000',
        '2026-02-01T00:00:00Z', 1000.0),
       ('d1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a2', 'Empty Group', '550e8400-e29b-41d4-a716-446655440000',
        '2026-02-01T00:00:00Z', 2000.0),
       ('d1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a3', 'Large Group', '550e8400-e29b-41d4-a716-446655440000',
        '2026-02-01T00:00:00Z', 3000.0),
       ('d1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a4',
        'Classroom Group with an Extremely Long Name That Is Intended To Test UI Text Wrapping and Potential Layout Breaks In Navigation Or List Views',
        '550e8400-e29b-41d4-a716-446655440000', '2026-02-01T00:00:00Z', 4000.0);

-- Classrooms
INSERT INTO classrooms (id, name, description, created_by, created_at)
VALUES ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'Main Classroom',
        'The primary classroom for testing exams and questions.', '550e8400-e29b-41d4-a716-446655440000',
        '2026-02-02T00:00:00Z'),
       ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b2', 'Classroom Without Group',
        'This classroom does not belong to any classroom group.', '550e8400-e29b-41d4-a716-446655440000',
        '2026-02-02T00:00:00Z'),
       ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b3',
        'Classroom with an Extremely Long Name That Is Intended To Test UI Text Wrapping and Potential Layout Breaks In Navigation Or List Views',
        'Descriptive name test.', '550e8400-e29b-41d4-a716-446655440000', '2026-02-02T00:00:00Z'),
       ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b4', 'Long Description Classroom',
        'This is a classroom with a description that is intentionally very long to test how the UI handles overflow and wrapping of long TEXT in card components or list items. It should ideally wrap or show an ellipsis depending on the design implementation in the frontend. Testing long TEXT is crucial for robust UI components.',
        '550e8400-e29b-41d4-a716-446655440000', '2026-02-02T00:00:00Z'),
       ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b5', 'Classroom 1', 'Member of Large Group',
        '550e8400-e29b-41d4-a716-446655440000', '2026-02-02T00:00:00Z'),
       ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b6', 'Classroom 2', 'Member of Large Group',
        '550e8400-e29b-41d4-a716-446655440000', '2026-02-02T00:00:00Z'),
       ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b7', 'Classroom 3', 'Member of Large Group',
        '550e8400-e29b-41d4-a716-446655440000', '2026-02-02T00:00:00Z'),
       ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b8', 'Classroom 4', 'Member of Large Group',
        '550e8400-e29b-41d4-a716-446655440000', '2026-02-02T00:00:00Z'),
       ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b9', 'Classroom 5', 'Member of Large Group',
        '550e8400-e29b-41d4-a716-446655440000', '2026-02-02T00:00:00Z'),
       ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1c6', 'Classroom 6', 'Member of Large Group',
        '550e8400-e29b-41d4-a716-446655440000', '2026-02-02T00:00:00Z'),
       ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1c7', 'Classroom 7', 'Member of Large Group',
        '550e8400-e29b-41d4-a716-446655440000', '2026-02-02T00:00:00Z'),
       ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1c8', 'Classroom 8', 'Member of Large Group',
        '550e8400-e29b-41d4-a716-446655440000', '2026-02-02T00:00:00Z'),
       ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1c9', 'Classroom 9', 'Member of Large Group',
        '550e8400-e29b-41d4-a716-446655440000', '2026-02-02T00:00:00Z'),
       ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b120', 'Staff Managed Classroom', 'Classroom where test user is staff.',
        'b8b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b304', '2026-02-02T00:00:00Z'),
       ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b121', 'Student Enrolled Classroom', 'Classroom where test user is student.',
        'b8b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b304', '2026-02-02T00:00:00Z'),
       ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b110', 'High Volume Exam Classroom',
        'This classroom contains a large number of exams for testing table pagination and scrolling.',
        '550e8400-e29b-41d4-a716-446655440000', '2026-02-02T00:00:00Z');

-- Classroom Members (Owner is 'test' user)
INSERT INTO classroom_members (id, classroom_id, user_id, role_name, can_manage_exams, can_manage_students,
                               can_manage_grades, group_id, joined_at, is_active, order_index)
VALUES (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', '550e8400-e29b-41d4-a716-446655440000', 'OWNER',
        TRUE, TRUE, TRUE, 'd1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a1', '2026-02-02T00:00:00Z', TRUE, 1000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b2', '550e8400-e29b-41d4-a716-446655440000', 'OWNER',
        TRUE, TRUE, TRUE, NULL, '2026-02-02T00:00:00Z', TRUE, 2000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b3', '550e8400-e29b-41d4-a716-446655440000', 'OWNER',
        TRUE, TRUE, TRUE, 'd1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a4', '2026-02-02T00:00:00Z', TRUE, 3000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b4', '550e8400-e29b-41d4-a716-446655440000', 'OWNER',
        TRUE, TRUE, TRUE, 'd1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a4', '2026-02-02T00:00:00Z', TRUE, 4000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b5', '550e8400-e29b-41d4-a716-446655440000', 'OWNER',
        TRUE, TRUE, TRUE, 'd1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a3', '2026-02-02T00:00:00Z', TRUE, 5000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b6', '550e8400-e29b-41d4-a716-446655440000', 'STAFF',
        TRUE, FALSE, TRUE, 'd1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a3', '2026-02-02T00:00:00Z', TRUE, 6000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b7', '550e8400-e29b-41d4-a716-446655440000', 'STUDENT',
        FALSE, FALSE, FALSE, 'd1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a3', '2026-02-02T00:00:00Z', TRUE, 7000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b8', '550e8400-e29b-41d4-a716-446655440000', 'OWNER',
        TRUE, TRUE, TRUE, 'd1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a3', '2026-02-02T00:00:00Z', TRUE, 8000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b9', '550e8400-e29b-41d4-a716-446655440000', 'STAFF',
        TRUE, FALSE, TRUE, 'd1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a3', '2026-02-02T00:00:00Z', TRUE, 9000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1c6', '550e8400-e29b-41d4-a716-446655440000', 'STUDENT',
        FALSE, FALSE, FALSE, 'd1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a3', '2026-02-02T00:00:00Z', TRUE, 10000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1c7', '550e8400-e29b-41d4-a716-446655440000', 'OWNER',
        TRUE, TRUE, TRUE, 'd1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a3', '2026-02-02T00:00:00Z', TRUE, 11000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1c8', '550e8400-e29b-41d4-a716-446655440000', 'STAFF',
        TRUE, FALSE, TRUE, 'd1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a3', '2026-02-02T00:00:00Z', TRUE, 12000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1c9', '550e8400-e29b-41d4-a716-446655440000', 'STUDENT',
        FALSE, FALSE, FALSE, 'd1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a3', '2026-02-02T00:00:00Z', TRUE, 13000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b120', 'b8b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b304', 'OWNER',
        TRUE, TRUE, TRUE, NULL, '2026-02-02T00:00:00Z', TRUE, 1000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b120', '550e8400-e29b-41d4-a716-446655440000', 'STAFF',
        TRUE, FALSE, TRUE, 'd1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a1', '2026-02-02T00:00:00Z', TRUE, 14000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b121', 'b8b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b304', 'OWNER',
        TRUE, TRUE, TRUE, NULL, '2026-02-02T00:00:00Z', TRUE, 1000.0),
       ('a1c1c1c1-c1c1-c1c1-c1c1-a1c1c1c1c121', 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b121',
        '550e8400-e29b-41d4-a716-446655440000', 'STUDENT', FALSE, FALSE, FALSE, 'd1a1a1a1-a1a1-a1a1-a1a1-d1a1a1a1a1a1',
        '2026-02-02T00:00:00Z', TRUE, 15000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b110', '550e8400-e29b-41d4-a716-446655440000', 'OWNER',
        TRUE, TRUE, TRUE, NULL, '2026-02-02T00:00:00Z', TRUE, 16000.0),
-- New Staff Members for Main Classroom
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'b8b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b301', 'STAFF',
        TRUE, FALSE, FALSE, NULL, '2026-02-02T00:00:00Z', TRUE, 17000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'b8b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b302', 'STAFF',
        FALSE, TRUE, FALSE, NULL, '2026-02-02T00:00:00Z', TRUE, 18000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'b8b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b303', 'STAFF',
        FALSE, FALSE, TRUE, NULL, '2026-02-02T00:00:00Z', TRUE, 19000.0),
-- New Student Members for Main Classroom
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'c1b2c3d4-e5f6-4a5b-8c9d-000000000001', 'STUDENT',
        FALSE, FALSE, FALSE, NULL, '2026-02-02T00:00:00Z', TRUE, 20000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'c1b2c3d4-e5f6-4a5b-8c9d-000000000002', 'STUDENT',
        FALSE, FALSE, FALSE, NULL, '2026-02-02T00:00:00Z', TRUE, 21000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'c1b2c3d4-e5f6-4a5b-8c9d-000000000003', 'STUDENT',
        FALSE, FALSE, FALSE, NULL, '2026-02-02T00:00:00Z', TRUE, 22000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'c1b2c3d4-e5f6-4a5b-8c9d-000000000004', 'STUDENT',
        FALSE, FALSE, FALSE, NULL, '2026-02-02T00:00:00Z', TRUE, 23000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'c1b2c3d4-e5f6-4a5b-8c9d-000000000005', 'STUDENT',
        FALSE, FALSE, FALSE, NULL, '2026-02-02T00:00:00Z', TRUE, 24000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'c1b2c3d4-e5f6-4a5b-8c9d-000000000006', 'STUDENT',
        FALSE, FALSE, FALSE, NULL, '2026-02-02T00:00:00Z', TRUE, 25000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'c1b2c3d4-e5f6-4a5b-8c9d-000000000007', 'STUDENT',
        FALSE, FALSE, FALSE, NULL, '2026-02-02T00:00:00Z', TRUE, 26000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'c1b2c3d4-e5f6-4a5b-8c9d-000000000008', 'STUDENT',
        FALSE, FALSE, FALSE, NULL, '2026-02-02T00:00:00Z', TRUE, 27000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'c1b2c3d4-e5f6-4a5b-8c9d-000000000009', 'STUDENT',
        FALSE, FALSE, FALSE, NULL, '2026-02-02T00:00:00Z', TRUE, 28000.0),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'c1b2c3d4-e5f6-4a5b-8c9d-000000000010', 'STUDENT',
        FALSE, FALSE, FALSE, NULL, '2026-02-02T00:00:00Z', TRUE, 29000.0);


-- Exam Groups in Main Classroom
INSERT INTO exam_groups (id, name, classroom_id, created_at)
VALUES ('f1c1c1c1-c1c1-c1c1-c1c1-f1c1c1c1c1c1', 'Standard Group', 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1',
        '2026-03-01T00:00:00Z'),
       ('f1c1c1c1-c1c1-c1c1-c1c1-f1c1c1c1c1c2', 'Empty Group', 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1',
        '2026-03-01T00:00:00Z'),
       ('f1c1c1c1-c1c1-c1c1-c1c1-f1c1c1c1c1c3',
        'Exam Group with an Extremely Long Name That Is Intended To Test UI Text Wrapping and Potential Layout Breaks In Sidebar Or Table Headers',
        'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', '2026-03-01T00:00:00Z');

-- Exams in Main Classroom
INSERT INTO exams (id, title, classroom_id, group_id, order_index, student_grade_visibility_mode,
                   student_answer_visibility_mode, start_time, end_time, duration)
VALUES ('a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d1', 'Main Test Exam', 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1',
        'f1c1c1c1-c1c1-c1c1-c1c1-f1c1c1c1c1c1', 1.0, 'VIEW_AFTER_FINISHED_EACH_ATTEMPT',
        'VIEW_AFTER_FINISHED_EACH_ATTEMPT', '2026-05-01T09:00:00Z', NULL, 660000000000),
       ('a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d7', 'Expired Exam', 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', NULL, 2.0,
        'VIEW_AFTER_FINISHED_EACH_ATTEMPT', 'VIEW_AFTER_FINISHED_EACH_ATTEMPT', '2025-01-01T09:00:00Z',
        '2025-01-01T10:00:00Z', NULL),
       ('a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d8', 'Future Exam', 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', NULL, 3.0,
        'VIEW_AFTER_FINISHED_EACH_ATTEMPT', 'VIEW_AFTER_FINISHED_EACH_ATTEMPT', '2027-01-01T09:00:00Z',
        '2027-01-01T10:00:00Z', NULL),
       ('a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d2', 'Standalone Exam (No Group)', 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1',
        NULL, 4.0, 'VIEW_AFTER_FINISHED_EACH_ATTEMPT', 'VIEW_AFTER_FINISHED_EACH_ATTEMPT', '2026-05-02T09:00:00Z',
        '2026-05-02T10:00:00Z', NULL),
       ('a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d3',
        'Exam with an Extremely Long Name That Is Intended To Test UI Text Wrapping and Potential Layout Breaks In Table Rows Or Detail Titles',
        'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1', 'f1c1c1c1-c1c1-c1c1-c1c1-f1c1c1c1c1c1', 5.0,
        'VIEW_AFTER_FINISHED_EACH_ATTEMPT', 'VIEW_AFTER_FINISHED_EACH_ATTEMPT', '2026-05-03T09:00:00Z',
        '2026-05-03T10:00:00Z', NULL),
       ('a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d4', 'Test Exam in Long Name Group', 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1',
        'f1c1c1c1-c1c1-c1c1-c1c1-f1c1c1c1c1c3', 6.0, 'VIEW_AFTER_FINISHED_EACH_ATTEMPT',
        'VIEW_AFTER_FINISHED_EACH_ATTEMPT', '2026-05-04T09:00:00Z', '2026-05-04T10:00:00Z', NULL),
       ('a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d5', 'Dummy Staff Exam', 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b120', NULL, 1.0,
        'VIEW_AFTER_FINISHED_EACH_ATTEMPT', 'VIEW_AFTER_FINISHED_EACH_ATTEMPT', '2026-05-05T09:00:00Z',
        '2026-05-05T10:00:00Z', NULL),
       ('a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d6', 'Dummy Student Exam', 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b121', NULL, 1.0,
        'VIEW_AFTER_FINISHED_EACH_ATTEMPT', 'VIEW_AFTER_FINISHED_EACH_ATTEMPT', '2026-05-06T09:00:00Z', NULL, NULL);

-- -- Question Groups and Questions for Main Test Exam & Dummy Student Exam
-- Main Test Exam Question Groups
-- 5 Independent Question Groups
INSERT INTO question_groups (id, prompt, is_group)
VALUES ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a01', '', FALSE),
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a02', '', FALSE),
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a03', '', FALSE),
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a04', '', FALSE),
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a05', '', FALSE),
-- Halving Penalty Question Group (Independent)
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a06', '', FALSE),
-- Actual Question Group (with 2 questions)
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a07', 'Section B: General Knowledge Quiz', TRUE),
-- Math Question Group (Independent)
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a08', '', FALSE),
-- Markdown & LaTeX Test Question Group (Independent)
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a09', '', FALSE);

-- Dummy Student Exam Question Groups
-- 5 Independent Question Groups
INSERT INTO question_groups (id, prompt, is_group)
VALUES ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d01', '', FALSE),
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d02', '', FALSE),
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d03', '', FALSE),
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d04', '', FALSE),
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d05', '', FALSE),
-- Halving Penalty Question Group (Independent)
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d06', '', FALSE),
-- Actual Question Group (with 2 questions)
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d07', 'Section B: General Knowledge Quiz', TRUE);

-- Link Exams to Question Groups
INSERT INTO exam_question_groups (id, exam_id, question_group_id, order_index)
VALUES
-- Main Test Exam Links
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d1', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a01', 1.0),
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d1', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a02', 2.0),
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d1', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a03', 3.0),
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d1', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a04', 4.0),
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d1', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a05', 5.0),
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d1', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a06', 6.0),
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d1', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a07', 7.0),
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d1', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a08', 8.0),
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d1', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a09', 9.0),
-- Dummy Student Exam Links
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d6', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d01', 1.0),
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d6', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d02', 2.0),
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d6', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d03', 3.0),
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d6', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d04', 4.0),
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d6', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d05', 5.0),
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d6', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d06', 6.0),
(gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d1d6', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d07', 7.0);

INSERT INTO questions (id, question_group_id, order_index, type, prompt, max_points, content, rubric)
VALUES
-- Main Test Exam Questions
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a01', 0.0, 'SINGLE_CHOICE',
 'What is the largest planet in our solar system?', 1.0,
 '{"type": "SINGLE_CHOICE", "options": [{"id": 1, "text": "Jupiter"}, {"id": 2, "text": "Saturn"}, {"id": 3, "text": "Earth"}]}',
 '{"graderType": "DICHOTOMOUS", "questionType": "SINGLE_CHOICE", "correctOptionId": 1}'),
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a02', 0.0, 'MULTIPLE_CHOICE', 'Select the prime numbers.', 2.0,
 '{"type": "MULTIPLE_CHOICE", "options": [{"id": 1, "text": "2"}, {"id": 2, "text": "4"}, {"id": 3, "text": "7"}, {"id": 4, "text": "9"}]}',
 '{"graderType": "DICHOTOMOUS", "questionType": "MULTIPLE_CHOICE", "correctOptionIds": [1, 3]}'),
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a03', 0.0, 'MULTIPLE_CHOICE',
 'Identify cities located in Europe (Weighted Scoring).', 5.0,
 '{"type": "MULTIPLE_CHOICE", "options": [{"id": 1, "text": "Paris"}, {"id": 2, "text": "London"}, {"id": 3, "text": "New York"}, {"id": 4, "text": "Tokyo"}, {"id": 5, "text": "Zurich"}, {"id": 6, "text": "Singapore"}]}',
 '{"graderType": "WEIGHTED", "questionType": "MULTIPLE_CHOICE", "optionWeights": {"1": 2.0, "2": 2.0, "3": -1.5, "4": -1.5, "5": 1.0, "6": 0.0}, "allowNegativeWeights": true}'),
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a04', 0.0, 'ESSAY', 'Explain the concept of photosynthesis.', 5.0,
 '{"type": "ESSAY", "minWords": 10, "maxWords": 100, "maxCharacters": 1000}',
 '{"graderType": "MANUAL", "questionType": "ESSAY"}'),
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a05', 0.0, 'FILE', 'Upload your lab report (PDF only).', 10.0,
 '{"type": "FILE", "allowedExtensions": ["pdf"], "maxFileSizeMegabytes": 5, "maxFileCount": 1}',
 '{"graderType": "MANUAL", "questionType": "FILE"}'),
-- Halving Question
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a06', 0.0, 'MULTIPLE_CHOICE',
 'Select the programming languages that are statically typed (Halving Penalty).', 4.0,
 '{"type": "MULTIPLE_CHOICE", "options": [{"id": 1, "text": "Java"}, {"id": 2, "text": "Python"}, {"id": 3, "text": "Kotlin"}, {"id": 4, "text": "JavaScript"}]}',
 '{"graderType": "HALVING", "questionType": "MULTIPLE_CHOICE", "correctOptionIds": [1, 3]}'),
-- Actual Question Group Questions
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a07', 0.0, 'SINGLE_CHOICE',
 'What is the chemical symbol for gold?', 2.0,
 '{"type": "SINGLE_CHOICE", "options": [{"id": 1, "text": "Au"}, {"id": 2, "text": "Ag"}, {"id": 3, "text": "Fe"}, {"id": 4, "text": "Cu"}]}',
 '{"graderType": "DICHOTOMOUS", "questionType": "SINGLE_CHOICE", "correctOptionId": 1}'),
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a07', 1.0, 'MULTIPLE_CHOICE', 'Select the noble gases.', 3.0,
 '{"type": "MULTIPLE_CHOICE", "options": [{"id": 1, "text": "Helium"}, {"id": 2, "text": "Neon"}, {"id": 3, "text": "Oxygen"}, {"id": 4, "text": "Nitrogen"}]}',
 '{"graderType": "DICHOTOMOUS", "questionType": "MULTIPLE_CHOICE", "correctOptionIds": [1, 2]}'),
-- Math Question (LaTeX formatting)
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a08', 0.0, 'SINGLE_CHOICE', 'Solve the quadratic equation for $x$:

$$x^2 - 5x + 6 = 0$$', 2.0,
 '{"type": "SINGLE_CHOICE", "options": [{"id": 1, "text": "$x = 2$ or $x = 3$"}, {"id": 2, "text": "$x = -2$ or $x = -3$"}, {"id": 3, "text": "$x = 1$ or $x = 5$"}, {"id": 4, "text": "$x = -1$ or $x = -6$"}]}',
 '{"graderType": "DICHOTOMOUS", "questionType": "SINGLE_CHOICE", "correctOptionId": 1}'),
-- Markdown & LaTeX Test Question (Multiple Choice)
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a09', 0.0, 'MULTIPLE_CHOICE', '### Markdown & LaTeX Visual Rendering Test

This question contains **various types** of Markdown formatting and LaTeX expressions to verify the layout rendering of our `MarkdownRenderer`.

#### 1. Formatting Styles
- **Bold text** using double asterisks.
- *Italic text* using single asterisks.
- `inline code blocks` using single backticks.

#### 2. Code Block Integration
Here is a code block showing a mathematical solver:
```javascript
// Evaluates the quadratic formula determinant
function getDiscriminant(a, b, c) {
  return b * b - 4 * a * c;
}
```

#### 3. LaTeX Math Equations
- **Inline Equation**: The standard normal distribution probability density function is represented as $f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{1}{2}\left(\frac{x-\mu}{\sigma}\right)^2}$.
- **Block Equation**:

  $$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$

**Question:** Which of the options below correctly displays both Markdown styles and math?', 5.0,
 '{"type": "MULTIPLE_CHOICE", "options": [{"id": 1, "text": "Option A: Contains bold **Markdown** and inline math: $\\sin^2\\theta + \\cos^2\\theta = 1$"}, {"id": 2, "text": "Option B: Contains list item formatting and a block equation:\n\n$$\\lim_{x \\to \\infty} \\left(1 + \\frac{1}{x}\\right)^x = e$$"}, {"id": 3, "text": "Option C: Contains inline code: `const pi = Math.PI;` and $\\pi \\approx 3.14159$"}, {"id": 4, "text": "Option D: All of the above options render correctly."}]}',
 '{"graderType": "DICHOTOMOUS", "questionType": "MULTIPLE_CHOICE", "correctOptionIds": [1, 2, 3, 4]}'),

-- Dummy Student Exam Questions
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d01', 0.0, 'SINGLE_CHOICE',
 'What is the largest planet in our solar system?', 1.0,
 '{"type": "SINGLE_CHOICE", "options": [{"id": 1, "text": "Jupiter"}, {"id": 2, "text": "Saturn"}, {"id": 3, "text": "Earth"}]}',
 '{"graderType": "DICHOTOMOUS", "questionType": "SINGLE_CHOICE", "correctOptionId": 1}'),
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d02', 0.0, 'MULTIPLE_CHOICE', 'Select the prime numbers.', 2.0,
 '{"type": "MULTIPLE_CHOICE", "options": [{"id": 1, "text": "2"}, {"id": 2, "text": "4"}, {"id": 3, "text": "7"}, {"id": 4, "text": "9"}]}',
 '{"graderType": "DICHOTOMOUS", "questionType": "MULTIPLE_CHOICE", "correctOptionIds": [1, 3]}'),
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d03', 0.0, 'MULTIPLE_CHOICE',
 'Identify cities located in Europe (Weighted Scoring).', 5.0,
 '{"type": "MULTIPLE_CHOICE", "options": [{"id": 1, "text": "Paris"}, {"id": 2, "text": "London"}, {"id": 3, "text": "New York"}, {"id": 4, "text": "Tokyo"}, {"id": 5, "text": "Zurich"}, {"id": 6, "text": "Singapore"}]}',
 '{"graderType": "WEIGHTED", "questionType": "MULTIPLE_CHOICE", "optionWeights": {"1": 2.0, "2": 2.0, "3": -1.5, "4": -1.5, "5": 1.0, "6": 0.0}, "allowNegativeWeights": true}'),
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d04', 0.0, 'ESSAY', 'Explain the concept of photosynthesis.', 5.0,
 '{"type": "ESSAY", "minWords": 10, "maxWords": 100, "maxCharacters": 1000}',
 '{"graderType": "MANUAL", "questionType": "ESSAY"}'),
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d05', 0.0, 'FILE', 'Upload your lab report (PDF only).', 10.0,
 '{"type": "FILE", "allowedExtensions": ["pdf"], "maxFileSizeMegabytes": 5, "maxFileCount": 1}',
 '{"graderType": "MANUAL", "questionType": "FILE"}'),
-- Halving Question
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d06', 0.0, 'MULTIPLE_CHOICE',
 'Select the programming languages that are statically typed (Halving Penalty).', 4.0,
 '{"type": "MULTIPLE_CHOICE", "options": [{"id": 1, "text": "Java"}, {"id": 2, "text": "Python"}, {"id": 3, "text": "Kotlin"}, {"id": 4, "text": "JavaScript"}]}',
 '{"graderType": "HALVING", "questionType": "MULTIPLE_CHOICE", "correctOptionIds": [1, 3]}'),
-- Actual Question Group Questions
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d07', 0.0, 'SINGLE_CHOICE',
 'What is the chemical symbol for gold?', 2.0,
 '{"type": "SINGLE_CHOICE", "options": [{"id": 1, "text": "Au"}, {"id": 2, "text": "Ag"}, {"id": 3, "text": "Fe"}, {"id": 4, "text": "Cu"}]}',
 '{"graderType": "DICHOTOMOUS", "questionType": "SINGLE_CHOICE", "correctOptionId": 1}'),
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1d07', 1.0, 'MULTIPLE_CHOICE', 'Select the noble gases.', 3.0,
 '{"type": "MULTIPLE_CHOICE", "options": [{"id": 1, "text": "Helium"}, {"id": 2, "text": "Neon"}, {"id": 3, "text": "Oxygen"}, {"id": 4, "text": "Nitrogen"}]}',
 '{"graderType": "DICHOTOMOUS", "questionType": "MULTIPLE_CHOICE", "correctOptionIds": [1, 2]}');

-- Diverse Demo Questions
INSERT INTO question_groups (id, prompt, is_group)
VALUES
-- Pool Question Groups
-- 5 Independent Question Groups
('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b01', '', FALSE),
('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b02', '', FALSE),
('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b03', '', FALSE),
('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b04', '', FALSE),
('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b05', '', FALSE),
-- Halving Penalty Question Group (Independent)
('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b06', '', FALSE),
-- Actual Question Group (with 2 questions)
('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b07', 'Section B: General Knowledge Quiz', TRUE);

INSERT INTO questions (id, question_group_id, order_index, type, prompt, max_points, content, rubric)
VALUES
-- Demo Pool Questions
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b01', 0.0, 'SINGLE_CHOICE',
 'What is the largest planet in our solar system?', 1.0,
 '{"type": "SINGLE_CHOICE", "options": [{"id": 1, "text": "Jupiter"}, {"id": 2, "text": "Saturn"}, {"id": 3, "text": "Earth"}]}',
 '{"graderType": "DICHOTOMOUS", "questionType": "SINGLE_CHOICE", "correctOptionId": 1}'),
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b02', 0.0, 'MULTIPLE_CHOICE', 'Select the prime numbers.', 2.0,
 '{"type": "MULTIPLE_CHOICE", "options": [{"id": 1, "text": "2"}, {"id": 2, "text": "4"}, {"id": 3, "text": "7"}, {"id": 4, "text": "9"}]}',
 '{"graderType": "DICHOTOMOUS", "questionType": "MULTIPLE_CHOICE", "correctOptionIds": [1, 3]}'),
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b03', 0.0, 'MULTIPLE_CHOICE',
 'Identify cities located in Europe (Weighted Scoring).', 5.0,
 '{"type": "MULTIPLE_CHOICE", "options": [{"id": 1, "text": "Paris"}, {"id": 2, "text": "London"}, {"id": 3, "text": "New York"}, {"id": 4, "text": "Tokyo"}, {"id": 5, "text": "Zurich"}, {"id": 6, "text": "Singapore"}]}',
 '{"graderType": "WEIGHTED", "questionType": "MULTIPLE_CHOICE", "optionWeights": {"1": 2.0, "2": 2.0, "3": -1.5, "4": -1.5, "5": 1.0, "6": 0.0}, "allowNegativeWeights": true}'),
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b04', 0.0, 'ESSAY', 'Explain the concept of photosynthesis.', 5.0,
 '{"type": "ESSAY", "minWords": 10, "maxWords": 100, "maxCharacters": 1000}',
 '{"graderType": "MANUAL", "questionType": "ESSAY"}'),
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b05', 0.0, 'FILE', 'Upload your lab report (PDF only).', 10.0,
 '{"type": "FILE", "allowedExtensions": ["pdf"], "maxFileSizeMegabytes": 5, "maxFileCount": 1}',
 '{"graderType": "MANUAL", "questionType": "FILE"}'),
-- Halving Question
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b06', 0.0, 'MULTIPLE_CHOICE',
 'Select the programming languages that are statically typed (Halving Penalty).', 4.0,
 '{"type": "MULTIPLE_CHOICE", "options": [{"id": 1, "text": "Java"}, {"id": 2, "text": "Python"}, {"id": 3, "text": "Kotlin"}, {"id": 4, "text": "JavaScript"}]}',
 '{"graderType": "HALVING", "questionType": "MULTIPLE_CHOICE", "correctOptionIds": [1, 3]}'),
-- Actual Question Group Questions
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b07', 0.0, 'SINGLE_CHOICE',
 'What is the chemical symbol for gold?', 2.0,
 '{"type": "SINGLE_CHOICE", "options": [{"id": 1, "text": "Au"}, {"id": 2, "text": "Ag"}, {"id": 3, "text": "Fe"}, {"id": 4, "text": "Cu"}]}',
 '{"graderType": "DICHOTOMOUS", "questionType": "SINGLE_CHOICE", "correctOptionId": 1}'),
(gen_random_uuid(), '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b07', 1.0, 'MULTIPLE_CHOICE', 'Select the noble gases.', 3.0,
 '{"type": "MULTIPLE_CHOICE", "options": [{"id": 1, "text": "Helium"}, {"id": 2, "text": "Neon"}, {"id": 3, "text": "Oxygen"}, {"id": 4, "text": "Nitrogen"}]}',
 '{"graderType": "DICHOTOMOUS", "questionType": "MULTIPLE_CHOICE", "correctOptionIds": [1, 2]}');

-- High Volume Exams (100 exams)
INSERT INTO exams (id, title, classroom_id, group_id, order_index, student_grade_visibility_mode,
                   student_answer_visibility_mode, start_time, end_time)
SELECT gen_random_uuid(),
       'exam-' || LPAD(i::TEXT, 3, '0'),
       'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b110',
       NULL,
       i::double precision,
       'VIEW_AFTER_FINISHED_EACH_ATTEMPT',
       'VIEW_AFTER_FINISHED_EACH_ATTEMPT',
       '2026-06-01T00:00:00Z',
       '2026-06-01T23:59:59Z'
FROM generate_series(1, 100) AS i;

-- Question Sets (Pool Folders)
INSERT INTO hierarchy_nodes (id, name, created_at, modified_at, parent_id, path, order_index, node_type, domain_type,
                             owner_user_id, content_id, content_type)
VALUES ('f0000000-0000-0000-0000-000000000001', 'Folder 1 (Classroom Resources)', '2026-03-01T00:00:00Z',
        '2026-03-01T00:00:00Z', NULL, 'nf0000000000000000000000000000001', 1.0, 'FOLDER', 'POOL',
        '550e8400-e29b-41d4-a716-446655440000', NULL, NULL),
       ('f0000000-0000-0000-0000-000000000002', 'Folder 2 (Exam Resources)', '2026-03-01T00:00:00Z',
        '2026-03-01T00:00:00Z', NULL, 'nf0000000000000000000000000000002', 2.0, 'FOLDER', 'POOL',
        '550e8400-e29b-41d4-a716-446655440000', NULL, NULL),
       ('f0000000-0000-0000-0000-000000000003', 'Empty Folder', '2026-03-01T00:00:00Z', '2026-03-01T00:00:00Z', NULL,
        'nf0000000000000000000000000000003', 3.0, 'FOLDER', 'POOL', '550e8400-e29b-41d4-a716-446655440000', NULL, NULL),
       ('f0000000-0000-0000-0000-000000000004', 'Deep Structure', '2026-03-01T00:00:00Z', '2026-03-01T00:00:00Z', NULL,
        'nf0000000000000000000000000000004', 4.0, 'FOLDER', 'POOL', '550e8400-e29b-41d4-a716-446655440000', NULL, NULL),
       ('f0000000-0000-0000-0000-000000000005', 'Folder with 200 Pools (Pagination Test)', '2026-03-01T00:00:00Z',
        '2026-03-01T00:00:00Z', NULL, 'nf0000000000000000000000000000005', 5.0, 'FOLDER', 'POOL',
        '550e8400-e29b-41d4-a716-446655440000', NULL, NULL),
       ('f0000000-0000-0000-0000-000000000006', 'Calculus', '2026-03-01T00:00:00Z', '2026-03-01T00:00:00Z',
        'f0000000-0000-0000-0000-000000000001', 'nf0000000000000000000000000000001.nf0000000000000000000000000000006',
        1.0, 'FOLDER', 'POOL', '550e8400-e29b-41d4-a716-446655440000', NULL, NULL);

-- Items (Pools)
INSERT INTO base_contents (id, content_type)
VALUES ('c0000000-0000-0000-0000-000000000001', 'QUESTION_SET'),
       ('c0000000-0000-0000-0000-000000000002', 'QUESTION_SET'),
       ('c0000000-0000-0000-0000-000000000003', 'QUESTION_SET'),
       ('c0000000-0000-0000-0000-000000000004', 'QUESTION_SET'),
       ('c0000000-0000-0000-0000-000000000010', 'QUESTION_SET'), -- Demo Diverse Pool
       ('c0000000-0000-0000-0000-000000000011', 'QUESTION_SET'); -- Demo Empty Pool

INSERT INTO question_sets (id)
VALUES ('c0000000-0000-0000-0000-000000000001'),
       ('c0000000-0000-0000-0000-000000000002'),
       ('c0000000-0000-0000-0000-000000000003'),
       ('c0000000-0000-0000-0000-000000000004'),
       ('c0000000-0000-0000-0000-000000000010'),
       ('c0000000-0000-0000-0000-000000000011');

INSERT INTO hierarchy_nodes (id, name, created_at, modified_at, parent_id, path, order_index, node_type, domain_type,
                             owner_user_id, content_id, content_type)
VALUES ('10000000-0000-0000-0000-000000000001', 'Calculus Basics', '2026-03-02T00:00:00Z', '2026-03-02T00:00:00Z',
        'f0000000-0000-0000-0000-000000000006',
        'nf0000000000000000000000000000001.nf0000000000000000000000000000006.n10000000000000000000000000000001', 1.0,
        'ITEM', 'POOL', '550e8400-e29b-41d4-a716-446655440000', 'c0000000-0000-0000-0000-000000000001', 'QUESTION_SET'),
       ('10000000-0000-0000-0000-000000000002', 'Algebra Intro', '2026-03-02T00:00:00Z', '2026-03-02T00:00:00Z',
        'f0000000-0000-0000-0000-000000000001', 'nf0000000000000000000000000000001.n10000000000000000000000000000002',
        2.0, 'ITEM', 'POOL', '550e8400-e29b-41d4-a716-446655440000', 'c0000000-0000-0000-0000-000000000002',
        'QUESTION_SET'),
       ('10000000-0000-0000-0000-000000000003', 'Physics Quiz Bank', '2026-03-02T00:00:00Z', '2026-03-02T00:00:00Z',
        'f0000000-0000-0000-0000-000000000002', 'nf0000000000000000000000000000002.n10000000000000000000000000000003',
        1.0, 'ITEM', 'POOL', '550e8400-e29b-41d4-a716-446655440000', 'c0000000-0000-0000-0000-000000000003',
        'QUESTION_SET'),
       ('10000000-0000-0000-0000-000000000004',
        'Question Pool with an Extremely Long Name That Is Intended To Test UI Text Wrapping and Potential Layout Breaks In Navigation Or Table Views',
        '2026-03-02T00:00:00Z', '2026-03-02T00:00:00Z', NULL, 'n10000000000000000000000000000004', 6.0, 'ITEM', 'POOL',
        '550e8400-e29b-41d4-a716-446655440000', 'c0000000-0000-0000-0000-000000000004', 'QUESTION_SET'),
       ('10000000-0000-0000-0000-000000000010', 'Demo Pool (Various Question Types)', '2026-03-02T00:00:00Z',
        '2026-03-02T00:00:00Z', NULL, 'n10000000000000000000000000000010', 7.0, 'ITEM', 'POOL',
        '550e8400-e29b-41d4-a716-446655440000', 'c0000000-0000-0000-0000-000000000010', 'QUESTION_SET'),
       ('10000000-0000-0000-0000-000000000011', 'Demo Empty Pool', '2026-03-02T00:00:00Z', '2026-03-02T00:00:00Z', NULL,
        'n10000000000000000000000000000011', 8.0, 'ITEM', 'POOL', '550e8400-e29b-41d4-a716-446655440000',
        'c0000000-0000-0000-0000-000000000011', 'QUESTION_SET');

-- Link Demo Diverse Pool to Questions
INSERT INTO question_set_question_groups (id, question_set_id, question_group_id, order_index)
VALUES (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000010', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b01', 1),
       (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000010', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b02', 2),
       (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000010', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b03', 3),
       (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000010', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b04', 4),
       (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000010', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b05', 5),
       (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000010', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b06', 6),
       (gen_random_uuid(), 'c0000000-0000-0000-0000-000000000010', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1b07', 7);

-- Deep Nesting (5 levels)
INSERT INTO hierarchy_nodes (id, name, created_at, modified_at, parent_id, path, order_index, node_type, domain_type,
                             owner_user_id, content_id, content_type)
VALUES ('f0000000-0000-0000-0000-000000000011', 'Level 2', '2026-03-03T00:00:00Z', '2026-03-03T00:00:00Z',
        'f0000000-0000-0000-0000-000000000004', 'nf0000000000000000000000000000004.nf0000000000000000000000000000011',
        1.0, 'FOLDER', 'POOL', '550e8400-e29b-41d4-a716-446655440000', NULL, NULL),
       ('f0000000-0000-0000-0000-000000000012', 'Level 3', '2026-03-03T00:00:00Z', '2026-03-03T00:00:00Z',
        'f0000000-0000-0000-0000-000000000011',
        'nf0000000000000000000000000000004.nf0000000000000000000000000000011.nf0000000000000000000000000000012', 1.0,
        'FOLDER', 'POOL', '550e8400-e29b-41d4-a716-446655440000', NULL, NULL),
       ('f0000000-0000-0000-0000-000000000013', 'Level 4', '2026-03-03T00:00:00Z', '2026-03-03T00:00:00Z',
        'f0000000-0000-0000-0000-000000000012',
        'nf0000000000000000000000000000004.nf0000000000000000000000000000011.nf0000000000000000000000000000012.nf0000000000000000000000000000013',
        1.0, 'FOLDER', 'POOL', '550e8400-e29b-41d4-a716-446655440000', NULL, NULL),
       ('f0000000-0000-0000-0000-000000000014', 'Level 5', '2026-03-03T00:00:00Z', '2026-03-03T00:00:00Z',
        'f0000000-0000-0000-0000-000000000013',
        'nf0000000000000000000000000000004.nf0000000000000000000000000000011.nf0000000000000000000000000000012.nf0000000000000000000000000000013.nf0000000000000000000000000000014',
        1.0, 'FOLDER', 'POOL', '550e8400-e29b-41d4-a716-446655440000', NULL, NULL);

-- Templates
INSERT INTO base_contents (id, content_type)
VALUES ('e0000000-0000-0000-0000-000000000c01', 'QUESTION_SET'),
       ('e0000000-0000-0000-0000-000000000c02', 'QUESTION_SET'),
       ('e0000000-0000-0000-0000-000000000c10', 'QUESTION_SET'), -- Demo Diverse Template
       ('e0000000-0000-0000-0000-000000000c11', 'QUESTION_SET'); -- Demo Empty Template

INSERT INTO question_sets (id)
VALUES ('e0000000-0000-0000-0000-000000000c01'),
       ('e0000000-0000-0000-0000-000000000c02'),
       ('e0000000-0000-0000-0000-000000000c10'),
       ('e0000000-0000-0000-0000-000000000c11');

INSERT INTO hierarchy_nodes (id, name, created_at, modified_at, parent_id, path, order_index, node_type, domain_type,
                             owner_user_id, content_id, content_type)
VALUES ('20000000-0000-0000-0000-000000000001', 'Folder 1 (Final Exams Templates)', '2026-04-01T00:00:00Z',
        '2026-04-01T00:00:00Z', NULL, 'n20000000000000000000000000000001', 1.0, 'FOLDER', 'TEMPLATE',
        '550e8400-e29b-41d4-a716-446655440000', NULL, NULL),
       ('f0000000-0000-0000-0000-000000001002', 'Folder 2 (Mock Exam Templates)', '2026-04-01T00:00:00Z',
        '2026-04-01T00:00:00Z', NULL, 'nf00000000000000000000000000001002', 2.0, 'FOLDER', 'TEMPLATE',
        '550e8400-e29b-41d4-a716-446655440000', NULL, NULL),
       ('f0000000-0000-0000-0000-000000001005', 'Folder with 200 Templates (Pagination Test)', '2026-04-01T00:00:00Z',
        '2026-04-01T00:00:00Z', NULL, 'nf00000000000000000000000000001005', 3.0, 'FOLDER', 'TEMPLATE',
        '550e8400-e29b-41d4-a716-446655440000', NULL, NULL),
       ('e0000000-0000-0000-0000-000000000001', 'Algebra Template', '2026-04-02T00:00:00Z', '2026-04-02T00:00:00Z',
        '20000000-0000-0000-0000-000000000001', 'n20000000000000000000000000000001.ne0000000000000000000000000000001',
        1.0, 'ITEM', 'TEMPLATE', '550e8400-e29b-41d4-a716-446655440000', 'e0000000-0000-0000-0000-000000000c01',
        'QUESTION_SET'),
       ('e0000000-0000-0000-0000-000000000002', 'History Midterm Template', '2026-04-02T00:00:00Z',
        '2026-04-02T00:00:00Z', NULL, 'ne0000000000000000000000000000002', 4.0, 'ITEM', 'TEMPLATE',
        '550e8400-e29b-41d4-a716-446655440000', 'e0000000-0000-0000-0000-000000000c02', 'QUESTION_SET'),
       ('e0000000-0000-0000-0000-000000000010', 'Demo Template (Various Question Types)', '2026-04-02T00:00:00Z',
        '2026-04-02T00:00:00Z', NULL, 'ne00000000000000000000000000000010', 5.0, 'ITEM', 'TEMPLATE',
        '550e8400-e29b-41d4-a716-446655440000', 'e0000000-0000-0000-0000-000000000c10', 'QUESTION_SET'),
       ('e0000000-0000-0000-0000-000000000011', 'Demo Empty Template', '2026-04-02T00:00:00Z', '2026-04-02T00:00:00Z',
        NULL, 'ne00000000000000000000000000000011', 6.0, 'ITEM', 'TEMPLATE', '550e8400-e29b-41d4-a716-446655440000',
        'e0000000-0000-0000-0000-000000000c11', 'QUESTION_SET');

-- Link Demo Diverse Template to Questions
INSERT INTO question_set_question_groups (id, question_set_id, question_group_id, order_index)
VALUES (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000c10', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a01', 1),
       (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000c10', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a02', 2),
       (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000c10', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a03', 3),
       (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000c10', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a04', 4),
       (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000c10', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a05', 5),
       (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000c10', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a06', 6),
       (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000c10', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a07', 7),
       (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000c10', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a08', 8),
       (gen_random_uuid(), 'e0000000-0000-0000-0000-000000000c10', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1a09', 9);

-- Pagination test pools
INSERT INTO base_contents (id, content_type)
SELECT ('c0000000-0000-0000-1000-' || LPAD(i::TEXT, 12, '0'))::UUID,
       'QUESTION_SET'
FROM generate_series(1, 200) AS i;

INSERT INTO question_sets (id)
SELECT ('c0000000-0000-0000-1000-' || LPAD(i::TEXT, 12, '0'))::UUID
FROM generate_series(1, 200) AS i;

INSERT INTO hierarchy_nodes (id, name, created_at, modified_at, parent_id, path, order_index, node_type, domain_type,
                             owner_user_id, content_id, content_type)
SELECT ('10000000-0000-0000-1000-' || LPAD(i::TEXT, 12, '0'))::UUID,
       'Pool ' || LPAD(i::TEXT, 3, '0'),
       '2026-05-01T00:00:00Z',
       '2026-05-01T00:00:00Z',
       'f0000000-0000-0000-0000-000000000005',
       ('nf0000000000000000000000000000005.n1000000000000001000' || LPAD(i::TEXT, 12, '0'))::LTREE,
       i::double precision,
       'ITEM',
       'POOL',
       '550e8400-e29b-41d4-a716-446655440000',
       ('c0000000-0000-0000-1000-' || LPAD(i::TEXT, 12, '0'))::UUID,
       'QUESTION_SET'
FROM generate_series(1, 200) AS i;

-- Pagination test templates
INSERT INTO base_contents (id, content_type)
SELECT ('e0000000-0000-0000-1000-' || LPAD(i::TEXT, 12, '0'))::UUID,
       'QUESTION_SET'
FROM generate_series(1, 200) AS i;

INSERT INTO question_sets (id)
SELECT ('e0000000-0000-0000-1000-' || LPAD(i::TEXT, 12, '0'))::UUID
FROM generate_series(1, 200) AS i;

INSERT INTO hierarchy_nodes (id, name, created_at, modified_at, parent_id, path, order_index, node_type, domain_type,
                             owner_user_id, content_id, content_type)
SELECT ('20000000-0000-0000-1000-' || LPAD(i::TEXT, 12, '0'))::UUID,
       'Template ' || LPAD(i::TEXT, 3, '0'),
       '2026-05-01T00:00:00Z',
       '2026-05-01T00:00:00Z',
       'f0000000-0000-0000-0000-000000001005',
       ('nf00000000000000000000000000001005.n2000000000000001000' || LPAD(i::TEXT, 12, '0'))::LTREE,
       i::DOUBLE PRECISION,
       'ITEM',
       'TEMPLATE',
       '550e8400-e29b-41d4-a716-446655440000',
       ('e0000000-0000-0000-1000-' || LPAD(i::TEXT, 12, '0'))::UUID,
       'QUESTION_SET'
FROM generate_series(1, 200) AS i;

-- New Dummy Exams for Student Enrolled Classroom
INSERT INTO exams (id, title, classroom_id, group_id, order_index, student_grade_visibility_mode,
                   student_answer_visibility_mode, start_time, end_time, duration)
VALUES ('a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d221', 'Math Quiz 1', 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b121', NULL, 2.0,
        'VIEW_AFTER_FINISHED_EACH_ATTEMPT', 'VIEW_AFTER_FINISHED_EACH_ATTEMPT', '2026-06-01T09:00:00Z',
        '2026-06-01T10:00:00Z', NULL),
       ('a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d222', 'Science Quiz 1', 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b121', NULL, 3.0,
        'VIEW_AFTER_FINISHED_EACH_ATTEMPT', 'VIEW_AFTER_FINISHED_EACH_ATTEMPT', '2026-06-02T09:00:00Z',
        '2026-06-02T10:00:00Z', NULL),
       ('a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d223', 'History Quiz 1', 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b121', NULL, 4.0,
        'VIEW_AFTER_FINISHED_EACH_ATTEMPT', 'VIEW_AFTER_FINISHED_EACH_ATTEMPT', '2026-06-03T09:00:00Z',
        '2026-06-03T10:00:00Z', NULL);

-- New Exam Question Groups (Math, Science, History)
INSERT INTO question_groups (id, prompt, is_group)
VALUES ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1c01', '', FALSE),
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1c02', '', FALSE),
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1c03', '', FALSE),
       ('7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1c04', '', FALSE);

-- Link New Exams to Question Groups
INSERT INTO exam_question_groups (id, exam_id, question_group_id, order_index)
VALUES (gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d221', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1c01', 1.0),
       (gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d222', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1c02', 1.0),
       (gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d223', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1c03', 1.0),
       (gen_random_uuid(), 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d223', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1c04', 2.0);

-- Questions for New Exams
INSERT INTO questions (id, question_group_id, order_index, type, prompt, max_points, content, rubric)
VALUES ('b1a1a1a1-1a1a-1a1a-1a1a-7f1a1a1a1c01', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1c01', 0.0, 'SINGLE_CHOICE',
        'What is 2 + 2?', 1.0,
        '{"type": "SINGLE_CHOICE", "options": [{"id": 1, "text": "3"}, {"id" : 2, "text": "4"}, {"id" : 3, "text": "5"}]}',
        '{"graderType": "DICHOTOMOUS", "questionType": "SINGLE_CHOICE", "correctOptionId": 2}'),
       ('b1a1a1a1-1a1a-1a1a-1a1a-7f1a1a1a1c02', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1c02', 0.0, 'SINGLE_CHOICE',
        'What gas do humans breathe to survive?', 1.0,
        '{"type": "SINGLE_CHOICE", "options": [{"id": 1, "text": "Oxygen"}, {"id" : 2, "text": "Carbon Dioxide"}, {"id"
 : 3, "text": "Nitrogen"}]}',
        '{"graderType": "DICHOTOMOUS", "questionType": "SINGLE_CHOICE", "correctOptionId": 1}'),
       ('b1a1a1a1-1a1a-1a1a-1a1a-7f1a1a1a1c03', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1c03', 0.0, 'SINGLE_CHOICE',
        'Who was the first president of the United States?', 2.0,
        '{"type": "SINGLE_CHOICE", "options": [{"id": 1, "text": "Thomas Jefferson"}, {"id" : 2,
 "text": "George Washington"}, {"id" : 3, "text": "Abraham Lincoln"}]}',
        '{"graderType": "DICHOTOMOUS", "questionType": "SINGLE_CHOICE", "correctOptionId": 2}'),
       ('b1a1a1a1-1a1a-1a1a-1a1a-7f1a1a1a1c04', '7f1a1a1a-1a1a-1a1a-1a1a-7f1a1a1a1c04', 0.0, 'MULTIPLE_CHOICE',
        'Select the Allied powers of World War II.', 3.0,
        '{"type": "MULTIPLE_CHOICE", "options": [{"id": 1, "text": "United Kingdom"}, {"id" : 2, "text": "Germany"}, {"id"
 : 3, "text": "Soviet Union"}, {"id" : 4, "text": "Japan"}]}',
        '{"graderType": "DICHOTOMOUS", "questionType": "MULTIPLE_CHOICE", "correctOptionIds": [1, 3]}');

-- New Classroom Owned by owner_01 (test account main is not in it)
INSERT INTO classrooms (id, name, description, created_by, created_at)
VALUES ('e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b130', 'Advanced Chemistry', 'Learn about chemical reactions and lab safety.',
        'b8b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b304', '2026-06-04T08:00:00Z');

-- Owner membership for Advanced Chemistry
INSERT INTO classroom_members (id, classroom_id, user_id, role_name, can_manage_exams, can_manage_students,
                               can_manage_grades, group_id, joined_at, is_active, order_index)
VALUES (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b130', 'b8b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b304', 'OWNER',
        TRUE, TRUE, TRUE, NULL, '2026-06-04T08:00:00Z', TRUE, 1000.0);

-- Classroom Invitation from owner_01 to test account main
INSERT INTO classroom_invites (id, classroom_id, target_user_id, invited_by, status, created_at, expires_at,
                               responded_at)
VALUES ('c1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d333', 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b130',
        '550e8400-e29b-41d4-a716-446655440000', 'b8b3b3b3-b3b3-b3b3-b3b3-b3b3b3b3b304', 'PENDING',
        '2026-06-04T08:30:00Z', '2026-06-11T08:30:00Z', NULL);

-- Additional Classroom Invitations for Main Classroom
INSERT INTO classroom_invites (id, classroom_id, target_user_id, invited_by, status, created_at, expires_at,
                               responded_at)
VALUES (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1',
        'c1b2c3d4-e5f6-4a5b-8c9d-000000000001', '550e8400-e29b-41d4-a716-446655440000', 'ACCEPTED',
        '2026-06-10T10:00:00Z', '2026-06-17T10:00:00Z', '2026-06-11T09:00:00Z'),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1',
        'c1b2c3d4-e5f6-4a5b-8c9d-000000000011', '550e8400-e29b-41d4-a716-446655440000', 'REVOKED',
        '2026-06-10T11:00:00Z', '2026-06-17T11:00:00Z', '2026-06-10T12:00:00Z'),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1',
        'c1b2c3d4-e5f6-4a5b-8c9d-000000000012', '550e8400-e29b-41d4-a716-446655440000', 'REJECTED',
        '2026-06-08T09:00:00Z', '2026-06-15T09:00:00Z', '2026-06-09T14:00:00Z'),
       (gen_random_uuid(), 'e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b1b1',
        'c1b2c3d4-e5f6-4a5b-8c9d-000000000013', '550e8400-e29b-41d4-a716-446655440000', 'PENDING',
        '2026-06-13T08:00:00Z', '2026-06-20T08:00:00Z', NULL);

-- Submissions for test account main
INSERT INTO exam_attempts (id, exam_id, student_id, classroom_member_id, status, score, attempt_number, started_at,
                           submitted_at, last_active_at)
VALUES ('c1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d221', 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d221',
        '550e8400-e29b-41d4-a716-446655440000', 'a1c1c1c1-c1c1-c1c1-c1c1-a1c1c1c1c121', 'GRADED', 1.000, 1,
        '2026-06-01T09:10:00Z', '2026-06-01T09:30:00Z', '2026-06-01T09:30:00Z'),
       ('c1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d222', 'a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d222',
        '550e8400-e29b-41d4-a716-446655440000', 'a1c1c1c1-c1c1-c1c1-c1c1-a1c1c1c1c121', 'GRADED', 1.000, 1,
        '2026-06-02T09:10:00Z', '2026-06-02T09:30:00Z', '2026-06-02T09:30:00Z');

-- Question Responses for test account main submissions
INSERT INTO question_responses (id, attempt_id, question_id, question_response_data, score, is_graded, is_overridden,
                                last_sequence_number)
VALUES ('d1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d221', 'c1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d221',
        'b1a1a1a1-1a1a-1a1a-1a1a-7f1a1a1a1c01', '{
    "type": "SINGLE_CHOICE",
    "selectedOptionId": 2
  }'::jsonb, 1.000, TRUE, FALSE, 1),
       ('d1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d222', 'c1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d222',
        'b1a1a1a1-1a1a-1a1a-1a1a-7f1a1a1a1c02', '{
         "type": "SINGLE_CHOICE",
         "selectedOptionId": 1
       }'::jsonb, 1.000, TRUE, FALSE, 1);

-- Notifications for test account main
INSERT INTO notifications (id, user_id, title, message, type, metadata, is_read, read_at, created_at)
VALUES
-- Exam Published notifications
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'New Exam Published',
 'A new exam ''Math Quiz 1'' has been published in your classroom ''Student Enrolled Classroom''.', 'EXAM_PUBLISHED',
 '{"examId":"a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d221", "classroomId":"e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b121"}', FALSE, NULL,
 '2026-06-01T09:05:00Z'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'New Exam Published',
 'A new exam ''Science Quiz 1'' has been published in your classroom ''Student Enrolled Classroom''.', 'EXAM_PUBLISHED',
 '{"examId":"a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d222", "classroomId":"e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b121"}', FALSE, NULL,
 '2026-06-02T09:05:00Z'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'New Exam Published',
 'A new exam ''History Quiz 1'' has been published in your classroom ''Student Enrolled Classroom''.', 'EXAM_PUBLISHED',
 '{"examId":"a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d223", "classroomId":"e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b121"}', FALSE, NULL,
 '2026-06-03T09:05:00Z'),
-- Exam Graded notifications
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'Exam Graded',
 'Your submission for the exam ''Math Quiz 1'' has been graded.', 'EXAM_GRADED',
 '{"examId":"a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d221", "classroomId":"e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b121",
 "attemptId":"c1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d221"}',
 FALSE, NULL, '2026-06-01T10:15:00Z'),
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'Exam Graded',
 'Your submission for the exam ''Science Quiz 1'' has been graded.', 'EXAM_GRADED',
 '{"examId":"a1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d222", "classroomId":"e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b121",
 "attemptId":"c1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d222"}',
 FALSE, NULL, '2026-06-02T10:15:00Z'),
-- Classroom invitation notification
(gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'Classroom Invitation',
 'You have been invited by Owner One to join the classroom ''Advanced Chemistry''.', 'CLASSROOM_INVITATION',
 '{"inviteId":"c1d1d1d1-d1d1-d1d1-d1d1-a1d1d1d1d333", "classroomId":"e1b1b1b1-b1b1-b1b1-b1b1-e1b1b1b1b130"}', FALSE,
 NULL, '2026-06-04T08:30:00Z');
