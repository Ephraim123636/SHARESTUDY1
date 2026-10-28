USE studyshare;
DROP TABLE IF EXISTS `downloads`;
DROP TABLE IF EXISTS `materials`;
DROP TABLE IF EXISTS `password_resets`;
DROP TABLE IF EXISTS `ratings`;
DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `subscriptions`;
DROP TABLE IF EXISTS `users`;

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 28, 2026 at 10:00 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `studyshare`
--

-- --------------------------------------------------------

--
-- Table structure for table `downloads`
--

CREATE TABLE `downloads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `downloaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `downloads`
--

INSERT INTO `downloads` (`id`, `user_id`, `material_id`, `downloaded_at`) VALUES
(1, 1, 1, '2026-10-16 09:08:20'),
(2, 1, 1, '2026-10-16 09:10:08'),
(3, 2, 1, '2026-10-17 09:14:23'),
(4, 1, 1, '2026-10-22 17:48:06'),
(5, 2, 2, '2026-10-23 10:40:11');

-- --------------------------------------------------------

--
-- Table structure for table `materials`
--

CREATE TABLE `materials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `course` varchar(100) NOT NULL,
  `subject` varchar(100) NOT NULL,
  `academic_year` varchar(20) DEFAULT NULL,
  `material_type` varchar(30) NOT NULL DEFAULT 'unspecified',
  `is_premium` tinyint(1) NOT NULL DEFAULT 0,
  `file_path` varchar(255) NOT NULL,
  `uploaded_by` int(11) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `materials`
--

INSERT INTO `materials` (`id`, `title`, `description`, `course`, `subject`, `academic_year`, `material_type`, `is_premium`, `file_path`, `uploaded_by`, `status`, `created_at`) VALUES
(1, 'Notes', 'I want to help my fellow student', 'information-technology', 'operating system', 'year-2', 'notes', 0, '../uploads/2d254a25754225db0cf41b9dcee4924e.pdf', 1, 'approved', '2026-10-16 07:17:10'),
(2, 'Web Design and Development', '', 'information-technology', 'Web Design and Development', 'year-2', 'notes', 0, '../uploads/07c0dbd6fb179c94415476d446e90312.pdf', 2, 'approved', '2026-10-23 10:39:51');

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `email_hash` char(64) NOT NULL,
  `requester_hash` char(64) NOT NULL,
  `token_hash` char(64) DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `requested_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ratings`
--

CREATE TABLE `ratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ratings`
--

INSERT INTO `ratings` (`id`, `user_id`, `material_id`, `rating`, `comment`, `created_at`) VALUES
(2, 10, 1, 4, 'this material is so powerful and useful to my fellow students', '2026-10-19 12:42:07');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reporter_id` int(11) NOT NULL,
  `material_id` int(11) NOT NULL,
  `reason` varchar(150) NOT NULL,
  `details` text DEFAULT NULL,
  `status` enum('pending','reviewed','resolved') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `plan` enum('monthly','semester') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'ZMW',
  `tx_ref` varchar(80) DEFAULT NULL,
  `transaction_id` varchar(30) DEFAULT NULL,
  `paid_at` datetime DEFAULT NULL,
  `status` enum('pending_payment','active','cancelled') NOT NULL DEFAULT 'pending_payment',
  `expires_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscriptions`
--

INSERT INTO `subscriptions` (`id`, `user_id`, `plan`, `amount`, `currency`, `tx_ref`, `transaction_id`, `paid_at`, `status`, `expires_at`, `created_at`) VALUES
(5, 2, 'monthly', 50.00, 'ZMW', NULL, NULL, NULL, 'active', '2026-11-19 15:05:13', '2026-10-17 09:25:48');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('student','admin') NOT NULL DEFAULT 'student',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `program` varchar(100) DEFAULT NULL,
  `year_of_study` varchar(20) DEFAULT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `role`, `created_at`, `program`, `year_of_study`, `profile_photo`) VALUES
(1, 'Raymond Kaziya', 'kaziyaraymond76@gmail.com', '$2y$10$m5H/FVM2/KqJPBL6OLd1weqBU6EBetReBROpYxAj6bi/ZsW7jYLp6', 'student', '2026-10-15 05:11:06', 'BSE', 'year-1', NULL),
(2, 'Ephraim Chilombo', 'ephraimchilombo64@gmail.com', '$2y$10$RN8R0/u2v4gLOvG/fm5DMOIOIddpsQkPGxHjNXhrQZ71GAKMF9jRS', 'admin', '2026-10-16 08:19:21', 'Software Engineering', 'year-2', NULL),
(9, 'Sibusisiwe Ndhlovu', 'sibusisiwelisandhlovu@gmail.com', '$2y$10$F2mwv/9oezPOgf33Ga95oul0nZeV4jnU5//8pHxSVt9422RWXp0IS', 'admin', '2026-10-19 08:54:36', 'BSE', 'year-2', NULL),
(10, 'Francis Manda', 'Framanda732@gmail.com', '$2y$10$6pUgfQuFtnZaghCdec0fq.erAnNLjz3xWhHjQ66uYooQczJ8oaEgG', 'admin', '2026-10-19 09:07:04', 'BIT', 'year-2', NULL),
(11, 'Catherine Chanda', 'chandacatherine452@gmail.com', '$2y$10$7LK7gM4DY5yJpwXfdXtzHe0lElB0uhUdTPc2Qe72EOYpfWqlvCNR6', 'admin', '2026-10-23 10:54:18', 'BIT', 'year-2', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `downloads`
--
ALTER TABLE `downloads`
  ADD KEY `user_id` (`user_id`),
  ADD KEY `material_id` (`material_id`);

--
-- Indexes for table `materials`
--
ALTER TABLE `materials`
  ADD KEY `uploaded_by` (`uploaded_by`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD UNIQUE KEY `token_hash` (`token_hash`),
  ADD KEY `idx_password_resets_email_request` (`email_hash`,`requested_at`),
  ADD KEY `idx_password_resets_requester` (`requester_hash`,`requested_at`),
  ADD KEY `idx_password_resets_user` (`user_id`);

--
-- Indexes for table `ratings`
--
ALTER TABLE `ratings`
  ADD UNIQUE KEY `user_id` (`user_id`,`material_id`),
  ADD KEY `material_id` (`material_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD KEY `reporter_id` (`reporter_id`),
  ADD KEY `material_id` (`material_id`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD UNIQUE KEY `subscriptions_tx_ref_unique` (`tx_ref`),
  ADD UNIQUE KEY `subscriptions_transaction_id_unique` (`transaction_id`),
  ADD KEY `subscriptions_user_fk` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `downloads`
--

--
-- AUTO_INCREMENT for table `materials`
--

--
-- AUTO_INCREMENT for table `password_resets`
--

--
-- AUTO_INCREMENT for table `ratings`
--

--
-- AUTO_INCREMENT for table `reports`
--

--
-- AUTO_INCREMENT for table `subscriptions`
--

--
-- AUTO_INCREMENT for table `users`
--

--
-- Constraints for dumped tables
--

--
-- Constraints for table `downloads`
--
ALTER TABLE `downloads`
  ADD CONSTRAINT `downloads_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `downloads_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`);

--
-- Constraints for table `materials`
--
ALTER TABLE `materials`
  ADD CONSTRAINT `materials_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD CONSTRAINT `fk_password_resets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ratings`
--
ALTER TABLE `ratings`
  ADD CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`);

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`material_id`) REFERENCES `materials` (`id`);

--
-- Constraints for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
