let miMenu = JSON.parse(localStorage.getItem('miMenu')) || [];
let categorias = JSON.parse(localStorage.getItem('categorias')) || ["Todas", "Parrillas", "Bebidas"];
let config = JSON.parse(localStorage.getItem('configRest')) || { 
    n: "El Hato", t: 37.50, w: "584120000000", fb: "", ig: "", tk: "" 
};
let usuarioActivo = JSON.parse(localStorage.getItem('userRest')) || null;
let carrito = [];
let categoriaActual = "Todas";
let captchaRes = 0;

// SEGURIDAD
function generarCaptcha() { 
    let a = Math.floor(Math.random() * 10); let b = Math.floor(Math.random() * 10);
    captchaRes = a + b;
    document.getElementById('captcha-pregunta').innerText = `${a} + ${b}`;
}

function toggleAuth(isReg) {
    document.getElementById('auth-login-view').style.display = isReg ? 'none' : 'block';
    document.getElementById('auth-register-view').style.display = isReg ? 'block' : 'none';
}

function registrarUsuario() {
    const key = document.getElementById('reg-master-key').value;
    if (key !== "madielomar19") return alert("Llave Maestra incorrecta.");
    const u = document.getElementById('reg-user').value;
    const e = document.getElementById('reg-email').value;
    const p = document.getElementById('reg-pass').value;
    if(!u || !e || !p) return alert("Complete los datos.");
    localStorage.setItem('adminCreds', JSON.stringify({user:u, email:e, pass:p}));
    alert("¡Dueño registrado!");
    toggleAuth(false);
}

function iniciarSesion() {
    const id = document.getElementById('login-id').value;
    const ps = document.getElementById('login-pass').value;
    const cap = document.getElementById('captcha-respuesta').value;
    const creds = JSON.parse(localStorage.getItem('adminCreds'));
    if(!creds) return alert("Regístrese primero.");
    if(parseInt(cap) !== captchaRes) return alert("Captcha mal hecho.");
    if((id===creds.user || id===creds.email) && ps===creds.pass) {
        usuarioActivo = {login:true};
        localStorage.setItem('userRest', JSON.stringify(usuarioActivo));
        location.reload();
    } else { alert("Datos incorrectos."); }
}

// CONFIGURACIÓN
function guardarConfiguracion() {
    config.n = document.getElementById('conf-nombre').value;
    config.w = document.getElementById('conf-whatsapp').value;
    config.t = document.getElementById('conf-tasa').value;
    config.fb = document.getElementById('conf-fb').value;
    config.ig = document.getElementById('conf-ig').value;
    config.tk = document.getElementById('conf-tk').value;
    localStorage.setItem('configRest', JSON.stringify(config));
    location.reload();
}

function cargarRedes() {
    if(config.fb) { document.getElementById('link-facebook').href = config.fb; document.getElementById('link-facebook').style.display = 'flex'; }
    if(config.ig) { document.getElementById('link-instagram').href = config.ig; document.getElementById('link-instagram').style.display = 'flex'; }
    if(config.tk) { document.getElementById('link-tiktok').href = config.tk; document.getElementById('link-tiktok').style.display = 'flex'; }
}

// MENÚ Y PRODUCTOS
function mostrarMenu() {
    const cont = document.getElementById('menu-cliente');
    cont.innerHTML = '';
    const filtrados = categoriaActual === "Todas" ? miMenu : miMenu.filter(p => p.cat === categoriaActual);
    filtrados.forEach((p) => {
        const idx = miMenu.indexOf(p);
        const usd = (p.precioBs / config.t).toFixed(2);
        let botones = usuarioActivo 
            ? `<div style="display:flex; gap:10px; margin-top:15px;">
                <button onclick="cargarParaEditar(${idx})" style="background:#2196f3; color:white; padding:15px; border-radius:10px; flex:1;">EDITAR</button>
                <button onclick="borrarPlato(${idx})" style="background:red; color:white; padding:15px; border-radius:10px; flex:1;">BORRAR</button>
               </div>`
            : `<button onclick="agregarAlCarrito(${idx})" class="btn-llanero" style="padding:15px; font-size:1.3rem;">AÑADIR AL PEDIDO 🛒</button>`;
        cont.innerHTML += `<div class="card"><img src="${p.img || ''}"><div class="card-body"><h3>${p.nombre}</h3><span style="font-size:2rem; font-weight:bold;">Bs. ${p.precioBs}</span><p style="color:green; font-weight:bold;">$ ${usd} USD</p>${botones}</div></div>`;
    });
}

function guardarPlato() {
    const n = document.getElementById('plato-nombre').value;
    const c = document.getElementById('plato-categoria').value;
    const p = document.getElementById('plato-precio').value;
    const f = document.getElementById('plato-foto').files[0];
    const idx = parseInt(document.getElementById('edit-index').value);
    const callback = (imgBase64) => {
        const obj = { nombre: n, cat: c, precioBs: p, img: imgBase64 || (idx !== -1 ? miMenu[idx].img : '') };
        if(idx === -1) miMenu.push(obj); else miMenu[idx] = obj;
        localStorage.setItem('miMenu', JSON.stringify(miMenu));
        location.reload();
    };
    if(f) { const reader = new FileReader(); reader.onload=(e)=>callback(e.target.result); reader.readAsDataURL(f); } else { callback(); }
}

function borrarPlato(i) { if(confirm("¿Borrar plato?")) { miMenu.splice(i,1); localStorage.setItem('miMenu', JSON.stringify(miMenu)); mostrarMenu(); } }

function cargarParaEditar(i) {
    const p = miMenu[i];
    document.getElementById('plato-nombre').value = p.nombre;
    document.getElementById('plato-precio').value = p.precioBs;
    document.getElementById('plato-categoria').value = p.cat;
    document.getElementById('edit-index').value = i;
    irAlPanel();
    switchTab({currentTarget: document.querySelectorAll('.nav-tab')[1]}, 'tab-comidas');
}

// CARRITO
function agregarAlCarrito(idx) { carrito.push(miMenu[idx]); document.getElementById('cart-count').innerText = carrito.length; }
function abrirCarrito() {
    const l = document.getElementById('lista-carrito'); l.innerHTML = ''; let t = 0;
    carrito.forEach(i => { t += parseFloat(i.precioBs); l.innerHTML += `<p>• ${i.nombre}: Bs. ${i.precioBs}</p>`; });
    document.getElementById('total-carrito-area').innerText = `TOTAL: Bs. ${t.toFixed(2)}`;
    document.getElementById('modal-carrito').style.display='block';
}

function enviarWhatsApp() {
    let m = `*Pedido de ${config.n}*\n`;
    carrito.forEach(i => m += `- ${i.nombre} (Bs. ${i.precioBs})\n`);
    window.open(`https://wa.me/${config.w}?text=${encodeURIComponent(m)}`);
}

// INICIO
window.onload = () => {
    document.getElementById('display-nombre-rest').innerText = config.n;
    document.getElementById('valor-tasa').innerText = `Tasa: ${config.t} Bs.`;
    document.getElementById('conf-nombre').value = config.n;
    document.getElementById('conf-whatsapp').value = config.w;
    document.getElementById('conf-tasa').value = config.t;
    document.getElementById('conf-fb').value = config.fb;
    document.getElementById('conf-ig').value = config.ig;
    document.getElementById('conf-tk').value = config.tk;
    document.getElementById('plato-categoria').innerHTML = categorias.filter(c=>c!=="Todas").map(c=>`<option value="${c}">${c}</option>`).join('');
    document.getElementById('lista-categorias-admin').innerHTML = categorias.filter(c=>c!=="Todas").map(c=>`<div style="display:flex; justify-content:space-between; margin-bottom:15px; background:#f9f9f9; padding:15px; border-radius:10px; color:#000; border:2px solid var(--soga);"><span>${c}</span><button onclick="eliminarCat('${c}')" style="background:red; color:white; border:none; padding:8px; border-radius:5px;">X</button></div>`).join('');
    cargarRedes(); renderTabs(); mostrarMenu();
};

function agregarCategoria() {
    const c = document.getElementById('nueva-cat-nombre').value;
    if(c) { categorias.push(c); localStorage.setItem('categorias', JSON.stringify(categorias)); location.reload(); }
}

function renderTabs() { document.getElementById('categorias-bar').innerHTML = categorias.map(c=>`<button class="tab-btn ${categoriaActual===c?'active':''}" onclick="filtrar('${c}')">${c}</button>`).join(''); }
function filtrar(c) { categoriaActual = c; renderTabs(); mostrarMenu(); }
function cerrarModal(id) { document.getElementById(id).style.display='none'; }
function irAlPanel() { document.getElementById('admin-panel').style.display='block'; }
function cerrarAdmin() { document.getElementById('admin-panel').style.display='none'; }
function abrirLogin() { document.getElementById('modal-login').style.display='block'; if(usuarioActivo) { document.getElementById('auth-login-view').style.display='none'; document.getElementById('auth-logged-in').style.display='block'; } else { generarCaptcha(); } }
function cerrarSesion() { localStorage.removeItem('userRest'); location.reload(); }
function eliminarCat(c) { categorias = categorias.filter(i=>i!==c); localStorage.setItem('categorias', JSON.stringify(categorias)); location.reload(); }
function switchTab(evt, tabId) { document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none'); document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active')); document.getElementById(tabId).style.display = 'block'; evt.currentTarget.classList.add('active'); }