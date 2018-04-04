CREATE DATABASE  IF NOT EXISTS `db_test`;
USE `db_test`;
DROP TABLE IF EXISTS `table_test`;
CREATE TABLE `table_test` (
  `id` int(7) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(16) NOT NULL,
  `gender` char(1) NOT NULL,
  `is_unisex` tinyint(4) NOT NULL,
  `sum` int(11) unsigned NOT NULL,
  `peak_year` int(4) unsigned NOT NULL,
  `1880` int(8) unsigned NOT NULL,
  `1881` int(8) unsigned NOT NULL,
  `1882` int(8) unsigned NOT NULL,
  `1883` int(8) unsigned NOT NULL,
  `1884` int(8) unsigned NOT NULL,
  `1885` int(8) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
);
INSERT INTO `table_test` VALUES (1,'Mary','F',0,4120692,0,7065,6919,8148,8012,9217,9128);
