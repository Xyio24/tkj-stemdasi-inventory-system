@echo off
"C:\Program Files\MariaDB 12.3\bin\mysql.exe" -u root -padmintkj inventory_tkj -e "DROP TABLE IF EXISTS migrations; SHOW TABLES;"
echo Done.
