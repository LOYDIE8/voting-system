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

    const positions = Object.keys(electionVotes);
    positions.forEach(pos => {
        const selected = document.querySelector(`input[name='${pos}']:checked`);
        if (selected) {
            electionVotes[pos][selected.value]++;
        }
    });

    localStorage.setItem("electionVotes", JSON.stringify(electionVotes));

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

function resetElection() {
    if (localStorage.getItem("currentSession") !== "admin") {
        alert("Unauthorized action!");
        return;
    }

    if(confirm("CRITICAL WARNING: Are you sure you want to completely wipe all votes? This action cannot be undone.")) {
        localStorage.removeItem("electionVotes");
        localStorage.removeItem("votedList");
        initElectionDB(); 
        alert("System Reset Complete. All votes are back to 0.");
        document.getElementById("adminResults").classList.add("hidden");
    }
}

function logout() {
    localStorage.removeItem("currentSession");
    location.reload(); 
}