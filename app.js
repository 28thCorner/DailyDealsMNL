/* =========================================================
   DAILY DEALS - SUPABASE VERSION
   GitHub Pages + Supabase
   ========================================================= */

const SUPABASE_URL = "https://kdwsaxovwgyehggzwxsb.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_Uu0U5bD3ZoqJDS6X_Ev1Mg_L0Y1p0x-";

/*
  IMPORTANT:
  This is your OWNER'S Supabase Auth UID.
  Only this account can add/edit/delete products.
*/
const OWNER_USER_ID = "49287653-4b49-4eb8-9d92-e41986dc1434";

const PRODUCTS_TABLE = "products";
const STORAGE_BUCKET = "products";

let supabase = null;
let currentUser = null;
let isOwner = false;

let products = [];
let cart = JSON.parse(localStorage.getItem("ddCart") || "null") || [
  { productId: 1, qty: 2 },
  { productId: 2, qty: 1 },
  { productId: 3, qty: 1 }
];

let filter = "dashboard";
let editId = null;
let uploadedFile = null;
let uploadedPreview = "";

const defaults = [
  {
    id: 1,
    name: "Michael Kors Tote Bag",
    category: "Bags",
    price: 4299,
    image: "bag.jpg"
  },
  {
    id: 2,
    name: "Anne Klein Watch",
    category: "Watches",
    price: 1799,
    image: "watch.jpg"
  },
  {
    id: 3,
    name: "Tommy Hilfiger Perfume",
    category: "Perfume",
    price: 3499,
    image: "perfume.jpg"
  },
  {
    id: 4,
    name: "Classic Black Bag",
    category: "Bags",
    price: 2999,
    image: "sale_bag.jpg",
    sale: true
  },
  {
    id: 5,
    name: "Tommy Casual Shoes",
    category: "Shoes",
    price: 3899,
    image: "shoes.jpg",
    new: true
  },
  {
    id: 6,
    name: "Daily Vitamins",
    category: "Vitamins",
    price: 1299,
    image: "vitamins.jpg",
    new: true
  },
  {
    id: 7,
    name: "Designer Wallet",
    category: "Wallets",
    price: 2199,
    image: "wallet.jpg",
    new: true
  }
];

const cats = [
  ["Bags", "bag.jpg"],
  ["Wallets", "wallet.jpg"],
  ["Perfume", "perfume.jpg"],
  ["Shoes", "shoes.jpg"],
  ["Vitamins", "vitamins.jpg"],
  ["Watches", "watch.jpg"]
];

/* Removed brands:
   Carol
   Alexis Bendel
   Karen Neuburger
   DCSHOECOUSA
   Stone Mountain USA
   Vera Wang
   Escada
   planetGOLD
   White Mountain
*/

const brands =
  "adidas|ALDO|ANNE KLEIN|BEVERLY HILLS POLO CLUB|Calvin Klein|Champion|COLE HAAN|DKNY|GAP|GUESS|HEAD|Herschel|HUGO|IZOD|JORDAN|Juicy Couture|KARL LAGERFELD|kate spade|kipling|LACOSTE|Levi’s|MARC JACOBS|MICHAEL KORS|nanette lepore|NAUTICA|NIKE|NINE WEST|Paris Hilton|Penguin|PERRY ELLIS|PUMA|RALPH LAUREN|Reebok|STEVE MADDEN|TED BAKER|TOMMY HILFIGER|TRUE RELIGION|U.S POLO ASSN.|VAN HEUSEN|WRANGLER|XOXO".split(
    "|"
  );

const page = document.getElementById("page");

const money = (n) =>
  "₱" +
  Number(n || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2
  });

const esc = (s) =>
  String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));

/* =========================================================
   LOAD SUPABASE LIBRARY
   ========================================================= */

function loadSupabaseLibrary() {
  return new Promise((resolve, reject) => {
    if (window.supabase) {
      resolve();
      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Unable to load Supabase library."));

    document.head.appendChild(script);
  });
}

/* =========================================================
   INITIALIZE
   ========================================================= */

async function init() {
  try {
    await loadSupabaseLibrary();

    supabase = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );

    const {
      data: { session }
    } = await supabase.auth.getSession();

    currentUser = session?.user || null;
    isOwner = currentUser?.id === OWNER_USER_ID;

    await loadProducts();

    setupAuthListener();
    setupButtons();

    dashboard();
    renderCart();

    updateOwnerInterface();

  } catch (error) {
    console.error(error);

    products = [...defaults];

    dashboard();
    renderCart();

    alert(
      "The website could not connect to Supabase. Please check your Supabase settings."
    );
  }
}

/* =========================================================
   AUTH
   ========================================================= */

function setupAuthListener() {
  if (!supabase) return;

  supabase.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;

    isOwner = currentUser?.id === OWNER_USER_ID;

    updateOwnerInterface();

    if (session?.user) {
      await loadProducts();

      if (filter === "dashboard") {
        dashboard();
      } else if (filter === "shop") {
        shop();
      } else if (filter === "sale") {
        sale();
      } else if (filter === "new") {
        newArrivals();
      }
    }
  });
}

/* =========================================================
   OWNER ACCESS
   ========================================================= */

function updateOwnerInterface() {
  const addButtons = document.querySelectorAll(".add-product");

  addButtons.forEach((button) => {
    button.style.display = isOwner ? "" : "none";
  });
}

/*
  This is only the visual restriction.

  The REAL protection must come from your Supabase
  Row Level Security policies, so another user cannot
  bypass the hidden button.
*/

function ownerOnly() {
  if (!currentUser) {
    alert("Please log in as the store owner.");
    return false;
  }

  if (!isOwner) {
    alert("Only the store owner can manage products.");
    return false;
  }

  return true;
}

/* =========================================================
   PRODUCTS
   ========================================================= */

async function loadProducts() {
  if (!supabase) {
    products = [...defaults];
    return;
  }

  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select("*")
    .order("created_at", {
      ascending: false
    });

  if (error) {
    console.error("Supabase product error:", error);

    /*
      If the table is empty/not ready yet, keep your
      original products visible.
    */
    products = [...defaults];

    return;
  }

  products = (data || []).map(normalizeProduct);

  /*
    If Supabase has no products yet, show the original
    products so the page does not appear empty.
  */
  if (!products.length) {
    products = [...defaults];
  }
}

/* =========================================================
   NORMALIZE DATABASE PRODUCT
   ========================================================= */

function normalizeProduct(p) {
  return {
    id: p.id,

    name: p.name || "",

    category:
      p.category ||
      p.product_category ||
      "Bags",

    price:
      Number(
        p.price ||
        p.original_price ||
        0
      ),

    salePrice:
      Number(
        p.sale_price ??
        p.salePrice ??
        0
      ) || null,

    description:
      p.description || "",

    image:
      p.image_url ||
      p.image ||
      p.image_path ||
      "bag.jpg",

    new:
      Boolean(
        p.is_new ??
        p.new ??
        p.new_arrival ??
        false
      ),

    sale:
      Boolean(
        p.is_sale ??
        p.sale ??
        false
      )
  };
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function dashboard() {
  filter = "dashboard";

  page.innerHTML = `
    <section class="hero">
      <h1>Style Meets<br>Great Deals</h1>
      <p>Authentic Brands. Amazing Prices.</p>
      <button class="pink" onclick="shop()">
        Shop Now →
      </button>
    </section>

    <div class="section-head">
      <h2>Shop by Category</h2>
      <button class="view" onclick="shop()">
        View All →
      </button>
    </div>

    <div class="cats">
      ${cats
        .map(
          (x) => `
            <button
              class="cat"
              onclick="category('${x[0]}')"
            >
              <img
                src="${x[1]}"
                onerror="this.src='bag.jpg'"
              >
              ${x[0]}
            </button>
          `
        )
        .join("")}
    </div>

    <div class="promos">

      <div class="promo sale">
        <h3>FLASH SALE ⚡</h3>
        <p>Up to 70% OFF • Limited time only!</p>

        <button
          class="shopbtn"
          onclick="sale()"
        >
          Shop Now
        </button>

        <img
          src="sale_bag.jpg"
          onerror="this.src='bag.jpg'"
        >
      </div>

      <div class="promo new">
        <h3>New Arrivals ♥</h3>
        <p>Fresh styles you'll love.</p>

        <button
          class="shopbtn"
          onclick="newArrivals()"
        >
          Discover Now
        </button>

        <img
          src="new_shoes.jpg"
          onerror="this.src='shoes.jpg'"
        >
      </div>

    </div>

    <section class="brands">
      <h2>CHOOSE FROM POPULAR BRANDS</h2>
      <div class="under"></div>

      <div class="brandgrid">
        ${brands
          .map(
            (b) => `
              <div class="brand">
                ${esc(b)}
              </div>
            `
          )
          .join("")}
      </div>
    </section>
  `;

  updateOwnerInterface();
}

/* =========================================================
   PRODUCT CARD
   ========================================================= */

function card(p) {
  const sp =
    p.salePrice ||
    (p.sale
      ? Math.round(Number(p.price) * 0.7)
      : 0);

  return `
    <article class="product">

      ${
        p.sale
          ? '<span class="badge">SALE</span>'
          : p.new
          ? '<span class="badge">NEW</span>'
          : ""
      }

      <img
        src="${esc(p.image || "bag.jpg")}"
        onerror="this.src='bag.jpg'"
      >

      <div class="info">

        <h3>
          ${esc(p.name)}
        </h3>

        <p>
          ${esc(p.category)}
        </p>

        <span class="price">
          ${money(sp || p.price)}

          ${
            sp
              ? `<span class="old">${money(
                  p.price
                )}</span>`
              : ""
          }
        </span>

        <button
          class="add"
          onclick="add(${JSON.stringify(p.id)})"
        >
          + Add
        </button>

        ${
          isOwner
            ? `
              <button
                class="add"
                style="margin-right:5px;background:#333"
                onclick="openModal(${JSON.stringify(
                  p.id
                )})"
              >
                Edit
              </button>
            `
            : ""
        }

      </div>

    </article>
  `;
}

/* =========================================================
   LISTING
   ========================================================= */

function listing(title, list) {
  page.innerHTML = `
    <div class="section-head">

      <h1 class="page-title">
        ${esc(title)}
      </h1>

      ${
        isOwner
          ? `
            <button
              class="pink add-product"
              onclick="openModal()"
            >
              ＋ Add Product
            </button>
          `
          : ""
      }

    </div>

    <div class="products">

      ${
        list.length
          ? list.map(card).join("")
          : '<div class="empty">No products found.</div>'
      }

    </div>
  `;

  updateOwnerInterface();
}

/* =========================================================
   FILTERS
   ========================================================= */

function shop() {
  filter = "shop";
  listing("Shop All", products);
}

function sale() {
  filter = "sale";
  listing(
    "Sale Items",
    products.filter((p) => p.sale)
  );
}

function newArrivals() {
  filter = "new";

  listing(
    "New Arrivals",
    products.filter((p) => p.new)
  );
}

function category(c) {
  filter = c;

  listing(
    c,
    products.filter(
      (p) => p.category === c
    )
  );
}

/* =========================================================
   OTHER PAGES
   ========================================================= */

function simple(title, msg) {
  page.innerHTML = `
    <h1 class="page-title">
      ${esc(title)}
    </h1>

    <p class="muted">
      ${esc(msg)}
    </p>

    <div class="empty">
      This section is ready for your store data.
    </div>
  `;
}

/* =========================================================
   CART
   ========================================================= */

function saveCart() {
  localStorage.setItem(
    "ddCart",
    JSON.stringify(cart)
  );
}

function add(id) {
  const existing = cart.find(
    (i) => String(i.productId) === String(id)
  );

  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      productId: id,
      qty: 1
    });
  }

  saveCart();
  renderCart();
}

function qty(id, d) {
  const item = cart.find(
    (i) => String(i.productId) === String(id)
  );

  if (!item) return;

  item.qty += d;

  if (item.qty < 1) {
    cart = cart.filter(
      (i) =>
        String(i.productId) !== String(id)
    );
  }

  saveCart();
  renderCart();
}

function remove(id) {
  cart = cart.filter(
    (i) =>
      String(i.productId) !== String(id)
  );

  saveCart();
  renderCart();
}

function renderCart() {
  const rows = cart
    .map((i) => ({
      ...i,
      p: products.find(
        (p) =>
          String(p.id) ===
          String(i.productId)
      )
    }))
    .filter((x) => x.p);

  const count = document.getElementById(
    "count"
  );

  const cartItems =
    document.getElementById(
      "cartItems"
    );

  const subtotal =
    document.getElementById(
      "subtotal"
    );

  const total =
    document.getElementById(
      "total"
    );

  if (count) {
    count.textContent =
      "(" +
      rows.reduce(
        (a, x) => a + x.qty,
        0
      ) +
      ")";
  }

  if (cartItems) {
    cartItems.innerHTML = rows.length
      ? rows
          .map(
            (x) => `
              <div class="cart-item">

                <img
                  src="${esc(
                    x.p.image ||
                      "bag.jpg"
                  )}"
                  onerror="this.src='bag.jpg'"
                >

                <div>

                  <h4>
                    ${esc(x.p.name)}
                  </h4>

                  <small>
                    ${esc(x.p.category)}
                  </small>

                  <div class="cart-price">
                    ${money(
                      x.p.salePrice ||
                        x.p.price
                    )}
                  </div>

                </div>

                <div class="qty">

                  <button
                    onclick="qty(${JSON.stringify(
                      x.p.id
                    )},-1)"
                  >
                    −
                  </button>

                  ${x.qty}

                  <button
                    onclick="qty(${JSON.stringify(
                      x.p.id
                    )},1)"
                  >
                    +
                  </button>

                  <button
                    onclick="remove(${JSON.stringify(
                      x.p.id
                    )})"
                  >
                    ×
                  </button>

                </div>

              </div>
            `
          )
          .join("")
      : '<div class="empty">Your cart is empty.</div>';
  }

  const totalValue = rows.reduce(
    (a, x) =>
      a +
      Number(
        x.p.salePrice ||
          x.p.price ||
          0
      ) *
        x.qty,
    0
  );

  if (subtotal) {
    subtotal.textContent =
      money(totalValue);
  }

  if (total) {
    total.textContent =
      money(totalValue);
  }
}

/* =========================================================
   ADD / EDIT PRODUCT MODAL
   ========================================================= */

function openModal(id = null) {
  if (!ownerOnly()) return;

  editId = id;
  uploadedFile = null;
  uploadedPreview = "";

  const p =
    id !== null && id !== undefined
      ? products.find(
          (x) =>
            String(x.id) ===
            String(id)
        )
      : null;

  document
    .getElementById("modal")
    .classList.remove("hidden");

  document.getElementById(
    "name"
  ).value = p?.name || "";

  document.getElementById(
    "category"
  ).value = p?.category || "Bags";

  document.getElementById(
    "price"
  ).value = p?.price || "";

  document.getElementById(
    "salePrice"
  ).value =
    p?.salePrice || "";

  document.getElementById(
    "description"
  ).value =
    p?.description || "";

  document.getElementById(
    "isNew"
  ).checked = !!p?.new;

  document.getElementById(
    "isSale"
  ).checked = !!p?.sale;

  const preview =
    document.getElementById(
      "preview"
    );

  preview.src =
    p?.image || "bag.jpg";

  preview.style.filter =
    "none";
}

/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

function setupImageUpload() {
  const fileInput =
    document.getElementById(
      "file"
    );

  if (!fileInput) return;

  fileInput.onchange = (e) => {
    const file =
      e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(
        "Please select an image file."
      );

      fileInput.value = "";
      return;
    }

    /*
      6 MB is a good limit for the
      standard Supabase upload method.
    */
    if (
      file.size >
      6 * 1024 * 1024
    ) {
      alert(
        "Please choose an image smaller than 6 MB."
      );

      fileInput.value = "";
      return;
    }

    uploadedFile = file;

    const reader =
      new FileReader();

    reader.onload = () => {
      uploadedPreview =
        reader.result;

      const preview =
        document.getElementById(
          "preview"
        );

      preview.src =
        uploadedPreview;
    };

    reader.readAsDataURL(file);
  };
}

/* =========================================================
   IMAGE EDITOR
   ========================================================= */

function setupImageEditor() {
  document
    .querySelectorAll(".tool")
    .forEach((button) => {
      button.onclick = () => {
        const preview =
          document.getElementById(
            "preview"
          );

        if (!preview) return;

        if (
          button.id ===
          "reset"
        ) {
          preview.style.filter =
            "none";
        } else {
          preview.style.filter =
            button.dataset.f ||
            "none";
        }
      };
    });
}

/* =========================================================
   UPLOAD IMAGE TO SUPABASE
   ========================================================= */

async function uploadProductImage(file) {
  if (!file) return null;

  if (!ownerOnly()) {
    throw new Error(
      "Only the owner can upload images."
    );
  }

  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase() ||
    "jpg";

  const safeName =
    file.name
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "-"
      )
      .replace(
        /\.[^/.]+$/,
        ""
      );

  const path =
    OWNER_USER_ID +
    "/" +
    Date.now() +
    "-" +
    crypto.randomUUID() +
    "-" +
    safeName +
    "." +
    extension;

  const {
    data,
    error
  } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(
      path,
      file,
      {
        cacheControl:
          "3600",
        upsert: false,
        contentType:
          file.type ||
          "image/jpeg"
      }
    );

  if (error) {
    console.error(
      "Image upload error:",
      error
    );

    throw error;
  }

  /*
    Your products bucket should be PUBLIC
    if you want every website visitor to
    see product images without logging in.
  */
  const {
    data: publicData
  } =
    supabase.storage
      .from(
        STORAGE_BUCKET
      )
      .getPublicUrl(
        data.path
      );

  return publicData.publicUrl;
}

/* =========================================================
   SAVE PRODUCT
   ========================================================= */

async function saveProduct() {
  if (!ownerOnly()) return;

  const button =
    document.getElementById(
      "save"
    );

  const name =
    document
      .getElementById(
        "name"
      )
      .value.trim();

  const category =
    document.getElementById(
      "category"
    ).value;

  const price =
    Number(
      document.getElementById(
        "price"
      ).value
    );

  const salePriceRaw =
    document.getElementById(
      "salePrice"
    ).value;

  const salePrice =
    salePriceRaw
      ? Number(salePriceRaw)
      : null;

  const description =
    document.getElementById(
      "description"
    ).value.trim();

  const isNew =
    document.getElementById(
      "isNew"
    ).checked;

  const isSale =
    document.getElementById(
      "isSale"
    ).checked;

  if (!name || !price) {
    alert(
      "Enter a product name and price."
    );

    return;
  }

  if (salePrice !== null) {
    if (
      salePrice <= 0 ||
      salePrice >= price
    ) {
      alert(
        "Sale price must be lower than the regular price."
      );

      return;
    }
  }

  button.disabled = true;
  button.textContent =
    "Saving...";

  try {
    const old =
      editId !== null
        ? products.find(
            (p) =>
              String(p.id) ===
              String(editId)
          )
        : null;

    let imageUrl =
      old?.image || null;

    /*
      Upload new image only if
      the owner selected one.
    */
    if (uploadedFile) {
      imageUrl =
        await uploadProductImage(
          uploadedFile
        );
    }

    /*
      Database columns expected:
        name
        category
        price
        sale_price
        description
        image_url
        is_new
        is_sale
        owner_id

      If your table uses these exact
      columns, this works directly.
    */

    const payload = {
      name,
      category,
      price,
      sale_price: salePrice,
      description,
      image_url: imageUrl,
      is_new: isNew,
      is_sale: isSale,
      owner_id: OWNER_USER_ID
    };

    if (
      editId !== null &&
      editId !== undefined
    ) {
      const {
        error
      } = await supabase
        .from(
          PRODUCTS_TABLE
        )
        .update(payload)
        .eq(
          "id",
          editId
        );

      if (error) {
        throw error;
      }

    } else {
      const {
        error
      } = await supabase
        .from(
          PRODUCTS_TABLE
        )
        .insert(
          payload
        );

      if (error) {
        throw error;
      }
    }

    await loadProducts();

    document
      .getElementById(
        "modal"
      )
      .classList.add(
        "hidden"
      );

    editId = null;
    uploadedFile = null;
    uploadedPreview = "";

    /*
      Refresh current page.
    */
    if (filter === "dashboard") {
      dashboard();
    } else if (
      filter === "shop"
    ) {
      shop();
    } else if (
      filter === "sale"
    ) {
      sale();
    } else if (
      filter === "new"
    ) {
      newArrivals();
    } else {
      category(filter);
    }

    alert(
      "Product saved successfully."
    );

  } catch (error) {
    console.error(
      "Save product error:",
      error
    );

    alert(
      "Could not save the product.\n\n" +
      error.message
    );

  } finally {
    button.disabled = false;
    button.textContent =
      "Save Product";
  }
}

/* =========================================================
   BUTTON SETUP
   ========================================================= */

function setupButtons() {
  const close =
    document.getElementById(
      "close"
    );

  if (close) {
    close.onclick = () => {
      document
        .getElementById(
          "modal"
        )
        .classList.add(
          "hidden"
        );
    };
  }

  setupImageUpload();
  setupImageEditor();

  const save =
    document.getElementById(
      "save"
    );

  if (save) {
    save.onclick =
      saveProduct;
  }

  document
    .querySelectorAll(
      "[data-view]"
    )
    .forEach(
      (button) => {
        button.onclick =
          () => {
            document
              .querySelectorAll(
                ".nav"
              )
              .forEach(
                (x) =>
                  x.classList.remove(
                    "active"
                  )
              );

            button.classList.add(
              "active"
            );

            const v =
              button.dataset
                .view;

            if (
              v ===
              "dashboard"
            ) {
              dashboard();
            } else if (
              v === "shop"
            ) {
              shop();
            } else if (
              v === "sale"
            ) {
              sale();
            } else if (
              v === "new"
            ) {
              newArrivals();
            } else if (
              v === "orders"
            ) {
              simple(
                "My Orders",
                "Your previous orders will appear here."
              );
            } else {
              simple(
                v
                  .charAt(0)
                  .toUpperCase() +
                  v.slice(1),
                "This section is ready for your store data."
              );
            }
          };
      }
    );

  document
    .querySelectorAll(
      "[data-cat]"
    )
    .forEach(
      (button) => {
        button.onclick =
          () => {
            document
              .querySelectorAll(
                ".nav"
              )
              .forEach(
                (x) =>
                  x.classList.remove(
                    "active"
                  )
              );

            button.classList.add(
              "active"
            );

            category(
              button.dataset
                .cat
            );
          };
      }
    );

  const logout =
    document.getElementById(
      "logout"
    );

  if (logout) {
    logout.onclick =
      async () => {
        if (!supabase) return;

        const {
          error
        } =
          await supabase.auth.signOut();

        if (error) {
          alert(
            error.message
          );
        } else {
          location.reload();
        }
      };
  }

  const checkout =
    document.getElementById(
      "checkout"
    );

  if (checkout) {
    checkout.onclick =
      () => {
        alert(
          "Checkout will be connected to your payment/order system next."
        );
      };
  }

  const menu =
    document.getElementById(
      "menu"
    );

  if (menu) {
    menu.onclick =
      () =>
        document
          .querySelector(
            ".sidebar"
          )
          .classList.toggle(
            "open"
          );
  }

  const mobileCart =
    document.getElementById(
      "mobileCart"
    );

  if (mobileCart) {
    mobileCart.onclick =
      () =>
        (document.querySelector(
          ".cart"
        ).style.display =
          "flex");
  }

  const cartClose =
    document.getElementById(
      "cartClose"
    );

  if (cartClose) {
    cartClose.onclick =
      () =>
        (document.querySelector(
          ".cart"
        ).style.display =
          "none");
  }
}

/* =========================================================
   MAKE FUNCTIONS AVAILABLE TO HTML onclick=""
   ========================================================= */

window.shop =
  shop;

window.sale =
  sale;

window.newArrivals =
  newArrivals;

window.category =
  category;

window.add =
  add;

window.qty =
  qty;

window.remove =
  remove;

window.openModal =
  openModal;

/* =========================================================
   START WEBSITE
   ========================================================= */

init();
