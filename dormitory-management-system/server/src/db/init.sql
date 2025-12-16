DROP DATABASE IF EXISTS dormitory_db;
CREATE DATABASE dormitory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dormitory_db;

CREATE TABLE dormitory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  num_total_rooms INT NOT NULL DEFAULT 100,
  num_available_rooms INT NOT NULL
);

-- capacity removed here
CREATE TABLE rooms (
  id INT PRIMARY KEY AUTO_INCREMENT,
  building VARCHAR(50) NULL,
  room_number VARCHAR(20) NOT NULL,
  status ENUM('available','occupied') NOT NULL DEFAULT 'available'
);

CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','receptionist','service','admin') NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NULL,
  phone VARCHAR(50) NULL,
  room_id INT NULL,
  requested_room_id INT NULL,
  paid TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
  CONSTRAINT fk_users_requested_room FOREIGN KEY (requested_room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

CREATE TABLE interventions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  created_by INT NOT NULL,
  room_id INT NOT NULL,
  type ENUM('cleaning','repair') NOT NULL,
  description VARCHAR(500) NOT NULL,
  status ENUM('pending','accepted','rejected','completed') NOT NULL DEFAULT 'pending',
  handled_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  CONSTRAINT fk_interv_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_interv_handler FOREIGN KEY (handled_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_interv_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE TABLE behavior_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  recorded_by INT NOT NULL,
  description VARCHAR(500) NOT NULL,
  points INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_beh_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_beh_recorder FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(120) NOT NULL,
  message VARCHAR(500) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at DATETIME NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_room ON users(room_id);
CREATE INDEX idx_users_requested_room ON users(requested_room_id);

-- capacity removed in INSERT
INSERT INTO rooms (building, room_number, status) VALUES
('A', '101', 'available'),
('A', '102', 'available'),
('A', '103', 'available'),
('A', '104', 'available'),
('A', '105', 'available'),
('B', '201', 'available'),
('B', '202', 'available'),
('B', '203', 'available'),
('B', '204', 'available'),
('B', '205', 'available');

-- Seed accounts required by the UI (password: pass1234)
INSERT INTO users (username, password_hash, role, name, email, phone, paid) VALUES
('student1',   '$2a$10$kyCfLf7oKzUEEBotEp5nAO84KQOcpjAa0rttDCDWlvg7XlewyA/gG', 'student',      'Gao Lin',   'student1@seu.edu.cn',   '13800138000', 0),
('reception1', '$2a$10$kyCfLf7oKzUEEBotEp5nAO84KQOcpjAa0rttDCDWlvg7XlewyA/gG', 'receptionist', 'Reception One', 'reception1@seu.edu.cn', '13800138020', 0),
('service1',   '$2a$10$kyCfLf7oKzUEEBotEp5nAO84KQOcpjAa0rttDCDWlvg7XlewyA/gG', 'service',      'Service One',   'service1@seu.edu.cn',   '13800138030', 0),
('admin1',     '$2a$10$kyCfLf7oKzUEEBotEp5nAO84KQOcpjAa0rttDCDWlvg7XlewyA/gG', 'admin',        'Admin One',     'admin1@seu.edu.cn',     '13800138040', 0);

INSERT INTO users (username, password_hash, role, name, email, phone, paid) VALUES
('student2', '$2a$10$kyCfLf7oKzUEEBotEp5nAO84KQOcpjAa0rttDCDWlvg7XlewyA/gG', 'student', 'Alice Wang', 'alice.wang@seu.edu.cn', '13800138001', 0),
('student3', '$2a$10$kyCfLf7oKzUEEBotEp5nAO84KQOcpjAa0rttDCDWlvg7XlewyA/gG', 'student', 'Bob Li',    'bob.li@seu.edu.cn',     '13800138002', 0),
('student4', '$2a$10$kyCfLf7oKzUEEBotEp5nAO84KQOcpjAa0rttDCDWlvg7XlewyA/gG', 'student', 'Chen Wei',  'chen.wei@seu.edu.cn',   '13800138003', 0),
('student5', '$2a$10$kyCfLf7oKzUEEBotEp5nAO84KQOcpjAa0rttDCDWlvg7XlewyA/gG', 'student', 'Deng Yu',   'deng.yu@seu.edu.cn',    '13800138004', 0),
('student6', '$2a$10$kyCfLf7oKzUEEBotEp5nAO84KQOcpjAa0rttDCDWlvg7XlewyA/gG', 'student', 'Emma Zhang','emma.zhang@seu.edu.cn', '13800138005', 0),
('student7', '$2a$10$kyCfLf7oKzUEEBotEp5nAO84KQOcpjAa0rttDCDWlvg7XlewyA/gG', 'student', 'Fan Hao',   'fan.hao@seu.edu.cn',     '13800138006', 0),
('student8', '$2a$10$kyCfLf7oKzUEEBotEp5nAO84KQOcpjAa0rttDCDWlvg7XlewyA/gG', 'student', 'Fofie Faffal',   'gao.lin@seu.edu.cn',     '13800138007', 0),
('student9', '$2a$10$kyCfLf7oKzUEEBotEp5nAO84KQOcpjAa0rttDCDWlvg7XlewyA/gG', 'student', 'Huang Jie', 'huang.jie@seu.edu.cn',   '13800138008', 0);

/*SHOW TABLES;
DESCRIBE rooms;
DESCRIBE users;
SELECT * FROM rooms;
SELECT * FROM interventions;
SELECT * from users;*/