<?php
header('Content-Type: application/json');
include 'db.php';

// Count the votes for each candidate in each position
$query = "SELECT position, candidate, COUNT(*) as count FROM votes GROUP BY position, candidate";
$result = $conn->query($query);

$results = [];

while ($row = $result->fetch_assoc()) {
    $pos = $row['position'];
    $cand = $row['candidate'];
    
    if (!isset($results[$pos])) {
        $results[$pos] = [];
    }
    
    // Store the total tally
    $results[$pos][$cand] = $row['count'];
}

echo json_encode($results);

$conn->close();
?>