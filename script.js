let allPlayers = [];
let filteredPlayers = [];
let packed = loadState();
let currentPage = 0;
const playersPerPage = 50;
const totalPlayers = 17737; // Nombre total de joueurs

async function loadPlayers() {
    try {
        const response = await fetch('fut_players_updated.json');
        allPlayers = await response.json();
        console.log('Joueurs chargés:', allPlayers.length);
        filteredPlayers = allPlayers; // Initialement, tous les joueurs sont affichés
        renderPlayers();
    } catch (error) {
        console.error('Erreur lors du chargement des joueurs:', error);
        const container = document.getElementById('players');
        if (container) {
            container.innerHTML = 'Erreur lors du chargement des joueurs.';
        }
    }
}

function saveState() {
    localStorage.setItem("packedPlayers", JSON.stringify(packed));
}

function loadState() {
    const data = localStorage.getItem("packedPlayers");
    return data ? JSON.parse(data) : {};
}

function updateProgress() {
    const checked = Object.values(packed).filter(v => v).length;
    const percent = Math.round((checked / totalPlayers) * 100);
    document.getElementById("progress").textContent = `Progression : ${percent}% (${checked}/${totalPlayers})`;
}

function applyFilters() {
    const searchName = document.getElementById("searchName").value.toLowerCase();
    const searchClub = document.getElementById("searchClub").value.toLowerCase();
    const searchLeague = document.getElementById("searchLeague").value.toLowerCase();
    const searchOVR = document.getElementById("searchOVR").value;

    filteredPlayers = allPlayers.filter(p => {
        const matchesName = p.Name.toLowerCase().includes(searchName);
        const matchesClub = p.Team.toLowerCase().includes(searchClub);
        const matchesLeague = p.League.toLowerCase().includes(searchLeague);
        const matchesOVR = searchOVR ? p.OVR === parseFloat(searchOVR) : true;
        return matchesName && matchesClub && matchesLeague && matchesOVR;
    });

    currentPage = 0; // Réinitialiser à la première page
    renderPlayers();
}

function renderPlayers() {
    const container = document.getElementById("players");
    container.innerHTML = '';

    const start = currentPage * playersPerPage;
    const end = start + playersPerPage;
    const pagePlayers = filteredPlayers.slice(start, end);

    pagePlayers.forEach((p) => {
        const div = document.createElement("div");
        div.className = "player";
        if (packed[p.Name]) {
            div.classList.add("checked"); // Appliquer la classe checked si coché
        }

        const label = document.createElement("label");
        label.textContent = `${p.Name} (OVR ${p.OVR}) - ${p.Team} / ${p.League}`;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = packed[p.Name] || false;
        checkbox.addEventListener("change", () => {
            packed[p.Name] = checkbox.checked;
            if (checkbox.checked) {
                div.classList.add("checked");
            } else {
                div.classList.remove("checked");
            }
            saveState();
            updateProgress();
        });

        div.appendChild(label);
        div.appendChild(checkbox);
        container.appendChild(div);
    });

    // Ajouter la navigation
    const nav = document.createElement("div");
    nav.className = "nav";
    nav.innerHTML = `
        <button onclick="changePage(-1)" ${currentPage === 0 ? 'disabled' : ''}>Précédent</button>
        <span>Page ${currentPage + 1} / ${Math.ceil(filteredPlayers.length / playersPerPage)}</span>
        <button onclick="changePage(1)" ${end >= filteredPlayers.length ? 'disabled' : ''}>Suivant</button>
    `;
    container.appendChild(nav);

    updateProgress();
}

function changePage(delta) {
    currentPage += delta;
    renderPlayers();
}

// Initialiser les événements de recherche
document.getElementById("searchName").addEventListener("input", applyFilters);
document.getElementById("searchClub").addEventListener("input", applyFilters);
document.getElementById("searchLeague").addEventListener("input", applyFilters);
document.getElementById("searchOVR").addEventListener("input", applyFilters);

// Charger les joueurs
loadPlayers();