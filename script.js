import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

let allPlayers = [];
let filteredPlayers = [];
let packed = {};
let currentPage = 0;
const playersPerPage = 50;
const totalPlayers = 17737;

// Définir loadPlayers et l'attacher à window
export async function loadPlayers(user, db) {
    try {
        const response = await fetch('fut_players_updated.json');
        if (!response.ok) throw new Error('Échec du chargement de fut_players_updated.json');
        allPlayers = await response.json();
        console.log('Joueurs chargés:', allPlayers.length);
        filteredPlayers = allPlayers;
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        packed = docSnap.exists() ? docSnap.data().packed || {} : {};
        renderPlayers(user, db);
    } catch (error) {
        console.error('Erreur:', error);
        document.getElementById('players').innerHTML = 'Erreur lors du chargement des joueurs.';
    }
}
window.loadPlayers = loadPlayers; // Attacher à window

function saveState(user, db) {
    const docRef = doc(db, 'users', user.uid);
    setDoc(docRef, { packed }, { merge: true });
}

function updateProgress() {
    const checked = Object.values(packed).filter(v => v).length;
    const percent = Math.round((checked / totalPlayers) * 100);
    document.getElementById("progress").textContent = `Progression : ${percent}% (${checked}/${totalPlayers})`;
}

function applyFilters(user, db) {
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

    currentPage = 0;
    renderPlayers(user, db);
}

function renderPlayers(user, db) {
    const container = document.getElementById("players");
    container.innerHTML = '';

    const start = currentPage * playersPerPage;
    const end = start + playersPerPage;
    const pagePlayers = filteredPlayers.slice(start, end);

    pagePlayers.forEach((p) => {
        const div = document.createElement("div");
        div.className = "player";
        if (packed[p.Name]) div.classList.add("checked");
        if (p.OVR >= 80) div.classList.add("gold");
        else if (p.OVR >= 65) div.classList.add("silver");
        else div.classList.add("bronze");

        const label = document.createElement("label");
        label.textContent = `${p.Name} (OVR ${p.OVR}) - ${p.Team} / ${p.League}`;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = packed[p.Name] || false;
        checkbox.addEventListener("change", () => {
            packed[p.Name] = checkbox.checked;
            if (checkbox.checked) div.classList.add("checked");
            else div.classList.remove("checked");
            saveState(user, db);
            updateProgress();
        });

        div.appendChild(label);
        div.appendChild(checkbox);
        container.appendChild(div);
    });

    const nav = document.createElement("div");
    nav.className = "nav";
    nav.innerHTML = `
        <button onclick="window.changePage(-1)" ${currentPage === 0 ? 'disabled' : ''}>Précédent</button>
        <span>Page ${currentPage + 1} / ${Math.ceil(filteredPlayers.length / playersPerPage)}</span>
        <button onclick="window.changePage(1)" ${end >= filteredPlayers.length ? 'disabled' : ''}>Suivant</button>
    `;
    container.appendChild(nav);

    updateProgress();
}

window.changePage = (delta) => {
    currentPage += delta;
    renderPlayers(window.currentUser, window.firestoreDb); // Utiliser des variables globales
};

// Stocker user et db globalement pour éviter firebase global
document.addEventListener("DOMContentLoaded", () => {
    window.currentUser = null;
    window.firestoreDb = null;
    // Ces valeurs seront définies dans index.html
    document.getElementById("searchName").addEventListener("input", () => applyFilters(window.currentUser, window.firestoreDb));
    document.getElementById("searchClub").addEventListener("input", () => applyFilters(window.currentUser, window.firestoreDb));
    document.getElementById("searchLeague").addEventListener("input", () => applyFilters(window.currentUser, window.firestoreDb));
    document.getElementById("searchOVR").addEventListener("input", () => applyFilters(window.currentUser, window.firestoreDb));
});