
import {
    db
} from "./firebase-config.js";

import {
    collection,
    getDocs,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let allProducts = [];

let filteredProducts = [];

let currentPage = 1;

const PRODUCTS_PER_PAGE = 6;

const productGrid =
document.getElementById("productGrid");

const searchInput =
document.getElementById("searchInput");

const categoryFilter =
document.getElementById("categoryFilter");

const pageInfo =
document.getElementById("pageInfo");

const prevPage =
document.getElementById("prevPage");

const nextPage =
document.getElementById("nextPage");

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadProducts();

        setupSearch();

        setupPagination();
    }
);

function loadProducts(){

    const productsRef =
    collection(db, "products");

    const productsQuery =
    query(
        productsRef,
        orderBy("createdAt", "desc")
    );

    onSnapshot(
        productsQuery,
        (snapshot)=>{

            allProducts = [];

            snapshot.forEach((doc)=>{

                allProducts.push({

                    id: doc.id,

                    ...doc.data()

                });

            });

            populateCategories();

            applyFilters();
        }
    );
}

function populateCategories(){

    const categories =
    [...new Set(
        allProducts.map(
            p => p.category
        )
    )];

    categoryFilter.innerHTML = `
        <option value="">
            All Categories
        </option>
    `;

    categories.forEach(category=>{

        const option =
        document.createElement("option");

        option.value = category;

        option.textContent = category;

        categoryFilter.appendChild(option);

    });

}

function setupSearch(){

    searchInput.addEventListener(
        "input",
        applyFilters
    );

    categoryFilter.addEventListener(
        "change",
        applyFilters
    );
}

function applyFilters(){

    const search =
    searchInput.value
    .trim()
    .toLowerCase();

    const category =
    categoryFilter.value;

    filteredProducts =
    allProducts.filter(product=>{

        const matchesSearch =

            product.name
            ?.toLowerCase()
            .includes(search)

            ||

            product.description
            ?.toLowerCase()
            .includes(search);

        const matchesCategory =

            !category

            ||

            product.category === category;

        return (
            matchesSearch
            &&
            matchesCategory
        );

    });

    currentPage = 1;

    renderProducts();
}

function setupPagination(){

    prevPage.addEventListener(
        "click",
        ()=>{

            if(currentPage > 1){

                currentPage--;

                renderProducts();
            }
        }
    );

    nextPage.addEventListener(
        "click",
        ()=>{

            const totalPages =
            Math.ceil(
                filteredProducts.length
                /
                PRODUCTS_PER_PAGE
            );

            if(currentPage < totalPages){

                currentPage++;

                renderProducts();
            }
        }
    );
}

function renderProducts(){

    if(!productGrid) return;

    productGrid.innerHTML = "";

    if(filteredProducts.length === 0){

        productGrid.innerHTML = `
            <div class="empty-products">

                <i class="fa-solid fa-box-open"></i>

                <h3>
                    No products found
                </h3>

                <p>
                    Try another search.
                </p>

            </div>
        `;

        pageInfo.textContent = "";

        return;
    }

    const start =
    (currentPage - 1)
    *
    PRODUCTS_PER_PAGE;

    const end =
    start
    +
    PRODUCTS_PER_PAGE;

    const pageProducts =
    filteredProducts.slice(
        start,
        end
    );

    pageProducts.forEach(product=>{

        productGrid.appendChild(

            createProductCard(product)

        );

    });

    updatePagination();
}

function createProductCard(product){

    const card =
    document.createElement("div");

    card.className =
    "product-card";

    const stockClass =
    getStockClass(product.stock);

    const stockLabel =
    getStockLabel(product.stock);

    card.innerHTML = `

    <div class="product-slider">

        <div
            class="category-tag"
        >
            ${product.category || "General"}
        </div>

        <div
            class="product-images"
            id="images-${product.id}"
        >

        </div>

    </div>

    <div class="product-content">

        <h3 class="product-name">
            ${product.name}
        </h3>

        <p class="product-description">
            ${product.description || ""}
        </p>

        <div class="product-price">
            KES ${Number(product.price).toLocaleString()}
        </div>

        <div class="product-stock ${stockClass}">
            ${stockLabel}
        </div>

        <input
            type="number"
            class="quantity"
            min="1"
            max="${product.stock}"
            value="1"
            id="qty-${product.id}"
        >

        <div class="product-actions">

            <button
                class="add-cart-btn"
                data-id="${product.id}"
            >
                Add To Cart
            </button>

            <button
                class="buy-now"
                data-buy="${product.id}"
            >
                Buy Now
            </button>

        </div>

    </div>
    `;

    createImageSlider(
        product,
        card
    );

    attachCartEvents(
        card,
        product
    );

    return card;
}

function getStockClass(stock){

    if(stock <= 0)
        return "stock-out";

    if(stock <= 5)
        return "stock-low";

    return "stock-in";
}

function getStockLabel(stock){

    if(stock <= 0)
        return "Out Of Stock";

    if(stock <= 5)
        return `Low Stock (${stock})`;

    return `In Stock (${stock})`;
}

function createImageSlider(
    product,
    card
){

    const container =
    card.querySelector(
        `.product-images`
    );

    if(
        !product.images
        ||
        !product.images.length
    ){
        return;
    }

    product.images.forEach(
        (image,index)=>{

            const img =
            document.createElement("img");

            img.src = image;

            if(index === 0){

                img.classList.add(
                    "active"
                );
            }

            container.appendChild(img);

        }
    );

    if(product.images.length > 1){

        let current = 0;

        setInterval(()=>{

            const images =
            container.querySelectorAll("img");

            images.forEach(img=>{

                img.classList.remove(
                    "active"
                );

            });

            current++;

            if(
                current >=
                images.length
            ){
                current = 0;
            }

            images[current]
            .classList.add(
                "active"
            );

        },3000);

    }
}

function attachCartEvents(
    card,
    product
){

    const addButton =
    card.querySelector(
        "[data-id]"
    );

    const buyButton =
    card.querySelector(
        "[data-buy]"
    );

    addButton.addEventListener(
        "click",
        ()=>{

            const qty =
            Number(
                document.getElementById(
                    `qty-${product.id}`
                ).value
            );

            if(
                window.addToCart
            ){

                window.addToCart(
                    product,
                    qty
                );
            }

        }
    );

    buyButton.addEventListener(
        "click",
        ()=>{

            const qty =
            Number(
                document.getElementById(
                    `qty-${product.id}`
                ).value
            );

            if(
                window.buyNow
            ){

                window.buyNow(
                    product,
                    qty
                );
            }

        }
    );
}

function updatePagination(){

    const totalPages =
    Math.ceil(
        filteredProducts.length
        /
        PRODUCTS_PER_PAGE
    );

    pageInfo.textContent =
    `Page ${currentPage} of ${totalPages}`;

    prevPage.disabled =
    currentPage === 1;

    nextPage.disabled =
    currentPage === totalPages;
}

window.refreshProducts =
loadProducts;