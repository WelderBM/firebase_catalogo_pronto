import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const folderList = document.getElementById("folderList");
const loading = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "login.html";
  await loadFolders();
});

async function loadFolders() {
    const folderList = document.getElementById("folderList");
    folderList.innerHTML = "Carregando pastas...";
    try {
        const querySnapshot = await getDocs(collection(db, "pastas"));
        folderList.classList.remove("folder-loading");
        folderList.innerHTML = "";

        if (querySnapshot.empty) {
            folderList.innerHTML = `
        <div class="empty-state">
          <img src="ghost.png" alt="Nada aqui" class="ghost-icon"/>
          <p>Nada por aqui. Tente importar um JSON com produtos.</p>
        </div>
      `;
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const folder = document.createElement("div");
            folder.className = "folder";
            folder.innerText = docSnap.id;
            folder.onclick = () => {
                localStorage.setItem("currentFolder", docSnap.id);
                window.location.href = "products.html";
            };
            folderList.appendChild(folder);
        });
    } catch (e) {
        console.error("Erro ao carregar pastas:", e);
        folderList.innerHTML = `<p>Erro ao carregar pastas</p>`;
    }
}


document.getElementById("logoutBtn").onclick = () => {
  signOut(auth).then(() => window.location.href = "login.html");
};

document.getElementById("importBtn").onclick = () => {
  document.getElementById("jsonInput").click();
};

document.getElementById("jsonInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  const json = JSON.parse(text);
  if (!json.folderName || !json.products) return alert("Formato inválido");
  await setDoc(doc(db, "pastas", json.folderName), { produtos: json.products });
  alert("Importado com sucesso!");
  await loadFolders();
});