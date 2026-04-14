<?php
// Return JSON
header('Content-Type: application/json');

// Connect to DB
include 'db.php';

// Clear all votes
$conn->query("TRUNCATE TABLE votes");

// Reset voting status of all students
$conn->query("UPDATE voters SET has_voted = 0");

// Send success response
echo json_encode([
    "status" => "success",
    "message" => "Election reset successfully!"
]);

// Close DB connection
$conn->close();
?>