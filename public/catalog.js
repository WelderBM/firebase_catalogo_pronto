import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "../firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "login.html";
  loadFolders();
});

async function loadFolders() {
  const folderList = document.getElementById("folderList");
  if (!folderList) return;
  folderList.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "pastas"));
  querySnapshot.forEach((docSnap) => {
    const folder = document.createElement("div");
    folder.className = "folder";
    folder.innerText = docSnap.id;
    folder.onclick = () => loadItems(docSnap.id);
    folderList.appendChild(folder);
  });
}

async function loadItems(folderId) {
  const itemList = document.getElementById("itemList");
  if (!itemList) return;
  itemList.innerHTML = "";
  const folderRef = doc(db, "pastas", folderId);
  const folderSnap = await getDoc(folderRef);
  const data = folderSnap.data();
  if (!data || !data.produtos) return;
  data.produtos.forEach((item) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<b>${item.title}</b><br>${item.description}<br><b>R$ ${item.price}</b>`;
    ["title", "description", "price"].forEach((chave) => {
      const btn = document.createElement("button");
      btn.className = "copy-btn";
      btn.innerText = `Copiar ${chave}`;
      btn.onclick = () => navigator.clipboard.writeText(item[chave]);
      div.appendChild(btn);
    });
    itemList.appendChild(div);
  });
}

document.getElementById("jsonInput")?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  const json = JSON.parse(text);
  if (!json.folderName || !json.products) return alert("Formato inválido");
  await setDoc(doc(db, "pastas", json.folderName), { produtos: json.products });
  alert("Importado com sucesso!");
  loadFolders();
});

window.logout = () => {
  signOut(auth).then(() => (window.location.href = "login.html"));
};
