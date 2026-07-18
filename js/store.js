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

// Stock badge helper functions
function getStockClass(stock){
    if(stock <= 0)
        return "stock-out";
    if(stock <= 5)
        return "stock-low";
    return "stock-in";
}

function getStockLabel(stock){
    if(stock <= 0)
        return "Out of Stock";
    if(stock <= 5)
        return `Low Stock (${stock})`;
    return `In Stock (${stock})`;
}

// Image gallery functions
function createImageGallery(images, productId) {
    if (!images || images.length === 0) {
        return `
            <div class="gallery-main">
                <img src="/assets/no-image.png" alt="No image available" loading="lazy">
            </div>
        `;
    }

    let galleryHtml = `
        <div class="gallery-main">
            <img src="${images[0]}" alt="Product image" loading="lazy" id="main-image-${productId}">
        </div>
    `;

    if (images.length > 1) {
        galleryHtml += `
            <div class="gallery-thumbnails">
        `;
        images.forEach((image, index) => {
            galleryHtml += `
                <img 
                    src="${image}" 
                    alt="Product image ${index + 1}" 
                    class="gallery-thumbnail ${index === 0 ? 'active' : ''}"
                    data-index="${index}"
                    data-product="${productId}"
                    loading="lazy"
                    onclick="changeMainImage('${productId}', ${index})"
                >
            `;
        });
        galleryHtml += `
            </div>
        `;
    }

    return galleryHtml;
}

// Make changeMainImage available globally
window.changeMainImage = function(productId, index) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || !product.images || !product.images[index]) return;

    const mainImage = document.getElementById(`main-image-${productId}`);
    if (mainImage) {
        mainImage.src = product.images[index];
    }

    // Update active thumbnail
    const thumbnails = document.querySelectorAll(`.gallery-thumbnail[data-product="${productId}"]`);
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
};

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
        ).filter(Boolean) // Remove undefined/null
    )];

    // Clear existing options except the first "All Categories"
    while (categoryFilter.options.length > 1) {
        categoryFilter.remove(1);
    }

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
            .includes(search)
            ||
            product.category
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
                // Scroll to top of product grid
                productGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                // Scroll to top of product grid
                productGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
                <h3>No products found</h3>
                <p>Try another search or category.</p>
            </div>
        `;

        if(pageInfo) {
            pageInfo.textContent = "";
        }

        if(prevPage) prevPage.disabled = true;
        if(nextPage) nextPage.disabled = true;

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

    // Build gallery HTML
    const galleryHtml = createImageGallery(product.images, product.id);

    card.innerHTML = `

    <div class="product-slider">

        <div class="category-tag">
            ${product.category || "General"}
        </div>

        <div class="product-gallery">
            ${galleryHtml}
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

        <div class="quantity-selector">
            <button 
                class="qty-btn qty-minus" 
                data-product="${product.id}"
                ${product.stock <= 0 ? 'disabled' : ''}
            >
                -
            </button>
            <span class="qty-display" id="qty-display-${product.id}">1</span>
            <button 
                class="qty-btn qty-plus" 
                data-product="${product.id}"
                ${product.stock <= 0 ? 'disabled' : ''}
            >
                +
            </button>
        </div>

        <div class="product-actions">

            <button
                class="add-cart-btn"
                data-id="${product.id}"
                ${product.stock <= 0 ? 'disabled' : ''}
            >
                Add To Cart
            </button>

            <button
                class="buy-now"
                data-buy="${product.id}"
                ${product.stock <= 0 ? 'disabled' : ''}
            >
                Buy Now
            </button>

        </div>

    </div>
    `;

    attachProductEvents(
        card,
        product
    );

    return card;
}

function attachProductEvents(
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

    // Quantity selector buttons
    const minusBtn =
    card.querySelector(`.qty-minus[data-product="${product.id}"]`);
    
    const plusBtn =
    card.querySelector(`.qty-plus[data-product="${product.id}"]`);
    
    const qtyDisplay =
    card.querySelector(`#qty-display-${product.id}`);

    let currentQty = 1;

    function updateQtyDisplay() {
        if (qtyDisplay) {
            qtyDisplay.textContent = currentQty;
        }
        // Update button states
        if (minusBtn) {
            minusBtn.disabled = currentQty <= 1;
        }
        if (plusBtn) {
            plusBtn.disabled = currentQty >= product.stock;
        }
    }

    if (minusBtn) {
        minusBtn.addEventListener(
            "click",
            () => {
                if (currentQty > 1) {
                    currentQty--;
                    updateQtyDisplay();
                }
            }
        );
    }

    if (plusBtn) {
        plusBtn.addEventListener(
            "click",
            () => {
                if (currentQty < product.stock) {
                    currentQty++;
                    updateQtyDisplay();
                }
            }
        );
    }

    // Initialize quantity display
    updateQtyDisplay();

    addButton.addEventListener(
        "click",
        ()=>{
            if(
                window.addToCart
            ){
                window.addToCart(
                    product,
                    currentQty
                );
            }
        }
    );

    buyButton.addEventListener(
        "click",
        ()=>{
            if(
                window.buyNow
            ){
                window.buyNow(
                    product,
                    currentQty
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

    if (pageInfo) {
        pageInfo.textContent =
        `Page ${currentPage} of ${totalPages}`;
    }

    if (prevPage) {
        prevPage.disabled =
        currentPage === 1;
    }

    if (nextPage) {
        nextPage.disabled =
        currentPage === totalPages;
    }
}

window.refreshProducts =
loadProducts;