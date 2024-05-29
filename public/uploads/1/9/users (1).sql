-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 18, 2024 at 01:40 PM
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
-- Database: `tms`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `UserID` int(11) NOT NULL,
  `Username` varchar(255) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `FirstName` varchar(255) DEFAULT NULL,
  `userData` varchar(255) DEFAULT NULL,
  `SessionID` varchar(255) DEFAULT NULL,
  `ProgramID` varchar(255) DEFAULT NULL,
  `LastName` varchar(255) DEFAULT NULL,
  `ProfilePicture` varchar(255) DEFAULT NULL,
  `ContactNumber` varchar(255) DEFAULT NULL,
  `UserType` enum('STUDENT','ADMIN','TRAINER','MONITOR','CLIENT','MANAGER') NOT NULL DEFAULT 'STUDENT'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`UserID`, `Username`, `Password`, `Email`, `FirstName`, `userData`, `SessionID`, `ProgramID`, `LastName`, `ProfilePicture`, `ContactNumber`, `UserType`) VALUES
(4, 'Admin', '$2b$10$TUbpRye5/tV0bAlDrt1ATujNoKmOzhrjMA3dZx9A2GVe/rkEXGmFC', 'admin@eci.com', NULL, NULL, NULL, '', NULL, NULL, NULL, 'ADMIN'),
(5, 'Manager', '$2b$10$M1dh6jH3exb33KYStqBnpeEvVOZN2BbiNIM2o/6kJTi94ovjmJH4y', 'manager@eci.com', NULL, NULL, NULL, '1', NULL, NULL, NULL, 'MANAGER'),
(6, 'Trainer', '$2b$10$dVUnjM98mciJfZL33hHjjeIlA.BSjAzZrnX73806Ju20vXblK9kAC', 'trainer@eci.com', NULL, NULL, NULL, '1', NULL, NULL, NULL, 'TRAINER'),
(7, 'Monitor', '$2b$10$1R5kBkIK6Dx3gfeCTv4MveZmxGz2LsNWNU6f9Rz60zGH1JsQXsuE.', 'monitor@eci.com', NULL, NULL, NULL, '1', NULL, NULL, NULL, 'MONITOR'),
(8, 'Sami ', '$2b$10$.M4XTgBYx9KV565fpOq0vuTgrVthRehxw4.lT/t2bbDZOeOMAHuD2', 'samirashid54222@gmail.com', NULL, NULL, '1', '1', NULL, NULL, NULL, 'STUDENT');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`UserID`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `UserID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
