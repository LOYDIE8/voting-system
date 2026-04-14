// 1. UI NAVIGATION
// Switch between student and admin login
function toggleLogin(type) {
    if (type === 'admin') {
        document.getElementById("studentLoginBox").classList.add("hidden");
        document.getElementById("adminLoginBox").classList.remove("hidden");
    } else {
        document.getElementById("adminLoginBox").classList.add("hidden");
        document.getElementById("studentLoginBox").classList.remove("hidden");
    }
}


// 2. STUDENT LOGIN
async function loginStudent() {
    const studentName = document.getElementById("studentName").value.trim();
    const studentId = document.getElementById("studentId").value.trim();
    const messageBox = document.getElementById("loginMessage");

    if (!studentName || !studentId) {
        messageBox.innerText = "Please enter both Name and ID.";
        return;
    }

    // Send credentials to PHP to check MySQL database
    try {
        let response = await fetch('login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: studentName, id: studentId })
        });
        
        let result = await response.json();

        if (result.status === "success") {
            // Save session info for UI purposes
            localStorage.setItem("currentSession", "voter_" + studentId);
            localStorage.setItem("voterCourse", result.course); // Expecting PHP to return the student's course

            document.getElementById("voterNameDisplay").innerText = result.name;
            document.getElementById("loginSection").classList.add("hidden");
            
            buildBallot(); 
            document.getElementById("votingSection").classList.remove("hidden");
        } else {
            // PHP will return an error message if invalid or already voted
            messageBox.innerText = result.message; 
        }
    } catch (error) {
        console.error("Error:", error);
        messageBox.innerText = "Server connection error.";
    }
}


// 3. BUILD BALLOT
async function buildBallot() {
    const voterCourse = localStorage.getItem("voterCourse");
    const container = document.getElementById("ballotContainer");
    container.innerHTML = "<p>Loading ballot...</p>";

    try {
        // Fetch the candidate list from MySQL via PHP
        let response = await fetch('get_candidates.php');
        let electionVotes = await response.json(); 

        container.innerHTML = "";

        const repPositions = ["bsit", "bshm", "bsie", "bsed", "bit_auto", "bit_et", "bit_comp"];
        const generalPositions = ["president", "vice", "secretary", "treasurer"];

        for (let position in electionVotes) {
            let showPosition = false;

            if (generalPositions.includes(position) || position === voterCourse) {
                showPosition = true;
            }

            if (showPosition) {
                let groupDiv = document.createElement("div");
                groupDiv.className = "candidate-group";
                
                let displayPos = position.toUpperCase().replace("_", " ");
                if (repPositions.includes(position)) {
                    displayPos += " REPRESENTATIVE";
                }

                groupDiv.innerHTML = `<h3>${displayPos}</h3>`;
                
                // Note: Assuming PHP returns candidate array under electionVotes[position]
                for (let i = 0; i < electionVotes[position].length; i++) {
                    let candidate = electionVotes[position][i];
                    groupDiv.innerHTML += `
                        <label>
                            <input type="radio" name="${position}" value="${candidate}" required> 
                            ${candidate}
                        </label>`;
                }

                container.appendChild(groupDiv);
            }
        }
    } catch (error) {
        console.error("Error:", error);
        container.innerHTML = "<p>Failed to load candidates from server.</p>";
    }
}


// 4. SUBMIT VOTE
document.getElementById("voteForm").addEventListener("submit", async function(e) {
    e.preventDefault(); 

    const currentSession = localStorage.getItem("currentSession");
    if (!currentSession || !currentSession.startsWith("voter_")) return;

    const studentId = currentSession.split("_")[1];
    
    // Collect selected votes
    let myVotes = {};
    const repPositions = ["bsit", "bshm", "bsie", "bsed", "bit_auto", "bit_et", "bit_comp"];
    const generalPositions = ["president", "vice", "secretary", "treasurer"];
    const allPositions = generalPositions.concat(repPositions);

    allPositions.forEach(pos => {
        const selected = document.querySelector(`input[name='${pos}']:checked`);
        if (selected) {
            myVotes[pos] = selected.value; 
        }
    });

    // Prepare data to send
    const payload = {
        studentId: studentId,
        votes: myVotes
    };

    try {
        let response = await fetch('vote.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        let result = await response.json();

        if (result.status === "success") {
            // MySQL handles marking them as voted now. Just update UI.
            document.getElementById("voteForm").reset();
            document.getElementById("votingSection").classList.add("hidden");
            document.getElementById("successSection").classList.remove("hidden");
        } else {
            alert(result.message);
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Server connection error.");
    }
});


// 5. ADMIN
function loginAdmin() {
    const user = document.getElementById("adminUser").value;
    const pass = document.getElementById("adminPass").value;
    const msg = document.getElementById("adminLoginMessage");

    // Ideally move this check to a PHP file too, but keeping it simple for UI testing
    if (user === "admin" && pass === "admin123") {
        localStorage.setItem("currentSession", "admin");
        
        document.getElementById("loginSection").classList.add("hidden");
        document.getElementById("adminDashboard").classList.remove("hidden");
    } else {
        msg.innerText = "Invalid Admin Credentials.";
    }
}


// Show live results from MySQL
async function showResults() {
    const resultsDiv = document.getElementById("adminResults");
    document.getElementById("voterHistoryContainer").classList.add("hidden");
    
    resultsDiv.innerHTML = "<p>Loading live results...</p>";
    resultsDiv.classList.remove("hidden");

    try {
        let response = await fetch('get_results.php');
        let data = await response.json(); 

        const repPositions = ["bsit", "bshm", "bsie", "bsed", "bit_auto", "bit_et", "bit_comp"];
        let output = "<h3>LIVE VOTES:</h3>";
        
        for (let position in data) {
            let displayPos = position.toUpperCase().replace("_", " ");
            if (repPositions.includes(position)) {
                displayPos += " REP";
            }

            output += `<h4>${displayPos}</h4><ul>`;
            for (let candidate in data[position]) {
                output += `<li>${candidate}: ${data[position][candidate]} votes</li>`;
            }
            output += "</ul>";
        }

        resultsDiv.innerHTML = output;
    } catch (error) {
        console.error("Error:", error);
        resultsDiv.innerHTML = "<p>Failed to load results from server.</p>";
    }
}


// Show voter logs from MySQL
async function showVoterHistory() {
    const historyDiv = document.getElementById("voterHistoryContainer");
    document.getElementById("adminResults").classList.add("hidden"); 

    historyDiv.innerHTML = "<p>Loading voter logs...</p>";
    historyDiv.classList.remove("hidden");

    try {
        let response = await fetch('get_voter_history.php');
        let detailedVotes = await response.json(); 

        if (detailedVotes.length === 0) {
            historyDiv.innerHTML = "<h3>No votes yet.</h3>";
            return;
        }

        let tableHTML = `<h3>VOTER LOG</h3><table border="1" style="width:100%; text-align:left;">
            <thead><tr><th>Student Name</th><th>Ballot Summary</th></tr></thead><tbody>`;

        detailedVotes.forEach(record => {
            let ballotDetails = "";
            for (const [position, candidate] of Object.entries(record.votes)) {
                ballotDetails += `<span style="display:block;"><b>${position}:</b> ${candidate}</span>`;
            }
            tableHTML += `<tr><td>${record.voterName}</td><td>${ballotDetails}</td></tr>`;
        });

        tableHTML += `</tbody></table>`;
        historyDiv.innerHTML = tableHTML;
    } catch (error) {
        console.error("Error:", error);
        historyDiv.innerHTML = "<p>Failed to load history from server.</p>";
    }
}


// Reset system via PHP
async function resetElection() {
    if (localStorage.getItem("currentSession") !== "admin") {
        alert("Unauthorized");
        return;
    }

    if(confirm("Are you sure? This will permanently delete all votes from the MySQL database!")) {
        try {
            let response = await fetch('reset_election.php', { method: 'POST' });
            let result = await response.json();
            
            if (result.status === "success") {
                alert("Database reset complete.");
                showResults(); // Refresh UI to show zeroes
            } else {
                alert("Failed to reset: " + result.message);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Server connection error.");
        }
    }
}


// Logout user
function logout() {
    localStorage.removeItem("currentSession");
    localStorage.removeItem("voterCourse");
    location.reload(); 
}