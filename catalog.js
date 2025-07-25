import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { app } from './firebase-config.js';

const db = getFirestore(app);
let currentFolderId = null;

document.getElementById('jsonInput').addEventListener('change', handleJsonUpload);

function handleJsonUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = JSON.parse(e.target.result);
    renderFolders(data);
  };
  reader.readAsText(file);
}

function renderFolders(folders) {
  const folderList = document.getElementById('folderList');
  folderList.innerHTML = '';
  currentFolderId = null;
  document.getElementById('itemsContainer').innerHTML = '';
  document.getElementById('backButton')?.remove();

  folders.forEach(folder => {
    const div = document.createElement('div');
    div.className = 'folder-item';
    div.textContent = folder.name;
    div.onclick = () => enterFolder(folder.id);
    folderList.appendChild(div);
  });
}

async function enterFolder(folderId) {
  currentFolderId = folderId;

  const folderList = document.getElementById('folderList');
  folderList.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.textContent = '← Voltar';
  backBtn.className = 'back-button';
  backBtn.id = 'backButton';
  backBtn.onclick = () => {
    currentFolderId = null;
    document.getElementById('itemsContainer').innerHTML = '';
    backBtn.remove();
    loadFoldersFromFirestore();
  };
  folderList.parentElement.insertBefore(backBtn, folderList);

  const querySnapshot = await getDocs(collection(db, "folders", folderId, "Product"));
  const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  renderItems(items);
}

function renderItems(items) {
  const container = document.getElementById('itemsContainer');
  container.innerHTML = '';

  items.forEach(item => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'product-card';

    const title = document.createElement('input');
    title.value = item.title || '';
    title.className = 'product-title';

    const description = document.createElement('textarea');
    description.value = item.description || '';
    description.className = 'product-description';

    const price = document.createElement('input');
    price.value = item.price || '';
    price.className = 'product-price';

    const imageUrl = document.createElement('input');
    imageUrl.value = item.imageUrl || '';
    imageUrl.className = 'product-image-url';

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 Copiar';
    copyBtn.className = 'copy-button';
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(
        `Título: ${title.value}\nDescrição: ${description.value}\nValor: ${price.value}`
      );
    };

    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 Salvar';
    saveBtn.className = 'save-button';
    saveBtn.onclick = async () => {
      const ref = doc(db, "folders", currentFolderId, "Product", item.id);
      await updateDoc(ref, {
        title: title.value,
        description: description.value,
        price: price.value,
        imageUrl: imageUrl.value,
      });
      alert("Produto atualizado!");
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '🗑️ Excluir';
    deleteBtn.className = 'delete-button';
    deleteBtn.onclick = async () => {
      if (!confirm("Tem certeza que deseja excluir este item?")) return;
      const ref = doc(db, "folders", currentFolderId, "Product", item.id);
      await deleteDoc(ref);
      enterFolder(currentFolderId);
    };

    itemDiv.appendChild(title);
    itemDiv.appendChild(description);
    itemDiv.appendChild(price);
    itemDiv.appendChild(imageUrl);
    itemDiv.appendChild(copyBtn);
    itemDiv.appendChild(saveBtn);
    itemDiv.appendChild(deleteBtn);

    container.appendChild(itemDiv);
  });
}

async function loadFoldersFromFirestore() {
  const snapshot = await getDocs(collection(db, "folders"));
  const folders = snapshot.docs.map(doc => ({
    id: doc.id,
    name: doc.data().name || 'Sem nome',
  }));
  renderFolders(folders);
}

window.addEventListener('DOMContentLoaded', loadFoldersFromFirestore);

window.logout = function () {
  localStorage.removeItem('auth');
  window.location.href = 'login.html';
};
