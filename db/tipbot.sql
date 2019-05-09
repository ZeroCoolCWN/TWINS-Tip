-- phpMyAdmin SQL Dump
-- version 4.7.4
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: May 09, 2019 at 06:27 PM
-- Server version: 5.7.19
-- PHP Version: 7.1.9

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tipbot`
--

-- --------------------------------------------------------

--
-- Table structure for table `deposits`
--

DROP TABLE IF EXISTS `deposits`;
CREATE TABLE IF NOT EXISTS `deposits` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `discord_id` varchar(18) NOT NULL,
  `wallet_address` varchar(128) NOT NULL,
  `anticipated_amount` float NOT NULL,
  `deposit` float NOT NULL,
  `timestamp` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wallet_address` (`wallet_address`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `net_stats`
--

DROP TABLE IF EXISTS `net_stats`;
CREATE TABLE IF NOT EXISTS `net_stats` (
  `difficulty` float NOT NULL,
  `masternodecount` int(11) NOT NULL,
  `blockcount` int(11) NOT NULL,
  `networkhashps` bigint(20) NOT NULL,
  `activewalletscount` int(11) NOT NULL,
  `moneysupply` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `registered_mns`
--

DROP TABLE IF EXISTS `registered_mns`;
CREATE TABLE IF NOT EXISTS `registered_mns` (
  `discord_id` varchar(18) NOT NULL,
  `rank` int(11) NOT NULL,
  `network` varchar(10) NOT NULL,
  `status` varchar(20) NOT NULL,
  `addr` varchar(34) NOT NULL,
  `version` int(11) NOT NULL,
  `lastseen` int(11) NOT NULL,
  `ipaddr` varchar(35) NOT NULL,
  `activetime` int(11) NOT NULL,
  `lastpaid` int(11) NOT NULL,
  `is_online` tinyint(4) NOT NULL,
  `notified` tinyint(4) NOT NULL,
  PRIMARY KEY (`addr`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `tips`
--

DROP TABLE IF EXISTS `tips`;
CREATE TABLE IF NOT EXISTS `tips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender` varchar(18) NOT NULL,
  `receiver` varchar(18) NOT NULL,
  `amount` float NOT NULL,
  `timestamp` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `discord_id` varchar(18) NOT NULL,
  `balance` float NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `discord_id` (`discord_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `withdraw`
--

DROP TABLE IF EXISTS `withdraw`;
CREATE TABLE IF NOT EXISTS `withdraw` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `discord_id` varchar(18) NOT NULL,
  `amount` float NOT NULL,
  `timestamp` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
