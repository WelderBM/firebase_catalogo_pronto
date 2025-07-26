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
    const currentFolder = localStorage.getItem("currentFolder");
    if (!currentFolder) return window.location.href = "folders.html";

    document.getElementById("folderName").innerText = currentFolder;

    const itemList = document.getElementById("itemList");
    itemList.innerHTML = "Carregando produtos...";

    try {
      const folderRef = doc(db, "pastas", currentFolder);
      const folderSnap = await getDoc(folderRef);
      const data = folderSnap.data();

      if (!data || !Array.isArray(data.produtos)) {
        itemList.innerHTML = `
        <div class="empty-state">
          <img src="ghost.png" class="ghost-icon"/>
          <p>Nenhum produto encontrado nesta pasta.</p>
        </div>`;
        return;
      }

      itemList.innerHTML = "";
      data.produtos.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "item-card";

        div.innerHTML = `
        <input value="${item.title}" onchange="updateItem(${index}, 'title', this.value)">
        <textarea onchange="updateItem(${index}, 'description', this.value)">${item.description}</textarea>
        <input type="number" value="${item.price}" onchange="updateItem(${index}, 'price', this.value)">
        <div class="copy-buttons">
          <button onclick="copyText('${item.title}')">Copiar título</button>
          <button onclick="copyText(\`${item.description}\`)">Copiar descrição</button>
          <button onclick="copyText('${item.price}')">Copiar valor</button>
        </div>
        <button onclick="deleteItem(${index})" class="delete-btn">Excluir</button>
      `;

        itemList.appendChild(div);
      });

    } catch (e) {
      console.error("Erro ao carregar produtos:", e);
      itemList.innerHTML = "Erro ao carregar produtos.";
    }
}

window.addEventListener('DOMContentLoaded', loadFoldersFromFirestore);

window.logout = function () {
  localStorage.removeItem('auth');
  window.location.href = 'login.html';
};
