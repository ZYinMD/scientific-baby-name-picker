DROP DATABASE IF EXISTS baby_name_picker;
CREATE DATABASE baby_name_picker;
USE baby_name_picker;
DROP TABLE IF EXISTS `mock_tables`;
CREATE TABLE `mock_tables` (
  `2012` mediumint(9) DEFAULT NULL,
  `2013` mediumint(9) DEFAULT NULL,
  `2014` mediumint(9) DEFAULT NULL,
  `2015` mediumint(9) DEFAULT NULL,
  `2016` mediumint(9) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `gender` varchar(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=latin1;
