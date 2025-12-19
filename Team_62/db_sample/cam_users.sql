-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 26, 2025 at 10:04 PM
-- Server version: 10.6.22-MariaDB-cll-lve
-- PHP Version: 8.3.22

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `organic`
--

-- --------------------------------------------------------

--
-- Table structure for table `cam_users`
--

CREATE TABLE `cam_users` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `number` varchar(20) NOT NULL,
  `address` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cam_users`
--

INSERT INTO `cam_users` (`id`, `name`, `email`, `number`, `address`, `password`, `created_at`) VALUES
(1, 'Ajaycode', 'ajaycode@gmail.com', '9739594609', '', '$2y$10$TyxkdolAKybePctoX1..G./ZJLJkww3o.yRnfze7Pxo30lmlCAT4i', '2025-09-19 07:57:58'),
(2, 'Nelson', 'nelson@gmail.com', '12345678', '', '$2y$10$MNgvPHxCjNWVya5kILA68eMmbGXJSL80337Ly8nEjSPLYw8S/5N.i', '2025-09-19 09:12:17'),
(3, 'test', 'test@gmail.com', '9739594609', '', '$2y$10$r6cAO9k13MVqUx0XVAVnYOB905Y9quq84AkySy58OPqL/OjfMlLlS', '2025-09-19 09:16:49'),
(4, 'VIBHU', 'vibhuvali@gmail.com', '9535716820', '', '$2y$10$b8wJvvFxVFz8hYbUlahD0eFA..CP0s24K6mX0OZVhG5kdi.yHmmT.', '2025-09-26 12:51:17');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cam_users`
--
ALTER TABLE `cam_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cam_users`
--
ALTER TABLE `cam_users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
