CREATE DATABASE IF NOT EXISTS `bihi`;
USE `bihi`;

--
-- Table structure for table `kickers`
--

CREATE TABLE `kickers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `height` decimal(3,1) DEFAULT NULL,
  `width` decimal(3,1) DEFAULT NULL,
  `angle` int(11) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `repType` enum('2d','3d') DEFAULT '2d',
  `annotations` tinyint(4) DEFAULT NULL,
  `grid` tinyint(4) DEFAULT NULL,
  `mountainboard` tinyint(4) DEFAULT NULL,
  `textured` tinyint(4) DEFAULT NULL,
  `rider` tinyint(4) DEFAULT NULL,
  `fill` tinyint(4) DEFAULT NULL,
  `borders` tinyint(4) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyIsam DEFAULT CHARSET=utf8;
