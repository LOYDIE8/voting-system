<?php
// Set response type to JSON
header('Content-Type: application/json');

// Get JSON data from request
$data = json_decode(file_get_contents('php://input'), true);

$studentName = $data['name'] ?? '';
$studentId = $data['id'] ?? '';

// Validate input
if (empty($studentName) || empty($studentId)) {
    echo json_encode([
        "status" => "error",
        "message" => "Please enter both Name and ID."
    ]);
    exit;
}

// Database connection (XAMPP MySQL)
$host = 'localhost';
$db = 'ctu_election';
$user = 'root';
$pass = '';

// Create connection
$conn = new mysqli($host, $user, $pass, $db);

// Check connection
if ($conn->connect_error) {
    echo json_encode([
        "status" => "error",
        "message" => "Database connection failed: " . $conn->connect_error
    ]);
    exit;
}

// Check if student exists
$stmt = $conn->prepare("
    SELECT name, course, has_voted 
    FROM voters 
    WHERE student_id = ? AND name = ?
");
$stmt->bind_param("ss", $studentId, $studentName);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $voter = $result->fetch_assoc();

    // Check voting status
    if ($voter['has_voted'] == 1) {
        echo json_encode([
            "status" => "error",
            "message" => "You have already voted."
        ]);
    } else {
        // Valid voter, send data to frontend
        echo json_encode([
            "status" => "success",
            "name" => $voter['name'],
            "course" => $voter['course']
        ]);
    }
} else {
    // No matching record
    echo json_encode([
        "status" => "error",
        "message" => "Invalid credentials. Voter not found."
    ]);
}

$stmt->close();
$conn->close();
?>