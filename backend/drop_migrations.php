<?php

$host = '127.0.0.1';
$port = 3306;
$db   = 'inventory_tkj';
$user = 'root';
$pass = 'admintkj';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Drop migrations table if it exists
    $pdo->exec("DROP TABLE IF EXISTS `migrations`");
    echo "migrations table dropped.\n";

    // List remaining tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Remaining tables: " . (count($tables) ? implode(', ', $tables) : 'none') . "\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
