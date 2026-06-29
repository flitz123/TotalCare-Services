
import { db } from "./firebase-config.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const SELLER_PHONE = "254741675601";

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

function addToCart(
    product,
    quantity = 1
){

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

            name: product.name,

            price: product.price,

            quantity,

            image:
            product.images?.[0] || ""

        });

    }

    saveCart();

    renderCart();

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
`Hello TotalCare,

I would like to purchase:

Product: ${product.name}
Quantity: ${quantity}
Price: KES ${product.price}

Image:
${product.images?.[0] || "No Image"}

Please assist me with the order.`;

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

        (sum,item)=>

            sum +
            (
                item.price *
                item.quantity
            ),

        0

    );
}

function updateCartCount(){

    if(!cartCount) return;

    const totalItems =
    cart.reduce(

        (sum,item)=>

            sum + item.quantity,

        0

    );

    cartCount.textContent =
    totalItems;
}

function renderCart(){

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

            cartTotal.textContent =
            "KES 0";
        }

        return;
    }

    cartContainer.innerHTML = "";

    cart.forEach(item => {

        const div =
        document.createElement("div");

        div.className =
        "cart-item";

        div.innerHTML = `

            <img
            src="${item.image}"
            alt="${item.name}"
            >

            <div class="cart-details">

                <h4>
                    ${item.name}
                </h4>

                <div class="cart-price">
                    KES ${Number(item.price)
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

        const order = {

            customerName,

            customerPhone,

            items: cart,

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
            customerPhone
        );

        cart = [];

        saveCart();

        renderCart();

        showToast(
            "Order placed successfully",
            "success"
        );

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

    customerPhone

){

    let text =

`New Order

Order ID:
${orderId}

Customer:
${customerName}

Phone:
${customerPhone}

Items:

`;

    cart.forEach(item => {

        text +=

`${item.name}
Qty: ${item.quantity}
KES ${item.price}

Image:
${item.image}

`;

    });

    text +=
`Total:
KES ${getTotal()}`;

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

        toast.classList.add(
            "show"
        );

    },100);

    setTimeout(()=>{

        toast.remove();

    },3500);

}

window.addToCart =
addToCart;

window.buyNow =
buyNow;