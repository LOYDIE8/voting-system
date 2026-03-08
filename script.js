const validVoters = [
    { name: "Capecenio", id: "840816" },
    { name: "Mendoza", id: "840817" },
    { name: "Garcia", id: "840818" },
    { name: "Bautista", id: "840819" },
    { name: "Aquino", id: "840820" },
    { name: "Reyes", id: "840821" },
    { name: "Cruz", id: "840822" },
    { name: "Ramos", id: "840823" },
    { name: "Villanueva", id: "840824" },
    { name: "Del Rosario", id: "840825" },
    { name: "Alvarez", id: "840826" },
    { name: "Castro", id: "840827" },
    { name: "Diaz", id: "840828" },
    { name: "Gomez", id: "840829" },
    { name: "Perez", id: "840830" },
    { name: "Lim", id: "840831" },
    { name: "Tan", id: "840832" },
    { name: "Navarro", id: "840833" },
    { name: "Torres", id: "840834" },
    { name: "Salazar", id: "840835" }
];

function initElectionDB() {
    if (!localStorage.getItem("electionVotes")) {
        const initialVotes = {
            president: {"John Cruz": 0, "Mark Reyes": 0},
            vice: {"Anna Lopez": 0, "Jane Santos": 0},
            secretary: {"Maria Lee": 0, "Paula Kim": 0},
            treasurer: {"David Tan": 0, "Kevin Ong": 0},
            bsit: {"Chris Lim": 0, "Leo Chan": 0},
            bshm: {"Sophia Cruz": 0, "Lara Gomez": 0},
            bsie: {"Alice Vargas": 0, "Brian Pineda": 0},
            bsed: {"Chloe Sy": 0, "Daniel Go": 0},
            bit_auto: {"Edgar Luna": 0, "Frankie Borja": 0},
            bit_et: {"Grace Dizon": 0, "Henry Silva": 0},
            bit_comp: {"Isaac Ramos": 0, "Jared Tolentino": 0}
        };
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
    document.getElementById("voterNameDisplay").innerText = isValid.name;
    document.getElementById("loginSection").classList.add("hidden");
    
    buildBallot(); 
    document.getElementById("votingSection").classList.remove("hidden");
}

function buildBallot() {
    const electionVotes = JSON.parse(localStorage.getItem("electionVotes"));
    const container = document.getElementById("ballotContainer");
    container.innerHTML = ""; 

    const repPositions = ["bsit", "bshm", "bsie", "bsed", "bit_auto", "bit_et", "bit_comp"];

    for (let position in electionVotes) {
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