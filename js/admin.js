import {
    auth,
    db,
    storage
}
from "./firebase-config.js";

import {
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    serverTimestamp,
    getDocs,
    onSnapshot,
    query,
    orderBy
}
from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
}
from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

let products = [];

let filteredProducts = [];

let orders = [];

let admins = [];

let editingProductId = null;

const productTableBody =
document.getElementById(
    "productTableBody"
);

const ordersTableBody =
document.getElementById(
    "ordersTableBody"
);

const adminTableBody =
document.getElementById(
    "adminTableBody"
);

const productSearch =
document.getElementById(
    "productSearch"
);

const orderSearch =
document.getElementById(
    "orderSearch"
);

const productCount =
document.getElementById(
    "productCount"
);

const orderCount =
document.getElementById(
    "orderCount"
);

const revenue =
document.getElementById(
    "revenue"
);

const pendingOrders =
document.getElementById(
    "pendingOrders"
);

const todayRevenue =
document.getElementById(
    "todayRevenue"
);

const monthlyRevenue =
document.getElementById(
    "monthlyRevenue"
);

const completedOrders =
document.getElementById(
    "completedOrders"
);

const cancelledOrders =
document.getElementById(
    "cancelledOrders"
);

onAuthStateChanged(

    auth,

    async (user)=>{

        if(!user){

            window.location.href =
            "/login.html";

            return;
        }

        await initializeDashboard();

    }

);

async function initializeDashboard(){

    await ensureCurrentAdminDoc();

    loadProducts();

    loadOrders();

    loadAdmins();

    setupSearch();

    setupSidebar();

}

async function ensureCurrentAdminDoc(){

    const user = auth.currentUser;

    if(!user?.email){
        return;
    }

    const normalizedEmail = user.email.trim().toLowerCase();

    try{

        await setDoc(
            doc(db, "admins", normalizedEmail),
            {
                name: user.displayName || normalizedEmail,
                email: normalizedEmail,
                role: "admin",
                active: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

    }
    catch(error){

        console.warn("Unable to sync admin record:", error);

    }

}

function setupSidebar(){

    const menuToggle =
    document.getElementById(
        "menuToggle"
    );

    const sidebar =
    document.getElementById(
        "adminSidebar"
    );

    if(menuToggle){

        menuToggle.addEventListener(
            "click",
            ()=>{

                sidebar.classList.toggle(
                    "active"
                );

            }
        );

    }

}

function loadProducts(){

    const productsRef =
    collection(
        db,
        "products"
    );

    const productsQuery =
    query(
        productsRef,
        orderBy(
            "createdAt",
            "desc"
        )
    );

    onSnapshot(

        productsQuery,

        (snapshot)=>{

            products = [];

            snapshot.forEach(doc=>{

                products.push({

                    id: doc.id,

                    ...doc.data()

                });

            });

            filteredProducts =
            [...products];

            renderProducts();

            updateAnalytics();

        }

    );

}

function renderProducts(){

    if(!productTableBody)
        return;

    productTableBody.innerHTML =
    "";

    filteredProducts.forEach(
        product=>{

            const row =
            document.createElement(
                "tr"
            );

            row.innerHTML = `

            <td>

                <img
                src="${
                    product.images?.[0]
                    ||
                    ""
                }"
                style="
                    width:70px;
                    height:70px;
                    object-fit:cover;
                    border-radius:8px;
                ">

            </td>

            <td>
                ${product.name}
            </td>

            <td>
                ${
                    product.category
                    ||
                    "-"
                }
            </td>

            <td>

                KES

                ${Number(
                    product.price
                ).toLocaleString()}

            </td>

            <td>

                ${
                    product.stock
                }

            </td>

            <td>

                <button
                class="view-btn"
                data-edit="${
                    product.id
                }">

                    Edit

                </button>

                <button
                class="delete-btn"
                data-delete="${
                    product.id
                }">

                    Delete

                </button>

            </td>

            `;

            productTableBody
            .appendChild(row);

        }
    );

    attachProductActions();

}

function setupSearch(){

    if(productSearch){

        productSearch
        .addEventListener(

            "input",

            ()=>{

                const value =

                productSearch
                .value
                .toLowerCase();

                filteredProducts =

                products.filter(
                    product=>{

                        return (

                            product.name
                            ?.toLowerCase()
                            .includes(
                                value
                            )

                            ||

                            product.category
                            ?.toLowerCase()
                            .includes(
                                value
                            )

                        );

                    }
                );

                renderProducts();

            }

        );

    }

    if(orderSearch){

        orderSearch
        .addEventListener(

            "input",

            ()=>{

                renderOrders();

            }

        );

    }

}

function attachProductActions(){

    document
    .querySelectorAll(
        "[data-edit]"
    )
    .forEach(btn=>{

        btn.onclick = ()=>{

            const id =
            btn.dataset.edit;

            startEditProduct(
                id
            );

        };

    });

    document
    .querySelectorAll(
        "[data-delete]"
    )
    .forEach(btn=>{

        btn.onclick = ()=>{

            const id =
            btn.dataset.delete;

            confirmDeleteProduct(
                id
            );

        };

    });

}

function loadOrders(){

    const ordersRef =
    collection(
        db,
        "orders"
    );

    const ordersQuery =
    query(
        ordersRef,
        orderBy(
            "createdAt",
            "desc"
        )
    );

    onSnapshot(

        ordersQuery,

        (snapshot)=>{

            orders = [];

            snapshot.forEach(doc=>{

                orders.push({

                    id: doc.id,

                    ...doc.data()

                });

            });

            renderOrders();

            updateAnalytics();

        }

    );

}

function loadAdmins(){

    const adminsRef =
    collection(
        db,
        "admins"
    );

    onSnapshot(

        adminsRef,

        (snapshot)=>{

            admins = [];

            snapshot.forEach(doc=>{

                admins.push({

                    id: doc.id,

                    ...doc.data()

                });

            });

            renderAdmins();

        }

    );

}

function updateAnalytics(){

    if(productCount){

        productCount.textContent =
        products.length;
    }

    if(orderCount){

        orderCount.textContent =
        orders.length;
    }

    const totalRevenue =

    orders.reduce(

        (sum,order)=>{

            return sum +
            Number(
                order.total || 0
            );

        },

        0

    );

    if(revenue){

        revenue.textContent =

        "KES " +

        totalRevenue
        .toLocaleString();

    }

    const pending =

    orders.filter(

        order=>

        order.status ===
        "Pending"

    ).length;

    if(pendingOrders){

        pendingOrders.textContent =
        pending;
    }

}

const productForm =
document.getElementById(
    "productForm"
);

const imageInput =
document.getElementById(
    "productImages"
);

const imagePreview =
document.getElementById(
    "imagePreview"
);

let selectedFiles = [];

if(imageInput){

    imageInput.addEventListener(
        "change",
        previewImages
    );

}

function previewImages(){

    selectedFiles =
    [...imageInput.files];

    imagePreview.innerHTML = "";

    selectedFiles.forEach(file=>{

        const reader =
        new FileReader();

        reader.onload =
        function(e){

            const img =
            document.createElement(
                "img"
            );

            img.src =
            e.target.result;

            img.style.width =
            "100px";

            img.style.height =
            "100px";

            img.style.objectFit =
            "cover";

            img.style.borderRadius =
            "10px";

            img.style.margin =
            "5px";

            imagePreview
            .appendChild(img);

        };

        reader.readAsDataURL(
            file
        );

    });

}

if(productForm){

    productForm.addEventListener(

        "submit",

        async (e)=>{

            e.preventDefault();

            try{

                showLoader();

                if(
                    editingProductId
                ){

                    await updateProduct();

                }
                else{

                    await createProduct();

                }

                hideLoader();

            }
            catch(error){

                console.error(
                    error
                );

                hideLoader();

                showToast(
                    "Operation failed",
                    "error"
                );

            }

        }

    );

}

async function createProduct(){

    let imageUrls = [];

    if(selectedFiles.length){

        try{

            imageUrls =
            await uploadImages();

        }
        catch(error){

            console.warn(
                "Image upload failed. Saving product without images.",
                error
            );

            showToast(
                "Image upload failed. Product saved without images.",
                "error"
            );

        }

    }

    const product = {

        name:
        document
        .getElementById(
            "productName"
        )
        .value
        .trim(),

        category:
        document
        .getElementById(
            "productCategory"
        )
        .value,

        description:
        document
        .getElementById(
            "productDescription"
        )
        .value
        .trim(),

        price:
        Number(
            document
            .getElementById(
                "productPrice"
            )
            .value
        ),

        stock:
        Number(
            document
            .getElementById(
                "productStock"
            )
            .value
        ),

        images:
        imageUrls,

        createdAt:
        serverTimestamp()

    };

    await addDoc(

        collection(
            db,
            "products"
        ),

        product

    );

    productForm.reset();

    imagePreview.innerHTML =
    "";

    selectedFiles = [];

    showToast(

        "Product added",

        "success"

    );

}

async function updateProduct(){

    const productRef =
    doc(
        db,
        "products",
        editingProductId
    );

    let imageUrls = [];

    if(
        selectedFiles.length
    ){

        try{

            imageUrls =
            await uploadImages();

        }
        catch(error){

            console.warn(
                "Image upload failed while updating product.",
                error
            );

            showToast(
                "Image upload failed. Product updated without new images.",
                "error"
            );

        }
    }

    const payload = {

        name:
        document
        .getElementById(
            "productName"
        )
        .value,

        category:
        document
        .getElementById(
            "productCategory"
        )
        .value,

        description:
        document
        .getElementById(
            "productDescription"
        )
        .value,

        price:
        Number(
            document
            .getElementById(
                "productPrice"
            )
            .value
        ),

        stock:
        Number(
            document
            .getElementById(
                "productStock"
            )
            .value
        )

    };

    if(
        imageUrls.length
    ){

        payload.images =
        imageUrls;

    }

    await updateDoc(

        productRef,

        payload

    );

    editingProductId =
    null;

    document
    .getElementById(
        "saveProductBtn"
    )
    .innerHTML =

    `<i class="fa-solid fa-floppy-disk"></i>
     Save Product`;

    productForm.reset();

    imagePreview.innerHTML =
    "";

    selectedFiles = [];

    showToast(

        "Product updated",

        "success"

    );

}

function startEditProduct(id){

    const product =

    products.find(

        p => p.id === id

    );

    if(!product) return;

    editingProductId =
    id;

    document
    .getElementById(
        "productId"
    )
    .value = id;

    document
    .getElementById(
        "productName"
    )
    .value =
    product.name || "";

    document
    .getElementById(
        "productCategory"
    )
    .value =
    product.category || "";

    document
    .getElementById(
        "productDescription"
    )
    .value =
    product.description || "";

    document
    .getElementById(
        "productPrice"
    )
    .value =
    product.price || 0;

    document
    .getElementById(
        "productStock"
    )
    .value =
    product.stock || 0;

    imagePreview.innerHTML =
    "";

    if(product.images){

        product.images.forEach(url=>{

            const img =
            document.createElement(
                "img"
            );

            img.src = url;

            img.style.width =
            "100px";

            img.style.height =
            "100px";

            img.style.objectFit =
            "cover";

            img.style.margin =
            "5px";

            img.style.borderRadius =
            "10px";

            imagePreview
            .appendChild(img);

        });

    }

    document
    .getElementById(
        "saveProductBtn"
    )
    .innerHTML =

    `<i class="fa-solid fa-pen"></i>
     Update Product`;

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

}

let deleteTarget = null;

function confirmDeleteProduct(id){

    deleteTarget = id;

    document
    .getElementById(
        "deleteModal"
    )
    .style.display =
    "flex";

}

document
.getElementById(
    "cancelDeleteBtn"
)
?.addEventListener(

    "click",

    ()=>{

        document
        .getElementById(
            "deleteModal"
        )
        .style.display =
        "none";

        deleteTarget =
        null;

    }

);

document
.getElementById(
    "confirmDeleteBtn"
)
?.addEventListener(

    "click",

    async ()=>{

        if(!deleteTarget)
            return;

        try{

            await deleteDoc(

                doc(
                    db,
                    "products",
                    deleteTarget
                )

            );

            showToast(

                "Product deleted",

                "success"

            );

        }
        catch(error){

            console.error(
                error
            );

            showToast(

                "Delete failed",

                "error"

            );

        }

        document
        .getElementById(
            "deleteModal"
        )
        .style.display =
        "none";

        deleteTarget =
        null;

    }

);

async function uploadImages(){

    const urls = [];

    for(const file of selectedFiles){

        const fileName =

        Date.now() +
        "-" +
        file.name;

        const storageRef =

        ref(

            storage,

            `products/${fileName}`

        );

        await uploadBytes(

            storageRef,

            file

        );

        const url =

        await getDownloadURL(
            storageRef
        );

        urls.push(url);

    }

    return urls;

}

const ORDER_STATUSES = [
    "Pending",
    "Processing",
    "Completed",
    "Cancelled"
];

function renderOrders(){

    if(!ordersTableBody) return;

    const searchTerm =
    orderSearch
    ? orderSearch.value
        .trim()
        .toLowerCase()
    : "";

    ordersTableBody.innerHTML = "";

    let filteredOrders =
    [...orders];

    if(searchTerm){

        filteredOrders =
        orders.filter(order=>{

            const idMatch =
            order.id
            ?.toLowerCase()
            .includes(searchTerm);

            const customerMatch =
            order.customerName
            ?.toLowerCase()
            .includes(searchTerm);

            const phoneMatch =
            order.customerPhone
            ?.toLowerCase()
            .includes(searchTerm);

            return (
                idMatch ||
                customerMatch ||
                phoneMatch
            );

        });

    }

    filteredOrders.forEach(order=>{

        const row =
        document.createElement("tr");

        const itemCount =
        order.items
        ? order.items.length
        : 0;

        row.innerHTML = `

        <td>
            ${order.id}
        </td>

        <td>
            ${order.customerName || "-"}
        </td>

        <td>
            ${order.customerPhone || "-"}
        </td>

        <td>
            ${itemCount}
        </td>

        <td>
            KES ${Number(
                order.total || 0
            ).toLocaleString()}
        </td>

        <td>

            <span
            class="status status-${(
                order.status ||
                "Pending"
            ).toLowerCase()}">

                ${order.status || "Pending"}

            </span>

        </td>

        <td>

            ${
                formatOrderDate(
                    order.createdAt
                )
            }

        </td>

        <td>

            <button
            class="view-btn"
            data-view-order="${order.id}">

                View

            </button>

            <button
            class="status-btn"
            data-status-order="${order.id}">

                Status

            </button>

        </td>

        `;

        ordersTableBody.appendChild(
            row
        );

    });

    attachOrderEvents();

    calculateRevenue();

}

function attachOrderEvents(){

    document
    .querySelectorAll(
        "[data-view-order]"
    )
    .forEach(btn=>{

        btn.onclick = ()=>{

            const id =
            btn.dataset.viewOrder;

            showOrderDetails(id);

        };

    });

    document
    .querySelectorAll(
        "[data-status-order]"
    )
    .forEach(btn=>{

        btn.onclick = ()=>{

            const id =
            btn.dataset.statusOrder;

            showStatusSelector(id);

        };

    });

}

function showOrderDetails(id){

    const order =
    orders.find(
        o => o.id === id
    );

    if(!order) return;

    const modal =
    document.getElementById(
        "orderModal"
    );

    const details =
    document.getElementById(
        "orderDetails"
    );

    let html = `

    <div class="order-details">

        <p>

            <strong>
            Order ID:
            </strong>

            ${order.id}

        </p>

        <p>

            <strong>
            Customer:
            </strong>

            ${order.customerName}

        </p>

        <p>

            <strong>
            Phone:
            </strong>

            ${order.customerPhone}

        </p>

        <p>

            <strong>
            Status:
            </strong>

            ${order.status}

        </p>

        <p>

            <strong>
            Total:
            </strong>

            KES ${Number(
                order.total
            ).toLocaleString()}

        </p>

        <hr>

        <h3>
            Items
        </h3>

    `;

    if(order.items){

        order.items.forEach(item=>{

            html += `

            <div
            class="order-item">

                <img
                src="${item.image}"
                width="70">

                <div>

                    <strong>
                        ${item.name}
                    </strong>

                    <br>

                    Qty:
                    ${item.quantity}

                    <br>

                    KES
                    ${Number(
                        item.price
                    ).toLocaleString()}

                </div>

            </div>

            `;

        });

    }

    html += `</div>`;

    details.innerHTML =
    html;

    modal.style.display =
    "flex";

}

document
.getElementById(
    "closeOrderModal"
)
?.addEventListener(

    "click",

    ()=>{

        document
        .getElementById(
            "orderModal"
        )
        .style.display =
        "none";

    }

);

async function showStatusSelector(id){

    const current =
    orders.find(
        o => o.id === id
    );

    if(!current) return;

    const newStatus =
    prompt(
        `Current Status: ${current.status}

Available:
Pending
Processing
Completed
Cancelled

Enter new status:`,
        current.status
    );

    if(
        !newStatus ||
        !ORDER_STATUSES.includes(
            newStatus
        )
    ){

        return;
    }

    try{

        await updateOrderStatus(
            id,
            newStatus
        );

        showToast(
            "Status updated",
            "success"
        );

    }
    catch(error){

        console.error(error);

        showToast(
            "Update failed",
            "error"
        );

    }

}

async function updateOrderStatus(
    orderId,
    status
){

    const orderRef =
    doc(
        db,
        "orders",
        orderId
    );

    await updateDoc(
        orderRef,
        {
            status
        }
    );

}

function calculateRevenue(){

    let totalRevenue = 0;
    let todayTotal = 0;
    let monthTotal = 0;

    let completed = 0;
    let cancelled = 0;

    const today =
    new Date();

    orders.forEach(order=>{

        const amount =
        Number(
            order.total || 0
        );

        totalRevenue += amount;

        if(
            order.status ===
            "Completed"
        ){

            completed++;

        }

        if(
            order.status ===
            "Cancelled"
        ){

            cancelled++;

        }

        if(order.createdAt){

            const orderDate =
            order.createdAt.toDate
            ? order.createdAt.toDate()
            : new Date();

            if(

                orderDate
                .toDateString()

                ===

                today
                .toDateString()

            ){

                todayTotal += amount;

            }

            if(

                orderDate
                .getMonth()

                ===

                today
                .getMonth()

                &&

                orderDate
                .getFullYear()

                ===

                today
                .getFullYear()

            ){

                monthTotal += amount;

            }

        }

    });

    if(revenue){

        revenue.textContent =
        "KES " +
        totalRevenue
        .toLocaleString();

    }

    if(todayRevenue){

        todayRevenue.textContent =
        "KES " +
        todayTotal
        .toLocaleString();

    }

    if(monthlyRevenue){

        monthlyRevenue.textContent =
        "KES " +
        monthTotal
        .toLocaleString();

    }

    if(completedOrders){

        completedOrders.textContent =
        completed;

    }

    if(cancelledOrders){

        cancelledOrders.textContent =
        cancelled;

    }

}

function formatOrderDate(timestamp){

    if(!timestamp)
        return "-";

    try{

        const date =
        timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

        return date.toLocaleDateString(
            "en-KE",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );

    }
    catch{

        return "-";
    }

}

const adminForm =
document.getElementById(
    "adminForm"
);

if(adminForm){

    adminForm.addEventListener(

        "submit",

        async (e)=>{

            e.preventDefault();

            try{

                showLoader();

                const name =
                document
                .getElementById(
                    "adminName"
                )
                .value
                .trim();

                const email =
                document
                .getElementById(
                    "adminEmail"
                )
                .value
                .trim()
                .toLowerCase();

                const role =
                document
                .getElementById(
                    "adminRole"
                )
                .value;

                await setDoc(
                    doc(
                        db,
                        "admins",
                        email
                    ),
                    {
                        name,
                        email,
                        role,
                        active: true,
                        createdAt: serverTimestamp()
                    }
                );

                adminForm.reset();

                showToast(
                    "Admin added",
                    "success"
                );

            }
            catch(error){

                console.error(error);

                showToast(
                    "Failed to add admin",
                    "error"
                );

            }

            hideLoader();

        }

    );

}

function renderAdmins(){

    if(!adminTableBody)
        return;

    adminTableBody.innerHTML =
    "";

    admins.forEach(admin=>{

        const row =
        document.createElement(
            "tr"
        );

        row.innerHTML = `

        <td>
            ${admin.name || "-"}
        </td>

        <td>
            ${admin.email || "-"}
        </td>

        <td>
            ${admin.role || "admin"}
        </td>

        <td>

            <button
            class="delete-btn"
            data-admin-delete="${admin.id}">

                Remove

            </button>

        </td>

        `;

        adminTableBody
        .appendChild(row);

    });

    attachAdminEvents();

}

function attachAdminEvents(){

    document
    .querySelectorAll(
        "[data-admin-delete]"
    )
    .forEach(btn=>{

        btn.onclick = async ()=>{

            const id =
            btn.dataset.adminDelete;

            if(
                !confirm(
                    "Remove admin?"
                )
            ){
                return;
            }

            try{

                await deleteDoc(

                    doc(
                        db,
                        "admins",
                        id
                    )

                );

                showToast(
                    "Admin removed",
                    "success"
                );

            }
            catch(error){

                console.error(error);

                showToast(
                    "Failed",
                    "error"
                );

            }

        };

    });

}

const saveSettingsBtn =
document.getElementById(
    "saveSettingsBtn"
);

if(saveSettingsBtn){

    saveSettingsBtn
    .addEventListener(

        "click",

        saveStoreSettings

    );

}

async function saveStoreSettings(){

    try{

        showLoader();

        const settings = {

            storeName:
            document
            .getElementById(
                "storeName"
            )
            .value,

            storePhone:
            document
            .getElementById(
                "storePhone"
            )
            .value,

            storeEmail:
            document
            .getElementById(
                "storeEmail"
            )
            .value,

            storeDescription:
            document
            .getElementById(
                "storeDescription"
            )
            .value,

            updatedAt:
            serverTimestamp()

        };

        await setDoc(

            doc(
                db,
                "settings",
                "store"
            ),

            settings

        );

        showToast(
            "Settings saved",
            "success"
        );

    }
    catch(error){

        console.error(error);

        showToast(
            "Failed to save settings",
            "error"
        );

    }

    hideLoader();

}

async function loadSettings(){

    try{

        const snapshot =
        await getDocs(
            collection(
                db,
                "settings"
            )
        );

        snapshot.forEach(docData=>{

            const data =
            docData.data();

            if(
                document.getElementById(
                    "storeName"
                )
            ){

                document
                .getElementById(
                    "storeName"
                )
                .value =
                data.storeName || "";

                document
                .getElementById(
                    "storePhone"
                )
                .value =
                data.storePhone || "";

                document
                .getElementById(
                    "storeEmail"
                )
                .value =
                data.storeEmail || "";

                document
                .getElementById(
                    "storeDescription"
                )
                .value =
                data.storeDescription || "";

            }

        });

    }
    catch(error){

        console.error(error);

    }

}

function showToast(

    message,

    type = "info"

){

    const container =
    document.getElementById(
        "toastContainer"
    );

    if(!container)
        return;

    const toast =
    document.createElement(
        "div"
    );

    toast.className =
    `toast toast-${type}`;

    toast.textContent =
    message;

    container.appendChild(
        toast
    );

    setTimeout(()=>{

        toast.classList.add(
            "show"
        );

    },100);

    setTimeout(()=>{

        toast.remove();

    },4000);

}

function showLoader(){

    const loader =
    document.getElementById(
        "loaderOverlay"
    );

    if(loader){

        loader.style.display =
        "flex";

    }

}

function hideLoader(){

    const loader =
    document.getElementById(
        "loaderOverlay"
    );

    if(loader){

        loader.style.display =
        "none";

    }

}

function updateFirebaseStatus(
    connected = true
){

    const status =
    document.getElementById(
        "firebaseStatus"
    );

    if(!status) return;

    if(connected){

        status.className =
        "firebase-status firebase-online";

        status.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        Connected to Firebase
        `;

    }
    else{

        status.className =
        "firebase-status firebase-offline";

        status.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        Firebase Offline
        `;

    }

}

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        loadSettings();

        updateFirebaseStatus(
            true
        );

    }

);

window.showToast =
showToast;

window.showLoader =
showLoader;

window.hideLoader =
hideLoader;
