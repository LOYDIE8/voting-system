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

function toggleLogin(type) {
    if (type === 'admin') {
        document.getElementById("studentLoginBox").classList.add("hidden");
        document.getElementById("adminLoginBox").classList.remove("hidden");
    } else {
        document.getElementById("adminLoginBox").classList.add("hidden");
        document.getElementById("studentLoginBox").classList.remove("hidden");
    }
}

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


function buildBallot() {
    const electionVotes = JSON.parse(localStorage.getItem("electionVotes"));
    const voterCourse = localStorage.getItem("voterCourse");
    const container = document.getElementById("ballotContainer");
    container.innerHTML = ""; 

    const repPositions = ["bsit", "bshm", "bsie", "bsed", "bit_auto", "bit_et", "bit_comp"];
    const generalPositions = ["president", "vice", "secretary", "treasurer"];

    for (let position in electionVotes) {
        let showPosition = false;

        if (generalPositions.includes(position)) {
            showPosition = true;
        } else if (position === voterCourse) {
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

document.getElementById("voteForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const currentSession = localStorage.getItem("currentSession");
    if (!currentSession || !currentSession.startsWith("voter_")) return;

    const studentId = currentSession.split("_")[1];
    let electionVotes = JSON.parse(localStorage.getItem("electionVotes"));
    let detailedVotes = JSON.parse(localStorage.getItem("detailedVotes")) || []; // NEW
    
    // Get voter info for the receipt
    const voterDetails = validVoters.find(v => v.id === studentId);
    let currentBallot = {
        voterId: studentId,
        voterName: voterDetails.name,
        course: voterDetails.course,
        votes: {}
    };

    const positions = Object.keys(electionVotes);
    positions.forEach(pos => {
        const selected = document.querySelector(`input[name='${pos}']:checked`);
        if (selected) {
            electionVotes[pos][selected.value]++;
            currentBallot.votes[pos] = selected.value; // Save the specific candidate chosen
        }
    });

    // Save everything
    localStorage.setItem("electionVotes", JSON.stringify(electionVotes));
    
    detailedVotes.push(currentBallot);
    localStorage.setItem("detailedVotes", JSON.stringify(detailedVotes)); // NEW

    let votedList = JSON.parse(localStorage.getItem("votedList")) || [];
    votedList.push(studentId);
    localStorage.setItem("votedList", JSON.stringify(votedList));

    document.getElementById("voteForm").reset();
    document.getElementById("votingSection").classList.add("hidden");
    document.getElementById("successSection").classList.remove("hidden");
});

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
    
    // Hide standard results if open
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

function resetElection() {
    if (localStorage.getItem("currentSession") !== "admin") {
        alert("Unauthorized action!");
        return;
    }

    if(confirm("CRITICAL WARNING: Are you sure you want to completely wipe all votes? This action cannot be undone.")) {
        localStorage.removeItem("electionVotes");
        localStorage.removeItem("votedList");
        localStorage.removeItem("detailedVotes"); // NEW: Clear the audit log
        initElectionDB(); 
        alert("System Reset Complete. All votes are back to 0.");
        document.getElementById("adminResults").classList.add("hidden");
        document.getElementById("voterHistoryContainer").classList.add("hidden");
    }
}

function logout() {
    localStorage.removeItem("currentSession");
    location.reload(); 
}