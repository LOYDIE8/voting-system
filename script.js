
// 1. DATABASE INITIALIZATION

// This function runs the moment the page loads. It checks if there is already
// voting data saved in the browser's local storage. If not, it creates a fresh database.
function initElectionDB() {
   // Check if "electionVotes" already exists in the browser's memory
   if (!localStorage.getItem("electionVotes")) {
        const initialVotes = {}; // Create an empty object to hold the scores
        
        // Loop through every position (president, vice, bsit, etc.) in your candidates.js file
        for (let position in electionCandidates) {
            initialVotes[position] = {}; // Create an empty group for that position
            
            // Loop through the candidates in that specific position
            for (let i = 0; i < electionCandidates[position].length; i++) {
                let candidateName = electionCandidates[position][i];
                // Set every candidate's starting vote count to 0
                initialVotes[position][candidateName] = 0;
            }
        }
        // Save the zeroed-out scores to localStorage (must convert to JSON string first)
        localStorage.setItem("electionVotes", JSON.stringify(initialVotes));
        
        // Create an empty array to track which Student IDs have already voted
        localStorage.setItem("votedList", JSON.stringify([])); 
        
        // Create an empty array to track the exact choices each student made (Audit Log)
        localStorage.setItem("detailedVotes", JSON.stringify([])); 
    }
}
// Actually run the function right now
initElectionDB(); 

// 2. UI NAVIGATION
// This function switches the screen between the Student Login and Admin Login
function toggleLogin(type) {
    if (type === 'admin') {
        // Hide student box, show admin box
        document.getElementById("studentLoginBox").classList.add("hidden");
        document.getElementById("adminLoginBox").classList.remove("hidden");
    } else {
        // Hide admin box, show student box
        document.getElementById("adminLoginBox").classList.add("hidden");
        document.getElementById("studentLoginBox").classList.remove("hidden");
    }
}


// 3. STUDENT LOGIN LOGIC
function loginStudent() {
    // Get the text the user typed in, and use .trim() to remove accidental spaces
    const studentName = document.getElementById("studentName").value.trim();
    const studentId = document.getElementById("studentId").value.trim();
    const messageBox = document.getElementById("loginMessage"); // Where errors go

    // SECURITY CHECK 1: Did they leave it blank?
    if (!studentName || !studentId) {
        messageBox.innerText = "Please enter both Name and ID.";
        return; // Stop the function here
    }

    // SECURITY CHECK 2: Does this student exist in our voters.js file?
    // We convert names to lowercase so "Capecenio" matches "capecenio"
    const isValid = validVoters.find(v => v.name.toLowerCase() === studentName.toLowerCase() && v.id === studentId);
    
    if (!isValid) {
        messageBox.innerText = "Invalid credentials. Name and ID do not match our records.";
        return; // Stop the function
    }

    // SECURITY CHECK 3: Has this student already voted?
    let votedList = JSON.parse(localStorage.getItem("votedList")) || [];
    if (votedList.includes(studentId)) {
        messageBox.innerText = "Access Denied: You have already cast your vote.";
        return; // Stop the function
    }

    // If they pass all checks, log them in!
    // Save their active session and their specific course to memory
    localStorage.setItem("currentSession", "voter_" + studentId);
    localStorage.setItem("voterCourse", isValid.course);

    // Update the UI to say "Welcome, [Their Name]!"
    document.getElementById("voterNameDisplay").innerText = isValid.name;
    
    // Hide the login screen
    document.getElementById("loginSection").classList.add("hidden");
    
    // Generate their specific ballot based on their course, then show it
    buildBallot(); 
    document.getElementById("votingSection").classList.remove("hidden");
}


// 4. GENERATING THE BALLOT

// This function creates the HTML radio buttons dynamically
function buildBallot() {
    const electionVotes = JSON.parse(localStorage.getItem("electionVotes"));
    const voterCourse = localStorage.getItem("voterCourse"); // Example: "bsit"
    const container = document.getElementById("ballotContainer");
    container.innerHTML = ""; // Clear out any old data

    // Define which positions belong to specific courses, and which are for everyone
    const repPositions = ["bsit", "bshm", "bsie", "bsed", "bit_auto", "bit_et", "bit_comp"];
    const generalPositions = ["president", "vice", "secretary", "treasurer"];

    // Loop through all positions in the database
    for (let position in electionVotes) {
        let showPosition = false; // Assume we hide it by default

        // Only show the position if it's a general position OR if it matches their specific course
        if (generalPositions.includes(position) || position === voterCourse) {
            showPosition = true;
        }

        if (showPosition) {
            // Create a new div wrapper for this position
            let groupDiv = document.createElement("div");
            groupDiv.className = "candidate-group";
            
            // Format the title (e.g., turn "bit_comp" into "BIT COMP REPRESENTATIVE")
            let displayPos = position.toUpperCase().replace("_", " ");
            if (repPositions.includes(position)) {
                displayPos += " REPRESENTATIVE";
            }

            // Add the position title to the div
            groupDiv.innerHTML = `<h3>${displayPos}</h3>`;
            
            // Loop through all candidates in this position and create a radio button for them
            for (let candidate in electionVotes[position]) {
                groupDiv.innerHTML += `
                    <label>
                        <input type="radio" name="${position}" value="${candidate}" required> 
                        ${candidate}
                    </label>`;
            }
            // Inject the completed block into the HTML page
            container.appendChild(groupDiv);
        }
    }
}


// 5. SUBMITTING THE VOTE

document.getElementById("voteForm").addEventListener("submit", async function(e) {
    e.preventDefault(); 

    const currentSession = localStorage.getItem("currentSession");
    if (!currentSession || !currentSession.startsWith("voter_")) return;

    const studentId = currentSession.split("_")[1];
    const voterDetails = validVoters.find(v => v.id === studentId);
    
    // 1. Gather the exact candidates the student picked
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

    // 2. Package the ballot into a neat little box to send to PHP
    const payload = {
        studentId: studentId,
        lastName: voterDetails.name,
        course: voterDetails.course,
        votes: myVotes
    };

    try {
        // 3. Send the package to your vote.php file!
        let response = await fetch('vote.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // 4. Wait to see what PHP says back
        let result = await response.json();

        if (result.status === "success") {
            // Keep a local lock just so they can't immediately click back
            let votedList = JSON.parse(localStorage.getItem("votedList")) || [];
            votedList.push(studentId);
            localStorage.setItem("votedList", JSON.stringify(votedList));

            document.getElementById("voteForm").reset();
            document.getElementById("votingSection").classList.add("hidden");
            document.getElementById("successSection").classList.remove("hidden");
        } else {
            // If PHP says they already voted in the database, show the error
            alert(result.message);
        }

    } catch (error) {
        console.error("Error:", error);
        alert("Could not connect to the database. Make sure Apache and MySQL are running in XAMPP!");
    }
});

// 6. ADMIN LOGIC

function loginAdmin() {
    const user = document.getElementById("adminUser").value;
    const pass = document.getElementById("adminPass").value;
    const msg = document.getElementById("adminLoginMessage");

    // Hardcoded security check for the admin credentials
    if (user === "admin" && pass === "admin123") {
        localStorage.setItem("currentSession", "admin"); // Mark them as admin in memory
        
        // Hide login, show admin dashboard
        document.getElementById("loginSection").classList.add("hidden");
        document.getElementById("adminDashboard").classList.remove("hidden");
    } else {
        msg.innerText = "Invalid Admin Credentials.";
    }
}

// Generates the live scoreboard for the admin
function showResults() {
    const data = JSON.parse(localStorage.getItem("electionVotes"));
    const resultsDiv = document.getElementById("adminResults");
    
    // Hide the history table if it's currently open
    document.getElementById("voterHistoryContainer").classList.add("hidden");
    
    const repPositions = ["bsit", "bshm", "bsie", "bsed", "bit_auto", "bit_et", "bit_comp"];
    let output = "<h3>LIVE VOTE TALLY:</h3>";
    
    // Loop through the data and build a list of scores
    for (let position in data) {
        let displayPos = position.toUpperCase().replace("_", " ");
        if (repPositions.includes(position)) {
            displayPos += " REP";
        }

        output += `<h4 style="color:#FFD700; border-bottom:1px solid #555; padding-bottom:3px;">${displayPos}</h4><ul style="list-style:none; padding-left:0;">`;
        for (let candidate in data[position]) {
            output += `<li style="margin-bottom:5px;">${candidate}: <strong>${data[position][candidate]}</strong> votes</li>`;
        }
        output += "</ul>";
    }

    // Put the list onto the screen
    resultsDiv.innerHTML = output;
    resultsDiv.classList.remove("hidden");
}

// Generates the table showing exactly who voted and who they chose
function showVoterHistory() {
    const detailedVotes = JSON.parse(localStorage.getItem("detailedVotes")) || [];
    const historyDiv = document.getElementById("voterHistoryContainer");
    
    // Hide standard results if open
    document.getElementById("adminResults").classList.add("hidden"); 

    // If nobody has voted yet, show a message
    if (detailedVotes.length === 0) {
        historyDiv.innerHTML = "<h3>VOTER AUDIT LOG</h3><p>No votes have been cast yet.</p>";
        historyDiv.classList.remove("hidden");
        return;
    }

    // Start building the HTML table
    let tableHTML = `
        <h3>VOTER AUDIT LOG</h3>
        <div class="table-responsive">
            <table class="voter-history-table">
                <thead>
                    <tr>
                        <th>Voter Identity</th>
                        <th>Ballot Details (Choices)</th>
                    </tr>
                </thead>
                <tbody>
    `;

    // Loop through every student's receipt in the audit log
    detailedVotes.forEach(record => {
        let ballotDetails = "";
        
        // Loop through the specific choices they made
        for (const [position, candidate] of Object.entries(record.votes)) {
            let displayPos = position.toUpperCase().replace("_", " ");
            ballotDetails += `<span class="vote-badge"><strong>${displayPos}:</strong> ${candidate}</span>`;
        }

        // Add a row to the table for this student
        tableHTML += `
            <tr>
                <td>
                    <div class="voter-name">${record.voterName}</div>
                    <div class="voter-id">ID: ${record.voterId} | ${record.course.toUpperCase()}</div>
                </td>
                <td>${ballotDetails}</td>
            </tr>
        `;
    });

    // Close the table tags and put it on the screen
    tableHTML += `</tbody></table></div>`;
    historyDiv.innerHTML = tableHTML;
    historyDiv.classList.remove("hidden");
}

// Wipes the entire database clean
function resetElection() {
    // Security check: Make sure they didn't bypass the login
    if (localStorage.getItem("currentSession") !== "admin") {
        alert("Unauthorized action!");
        return;
    }

    // Show a browser warning box
    if(confirm("CRITICAL WARNING: Are you sure you want to completely wipe all votes? This action cannot be undone.")) {
        // Delete everything from memory
        localStorage.removeItem("electionVotes");
        localStorage.removeItem("votedList");
        localStorage.removeItem("detailedVotes"); 
        
        initElectionDB(); // Rebuild the blank database
        
        alert("System Reset Complete. All votes are back to 0.");
        
        // Hide the scoreboards
        document.getElementById("adminResults").classList.add("hidden");
        document.getElementById("voterHistoryContainer").classList.add("hidden");
    }
}

// Clears the active session and refreshes the page
function logout() {
    localStorage.removeItem("currentSession");
    location.reload(); 
}