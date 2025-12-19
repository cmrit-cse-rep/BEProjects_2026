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
-- Table structure for table `a_stream_cam`
--

CREATE TABLE `a_stream_cam` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `type` varchar(20) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `a_stream_cam`
--

INSERT INTO `a_stream_cam` (`id`, `user_id`, `file_path`, `type`, `created_at`) VALUES
(1, 3, 'uploads/capture_1758796134211.jpg', 'image', '2025-09-25 03:28:55'),
(2, 3, 'uploads/video_1758796138978.mp4', 'video', '2025-09-25 03:29:21'),
(3, 3, 'uploads/video_1758797152352.mp4', 'video', '2025-09-25 03:46:02'),
(4, 3, 'uploads/video_1758797195355.mp4', 'video', '2025-09-25 03:46:49'),
(5, 3, 'uploads/video_1758797965409.mp4', 'video', '2025-09-25 03:59:30'),
(6, 3, 'uploads/capture_1758797974203.jpg', 'image', '2025-09-25 03:59:35'),
(7, 3, 'uploads/capture_1758797975489.jpg', 'image', '2025-09-25 03:59:36'),
(8, 1, 'uploads/capture_1758798019580.jpg', 'image', '2025-09-25 04:00:21'),
(9, 1, 'uploads/video_1758798316534.mp4', 'video', '2025-09-25 04:05:23'),
(10, 1, 'uploads/capture_1758799226493.jpg', 'image', '2025-09-25 04:20:28'),
(11, 1, 'uploads/video_1758799234565.mp4', 'video', '2025-09-25 04:20:47'),
(12, 1, 'uploads/capture_1758806437317.jpg', 'image', '2025-09-25 06:20:39'),
(13, 1, 'uploads/video_1758806598038.mp4', 'video', '2025-09-25 06:23:29'),
(14, 1, 'uploads/capture_1758889850145.jpg', 'image', '2025-09-26 05:30:51'),
(15, 1, 'uploads/capture_1758890046838.jpg', 'image', '2025-09-26 05:34:07'),
(16, 1, 'uploads/video_1758890061330.mp4', 'video', '2025-09-26 05:34:29'),
(17, 1, 'uploads/capture_1758891446578.jpg', 'image', '2025-09-26 05:57:32'),
(18, 1, 'uploads/capture_1758891513721.jpg', 'image', '2025-09-26 05:58:41'),
(19, 1, 'uploads/capture_1758891701892.jpg', 'image', '2025-09-26 06:01:55'),
(20, 4, 'uploads/capture_1758891826577.jpg', 'image', '2025-09-26 06:04:00'),
(21, 1, 'uploads/capture_1758891867043.jpg', 'image', '2025-09-26 06:04:39'),
(22, 4, 'uploads/capture_1758891920337.jpg', 'image', '2025-09-26 06:05:43'),
(23, 1, 'uploads/capture_1758891970800.jpg', 'image', '2025-09-26 06:06:35');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `a_stream_cam`
--
ALTER TABLE `a_stream_cam`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `a_stream_cam`
--
ALTER TABLE `a_stream_cam`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
