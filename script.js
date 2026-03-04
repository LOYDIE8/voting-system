if (!localStorage.getItem("votes")) {
    const initialVotes = {
        president: {"John Cruz": 0, "Mark Reyes": 0},
        vice: {"Anna Lopez": 0, "Jane Santos": 0},
        secretary: {"Maria Lee": 0, "Paula Kim": 0},
        treasurer: {"David Tan": 0, "Kevin Ong": 0},
        bsit: {"Chris Lim": 0, "Leo Chan": 0},
        bshm: {"Sophia Cruz": 0, "Lara Gomez": 0}
    };
    localStorage.setItem("votes", JSON.stringify(initialVotes));
}

function login() {
    const studentId = document.getElementById("studentId").value.trim();

    if (studentId === "") {
        document.getElementById("loginMessage").innerText = "Please enter Student ID.";
        return;
    }

    if (localStorage.getItem("voted_" + studentId)) {
        document.getElementById("loginMessage").innerText = "You have already voted!";
    } else {
        localStorage.setItem("currentVoter", studentId);
        document.getElementById("loginSection").classList.add("hidden");
        document.getElementById("votingSection").classList.remove("hidden");
    }
}

document.getElementById("voteForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const votes = JSON.parse(localStorage.getItem("votes"));

    const positions = ["president", "vice", "secretary", "treasurer", "bsit", "bshm"];
    
    positions.forEach(pos => {
        const selected = document.querySelector(`input[name='${pos}']:checked`);
        if (selected) {
            votes[pos][selected.value]++;
        }
    });

    localStorage.setItem("votes", JSON.stringify(votes));

    const voter = localStorage.getItem("currentVoter");
    localStorage.setItem("voted_" + voter, "true");

    alert("Vote submitted successfully!");
    showResults();
});

function showResults() {
    const votes = JSON.parse(localStorage.getItem("votes"));
    let output = "";

    for (let position in votes) {
        output += `<h3>${position.toUpperCase()}</h3>`;
        for (let candidate in votes[position]) {
            output += `${candidate}: ${votes[position][candidate]} votes<br>`;
        }
    }

    document.getElementById("results").innerHTML = output;
    document.getElementById("votingSection").classList.add("hidden");
    document.getElementById("resultsSection").classList.remove("hidden");
}

function logout() {
    document.getElementById("resultsSection").classList.add("hidden");
    document.getElementById("loginSection").classList.remove("hidden");
    document.getElementById("studentId").value = "";
    document.getElementById("loginMessage").innerText = "";
}

function resetElection() {
    if(confirm("Are you sure you want to clear all data? This cannot be undone.")) {
        localStorage.clear();
        alert("Election reset successful!");
        location.reload();
    }
}