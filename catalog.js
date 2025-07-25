import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Verifica se está logado
onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "login.html";
  await loadFolders();
});

// Carrega pastas
async function loadFolders() {
  const folderList = document.getElementById("folderList");
  folderList.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "pastas"));

  querySnapshot.forEach((docSnap) => {
    const div = document.createElement("div");
    div.className = "folder";
    div.innerText = docSnap.id;
    div.onclick = () => loadItems(docSnap.id);
    folderList.appendChild(div);
  });
}

// Carrega produtos da pasta clicada
async function loadItems(folderId) {
  const itemList = document.getElementById("itemList");
  itemList.innerHTML = "";
  const folderRef = doc(db, "pastas", folderId);
  const folderSnap = await getDoc(folderRef);

  const data = folderSnap.data();
  if (!data || !data.produtos) {
    itemList.innerText = "Nenhum produto encontrado.";
    return;
  }

  data.produtos.forEach((item) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <b>${item.title}</b><br>
      ${item.description}<br>
      <b>R$ ${item.price}</b><br>
    `;

    ["title", "description", "price"].forEach((key) => {
      const btn = document.createElement("button");
      btn.innerText = `Copiar ${key}`;
      btn.onclick = () => navigator.clipboard.writeText(item[key]);
      div.appendChild(btn);
    });

    itemList.appendChild(div);
  });
}

// Importar JSON com produtos
document.getElementById("jsonInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  const json = JSON.parse(text);
  if (!json.folderName || !json.products) return alert("Formato inválido");

  await setDoc(doc(db, "pastas", json.folderName), { produtos: json.products });
  alert("Importado com sucesso!");
  loadFolders();
});

// Logout
window.logout = () => {
  signOut(auth).then(() => window.location.href = "login.html");
};
