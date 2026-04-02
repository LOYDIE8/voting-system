<?php
$servername = "localhost";
$username = "root"; // Default XAMPP username
$password = "";     // Default XAMPP password is blank
$dbname = "ctu_election";

// Create the database connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check if it connected successfully
if ($conn->connect_error) {
  die("Database Connection Failed: " . $conn->connect_error);
}
?>