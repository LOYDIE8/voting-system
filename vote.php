<?php
// Bring in the database connection we just made
include 'db.php';

// Catch the JSON data sent over from your JavaScript
$data = json_decode(file_get_contents("php://input"), true);

$studentId = $data['studentId'];
$lastName = $data['lastName'];
$course = $data['course'];
$votes = $data['votes']; // The exact candidates they picked

// SECURITY CHECK: Did this student already vote?
$check_sql = "SELECT * FROM voters WHERE student_id = '$studentId'";
$result = $conn->query($check_sql);

if ($result->num_rows > 0) {
    // If we found them in the database, stop and send an error back
    echo json_encode(["status" => "error", "message" => "Access Denied: You have already voted!"]);
    exit;
}

// STEP 1: Add the student to the 'voters' table so they can never vote again
$insert_voter = "INSERT INTO voters (student_id, last_name, course, has_voted) VALUES ('$studentId', '$lastName', '$course', 1)";
$conn->query($insert_voter);

// STEP 2: Loop through their ballot and save each choice to the 'votes' table
foreach ($votes as $position => $candidate) {
    $insert_vote = "INSERT INTO votes (voter_id, position, candidate) VALUES ('$studentId', '$position', '$candidate')";
    $conn->query($insert_vote);
}

// Tell the JavaScript that the save was 100% successful
echo json_encode(["status" => "success", "message" => "Vote securely recorded in MySQL!"]);

// Hang up the database connection
$conn->close();
?>