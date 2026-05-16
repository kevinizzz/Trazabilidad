/* =========================================
   1. CONFIGURACIÓN Y ESTADO GLOBAL
   ========================================= */
const CONFIG = {
  Porcinos: { color: "#e57373", icon: "🐖" },
  Aves:     { color: "#64b5f6", icon: "🐔" },
  Ovinos:   { color: "#81c784", icon: "🐑" },
  Caprinos: { color: "#ffb74d", icon: "🐐" },
  Bovinos:  { color: "#a1887f", icon: "🐄" }
};

let categoriaActiva = "Porcinos";
let editandoIndex = null;

// Persistencia de datos en LocalStorage
let db = JSON.parse(localStorage.getItem("granjaData")) || {
  Porcinos: [], Aves: [], Ovinos: [], Caprinos: [], Bovinos: []
};

/* =========================================
   2. FUNCIONES DE RENDERIZADO (VISTA)
   ========================================= */
function renderTabla() {
  const tbody = document.getElementById("tablaCuerpo");
  const thead = document.getElementById("tablaHeader");
  const filtro = document.getElementById("inputBuscar").value.toLowerCase();
  
  // Cabeceras dinámicas según especie
  let columnasExtra = "";
  if(categoriaActiva === "Aves") columnasExtra = "<th>Postura</th>";
  if(categoriaActiva === "Caprinos") columnasExtra = "<th>Leche (L)</th>";
  if(categoriaActiva === "Porcinos") columnasExtra = "<th>Destete</th><th>Crías</th>";

thead.innerHTML = `
    <tr>
      <th>Nombre/Cód</th>
      <th>Sexo</th>
      <th>Raza</th>
      <th>Peso</th>
      ${columnasExtra}
      <th>Vacunación</th>
      <th>Acciones</th>
    </tr>
  `;

  tbody.innerHTML = "";
  
  // Filtrado de búsqueda
  let listaFiltrada = db[categoriaActiva].filter(a => 
    (a.codigo || "").toLowerCase().includes(filtro) || (a.nombre || "").toLowerCase().includes(filtro)
  );

  listaFiltrada.forEach((animal, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><b>${animal.nombre}</b><br><small>${animal.codigo}</small></td>
      <td>${animal.sexo}</td>
      <td>${animal.raza}</td>
      <td>${animal.peso}kg</td>
      ${categoriaActiva === "Aves" ? `<td>${animal.postura}</td>` : ""}
      ${categoriaActiva === "Caprinos" ? `<td>${animal.leche}</td>` : ""}
      ${categoriaActiva === "Porcinos" ? `<td>${animal.destete || '-'}</td><td>${animal.crias || '0'}</td>` : ""}
      <td>${animal.vacunacion || 'N/A'}</td>
      <td class="acciones">
        <button class="btn-editar" onclick="abrirModal(${index})">✎</button>
        <button class="btn-eliminar" onclick="eliminarRegistro(${index})">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("totalRegistros").textContent = `Total: ${listaFiltrada.length}`;
}

/* =========================================
   3. GESTIÓN DE DATOS Y FORMULARIO
   ========================================= */
function abrirModal(index = null) {
  editandoIndex = index;
  const modal = document.getElementById("modal");
  const form = document.getElementById("formularioCuerpo");
  const animal = index !== null ? db[categoriaActiva][index] : {};
  
  document.getElementById("modalTitulo").textContent = index === null ? "Agregar " + categoriaActiva : "Editar Registro";
  
  // Generación dinámica de campos del formulario
  form.innerHTML = `
    <div class="campo"><label>Nombre</label><input id="f_nombre" value="${animal.nombre || ''}"></div>
    <div class="campo"><label>Código</label><input id="f_codigo" value="${animal.codigo || ''}"></div>
    <div class="campo"><label>Sexo</label>
      <select id="f_sexo">
        <option value="Macho" ${animal.sexo==='Macho'?'selected':''}>Macho</option>
        <option value="Hembra" ${animal.sexo==='Hembra'?'selected':''}>Hembra</option>
      </select>
    </div>
    <div class="campo"><label>Raza</label><input id="f_raza" value="${animal.raza || ''}"></div>
    <div class="campo"><label>Peso (kg)</label><input type="number" id="f_peso" value="${animal.peso || ''}"></div>
    <div class="campo"><label>Fecha Vacunación</label><input type="date" id="f_vacunacion" value="${animal.vacunacion || ''}"></div>
  `;

  // Campos exclusivos por especie
  if(categoriaActiva === "Porcinos") {
    form.innerHTML += `
      <div class="campo"><label>Fecha Destete</label><input type="date" id="f_destete" value="${animal.destete || ''}"></div>
      <div class="campo"><label>Crías por parto</label><input type="number" id="f_crias" value="${animal.crias || ''}"></div>
    `;
  }
  if(categoriaActiva === "Aves") {
    form.innerHTML += `<div class="campo"><label>Ciclo Postura</label><input type="number" id="f_postura" value="${animal.postura || ''}"></div>`;
  }

  modal.classList.remove("oculto");
}

function cerrarModal() {
  document.getElementById("modal").classList.add("oculto");
}

function guardarRegistro() {
  const nuevo = {
    nombre: document.getElementById("f_nombre").value,
    codigo: document.getElementById("f_codigo").value,
    sexo: document.getElementById("f_sexo").value,
    raza: document.getElementById("f_raza").value,
    peso: document.getElementById("f_peso").value,
    vacunacion: document.getElementById("f_vacunacion").value
  };

  // Captura opcional de campos dinámicos
  if(document.getElementById("f_destete")) nuevo.destete = document.getElementById("f_destete").value;
  if(document.getElementById("f_crias")) nuevo.crias = document.getElementById("f_crias").value;
  if(document.getElementById("f_postura")) nuevo.postura = document.getElementById("f_postura").value;

  if(editandoIndex === null) db[categoriaActiva].push(nuevo);
  else db[categoriaActiva][editandoIndex] = nuevo;

  localStorage.setItem("granjaData", JSON.stringify(db));
  cerrarModal();
  renderTabla();
}

function eliminarRegistro(index) {
  if(confirm("¿Estás seguro de eliminar este registro?")) {
    db[categoriaActiva].splice(index, 1);
    localStorage.setItem("granjaData", JSON.stringify(db));
    renderTabla();
  }
}

/* =========================================
   4. EVENT LISTENERS (INTERACTIVIDAD)
   ========================================= */
document.querySelectorAll(".nav-item").forEach(item => {
  item.onclick = () => {
    // 1. Limpiar estados previos
    document.querySelectorAll(".nav-item").forEach(i => {
      i.classList.remove("activo");
      i.style.backgroundColor = "transparent";
      i.style.color = "#999";
    });

    // 2. Definir constantes
    categoriaActiva = item.dataset.cat;
    const conf = CONFIG[categoriaActiva];

    // 3. Aplicar Variables CSS (Esto ya controla Header y Sombras por el CSS que tienes)
    document.documentElement.style.setProperty('--color-tema', conf.color);
    document.documentElement.style.setProperty('--color-sombra', conf.color + "66");

    // 4. Actualizar Elementos Visuales
    item.classList.add("activo");
    item.style.color = conf.color;
    item.style.backgroundColor = conf.color + "33";
    
    document.getElementById("mainFab").style.backgroundColor = conf.color;
    document.getElementById("headerTitulo").textContent = categoriaActiva;
    document.getElementById("headerIcono").textContent = conf.icon;

    renderTabla();
  };
});

// Listener para el buscador
document.getElementById("inputBuscar").oninput = renderTabla;

// Carga inicial
renderTabla();