import {
  db,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  getDoc
} from "../core/data.js";

import { auth, signOut } from "../core/data.js";
import { renderDashboard } from './dashboard.js';
import { renderOrders } from './orders.js';
import { renderInventory } from './inventory.js';
import { renderReports } from './reports.js';
import { renderSettings } from './settings.js';

// === Sidebar Toggle (GLOBAL) ===
window.toggleSidebar = () => {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('-translate-x-full');
};

// Configuration API Image
const IMGBB_API_KEY = "daad728bfd5bc5f2739a9612b27c1410"; 







// --- 2. ROUTEUR SPA (SwitchTab) ---
window.switchTab = (tabName) => {
    const container = document.getElementById('page-content');
    
    // Fermer sidebar mobile
    if(window.innerWidth < 1024) toggleSidebar(false);

    // Update UI Sidebar Buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if(btn.innerText.toLowerCase().includes(tabName.replace('menu', 'menu editor'))) {
            btn.classList.add('bg-gray-700', 'text-white');
            btn.classList.remove('text-gray-300');
        } else {
            btn.classList.remove('bg-gray-700', 'text-white');
            btn.classList.add('text-gray-300');
        }
    });

    // Loader temporaire
    container.innerHTML = `<div class="loader-container"><i class="fa-solid fa-circle-notch fa-spin text-4xl"></i></div>`;

    // Chargement dynamique
    setTimeout(() => {
        switch(tabName) {
            case 'dashboard': renderDashboard(container); break;
            case 'orders': renderOrders(container); break;
            case 'menu': renderMenuEditor(container); break; // Logique interne
            case 'inventory': renderInventory(container); break;
            case 'reports': renderReports(container); break;
            case 'settings': renderSettings(container); break;
            default: renderDashboard(container);
        }
    }, 50);
};

// --- 3. UI GLOBALE ---
window.toggleSidebar = (forceState = null) => {
    const sb = document.getElementById('sidebar');
    const ol = document.getElementById('mobile-overlay');
    
    if (forceState === false) {
        sb.classList.add('-translate-x-full');
        ol.classList.add('hidden');
    } else {
        sb.classList.toggle('-translate-x-full');
        ol.classList.toggle('hidden');
    }
};

window.handleLogout = async () => {
    if(confirm("Se déconnecter ?")) {
        await signOut(auth);
        window.location.href = "login.html"; // Redirection simple
    }
};

// --- 4. LOGIQUE MENU EDITOR (Intégrée ici) ---
function renderMenuEditor(container) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6 fade-in">
            <h2 class="text-2xl font-bold text-white">Menu Editor</h2>
            <button onclick="window.openProductModal()" class="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition shadow">
                <i class="fa-solid fa-plus"></i> Ajouter Produit
            </button>
        </div>
        
        <div class="mb-4 fade-in">
            <input type="text" id="product-search" placeholder="Search product..." class="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition">
        </div>
        
        <div id="menu-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            </div>
    `;

    let allProducts = [];

    const q = query(collection(db, "products"), orderBy("name"));
    onSnapshot(q, (snapshot) => {
        const grid = document.getElementById('menu-grid');
        if(!grid) return;

        if(snapshot.empty) {
            grid.innerHTML = `<div class="text-gray-500 col-span-full text-center py-10">Aucun produit trouvé.</div>`;
            return;
        }

        // Store all products
        allProducts = [];
        snapshot.forEach(docSnap => {
            allProducts.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Initial render with all products
        renderProductCards(allProducts, grid);

        // Setup search functionality
        const searchInput = document.getElementById('product-search');
        if (searchInput && !searchInput.dataset.listenerSet) {
            searchInput.dataset.listenerSet = 'true';
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase().trim();
                
                if (searchTerm === '') {
                    renderProductCards(allProducts, grid);
                } else {
                    const filtered = allProducts.filter(p => 
                        p.name.toLowerCase().includes(searchTerm)
                    );
                    renderProductCards(filtered, grid);
                }
            });
        }
    });
}

function renderProductCards(products, gridElement) {
    if (!gridElement) return;
    
    if (products.length === 0) {
        gridElement.innerHTML = `<div class="text-gray-500 col-span-full text-center py-10">Aucun produit trouvé.</div>`;
        return;
    }

    gridElement.innerHTML = '';

    products.forEach(p => {
        const escapeQuote = (str) => String(str || '').replace(/'/g, "\\'");
        gridElement.innerHTML += `
            <div class="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 group relative shadow-lg fade-in">
                <img src="${p.img || 'https://placehold.co/300'}" class="w-full h-48 object-cover">
                <div class="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition duration-300">
                    <button onclick="window.openProductModal('${escapeQuote(p.id)}', '${escapeQuote(p.name)}', '${escapeQuote(p.price)}', '${escapeQuote(p.cat)}', '${escapeQuote(p.img)}')" class="bg-blue-600 text-white p-2 rounded shadow hover:bg-blue-500"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="window.deleteProduct('${escapeQuote(p.id)}')" class="bg-red-600 text-white p-2 rounded shadow hover:bg-red-500"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-lg text-white truncate w-3/4">${p.name}</h3>
                        <span class="text-yellow-400 font-mono font-bold">${parseFloat(p.price).toFixed(1)} DT</span>
                    </div>
                    ${p.description ? `<p class="text-sm text-gray-300 mb-2 line-clamp-2">${p.description}</p>` : ''}
                    ${p.sizes && (p.sizes.s || p.sizes.m || p.sizes.l) ? `
                    <div class="flex gap-2 mt-2 mb-3">
                        ${p.sizes.s ? `<button class="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-xs font-semibold">S - ${parseFloat(p.sizes.s).toFixed(1)} DT</button>` : ''}
                        ${p.sizes.m ? `<button class="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-xs font-semibold">M - ${parseFloat(p.sizes.m).toFixed(1)} DT</button>` : ''}
                        ${p.sizes.l ? `<button class="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 text-xs font-semibold">L - ${parseFloat(p.sizes.l).toFixed(1)} DT</button>` : ''}
                    </div>
                    ` : ''}
                    <div class="flex justify-between items-center mt-3">
                        <span class="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">${p.cat}</span>
                        <button onclick="window.toggleProductActive('${escapeQuote(p.id)}', ${p.active})" class="text-xs px-2 py-1 rounded font-bold cursor-pointer ${p.active ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}">
                            ${p.active ? 'ACTIF' : 'INACTIF'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

// Modal Logic & ImgBB
window.openProductModal = (id = '', name = '', price = '', cat = 'Plats', img = '') => {
    const modal = document.getElementById('modal-container');
    modal.classList.remove('hidden');
    modal.innerHTML = `
        <div class="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-md relative shadow-2xl fade-in">
            <h3 class="text-xl font-bold mb-4 text-white">${id ? 'Modifier' : 'Ajouter'} Produit</h3>
            <form id="product-form" class="space-y-4">
                <input type="hidden" id="p-id" value="${id}">
                <input type="hidden" id="p-current-img" value="${img}">
                
                <div>
                    <label class="text-xs text-gray-400">Nom</label>
                    <input type="text" id="p-name" value="${name}" class="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" required>
                </div>
                
                <div>
                    <label class="text-xs text-gray-400">Description</label>
                    <textarea id="p-description" placeholder="Description du produit..." class="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" rows="3"></textarea>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-xs text-gray-400">Prix</label>
                        <input type="number" step="0.5" id="p-price" value="${price}" class="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none" required>
                    </div>
                    <div>
                        <label class="text-xs text-gray-400">Catégorie</label>
                        <input type="text" id="p-cat" value="${cat}" placeholder="Ex: Pizzas, Vegan..." class="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-yellow-500 outline-none">
                    </div>
                </div>

                <div>
                    <label class="text-xs text-gray-400 block mb-2">Sizes Prices</label>
                    <div class="grid grid-cols-3 gap-2">
                        <div>
                            <input type="number" step="0.5" id="p-size-s" placeholder="S price" class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-yellow-500 outline-none text-sm">
                        </div>
                        <div>
                            <input type="number" step="0.5" id="p-size-m" placeholder="M price" class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-yellow-500 outline-none text-sm">
                        </div>
                        <div>
                            <input type="number" step="0.5" id="p-size-l" placeholder="L price" class="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-yellow-500 outline-none text-sm">
                        </div>
                    </div>
                </div>

                <div>
                    <label class="text-xs text-gray-400">Image</label>
                    <input type="file" id="p-file" accept="image/*" class="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:bg-gray-800 file:text-white hover:file:bg-gray-700">
                </div>

                <div class="flex gap-2 pt-2">
                    <button type="button" onclick="document.getElementById('modal-container').classList.add('hidden')" class="flex-1 bg-gray-700 py-2 rounded text-white">Annuler</button>
                    <button type="submit" id="btn-save" class="flex-1 bg-yellow-500 text-black py-2 rounded font-bold hover:bg-yellow-600">Enregistrer</button>
                </div>
            </form>
        </div>
    `;

    // If editing, load full product data from Firestore
    if (id) {
        const docRef = doc(db, "products", id);
        getDoc(docRef).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                document.getElementById('p-description').value = data.description || '';
                document.getElementById('p-size-s').value = data.sizes?.s || '';
                document.getElementById('p-size-m').value = data.sizes?.m || '';
                document.getElementById('p-size-l').value = data.sizes?.l || '';
            }
        }).catch(err => console.error("Error loading product:", err));
    }

    document.getElementById('product-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save');
        btn.innerText = "Traitement...";
        btn.disabled = true;

        try {
            const file = document.getElementById('p-file').files[0];
            let imgUrl = document.getElementById('p-current-img').value;

            if (file) {
                btn.innerText = "Upload...";
                const formData = new FormData();
                formData.append("image", file);
                const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: "POST",
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    imgUrl = data.data.url;
                } else {
                    throw new Error("Image upload failed");
                }
            } else if (!imgUrl) {
                imgUrl = 'https://placehold.co/300?text=No+Image';
            }

            const productData = {
                name: document.getElementById('p-name').value.trim(),
                price: parseFloat(document.getElementById('p-price').value),
                description: document.getElementById('p-description').value.trim(),
                cat: document.getElementById('p-cat').value.trim(),
                sizes: {
                    s: parseFloat(document.getElementById('p-size-s').value) || 0,
                    m: parseFloat(document.getElementById('p-size-m').value) || 0,
                    l: parseFloat(document.getElementById('p-size-l').value) || 0
                },
                img: imgUrl,
                active: true,
                stock: 50
            };

            const pid = document.getElementById('p-id').value;
            if (pid) {
                await updateDoc(doc(db, "products", pid), productData);
            } else {
                await addDoc(collection(db, "products"), productData);
            }

            document.getElementById('modal-container').classList.add('hidden');
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "Enregistrer";
        }
    };
};

window.deleteProduct = async (id) => { 
    if(confirm("Supprimer ce produit ?")) await deleteDoc(doc(db, "products", id)); 
};

window.toggleProductActive = async (id, current) => { 
    await updateDoc(doc(db, "products", id), { active: !current }); 
};
// أي كود موجود

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window.switchTab('dashboard');
  }, 100);
});
// ===== EDIT PRODUCT (TEMP TEST) =====
window.openEditProductModal = function (id) {
  alert("Edit product ID: " + id);
};
window.handleLogout = async () => {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    console.error("Erreur de déconnexion :", error);
    alert("Erreur lors de la déconnexion");
  }
};
