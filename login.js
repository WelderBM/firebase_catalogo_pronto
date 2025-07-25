import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, doc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentFolder = "";

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "login.html";
  loadFolders();
});

async function loadFolders() {
  const folderList = document.getElementById("folderList");
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
  currentFolder = folderId;
  const itemList = document.getElementById("itemList");
  itemList.innerHTML = "";

  const folderRef = doc(db, "pastas", folderId);
  const folderSnap = await getDoc(folderRef);
  const data = folderSnap.data();
  if (!data || !data.produtos) return;

  data.produtos.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "item";

    const titleInput = createInput("title", item.title);
    const descInput = createInput("description", item.description);
    const priceInput = createInput("price", item.price);

    const copyTitle = createCopyButton("Copiar título", item.title);
    const copyDesc = createCopyButton("Copiar descrição", item.description);
    const copyPrice = createCopyButton("Copiar valor", item.price);

    const saveBtn = document.createElement("button");
    saveBtn.innerText = "Salvar";
    saveBtn.onclick = async () => {
      item.title = titleInput.value;
      item.description = descInput.value;
      item.price = priceInput.value;
      await saveItems(index, item);
      alert("Produto salvo!");
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.innerText = "Excluir";
    deleteBtn.onclick = async () => {
      if (!confirm("Deseja mesmo excluir este produto?")) return;
      await deleteItem(index);
      loadItems(currentFolder);
    };

    div.appendChild(titleInput);
    div.appendChild(copyTitle);
    div.appendChild(document.createElement("br"));

    div.appendChild(descInput);
    div.appendChild(copyDesc);
    div.appendChild(document.createElement("br"));

    div.appendChild(priceInput);
    div.appendChild(copyPrice);
    div.appendChild(document.createElement("br"));

    div.appendChild(saveBtn);
    div.appendChild(deleteBtn);

    itemList.appendChild(div);
  });
}

function createInput(name, value) {
  const input = document.createElement("input");
  input.type = "text";
  input.name = name;
  input.value = value;
  return input;
}

function createCopyButton(text, value) {
  const btn = document.createElement("button");
  btn.innerText = text;
  btn.onclick = () => navigator.clipboard.writeText(value);
  return btn;
}

async function saveItems(index, updatedItem) {
  const folderRef = doc(db, "pastas", currentFolder);
  const folderSnap = await getDoc(folderRef);
  const data = folderSnap.data();
  data.produtos[index] = updatedItem;
  await setDoc(folderRef, data);
}

async function deleteItem(index) {
  const folderRef = doc(db, "pastas", currentFolder);
  const folderSnap = await getDoc(folderRef);
  const data = folderSnap.data();
  data.produtos.splice(index, 1);
  await setDoc(folderRef, data);
}

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

window.logout = () => {
  signOut(auth).then(() => window.location.href = "login.html");
};
