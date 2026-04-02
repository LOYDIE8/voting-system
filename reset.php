<?php
// Bring in the database connection
include 'db.php';

// Wipe the 'votes' table and the 'voters' table completely clean
$conn->query("TRUNCATE TABLE votes");
$conn->query("TRUNCATE TABLE voters");

// Tell the JavaScript that the database is officially empty
echo json_encode(["status" => "success", "message" => "Database wiped!"]);

// Close the connection
$conn->close();
?>