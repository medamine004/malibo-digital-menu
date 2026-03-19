/**
 * MENU CLIENT (Firebase Edition) - avec sélection de taille
 */
import { 
    db, collection, onSnapshot, addDoc, query, orderBy, serverTimestamp 
} from "../core/data.js";

const WHATSAPP_NUMBER = "21658052184"; 
const PLACEHOLDER_IMG = "https://placehold.co/400x300?text=Image+Non+Dispo";

// État
let menu = [];
let categories = [];
let activeCat = "";
let cart = [];
let pendingProduct = null; // Produit en attente de choix de taille

document.addEventListener('DOMContentLoaded', () => {
    initRealTimeMenu();

    // Exposition globale
    window.addToCart = addToCart;
    window.filter = filter;
    window.order = order;
    window.modQty = modQty; 
    window.openCart = () => document.getElementById('drawer').classList.add('open');
    window.closeCart = () => document.getElementById('drawer').classList.remove('open');
    window.toggleTableInput = () => {
        const d = document.getElementById('table-group');
        d.style.display = document.getElementById('opt-surplace').checked ? 'block' : 'none';
    };
    window.toggleTheme = () => document.documentElement.classList.toggle('dark');

    // Écouteurs pour le modal de taille
    document.getElementById('size-cancel')?.addEventListener('click', closeSizeModal);
    document.getElementById('size-modal')?.addEventListener('click', e => {
        if (e.target === e.currentTarget) closeSizeModal();
    });
});

// --- 1. CHARGEMENT TEMPS RÉEL ---
function initRealTimeMenu() {
    const q = query(collection(db, "products"), orderBy("name"));
    
    onSnapshot(q, (snapshot) => {
        menu = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                            .filter(p => p.active === true);
        
        if(menu.length > 0) {
            categories = [...new Set(menu.map(p => p.cat))];
            if (!activeCat || !categories.includes(activeCat)) activeCat = categories[0];
            renderCats();
            renderMenu();
        } else {
            document.getElementById('menu-list').innerHTML = `<div style="text-align:center;padding:3rem;color:#888">Menu en cours de mise à jour...</div>`;
        }
    });
}

// --- 2. RENDU ---
function renderCats() {
    const container = document.getElementById('cat-list');
    if(!container) return;
    container.innerHTML = categories.map(c => 
        `<button class="cat-item ${c === activeCat ? 'active' : ''}" onclick="filter('${c}')">${c}</button>`
    ).join('');
}

function filter(c) {
    activeCat = c;
    renderCats();
    renderMenu();
}

function renderMenu() {
    const grid = document.getElementById('menu-list');
    if(!grid) return;
    
    const items = menu.filter(p => p.cat === activeCat);
    if(items.length === 0) {
        grid.innerHTML = `<div style="text-align:center;width:100%;padding:2rem">Aucun produit ici</div>`;
        return;
    }

    grid.innerHTML = items.map(item => `
        <div class="dish-card">
            <img src="${item.img || PLACEHOLDER_IMG}" class="dish-img" loading="lazy" onerror="this.src='${PLACEHOLDER_IMG}'">
            <div class="dish-content">
                <div>
                    <div class="dish-title">${item.name}</div>
                    <div class="dish-desc">${item.description || ''}</div>

                    ${hasSizes(item) ? `
                    <div class="dish-sizes">
                        ${item.sizes?.s ? `<span class="size-badge">S : ${Number(item.sizes.s).toFixed(1)} DT</span>` : ''}
                        ${item.sizes?.m ? `<span class="size-badge">M : ${Number(item.sizes.m).toFixed(1)} DT</span>` : ''}
                        ${item.sizes?.l ? `<span class="size-badge">L : ${Number(item.sizes.l).toFixed(1)} DT</span>` : ''}
                    </div>
                    ` : ''}

                </div>
                <div class="dish-footer">
                    <div class="dish-price">${Number(item.price || 0).toFixed(1)} DT</div>
                    <button class="add-btn" onclick="addToCart('${item.id}')">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function hasSizes(item) {
    return item.sizes && (item.sizes.s != null || item.sizes.m != null || item.sizes.l != null);
}

// --- 3. PANIER & SÉLECTION TAILLE ---
function addToCart(id) {
    const product = menu.find(p => p.id === id);
    if (!product) return;

    if (hasSizes(product)) {
        showSizeSelector(product);
    } else {
        // Produit sans taille → ajout direct
        const existing = cart.find(i => i.id === id);
        if (existing) existing.qty++;
        else cart.push({...product, qty: 1});
        updateCart();
        showToast(`${product.name} ajouté ! 🛒`);
    }
}

function showSizeSelector(product) {
    pendingProduct = product;

    document.getElementById('size-modal-title').textContent = `Choisir une taille pour ${product.name}`;
    
    const container = document.getElementById('size-options');
    container.innerHTML = '';

    const sizes = [
        { key: 's', label: 'Small (S)' },
        { key: 'm', label: 'Medium (M)' },
        { key: 'l', label: 'Large (L)' }
    ];

    sizes.forEach(({key, label}) => {
        if (product.sizes?.[key] != null) {
            const price = Number(product.sizes[key]).toFixed(1);
            const btn = document.createElement('button');
            btn.className = 'size-btn';
            btn.textContent = `${label} — ${price} DT`;
            btn.onclick = () => confirmSize(key);
            container.appendChild(btn);
        }
    });

    const overlay = document.getElementById('size-modal');
    overlay.classList.add('show');
}

function confirmSize(selectedKey) {
    if (!pendingProduct) return;

    const price = Number(pendingProduct.sizes[selectedKey]);
    const cartItem = {
        ...pendingProduct,
        selectedSize: selectedKey.toUpperCase(),
        price: price,
        qty: 1
    };

    const existing = cart.find(i => i.id === cartItem.id && i.selectedSize === cartItem.selectedSize);
    if (existing) {
        existing.qty++;
    } else {
        cart.push(cartItem);
    }

    updateCart();
    showToast(`${pendingProduct.name} (${cartItem.selectedSize}) ajouté ! 🛒`);

    closeSizeModal();
    pendingProduct = null;
}

function closeSizeModal() {
    const overlay = document.getElementById('size-modal');
    overlay.classList.remove('show');
}

function modQty(id, delta) {
    const idx = cart.findIndex(i => i.id === id);
    if (idx === -1) return;
    cart[idx].qty += delta;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    updateCart();
}

function updateCart() {
    const count = cart.reduce((a, b) => a + b.qty, 0);
    const badge = document.getElementById('nav-badge');
    if(badge) { 
        badge.textContent = count; 
        badge.classList.toggle('show', count > 0); 
    }
    
    const container = document.getElementById('cart-items');
    let total = 0;
    if(container) {
        container.innerHTML = cart.length === 0 ? 
        `<div style="text-align:center;padding:2rem;color:#888">Panier vide</div>` : 
        cart.map(item => {
            total += item.price * item.qty;
            const displayName = item.selectedSize ? `${item.name} (${item.selectedSize})` : item.name;
            return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #eee">
                <div style="flex:1">
                    <b>${displayName}</b><br>
                    <small>${item.price.toFixed(1)} DT x ${item.qty}</small>
                </div>
                <div>
                    <button class="btn-qty" onclick="modQty('${item.id}', -1)">-</button> 
                    <b>${item.qty}</b> 
                    <button class="btn-qty" onclick="modQty('${item.id}', 1)">+</button>
                </div>
            </div>`;
        }).join('');
    }
    const totalEl = document.getElementById('cart-total');
    if(totalEl) totalEl.innerText = total.toFixed(1) + ' DT';
}

// --- 4. COMMANDE ---
async function order() {
    if (cart.length === 0) return showToast("Votre panier est vide !", "error");

    const type = document.querySelector('input[name="orderType"]:checked')?.value || "A Emporter";
    const table = document.getElementById('table-num')?.value || '';

    if (type === 'Sur Place' && !table) {
        alert("Veuillez indiquer votre numéro de table.");
        return;
    }

    const orderId = "CMD-" + Math.floor(1000 + Math.random() * 9000);
    const total = cart.reduce((a, b) => a + (b.price * b.qty), 0);

    showToast("Envoi de la commande...", "success");

    try {
        await addDoc(collection(db, "orders"), {
            orderId,
            items: cart,
            total,
            type,
            table: table || 'N/A',
            timestamp: serverTimestamp(),
            status: 'pending'
        });

        // WhatsApp message
        let msg = `🧾 *COMMANDE ${orderId}*\n🏷️ *${type}* ${table ? '('+table+')' : ''}\n────────────────\n`;
        cart.forEach(i => {
            const displayName = i.selectedSize ? `${i.name} (${i.selectedSize})` : i.name;
            msg += `▪️ ${i.qty}x ${displayName} (${(i.price * i.qty).toFixed(1)} DT)\n`;
        });
        msg += `────────────────\n💰 *TOTAL : ${total.toFixed(1)} DT*`;

        cart = [];
        updateCart();
        closeCart();

        setTimeout(() => {
            window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
        }, 1000);
    } catch (e) {
        console.error(e);
        alert("Erreur de connexion internet.");
    }
}

function showToast(msg, type='normal') {
    const box = document.getElementById('toast-container');
    if(!box) return;
    const el = document.createElement('div');
    el.className = `toast ${type} show`;
    el.innerHTML = `<span>${msg}</span>`;
    box.appendChild(el);
    setTimeout(() => el.remove(), 2500);
}
