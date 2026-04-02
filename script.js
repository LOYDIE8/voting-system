// 1. DATABASE INITIALIZATION
function initElectionDB() {
   if (!localStorage.getItem("electionVotes")) {
        const initialVotes = {}; 
        
        for (let position in electionCandidates) {
            initialVotes[position] = {}; 
            for (let i = 0; i < electionCandidates[position].length; i++) {
                let candidateName = electionCandidates[position][i];
                initialVotes[position][candidateName] = 0;
            }
        }
        localStorage.setItem("electionVotes", JSON.stringify(initialVotes));
        localStorage.setItem("votedList", JSON.stringify([])); 
        localStorage.setItem("detailedVotes", JSON.stringify([])); 
    }
}
initElectionDB(); 

// 2. UI NAVIGATION
function toggleLogin(type) {
    if (type === 'admin') {
        document.getElementById("studentLoginBox").classList.add("hidden");
        document.getElementById("adminLoginBox").classList.remove("hidden");
    } else {
        document.getElementById("adminLoginBox").classList.add("hidden");
        document.getElementById("studentLoginBox").classList.remove("hidden");
    }
}

// 3. STUDENT LOGIN LOGIC
function loginStudent() {
    const studentName = document.getElementById("studentName").value.trim();
    const studentId = document.getElementById("studentId").value.trim();
    const messageBox = document.getElementById("loginMessage"); 

    if (!studentName || !studentId) {
        messageBox.innerText = "Please enter both Name and ID.";
        return; 
    }

    const isValid = validVoters.find(v => v.name.toLowerCase() === studentName.toLowerCase() && v.id === studentId);
    
    if (!isValid) {
        messageBox.innerText = "Invalid credentials. Name and ID do not match our records.";
        return; 
    }

    let votedList = JSON.parse(localStorage.getItem("votedList")) || [];
    if (votedList.includes(studentId)) {
        messageBox.innerText = "Access Denied: You have already cast your vote.";
        return; 
    }

    localStorage.setItem("currentSession", "voter_" + studentId);
    localStorage.setItem("voterCourse", isValid.course);

    document.getElementById("voterNameDisplay").innerText = isValid.name;
    document.getElementById("loginSection").classList.add("hidden");
    
    buildBallot(); 
    document.getElementById("votingSection").classList.remove("hidden");
}

// 4. GENERATING THE BALLOT
function buildBallot() {
    const electionVotes = JSON.parse(localStorage.getItem("electionVotes"));
    const voterCourse = localStorage.getItem("voterCourse"); 
    const container = document.getElementById("ballotContainer");
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
            
            for (let candidate in electionVotes[position]) {
                groupDiv.innerHTML += `
                    <label>
                        <input type="radio" name="${position}" value="${candidate}" required> 
                        ${candidate}
                    </label>`;
            }
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

    const payload = {
        studentId: studentId,
        lastName: voterDetails.name,
        course: voterDetails.course,
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
            let votedList = JSON.parse(localStorage.getItem("votedList")) || [];
            votedList.push(studentId);
            localStorage.setItem("votedList", JSON.stringify(votedList));

            let electionVotes = JSON.parse(localStorage.getItem("electionVotes"));
            for (const [position, candidate] of Object.entries(myVotes)) {
                if (electionVotes[position] && electionVotes[position][candidate] !== undefined) {
                    electionVotes[position][candidate]++;
                }
            }
            localStorage.setItem("electionVotes", JSON.stringify(electionVotes));

            let detailedVotes = JSON.parse(localStorage.getItem("detailedVotes")) || [];
            detailedVotes.push({
                voterId: studentId,
                voterName: payload.lastName,
                course: payload.course,
                votes: myVotes
            });
            localStorage.setItem("detailedVotes", JSON.stringify(detailedVotes));

            document.getElementById("voteForm").reset();
            document.getElementById("votingSection").classList.add("hidden");
            document.getElementById("successSection").classList.remove("hidden");
        } else {
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

    if (user === "admin" && pass === "admin123") {
        localStorage.setItem("currentSession", "admin"); 
        
        document.getElementById("loginSection").classList.add("hidden");
        document.getElementById("adminDashboard").classList.remove("hidden");
    } else {
        msg.innerText = "Invalid Admin Credentials.";
    }
}

function showResults() {
    const data = JSON.parse(localStorage.getItem("electionVotes"));
    const resultsDiv = document.getElementById("adminResults");
    
    document.getElementById("voterHistoryContainer").classList.add("hidden");
    
    const repPositions = ["bsit", "bshm", "bsie", "bsed", "bit_auto", "bit_et", "bit_comp"];
    let output = "<h3>LIVE VOTE TALLY:</h3>";
    
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

    resultsDiv.innerHTML = output;
    resultsDiv.classList.remove("hidden");
}

function showVoterHistory() {
    const detailedVotes = JSON.parse(localStorage.getItem("detailedVotes")) || [];
    const historyDiv = document.getElementById("voterHistoryContainer");
    
    document.getElementById("adminResults").classList.add("hidden"); 

    if (detailedVotes.length === 0) {
        historyDiv.innerHTML = "<h3>VOTER AUDIT LOG</h3><p>No votes have been cast yet.</p>";
        historyDiv.classList.remove("hidden");
        return;
    }

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

    detailedVotes.forEach(record => {
        let ballotDetails = "";
        
        for (const [position, candidate] of Object.entries(record.votes)) {
            let displayPos = position.toUpperCase().replace("_", " ");
            ballotDetails += `<span class="vote-badge"><strong>${displayPos}:</strong> ${candidate}</span>`;
        }

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

    tableHTML += `</tbody></table></div>`;
    historyDiv.innerHTML = tableHTML;
    historyDiv.classList.remove("hidden");
}

// Wipes the entire database clean (Browser AND MySQL)
async function resetElection() {
    if (localStorage.getItem("currentSession") !== "admin") {
        alert("Unauthorized action!");
        return;
    }

    if(confirm("CRITICAL WARNING: Are you sure you want to completely wipe all votes? This action cannot be undone.")) {
        
        try {
            let response = await fetch('reset.php', { method: 'POST' });
            let result = await response.json();

            if (result.status === "success") {
                localStorage.removeItem("electionVotes");
                localStorage.removeItem("votedList");
                localStorage.removeItem("detailedVotes"); 
                
                initElectionDB(); 
                
                alert("System Reset Complete. Both the Database and Local Memory are back to 0.");
                
                document.getElementById("adminResults").classList.add("hidden");
                document.getElementById("voterHistoryContainer").classList.add("hidden");
            }
        } catch (error) {
            console.error("Error wiping database:", error);
            alert("Failed to reach the database. Make sure XAMPP is running!");
        }
    }
}

// Clears the active session and refreshes the page
function logout() {
    localStorage.removeItem("currentSession");
    location.reload(); 
}   