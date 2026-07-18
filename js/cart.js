import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const SELLER_PHONE = "254741675601";

// Cart now stores only product IDs and quantities
let cart =
JSON.parse(
    localStorage.getItem("cart")
) || [];

const cartContainer =
document.getElementById("cartItems");

const cartTotal =
document.getElementById("cartTotal");

const cartCount =
document.getElementById("cartCount");

const cartSidebar =
document.querySelector(".cart-sidebar");

const cartBtn =
document.getElementById("cartBtn");

const closeCartBtn =
document.getElementById("closeCart");

// Cache for product details
let productCache = {};

document.addEventListener(
    "DOMContentLoaded",
    () => {
        renderCart();
        setupCartUI();
    }
);

function setupCartUI(){

    if(cartBtn){

        cartBtn.addEventListener(
            "click",
            () => {
                cartSidebar.classList.add(
                    "active"
                );
            }
        );
    }

    if(closeCartBtn){

        closeCartBtn.addEventListener(
            "click",
            () => {
                cartSidebar.classList.remove(
                    "active"
                );
            }
        );
    }

    const checkoutBtn =
    document.getElementById(
        "checkoutBtn"
    );

    if(checkoutBtn){

        checkoutBtn.addEventListener(
            "click",
            checkout
        );
    }
}

function saveCart(){

    localStorage.setItem(
        "cart",
        JSON.stringify(cart)
    );

    updateCartCount();
}

async function getProductDetails(productId) {
    // Check cache first
    if (productCache[productId]) {
        return productCache[productId];
    }

    try {
        const docRef = doc(db, "products", productId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            productCache[productId] = {
                id: productId,
                name: data.name || "Unknown Product",
                price: data.price || 0,
                images: data.images || []
            };
            return productCache[productId];
        }
        return null;
    } catch (error) {
        console.error("Error fetching product:", error);
        return null;
    }
}

async function addToCart(
    product,
    quantity = 1
){
    // Find if product already in cart
    const existing =
    cart.find(
        item => item.id === product.id
    );

    if(existing){
        existing.quantity += quantity;
    }
    else{
        cart.push({
            id: product.id,
            quantity: quantity
        });
    }

    saveCart();
    await renderCart();
    showToast(
        `${product.name} added to cart`,
        "success"
    );
}

function buyNow(
    product,
    quantity
){
    const message =
`Hello TotalCare Engineering Services,

I would like to order:

• ${product.name}
Qty: ${quantity}
Price: KES ${Number(product.price).toLocaleString()}

Product Image:
${product.images?.[0] || "No Image"}

Thank you.`;

    const url =
`https://wa.me/${SELLER_PHONE}?text=${encodeURIComponent(message)}`;

    window.open(
        url,
        "_blank"
    );
}

function removeItem(id){

    cart =
    cart.filter(
        item => item.id !== id
    );

    saveCart();
    renderCart();
}

function changeQty(
    id,
    amount
){

    const item =
    cart.find(
        p => p.id === id
    );

    if(!item) return;

    item.quantity += amount;

    if(item.quantity <= 0){
        removeItem(id);
        return;
    }

    saveCart();
    renderCart();
}

function getTotal(){

    return cart.reduce(
        (sum, item) => {
            const product = productCache[item.id];
            return sum + (product ? product.price * item.quantity : 0);
        },
        0
    );
}

function updateCartCount(){

    if(!cartCount) return;

    const totalItems =
    cart.reduce(
        (sum,item) =>
            sum + item.quantity,
        0
    );

    cartCount.textContent =
    totalItems;
}

async function renderCart(){

    if(!cartContainer) return;

    updateCartCount();

    if(cart.length === 0){

        cartContainer.innerHTML = `
        <div class="empty-cart">

            <i class="fa-solid fa-cart-shopping"></i>

            <h3>Your cart is empty</h3>

        </div>
        `;

        if(cartTotal){
            cartTotal.textContent = "KES 0";
        }

        return;
    }

    cartContainer.innerHTML = "";

    // Fetch all product details
    for (const item of cart) {
        await getProductDetails(item.id);
    }

    cart.forEach(item => {
        const product = productCache[item.id];
        
        if (!product) {
            // Product not found, skip or show placeholder
            return;
        }

        const div =
        document.createElement("div");

        div.className =
        "cart-item";

        const imageUrl = product.images?.[0] || "/assets/no-image.png";

        div.innerHTML = `

            <img
                src="${imageUrl}"
                alt="${product.name}"
                loading="lazy"
            >

            <div class="cart-details">

                <h4>
                    ${product.name}
                </h4>

                <div class="cart-price">
                    KES ${Number(product.price)
                    .toLocaleString()}
                </div>

                <div class="cart-qty">

                    <button
                    data-minus="${item.id}">
                    -
                    </button>

                    <span>
                        ${item.quantity}
                    </span>

                    <button
                    data-plus="${item.id}">
                    +
                    </button>

                </div>

                <button
                class="cart-remove"
                data-remove="${item.id}">
                Remove
                </button>

            </div>
        `;

        cartContainer.appendChild(div);
    });

    attachCartEvents();

    if(cartTotal){

        cartTotal.textContent =
        "KES " +
        getTotal()
        .toLocaleString();
    }
}

function attachCartEvents(){

    document
    .querySelectorAll(
        "[data-remove]"
    )
    .forEach(btn=>{

        btn.onclick = ()=>{

            removeItem(
                btn.dataset.remove
            );

        };

    });

    document
    .querySelectorAll(
        "[data-minus]"
    )
    .forEach(btn=>{

        btn.onclick = ()=>{

            changeQty(
                btn.dataset.minus,
                -1
            );

        };

    });

    document
    .querySelectorAll(
        "[data-plus]"
    )
    .forEach(btn=>{

        btn.onclick = ()=>{

            changeQty(
                btn.dataset.plus,
                1
            );

        };

    });

}

async function checkout(){

    if(cart.length === 0){

        showToast(
            "Cart is empty",
            "error"
        );

        return;
    }

    const customerName =
    document.getElementById(
        "customerName"
    )?.value || "";

    const customerPhone =
    document.getElementById(
        "customerPhone"
    )?.value || "";

    if(
        !customerName ||
        !customerPhone
    ){

        showToast(
            "Fill customer details",
            "warning"
        );

        return;
    }

    try{
        // Fetch all product details for the order
        const orderItems = [];
        for (const item of cart) {
            const product = await getProductDetails(item.id);
            if (product) {
                orderItems.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity,
                    image: product.images?.[0] || ""
                });
            }
        }

        const order = {
            customerName,
            customerPhone,
            items: orderItems,
            total: getTotal(),
            status: "Pending",
            createdAt:
            serverTimestamp()
        };

        const docRef =
        await addDoc(
            collection(
                db,
                "orders"
            ),
            order
        );

        const orderId =
        docRef.id;

        await sendWhatsAppOrder(
            orderId,
            customerName,
            customerPhone,
            orderItems
        );

        cart = [];
        saveCart();
        await renderCart();

        showToast(
            "Order placed successfully",
            "success"
        );

        // Clear customer details
        document.getElementById("customerName").value = "";
        document.getElementById("customerPhone").value = "";

    }
    catch(error){

        console.error(error);

        showToast(
            "Checkout failed",
            "error"
        );

    }

}

async function sendWhatsAppOrder(
    orderId,
    customerName,
    customerPhone,
    orderItems
){

    let text =
`Hello TotalCare Engineering Services,

I would like to order:

`;

    orderItems.forEach(item => {
        text +=
`• ${item.name}
Qty: ${item.quantity}
Price: KES ${Number(item.price).toLocaleString()}
Product Image: ${item.image || "No Image"}

`;
    });

    text +=
`Total: KES ${getTotal().toLocaleString()}

Order ID: ${orderId}
Customer: ${customerName}
Phone: ${customerPhone}

Thank you.`;

    const url =
`https://wa.me/${SELLER_PHONE}?text=${encodeURIComponent(text)}`;

    window.open(
        url,
        "_blank"
    );
}

function showToast(
    message,
    type = "info"
){

    const toast =
    document.createElement("div");

    toast.className =
    `toast toast-${type}`;

    toast.textContent =
    message;

    document.body
    .appendChild(toast);

    setTimeout(()=>{
        toast.classList.add("show");
    },100);

    setTimeout(()=>{
        toast.remove();
    },3500);
}

// Function to clear product cache (useful when products are updated)
function clearProductCache() {
    productCache = {};
}

window.addToCart =
addToCart;

window.buyNow =
buyNow;

window.clearProductCache =
clearProductCache;