<?php
// Return JSON
header('Content-Type: application/json');

// Connect to DB
include 'db.php';

// Get voters and their votes
$query = "SELECT voters.name, votes.position, votes.candidate 
          FROM voters 
          JOIN votes ON voters.student_id = votes.student_id 
          ORDER BY voters.name";

$result = $conn->query($query);

$history = [];

// Organize data per voter
while ($row = $result->fetch_assoc()) {
    $name = $row['name'];

    // Create entry if first time seen
    if (!isset($history[$name])) {
        $history[$name] = [
            "voterName" => $name,
            "votes" => []
        ];
    }

    // Add vote under that voter
    $history[$name]["votes"][$row['position']] = $row['candidate'];
}

// Send JSON to frontend
echo json_encode(array_values($history));

$conn->close();
?>