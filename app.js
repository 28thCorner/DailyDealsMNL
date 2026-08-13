const KEY="daily_deals_products_v1";
let products=JSON.parse(localStorage.getItem(KEY)||"[]");
let photo={src:"",zoom:1,rotation:0,filter:"original"};
const canvas=document.getElementById("photoCanvas"),ctx=canvas.getContext("2d");
const filters={original:"none",bright:"brightness(1.13)",contrast:"contrast(1.2)",color:"saturate(1.5)",mono:"grayscale(1)",warm:"sepia(.25) saturate(1.2)"};
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);

function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function money(n){return "₱"+Number(n||0).toLocaleString("en-PH",{minimumFractionDigits:2})}
function save(){localStorage.setItem(KEY,JSON.stringify(products))}
function card(p){
 const im=p.image?`<img src="${p.image}" style="filter:${filters[p.filter||"original"]}">`:`<div class="placeholder">${esc(p.name.slice(0,2).toUpperCase())}</div>`;
 const price=p.sale?`<span class="old">${money(p.price)}</span>${money(p.sale)}`:money(p.price);
 return `<article class="product-card"><div class="product-image">${im}${p.badge&&p.badge!=="None"?`<span class="badge">${esc(p.badge)}</span>`:""}</div><div class="product-info"><h3>${esc(p.name)}</h3><p>${esc(p.desc||"Authentic product selected for everyday style.")}</p><div class="price">${price}</div></div><div class="card-actions"><button onclick="editProduct('${p.id}')">✎</button><button onclick="deleteProduct('${p.id}')">×</button></div></article>`;
}
function defaultProducts(){
 return [
 {id:"1",name:"Michael Kors Tote Bag",desc:"A polished everyday tote with timeless appeal.",price:4299,sale:0,category:"Bags",badge:"BESTSELLER",featured:true,new:false,isSale:false,image:"brand_bag.jpg"},
 {id:"2",name:"Anne Klein Watch",desc:"Classic style that elevates every outfit.",price:1799,sale:0,category:"Watches",badge:"None",featured:true,new:true,isSale:false,image:"watch.jpg"},
 {id:"3",name:"Tommy Hilfiger Perfume",desc:"A fresh signature scent for everyday wear.",price:3499,sale:0,category:"Perfume",badge:"NEW",featured:true,new:true,isSale:false,image:"brand_perfume.jpg"},
 {id:"4",name:"Tommy Hilfiger Sneakers",desc:"Comfortable everyday sneakers with a sporty finish.",price:2899,sale:2299,category:"Shoes",badge:"SALE",featured:true,new:true,isSale:true,image:"new_shoes.jpg"},
 {id:"5",name:"Classic Wallet",desc:"A compact accessory for your everyday essentials.",price:1299,sale:999,category:"Wallets",badge:"SALE",featured:false,new:false,isSale:true,image:"wallet.jpg"},
 {id:"6",name:"Daily Vitamins",desc:"A practical addition to your daily routine.",price:899,sale:0,category:"Vitamins",badge:"None",featured:false,new:false,isSale:false,image:"vitamins.jpg"}
 ];
}
if(!products.length){products=defaultProducts();save()}

function render(){
 $("#shopGrid").innerHTML=products.map(card).join("");
 $("#newGrid").innerHTML=products.filter(p=>p.new).map(card).join("")||`<div class="empty" style="grid-column:1/-1">No new arrivals yet.</div>`;
 $("#saleGrid").innerHTML=products.filter(p=>p.isSale||p.sale>0).map(card).join("")||`<div class="empty" style="grid-column:1/-1">No sale items yet.</div>`;
 ["Bags","Wallets","Perfume","Shoes","Vitamins","Watches"].forEach(c=>{
   const id=c.toLowerCase(), v=$("#"+id);
   v.innerHTML=`<div class="page-title"><div><small>CATEGORY</small><h1>${c}</h1><p>Shop our ${c.toLowerCase()} collection.</p></div></div><div class="product-grid">${products.filter(p=>p.category===c).map(card).join("")||`<div class="empty" style="grid-column:1/-1">No products in this category.</div>`}</div>`;
 });
}
function showView(id){
 $$(".view").forEach(v=>v.classList.remove("show"));$("#"+id).classList.add("show");
 const label=id==="new"?"New Arrival":id==="sale"?"Sale Item":id==="orders"?"My Orders":id[0].toUpperCase()+id.slice(1);
 $("#topTitle").textContent=label;$("#sidebar").classList.remove("open");window.scrollTo({top:0,behavior:"smooth"});
}
$$(".nav[data-view]").forEach(b=>b.onclick=()=>showView(b.dataset.view));
$$("[data-view-target]").forEach(b=>b.onclick=()=>showView(b.dataset.viewTarget));
$$(".category").forEach(b=>b.onclick=()=>showView(b.dataset.category.toLowerCase()));
$("#hamburger").onclick=()=>$("#sidebar").classList.add("open");
$("#mobileClose").onclick=()=>$("#sidebar").classList.remove("open");
$("#cartOpen").onclick=()=>$("#cartPanel").style.display="flex";
$("#cartClose").onclick=()=>$("#cartPanel").style.display="none";
$("#globalSearch").onkeydown=e=>{if(e.key==="Enter"){showView("shop");$("#catalogSearch").value=e.target.value;filterCatalog()}};

$$(".filter").forEach(b=>b.onclick=()=>{$$(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");filterCatalog()});
$("#catalogSearch").oninput=filterCatalog;
function filterCatalog(){let f=document.querySelector(".filter.active").dataset.filter,q=$("#catalogSearch").value.toLowerCase();$("#shopGrid").innerHTML=products.filter(p=>(f==="all"||p.category===f)&&(p.name+" "+p.desc).toLowerCase().includes(q)).map(card).join("")||`<div class="empty" style="grid-column:1/-1">No products found.</div>`}

let editing=null;
function openEditor(p=null){
 editing=p;$("#productForm").reset();$("#editId").value=p?.id||"";$("#editorTitle").textContent=p?"Edit Product":"Add Product";
 $("#productName").value=p?.name||"";$("#productDesc").value=p?.desc||"";$("#productPrice").value=p?.price||"";$("#productSale").value=p?.sale||"";
 $("#productCategory").value=p?.category||"Bags";$("#productBadge").value=p?.badge||"None";$("#productFeatured").checked=!!p?.featured;$("#productNew").checked=!!p?.new;$("#productIsSale").checked=!!p?.isSale;
 photo={src:p?.image||"",zoom:1,rotation:0,filter:p?.filter||"original"};$("#zoom").value=1;setTool(photo.filter);draw(photo.src);$("#editorModal").classList.add("show");
}
function closeEditor(){$("#editorModal").classList.remove("show")}
$("#editorClose").onclick=closeEditor;
$("#editorModal").onclick=e=>{if(e.target.id==="editorModal")closeEditor()};
$("#addProductBtn").onclick=$("#addNewBtn").onclick=$("#addSaleBtn").onclick=()=>openEditor();
$("#uploadPhoto").onclick=$("#replacePhoto").onclick=()=>$("#photoFile").click();
$("#photoFile").onchange=e=>readFile(e.target.files[0]);
$("#photoBox").onclick=()=>{if(!photo.src)$("#photoFile").click()};
$("#photoBox").ondragover=e=>e.preventDefault();
$("#photoBox").ondrop=e=>{e.preventDefault();readFile(e.dataTransfer.files[0])};
document.addEventListener("paste",e=>{if(!$("#editorModal").classList.contains("show"))return;let i=[...(e.clipboardData?.items||[])].find(x=>x.type.startsWith("image/"));if(i)readFile(i.getAsFile())});
function readFile(f){if(!f||!f.type.startsWith("image/"))return;let r=new FileReader();r.onload=()=>{photo.src=r.result;photo.zoom=1;photo.rotation=0;$("#zoom").value=1;draw(photo.src)};r.readAsDataURL(f)}
$("#removePhoto").onclick=()=>{photo.src="";draw("")};
$("#zoom").oninput=e=>{photo.zoom=+e.target.value;draw(photo.src)};
$("#rotatePhoto").onclick=()=>{photo.rotation=(photo.rotation+90)%360;draw(photo.src)};
$("#resetPhoto").onclick=()=>{photo.zoom=1;photo.rotation=0;photo.filter="original";$("#zoom").value=1;setTool("original");draw(photo.src)};
$$(".edit-tools button").forEach(b=>b.onclick=()=>{photo.filter=b.dataset.edit;setTool(photo.filter);draw(photo.src)});
function setTool(t){$$(".edit-tools button").forEach(b=>b.classList.toggle("active",b.dataset.edit===t))}
function draw(src){
 if(!src){$("#emptyPhoto").style.display="block";canvas.style.display="none";return}
 $("#emptyPhoto").style.display="none";canvas.style.display="block";
 let im=new Image();im.onload=()=>{
   let scale=Math.min(1,700/Math.max(im.width,im.height)),w=im.width*scale,h=im.height*scale;
   if(photo.rotation%180)[w,h]=[h,w];canvas.width=Math.max(500,w);canvas.height=Math.max(330,h);
   ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(photo.rotation*Math.PI/180);ctx.scale(photo.zoom,photo.zoom);ctx.filter=filters[photo.filter]||"none";ctx.drawImage(im,-im.width*scale/2,-im.height*scale/2,im.width*scale,im.height*scale);ctx.restore();
 };im.src=src;
}
$("#productForm").onsubmit=e=>{
 e.preventDefault();let id=$("#editId").value||crypto.randomUUID(),old=products.find(p=>p.id===id);
 let image=photo.src;if(photo.src&&canvas.style.display!=="none")image=canvas.toDataURL("image/jpeg",.88);
 let p={id,name:$("#productName").value.trim(),desc:$("#productDesc").value.trim(),price:+$("#productPrice").value,sale:+$("#productSale").value||0,category:$("#productCategory").value,badge:$("#productBadge").value,featured:$("#productFeatured").checked,new:$("#productNew").checked,isSale:$("#productIsSale").checked,image:image||old?.image||"",filter:photo.filter};
 products=old?products.map(x=>x.id===id?p:x):[p,...products];save();render();filterCatalog();closeEditor();toast(old?"Product updated":"Product added");
};
window.editProduct=id=>openEditor(products.find(p=>p.id===id));
window.deleteProduct=id=>{if(confirm("Delete this product?")){products=products.filter(p=>p.id!==id);save();render();filterCatalog();toast("Product deleted")}};
function toast(t){let x=$("#toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2000)}
$("#logout").onclick=()=>toast("Demo logout — connect authentication for a live store.");
render();filterCatalog();
