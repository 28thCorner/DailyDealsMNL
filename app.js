/* =========================================================
   DAILY DEALS - SUPABASE CONNECTED APP
   Owner-only Add Product
   ========================================================= */

const SUPABASE_URL = 'https://kdwsaxovwgyehggzwxsb.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_Uu0U5bD3ZoqJDS6X_Ev1Mg_L0Y1p0x-';

/*
  This is YOUR owner account UID from Supabase Authentication.
  Only this account can add/edit products.
*/
const OWNER_USER_ID = '49287653-4b49-4eb8-9d92-e41986dc1434';

const PRODUCTS_TABLE = "products";
const STORAGE_BUCKET = "products";

let uploaded = "";

const defaults = [
  {
    id: 1,
    name: 'Michael Kors Tote Bag',
    category: 'Bags',
    price: 4299,
    image: 'bag.jpg'
  },
  {
    id: 2,
    name: 'Anne Klein Watch',
    category: 'Watches',
    price: 1799,
    image: 'watch.jpg'
  },
  {
    id: 3,
    name: 'Tommy Hilfiger Perfume',
    category: 'Perfume',
    price: 3499,
    image: 'perfume.jpg'
  },
  {
    id: 4,
    name: 'Classic Black Bag',
    category: 'Bags',
    price: 2999,
    image: 'sale_bag.jpg',
    sale: true
  },
  {
    id: 5,
    name: 'Tommy Casual Shoes',
    category: 'Shoes',
    price: 3899,
    image: 'shoes.jpg',
    new: true
  },
  {
    id: 6,
    name: 'Daily Vitamins',
    category: 'Vitamins',
    price: 1299,
    image: 'vitamins.jpg',
    new: true
  },
  {
    id: 7,
    name: 'Designer Wallet',
    category: 'Wallets',
    price: 2199,
    image: 'wallet.jpg',
    new: true
  }
];

const cats = [
  ['Bags', 'bag.jpg'],
  ['Wallets', 'wallet.jpg'],
  ['Perfume', 'perfume.jpg'],
  ['Shoes', 'shoes.jpg'],
  ['Vitamins', 'vitamins.jpg'],
  ['Watches', 'watch.jpg']
];

// Removed:
// Carol, Alexis Bendel, Karen Neuburger, DCSHOECOUSA,
// Stone Mountain USA, Vera Wang, Escada, planetGOLD, White Mountain.
const brands =
  'Adidas|ALDO|ANNE KLEIN|BEVERLY HILLS POLO CLUB|Calvin Klein|Champion|COLE HAAN|DKNY|GAP|GUESS|HEAD|Herschel|HUGO|IZOD|JORDAN|Juicy Couture|KARL LAGERFELD|Kate Spade|Kipling|LACOSTE|Levi’s|MARC JACOBS|MICHAEL KORS|Nanette Lepore|NAUTICA|NIKE|NINE WEST|Paris Hilton|Penguin|PERRY ELLIS|PUMA|RALPH LAUREN|Reebok|STEVE MADDEN|TED BAKER|TOMMY HILFIGER|TRUE RELIGION|U.S POLO ASSN.|VAN HEUSEN|WRANGLER|XOXO'
    .split('|');

let products = [];
let cart =
  JSON.parse(localStorage.getItem('ddCart') || 'null') ||
  [
    { productId: 1, qty: 2 },
    { productId: 2, qty: 1 },
    { productId: 3, qty: 1 }
  ];

let filter = 'dashboard';
let editId = null;
let uploaded = '';

let currentUser = null;
let isOwner = false;
let supabase = null;

const page = document.getElementById('page');

const money = n =>
  '₱' +
  Number(n || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2
  });

const esc = s =>
  String(s || '').replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[c])
  );

/* =========================================================
   LOAD SUPABASE
   ========================================================= */

async function connectSupabase() {
  try {
    const module = await import(
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
    );

    supabase = module.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );

    console.log('Supabase connected.');

    const {
      data: { session }
    } = await supabase.auth.getSession();

    currentUser = session?.user || null;
    isOwner = currentUser?.id === OWNER_USER_ID;

    supabase.auth.onAuthStateChange((event, session) => {
      currentUser = session?.user || null;
      isOwner = currentUser?.id === OWNER_USER_ID;

      updateOwnerInterface();

      if (event === 'SIGNED_IN') {
        console.log('Signed in:', currentUser.email);
      }

      if (event === 'SIGNED_OUT') {
        console.log('Signed out.');
      }
    });

    await loadProducts();

    setupButtons();
    setupNavigation();

    dashboard();
    renderCart();
    updateOwnerInterface();

  } catch (error) {
    console.error('Supabase connection error:', error);

    products =
      JSON.parse(localStorage.getItem('ddProducts') || 'null') ||
      defaults;

    setupButtons();
    setupNavigation();

    dashboard();
    renderCart();

    alert(
      'The website could not connect to Supabase. Please check your internet connection and Supabase settings.'
    );
  }
}

/* =========================================================
   AUTHENTICATION
   ========================================================= */

function showLogin() {
  page.innerHTML = `
    <div style="
      max-width:420px;
      margin:70px auto;
      padding:30px;
      border:1px solid #eadde3;
      border-radius:15px;
      background:#fff;
      box-shadow:0 10px 30px rgba(0,0,0,.05);
    ">
      <h1 style="
        font-family:'Playfair Display',serif;
        margin-top:0;
      ">
        Owner Login
      </h1>

      <p class="muted">
        Sign in with your Supabase owner account to manage products.
      </p>

      <label style="
        display:block;
        font-size:11px;
        font-weight:700;
        margin-top:20px;
      ">
        Email
        <input
          id="loginEmail"
          type="email"
          autocomplete="email"
          style="
            display:block;
            width:100%;
            box-sizing:border-box;
            padding:11px;
            margin-top:6px;
            border:1px solid #eadde3;
            border-radius:7px;
          "
        >
      </label>

      <label style="
        display:block;
        font-size:11px;
        font-weight:700;
        margin-top:14px;
      ">
        Password
        <input
          id="loginPassword"
          type="password"
          autocomplete="current-password"
          style="
            display:block;
            width:100%;
            box-sizing:border-box;
            padding:11px;
            margin-top:6px;
            border:1px solid #eadde3;
            border-radius:7px;
          "
        >
      </label>

      <button
        id="loginButton"
        class="pink"
        style="margin-top:18px;width:100%;"
      >
        Login
      </button>

      <button
        id="cancelLogin"
        style="
          margin-top:10px;
          width:100%;
          border:0;
          background:#f9edf2;
          padding:10px;
          border-radius:7px;
        "
      >
        Back to Store
      </button>

      <p
        id="loginMessage"
        style="
          font-size:11px;
          margin-top:15px;
          color:#d94c7c;
        "
      ></p>
    </div>
  `;

  document.getElementById('loginButton').onclick = loginOwner;

  document.getElementById('cancelLogin').onclick = () => {
    dashboard();
  };

  document
    .getElementById('loginPassword')
    .addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        loginOwner();
      }
    });
}

async function loginOwner() {
  if (!supabase) {
    alert('Supabase is not connected yet.');
    return;
  }

  const email =
    document.getElementById('loginEmail')?.value.trim() || '';

  const password =
    document.getElementById('loginPassword')?.value || '';

  const message =
    document.getElementById('loginMessage');

  if (!email || !password) {
    if (message) {
      message.textContent =
        'Please enter your email and password.';
    }
    return;
  }

  const button =
    document.getElementById('loginButton');

  button.disabled = true;
  button.textContent = 'Logging in...';

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  button.disabled = false;
  button.textContent = 'Login';

  if (error) {
    console.error(error);

    if (message) {
      message.textContent =
        error.message ||
        'Login failed. Please check your email and password.';
    }

    return;
  }

  currentUser = data.user;
  isOwner = currentUser?.id === OWNER_USER_ID;

  if (!isOwner) {
    await supabase.auth.signOut();

    if (message) {
      message.textContent =
        'This account is not authorized as the store owner.';
    }

    alert(
      'Login denied. Only the owner account can manage products.'
    );

    return;
  }

  dashboard();
  updateOwnerInterface();

  alert('Owner login successful.');
}

async function logout() {
  if (!supabase) return;

  const { error } =
    await supabase.auth.signOut();

  if (error) {
    console.error(error);
    alert('Could not log out. Please try again.');
    return;
  }

  currentUser = null;
  isOwner = false;

  updateOwnerInterface();
  dashboard();

  alert('You are now logged out.');
}

/* =========================================================
   OWNER INTERFACE
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

function requireOwner() {
  if (!currentUser) {
    alert(
      'Please log in with the owner account first.'
    );
    showLogin();
    return false;
  }

  if (!isOwner) {
    alert(
      'Only the store owner can add or edit products.'
    );
    return false;
  }

  return true;
}

/* =========================================================
   SUPABASE PRODUCTS
   ========================================================= */

function normalizeProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price || 0),

    salePrice:
      row.sale_price !== undefined
        ? row.sale_price === null
          ? null
          : Number(row.sale_price)
        : null,

    description: row.description || '',

    image: row.image || row.image_url || 'bag.jpg',

    new:
      row.is_new_arrival !== undefined
        ? !!row.is_new_arrival
        : false,

    sale:
      row.is_sale !== undefined
        ? !!row.is_sale
        : false
  };
}

function productToDatabase(product) {
  return {
    name: product.name,
    category: product.category,
    price: Number(product.price || 0),
    sale_price:
      product.salePrice === null ||
      product.salePrice === '' ||
      product.salePrice === undefined
        ? null
        : Number(product.salePrice),

    description: product.description || '',

    image: product.image || 'bag.jpg',

    is_new_arrival: !!product.new,

    is_sale: !!product.sale
  };
}
async function loadProducts() {
  if (!supabase) {
    products = defaults;
    return;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', {
      ascending: false
    });

  if (error) {
    console.error(
      'Could not load products from Supabase:',
      error
    );

    /*
      Keep the store usable if the products table has
      not been exposed/configured yet.
    */
    products =
      JSON.parse(
        localStorage.getItem('ddProducts') || 'null'
      ) || defaults;

    return;
  }

  if (data && data.length) {
    products = data.map(normalizeProduct);

    localStorage.setItem(
      'ddProducts',
      JSON.stringify(products)
    );
  } else {
    products =
      JSON.parse(
        localStorage.getItem('ddProducts') || 'null'
      ) || defaults;
  }
}

/* =========================================================
   IMAGE UPLOAD
   ========================================================= */

async function uploadProductImage(file) {
  if (!requireOwner()) {
    throw new Error(
      'Only the owner can upload product images.'
    );
  }

  if (!file) {
    return null;
  }

  const extension =
    file.name.split('.').pop()?.toLowerCase() ||
    'jpg';

  const fileName =
    `${crypto.randomUUID()}.${extension}`;

  const filePath =
    `${OWNER_USER_ID}/${fileName}`;

  const { error } =
    await supabase.storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

  if (error) {
    console.error('Image upload error:', error);
    throw error;
  }

  const { data } =
    supabase.storage
      .from('products')
      .getPublicUrl(filePath);

  return data.publicUrl;
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function dashboard() {

  /* Stop any previous Flash Sale animation */
  if (window.ddSaleFlashTimer) {
    clearInterval(window.ddSaleFlashTimer);
    window.ddSaleFlashTimer = null;
  }

  /* Get all products marked as Sale */
  const saleItems = products.filter(p => p.sale && p.image);

  /* Use sale_bag.jpg only if there are no Sale products */
  const saleImages = saleItems.length
    ? saleItems.map(p => p.image)
    : ['sale_bag.jpg'];

  page.innerHTML = `
    <section class="hero">
      <h1>Style Meets<br>Great Deals</h1>

      <p>
        Authentic Brands. Amazing Prices.
      </p>

      <button
        class="pink"
        onclick="shop()"
      >
        Shop Now →
      </button>
    </section>


    <!-- =====================================================
         SHOP BY CATEGORY
         ===================================================== -->

    <div class="section-head">
      <h2>Shop by Category</h2>

      <button
        class="view"
        onclick="shop()"
      >
        View All →
      </button>
    </div>


    <div class="cats">

      ${cats
        .map(
          x => `
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
        .join('')}

    </div>


    <!-- =====================================================
         PROMOTIONAL BANNERS
         ===================================================== -->

    <div class="promos">


      <!-- ===================================================
           FLASH SALE
           =================================================== -->

      <div
        class="promo sale"
        style="
          position:relative;
          overflow:hidden;
        "
      >

        <h3>
          FLASH SALE ⚡
        </h3>

        <p>
          Up to 70% OFF • Limited time only!
        </p>

        <button
          class="shopbtn"
          onclick="sale()"
        >
          Shop Now
        </button>


        <!--
          IMPORTANT:
          There is ONLY ONE image element here.

          We change its src using JavaScript instead
          of putting multiple images on top of each other.
        -->

        <div
          id="saleFlashStage"
          style="
            position:absolute;
            right:0;
            bottom:0;
            width:58%;
            height:100%;
            display:flex;
            align-items:center;
            justify-content:center;
            overflow:hidden;
          "
        >

          <img
            id="saleFlashImage"
            src="${esc(saleImages[0])}"
            alt="Sale Item"
            style="
              width:100%;
              height:100%;
              object-fit:contain;
              display:block;
              opacity:1;
              transition:opacity .25s ease;
            "
            onerror="this.src='sale_bag.jpg'"
          >

        </div>

      </div>


      <!-- ===================================================
           NEW ARRIVALS
           =================================================== -->

      <div
        class="promo new"
        style="
          position:relative;
          overflow:hidden;
        "
      >

        <h3>
          New Arrivals ♥
        </h3>

        <p>
          Fresh styles you'll love.
        </p>

        <button
          class="shopbtn"
          onclick="newArrivals()"
        >
          Discover Now
        </button>

        <img
          src="new_arrivals.jpg"
          alt="New Arrivals"
          style="
            position:absolute;
            right:0;
            bottom:0;
            width:58%;
            height:100%;
            object-fit:contain;
          "
          onerror="this.src='bag.jpg'"
        >

      </div>

    </div>


    <!-- =====================================================
         POPULAR BRANDS
         ===================================================== -->

    <section class="brands">

      <h2>
        CHOOSE FROM POPULAR BRANDS
      </h2>

      <div class="under"></div>

      <div class="brandgrid">

        ${brands
          .map(
            b => `
              <div class="brand">
                ${esc(b)}
              </div>
            `
          )
          .join('')}

      </div>

    </section>


    <!-- =====================================================
         DISCLAIMER
         ===================================================== -->

    <section
      class="disclaimer"
      style="
        margin:40px 0 25px;
        padding:24px 25px;
        text-align:center;
        background:#fff8fb;
        border:1px solid #f0dce5;
        border-radius:12px;
        line-height:1.7;
      "
    >

      <h3
        style="
          margin:0 0 12px;
          font-size:15px;
          letter-spacing:1px;
        "
      >
        ✨ DISCLAIMER ✨
      </h3>

      <p
        style="
          margin:5px 0;
          font-size:11px;
        "
      >
        We are not affiliated with or endorsed by any brands posted on this site.
      </p>

      <p
        style="
          margin:5px 0;
          font-size:11px;
        "
      >
        All trademarks, logos, and brand names belong to their respective owners.
      </p>

      <p
        style="
          margin:5px 0;
          font-size:11px;
        "
      >
        Personally bought from US, Canada and Japan.
      </p>

      <strong
        style="
          display:block;
          margin-top:10px;
          font-size:12px;
        "
      >
        🛍️ Independent Reseller
      </strong>

    </section>
  `;


  /* =========================================================
     FLASH SALE IMAGE ANIMATION
     ========================================================= */

  const flashImage =
    document.getElementById('saleFlashImage');

  if (flashImage && saleImages.length > 1) {

    let saleIndex = 0;

    window.ddSaleFlashTimer = setInterval(() => {

      /* Fade the current image out */
      flashImage.style.opacity = '0';

      setTimeout(() => {

        saleIndex =
          (saleIndex + 1) % saleImages.length;

        /*
          Change the SAME image element.

          This is what prevents overlapping images.
        */

        flashImage.src =
          saleImages[saleIndex];

        flashImage.style.opacity = '1';

      }, 250);

    }, 1800);

  }


  /* Update owner-only buttons */
  updateOwnerInterface();

}

/* =========================================================
   PRODUCT CARD
   ========================================================= */

function card(p) {
  const sp =
    p.salePrice ||
    (p.sale
      ? Math.round(p.price * 0.7)
      : 0);

  return `
    <article class="product">

      ${
        p.sale
          ? '<span class="badge">SALE</span>'
          : p.new
            ? '<span class="badge">NEW</span>'
            : ''
      }

      <img
        src="${p.image || 'bag.jpg'}"
        onerror="this.src='bag.jpg'"
      >

      <div class="info">

        <h3>${esc(p.name)}</h3>

        <p>${esc(p.category)}</p>

        <span class="price">
          ${money(sp || p.price)}

          ${
            sp
              ? `<span class="old">
                   ${money(p.price)}
                 </span>`
              : ''
          }
        </span>

        <!-- ADD TO CART -->
        <button
          type="button"
          class="add product-add"
          data-product-id="${esc(String(p.id))}"
        >
          + Add
        </button>

        ${
          isOwner
            ? `
              <!-- EDIT PRODUCT -->
              <button
                type="button"
                class="add product-edit"
                style="margin-right:5px;"
                data-product-id="${esc(String(p.id))}"
              >
                Edit
              </button>
            `
            : ''
        }

      </div>
    </article>
  `;
}
/* =========================================================
   PRODUCT LIST
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
              type="button"
              class="pink add-product"
            >
              ＋ Add Product
            </button>
          `
          : ''
      }

    </div>

    <div class="products">

      ${
        list.length
          ? list.map(card).join('')
          : '<div class="empty">No products found.</div>'
      }

    </div>
  `;

  updateOwnerInterface();
}

function shop() {
  filter = 'shop';
  listing('Shop All', products);
}

function sale() {
  filter = 'sale';
  listing(
    'Sale Items',
    products.filter(p => p.sale)
  );
}

function newArrivals() {
  filter = 'new';
  listing(
    'New Arrivals',
    products.filter(p => p.new)
  );
}

function category(c) {
  filter = c;

  listing(
    c,
    products.filter(
      p => p.category === c
    )
  );
}

/* =========================================================
   OTHER PAGES
   ========================================================= */

function simple(t, msg) {
  page.innerHTML = `
    <h1 class="page-title">
      ${esc(t)}
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
    'ddCart',
    JSON.stringify(cart)
  );
}

function add(id) {
  const x = cart.find(
    i => String(i.productId) === String(id)
  );

  if (x) {
    x.qty++;
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
  const x = cart.find(
    i => String(i.productId) === String(id)
  );

  if (!x) return;

  x.qty += d;

  if (x.qty < 1) {
    cart = cart.filter(
      i =>
        String(i.productId) !== String(id)
    );
  }

  saveCart();
  renderCart();
}

function remove(id) {
  cart = cart.filter(
    i =>
      String(i.productId) !== String(id)
  );

  saveCart();
  renderCart();
}

function renderCart() {
  const rows = cart
    .map(i => ({
      ...i,
      p: products.find(
        p =>
          String(p.id) ===
          String(i.productId)
      )
    }))
    .filter(x => x.p);

  const count =
    document.getElementById('count');

  const cartItems =
    document.getElementById('cartItems');

  const subtotal =
    document.getElementById('subtotal');

  const totalElement =
    document.getElementById('total');

  if (!count || !cartItems) return;

  count.textContent =
    '(' +
    rows.reduce(
      (a, x) => a + x.qty,
      0
    ) +
    ')';

  cartItems.innerHTML = rows.length
    ? rows
        .map(
          x => `
          <div class="cart-item">

            <img
              src="${x.p.image || 'bag.jpg'}"
              onerror="this.src='bag.jpg'"
            >

            <div>
              <h4>${esc(x.p.name)}</h4>

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
        .join('')
    : '<div class="empty">Your cart is empty.</div>';

  const amount = rows.reduce(
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
      money(amount);
  }

  if (totalElement) {
    totalElement.textContent =
      money(amount);
  }
}

/* =========================================================
   ADD / EDIT PRODUCT MODAL
   ========================================================= */

function openModal(id = null) {
  if (!requireOwner()) return;

  editId = id;
  uploaded = '';

  const p =
    id !== null
      ? products.find(
          x =>
            String(x.id) ===
            String(id)
        )
      : null;

  document
    .getElementById('modal')
    .classList.remove('hidden');

  document.getElementById('name').value =
    p?.name || '';

  document.getElementById('category').value =
    p?.category || 'Bags';

  document.getElementById('price').value =
    p?.price || '';

  document.getElementById('salePrice').value =
    p?.salePrice || '';

  document.getElementById('description').value =
    p?.description || '';

  document.getElementById('isNew').checked =
    !!p?.new;

  document.getElementById('isSale').checked =
    !!p?.sale;

  document.getElementById('preview').src =
    p?.image || '';

  updateOwnerInterface();
}

/* =========================================================
   SAVE PRODUCT
   ========================================================= */

async function saveProduct() {
  if (!requireOwner()) return;

  const name =
    document.getElementById(
      'name'
    ).value.trim();

  const price =
    Number(
      document.getElementById(
        'price'
      ).value
    );

  const categoryValue =
    document.getElementById(
      'category'
    ).value;

  const salePriceValue =
    Number(
      document.getElementById(
        'salePrice'
      ).value
    );

  const description =
    document.getElementById(
      'description'
    ).value;

  const isNew =
    document.getElementById(
      'isNew'
    ).checked;

  const isSale =
    document.getElementById(
      'isSale'
    ).checked;

  if (!name || !price) {
    alert(
      'Enter a product name and price.'
    );
    return;
  }

  const saveButton =
    document.getElementById('save');

  saveButton.disabled = true;
  saveButton.textContent =
    'Saving...';

  try {
    const old =
      editId !== null
        ? products.find(
            p =>
              String(p.id) ===
              String(editId)
          )
        : null;

    let image =
      uploaded ||
      old?.image ||
      'bag.jpg';

    /* Upload new image if selected */
    const file =
      document.getElementById(
        'file'
      ).files[0];

    if (file) {
      image =
        await uploadProductImage(file);
    }

    const product = {
      id:
        editId !== null
          ? editId
          : crypto.randomUUID(),

      name,
      category: categoryValue, 
      price,
      salePrice:
        salePriceValue || null,
      description,
      image,
      new: isNew,
      sale: isSale
    };

    /*
      Save to Supabase.
      The RLS policy you created must allow only
      the owner UID to insert/update/delete.
    */

    if (editId !== null) {
      const { data, error } =
        await supabase
          .from('products')
          .update(
            productToDatabase(
              product
            )
          )
          .eq(
            'id',
            editId
          )
          .select()
          .single();

      if (error) throw error;

      const updated =
        normalizeProduct(data);

      products =
        products.map(p =>
          String(p.id) ===
          String(editId)
            ? updated
            : p
        );

    } else {
      const { data, error } =
        await supabase
          .from('products')
          .insert(
            productToDatabase(
              product
            )
          )
          .select()
          .single();

      if (error) throw error;

      products.push(
        normalizeProduct(data)
      );
    }

    localStorage.setItem(
      'ddProducts',
      JSON.stringify(products)
    );

    document
      .getElementById('modal')
      .classList.add('hidden');

    alert(
      editId !== null
        ? 'Product updated successfully.'
        : 'Product added successfully.'
    );

    editId = null;
    uploaded = '';

    if (filter === 'dashboard') {
  dashboard();
} else if (filter === 'shop') {
  shop();
} else if (filter === 'sale') {
  sale();
} else if (filter === 'new') {
  newArrivals();
} else {
  listing(
    filter,
    products.filter(
      p => p.category === filter
    )
  );
}

    renderCart();

  } catch (error) {
    console.error(
      'Save product error:',
      error
    );

    alert(
      'Could not save the product to Supabase.\n\n' +
      (error.message ||
        'Please check your Supabase table and RLS policies.')
    );

  } finally {
    saveButton.disabled = false;
    saveButton.textContent =
      'Save Product';
  }
}

/* =========================================================
   MODAL EVENTS
   ========================================================= */

function setupModal() {
  const close =
    document.getElementById('close');

  if (close) {
    close.onclick = () =>
      document
        .getElementById('modal')
        .classList.add('hidden');
  }

  const file =
    document.getElementById('file');

  if (file) {
    file.onchange = e => {
      const f =
        e.target.files[0];

      if (!f) return;

      const reader =
        new FileReader();

      reader.onload = () => {
        uploaded =
          reader.result;

        document.getElementById(
          'preview'
        ).src = uploaded;
      };

      reader.readAsDataURL(f);
    };
  }

  document
    .querySelectorAll('.tool')
    .forEach(button => {
      button.onclick = () => {
        const preview =
          document.getElementById(
            'preview'
          );

        preview.style.filter =
          button.id === 'reset'
            ? 'none'
            : button.dataset.f;
      };
    });

  const saveButton =
    document.getElementById('save');

  if (saveButton) {
    saveButton.onclick =
      saveProduct;
  }
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {
  document
    .querySelectorAll('[data-view]')
    .forEach(button => {
      button.onclick = () => {

        document
          .querySelectorAll('.nav')
          .forEach(x =>
            x.classList.remove(
              'active'
            )
          );

        button.classList.add(
          'active'
        );

        const v =
          button.dataset.view;

        if (v === 'dashboard') {
          dashboard();
        } else if (v === 'shop') {
          shop();
        } else if (v === 'sale') {
          sale();
        } else if (v === 'new') {
          newArrivals();
        } else if (v === 'orders') {
          simple(
            'My Orders',
            'Your previous orders will appear here.'
          );
        } else if (v === 'profile') {
          if (currentUser) {
            simple(
              'Profile',
              isOwner
                ? `Owner account: ${currentUser.email}`
                : `Signed in as ${currentUser.email}`
            );
          } else {
            showLogin();
          }
        } else {
          simple(
            v.charAt(0).toUpperCase() +
              v.slice(1),
            'This section is ready for your store data.'
          );
        }
      };
    });

  document
    .querySelectorAll('[data-cat]')
    .forEach(button => {
      button.onclick = () => {

        document
          .querySelectorAll('.nav')
          .forEach(x =>
            x.classList.remove(
              'active'
            )
          );

        button.classList.add(
          'active'
        );

        category(
          button.dataset.cat
        );
      };
    });
}

/* =========================================================
   BUTTONS
   ========================================================= */

function setupButtons() {

  setupModal();

  /* -------------------------------------------------------
     PRODUCT BUTTONS
     Uses event delegation because product cards are
     dynamically generated by listing()
     ------------------------------------------------------- */

  const productPage =
    document.getElementById('page');

  if (
    productPage &&
    !productPage.dataset.productButtonsReady
  ) {

    productPage.dataset.productButtonsReady = 'true';

    productPage.addEventListener('click', function (event) {

      const button =
        event.target.closest('button');

      if (!button) return;


      /* ---------------------------------------------------
         ADD PRODUCT
         --------------------------------------------------- */

      if (
        button.classList.contains('add-product')
      ) {

        event.preventDefault();
        event.stopPropagation();

        if (!requireOwner()) return;

        openModal();

        return;
      }


      /* ---------------------------------------------------
         EDIT PRODUCT
         --------------------------------------------------- */

      if (
        button.classList.contains('product-edit')
      ) {

        event.preventDefault();
        event.stopPropagation();

        if (!requireOwner()) return;

        const id =
          button.dataset.productId;

        if (!id) {
          console.error(
            'Edit button has no product ID.'
          );
          return;
        }

        openModal(id);

        return;
      }


      /* ---------------------------------------------------
         ADD TO CART
         --------------------------------------------------- */

      if (
        button.classList.contains('product-add')
      ) {

        event.preventDefault();
        event.stopPropagation();

        const id =
          button.dataset.productId;

        if (!id) {
          console.error(
            'Add button has no product ID.'
          );
          return;
        }

        add(id);

        return;
      }

    });
  }


  /* -------------------------------------------------------
     LOGOUT
     ------------------------------------------------------- */

  const logoutButton =
    document.getElementById('logout');

  if (logoutButton) {

    logoutButton.onclick = () => {

      if (currentUser) {
        logout();
      } else {
        showLogin();
      }

    };
  }


  /* -------------------------------------------------------
     CHECKOUT
     ------------------------------------------------------- */

  const checkout =
    document.getElementById('checkout');

  if (checkout) {

    checkout.onclick = () =>
      alert(
        'Checkout is not connected yet.'
      );

  }


  /* -------------------------------------------------------
     MOBILE MENU
     ------------------------------------------------------- */

  const menu =
    document.getElementById('menu');

  if (menu) {

    menu.onclick = () =>
      document
        .querySelector('.sidebar')
        .classList.toggle('open');

  }


  /* -------------------------------------------------------
     MOBILE CART
     ------------------------------------------------------- */

  const mobileCart =
    document.getElementById('mobileCart');

  if (mobileCart) {

    mobileCart.onclick = () =>
      document.querySelector(
        '.cart'
      ).style.display = 'flex';

  }


  /* -------------------------------------------------------
     CLOSE CART
     ------------------------------------------------------- */

  const cartClose =
    document.getElementById('cartClose');

  if (cartClose) {

    cartClose.onclick = () =>
      document.querySelector(
        '.cart'
      ).style.display = 'none';

  }

}
/* =========================================================
   START
   ========================================================= */

connectSupabase();
