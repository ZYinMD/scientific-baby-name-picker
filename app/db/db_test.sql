CREATE DATABASE  IF NOT EXISTS `db_test`
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
  `table_testcol` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `table_test`
--

LOCK TABLES `table_test` WRITE;
/*!40000 ALTER TABLE `table_test` DISABLE KEYS */;
INSERT INTO `table_test` VALUES (1,'Mary','F',0,4120692,0,7065,6919,8148,8012,9217,9128,NULL);
/*!40000 ALTER TABLE `table_test` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-04-03 21:52:25
