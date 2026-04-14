<?php
// Return JSON response
header('Content-Type: application/json');

// Connect to database
include 'db.php';

// Get data from frontend (script.js)
$data = json_decode(file_get_contents('php://input'), true);

$studentId = $data['studentId'] ?? '';
$votes = $data['votes'] ?? [];

// Check if required data exists
if (empty($studentId) || empty($votes)) {
    echo json_encode(["status" => "error", "message" => "No vote data received."]);
    exit;
}

// Create votes table if it doesn't exist yet
$conn->query("CREATE TABLE IF NOT EXISTS votes (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    student_id VARCHAR(50), 
    position VARCHAR(50), 
    candidate VARCHAR(100)
)");

// Check if student already voted
$checkStmt = $conn->prepare("SELECT has_voted FROM voters WHERE student_id = ?");
$checkStmt->bind_param("s", $studentId);
$checkStmt->execute();
$result = $checkStmt->get_result();
$voter = $result->fetch_assoc();

// If already voted or not found
if (!$voter || $voter['has_voted'] == 1) {
    echo json_encode(["status" => "error", "message" => "You have already voted!"]);
    exit;
}

// Save each vote
$insertVote = $conn->prepare("INSERT INTO votes (student_id, position, candidate) VALUES (?, ?, ?)");
foreach ($votes as $position => $candidate) {
    $insertVote->bind_param("sss", $studentId, $position, $candidate);
    $insertVote->execute();
}

// Mark student as voted
$updateUser = $conn->prepare("UPDATE voters SET has_voted = 1 WHERE student_id = ?");
$updateUser->bind_param("s", $studentId);
$updateUser->execute();

// Send success response
echo json_encode(["status" => "success"]);

// Close connections
$checkStmt->close();
$insertVote->close();
$updateUser->close();
$conn->close();
?>