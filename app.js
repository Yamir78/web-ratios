/* Helpers */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const fmt2 = (n) => (!isFinite(n) ? "0.00" : Number(n).toFixed(2));
const fmtPct = (n) => `${fmt2(n*100)}%`;
const safeDiv = (a,b) => {
  const A = Number(a), B = Number(b);
  if (!isFinite(A) || !isFinite(B) || B === 0) return null;
  return A/B;
};

/* Show/Hide panels */
$("#togglePanel").addEventListener("click", () => {
  $("#ratiosPanel").classList.toggle("hidden");
});
$("#toggleMargin").addEventListener("click", () => {
  $("#marginPanel").classList.toggle("hidden");
});

/* ====== DEMO RATIOS ====== */
$("#fillDemo").addEventListener("click", () => {
  $("#ac").value=50000; $("#pc").value=37000;
  $("#un").value=4530;  $("#vn").value=40018;
  $("#dt").value=62000; $("#pr").value=20000; $("#pat").value=92000;
  $("#cv").value=25808; $("#inv").value=34000;
  $("#vnt").value=40018; $("#ct").value=13000;
  $("#pp").value=20000; $("#ct2").value=13000;
  $("#gf").value=4650;  $("#oe").value=450; $("#cuo").value=1892; $("#ud").value=2730;

  // demo margen: 3 filas representativas
  ensureRows(3);
  const rows = $$("#marginTable tbody tr");
  fillRow(rows[0], {freq:"Día", prod:"Polos", pv:28.50, cu:20.00, qty:216/7});  // ejemplo por día
  fillRow(rows[1], {freq:"Semana", prod:"Camisas", pv:34.50, cu:28.00, qty:120});
  fillRow(rows[2], {freq:"Semana", prod:"Accesorios", pv:15.00, cu:10.00, qty:30});
  recalcMarginTable();
});

/* ====== RATIOS ====== */
document.querySelectorAll('[data-action="calc"]').forEach(btn=>{
  btn.addEventListener("click", e=>{
    const card = e.target.closest(".card");
    calcCard(card);
    buildConclusion();
  });
});
$("#calcAll").addEventListener("click", ()=>{
  $$(".card").forEach(calcCard);
  buildConclusion();
});

function calcCard(card){
  const map = {
    liquidez:{ fn:calcLiquidez, out:"#out-liquidez" },
    rentabilidad:{ fn:calcRentabilidad, out:"#out-rentabilidad" },
    endeudamiento:{ fn:calcEndeudamiento, out:"#out-endeudamiento" },
    rot_inv:{ fn:calcRotInv, out:"#out-rotinv" },
    rot_ct:{ fn:calcRotCT, out:"#out-rotct" },
    inc_ct:{ fn:calcIncCT, out:"#out-incct" },
    cap_pago:{ fn:calcCapPago, out:"#out-cappago" }
  };
  const key = card.dataset.ratio;
  const cfg = map[key]; if(!cfg) return;
  const res = cfg.fn(); $(cfg.out).textContent = res.text;
  return res;
}

/* Each ratio */
function calcLiquidez(){
  const v = safeDiv($("#ac").value, $("#pc").value);
  if (v===null) return {text:"Datos incompletos", value:null};
  const interp = v>1 ? "Liquidez favorable (cumple criterio)." : "Riesgo de liquidez a corto plazo.";
  return {text:`${fmt2(v)} veces • ${interp}`, value:v, interp};
}
function calcRentabilidad(){
  const m = safeDiv($("#un").value, $("#vn").value);
  if (m===null) return {text:"Datos incompletos", value:null};
  const interp = m>=0.04 ? "Cubre costos financieros y genera ganancia." :
                            "Rentabilidad ajustada frente a referencia (4% mensual).";
  return {text:`${fmt2(m)} (${fmtPct(m)}) • ${interp}`, value:m, interp};
}
function calcEndeudamiento(){
  const v = safeDiv(Number($("#dt").value)+Number($("#pr").value), $("#pat").value);
  if (v===null) return {text:"Datos incompletos", value:null};
  const interp = v<1 ? "Endeudamiento razonable." : "Sobreendeudado vs patrimonio.";
  return {text:`${fmt2(v)} (${fmtPct(v)}) • ${interp}`, value:v, interp};
}
function calcRotInv(){
  const veces = safeDiv($("#cv").value, $("#inv").value);
  if (veces===null) return {text:"Datos incompletos", value:null};
  const dias = 30/veces;
  const interp = (veces>=1) ? "Buena conversión." : "Conversión lenta; vigilar existencias.";
  return {text:`${fmt2(veces)} veces • ${fmt2(dias)} días • ${interp}`, value:veces, dias, interp};
}
function calcRotCT(){
  const veces = safeDiv($("#vnt").value, $("#ct").value);
  if (veces===null) return {text:"Datos incompletos", value:null};
  const dias = 30/veces;
  const interp = (veces>=1.5) ? "Uso eficiente del capital de trabajo." :
                                "Rotación ajustada; mejorar operaciones.";
  return {text:`${fmt2(veces)} veces • ${fmt2(dias)} días • ${interp}`, value:veces, dias, interp};
}
function calcIncCT(){
  const r = safeDiv($("#pp").value, $("#ct2").value);
  if (r===null) return {text:"Datos incompletos", value:null};
  const interp = r>1 ? "Alerta de liquidez: se financia más del CT." :
                       "Presión de liquidez moderada.";
  return {text:`${fmt2(r)} (${fmtPct(r)}) • ${interp}`, value:r, interp};
}
function calcCapPago(){
  const gf=+$("#gf").value, oe=+$("#oe").value, cuo=+$("#cuo").value, ud=+$("#ud").value;
  const num = gf+oe+cuo, den = gf+oe+ud;
  const r = safeDiv(num, den);
  if (r===null) return {text:"Datos incompletos", value:null};
  const interp = r<=1 ? "APTA: la cuota cabe." : "NO APTA: la cuota excede.";
  return {text:`${fmt2(r)} (${fmtPct(r)}) • ${interp}`, value:r, interp};
}

/* Conclusion */
function buildConclusion(){
  const L=calcLiquidez(), R=calcRentabilidad(), E=calcEndeudamiento(),
        RI=calcRotInv(), RC=calcRotCT(), IC=calcIncCT(), CP=calcCapPago();

  if ([L,R,E,RI,RC,IC,CP].some(x=>!x || x.value===null)){
    $("#conclusionText").textContent="Faltan datos en uno o más ratios. Completa y calcula para generar la conclusión.";
    return;
  }
  const parts=[];
  parts.push(`Liquidez ${fmt2(L.value)} veces (${L.value>1?"favorable":"riesgo"}).`);
  parts.push(`Margen ${fmtPct(R.value)} (${R.value>=0.04?"adecuado":"ajustado"}).`);
  parts.push(`Endeudamiento ${fmt2(E.value)} (${E.value<1?"sano":"alto"}).`);
  parts.push(`Rotación de inventarios ${fmt2(RI.value)} veces (~${fmt2(RI.dias)} días).`);
  parts.push(`Rotación de CT ${fmt2(RC.value)} veces (~${fmt2(RC.dias)} días).`);
  parts.push(`Incremento de CT ${fmt2(IC.value)} (${fmtPct(IC.value)}) ${IC.value>1?"con alerta":"en rango cómodo"}.`);
  parts.push(`Capacidad de pago: ${CP.value<=1?"APTA":"NO APTA"} (${fmt2(CP.value)}).`);

  $("#conclusionText").textContent = `${parts[0]} ${parts[1]} ${parts[2]} ${parts[3]} ${parts[4]} ${parts[5]} ${parts[6]}`;
}

/* ====== MARGEN DE VENTAS ====== */
const tbody = $("#marginTable tbody");

function newRow(){
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><select class="freq">
          <option>Día</option><option>Semana</option><option>Mes</option>
        </select></td>
    <td><input class="prod" type="text" placeholder="Producto/servicio"></td>
    <td><input class="pv"   type="number" step="0.01" min="0" placeholder="Precio venta"></td>
    <td><input class="cu"   type="number" step="0.01" min="0" placeholder="Costo unitario"></td>
    <td><input class="qty"  type="number" step="0.01" min="0" placeholder="Cantidad"></td>
    <td class="venta">0.00</td>
    <td class="costo">0.00</td>
    <td class="util">0.00</td>
    <td class="margen">0.00%</td>`;
  tbody.appendChild(tr);

  tr.querySelectorAll("input,select").forEach(el=>{
    el.addEventListener("input", recalcMarginTable);
  });
}

function ensureRows(n){
  while (tbody.children.length < n) newRow();
}

function fillRow(tr, {freq, prod, pv, cu, qty}){
  tr.querySelector(".freq").value = freq || "Semana";
  tr.querySelector(".prod").value = prod || "";
  tr.querySelector(".pv").value   = pv ?? "";
  tr.querySelector(".cu").value   = cu ?? "";
  tr.querySelector(".qty").value  = qty ?? "";
}

function recalcMarginTable(){
  let tVenta=0, tCosto=0, tUtil=0;
  $$("#marginTable tbody tr").forEach(tr=>{
    const pv = +tr.querySelector(".pv").value || 0;
    const cu = +tr.querySelector(".cu").value || 0;
    const q  = +tr.querySelector(".qty").value || 0;

    const venta = pv*q;
    const costo = cu*q;
    const util  = venta - costo;
    const margen = venta>0 ? util/venta : 0;

    tr.querySelector(".venta").textContent = fmt2(venta);
    tr.querySelector(".costo").textContent = fmt2(costo);
    tr.querySelector(".util").textContent  = fmt2(util);
    tr.querySelector(".margen").textContent= fmtPct(margen);

    tVenta += venta; tCosto += costo; tUtil += util;
  });

  $("#tVenta").textContent = fmt2(tVenta);
  $("#tCosto").textContent = fmt2(tCosto);
  $("#tUtil").textContent  = fmt2(tUtil);
  const mTotal = tVenta>0 ? tUtil/tVenta : 0;
  $("#tMargen").textContent = fmtPct(mTotal);

  const pctCosto = tVenta>0 ? tCosto/tVenta : 0;
  $("#resumenCostoMargen").textContent =
    `% Costo de ventas: ${fmtPct(pctCosto)} • % Margen del negocio: ${fmtPct(mTotal)}`;
}

/* Inicializa 3 filas base */
ensureRows(3);
recalcMarginTable();

/* Añadir filas y descargar CSV */
$("#addRow").addEventListener("click", ()=>{ newRow(); });

$("#downloadCSV").addEventListener("click", ()=>{
  const rows = [
    ["Frecuencia","Producto/servicio","Precio venta","Costo unit.","Cantidad","Ingreso","Costo total","Utilidad","% Margen"]
  ];

  $$("#marginTable tbody tr").forEach(tr=>{
    const freq = tr.querySelector(".freq").value;
    const prod = tr.querySelector(".prod").value;
    const pv   = +tr.querySelector(".pv").value || 0;
    const cu   = +tr.querySelector(".cu").value || 0;
    const qty  = +tr.querySelector(".qty").value || 0;
    const venta= pv*qty, costo=cu*qty, util=venta-costo, margen=venta>0?util/venta:0;

    rows.push([freq, prod, fmt2(pv), fmt2(cu), fmt2(qty), fmt2(venta), fmt2(costo), fmt2(util), fmt2(margen*100)+"%"]);
  });

  // Totales
  const tVenta = $("#tVenta").textContent;
  const tCosto = $("#tCosto").textContent;
  const tUtil  = $("#tUtil").textContent;
  const tMarg  = $("#tMargen").textContent;

  rows.push([]);
  rows.push(["Totales","","","","", tVenta, tCosto, tUtil, tMarg]);
  rows.push([$("#resumenCostoMargen").textContent]);

  const csv = rows.map(r => r.map(cell=>{
    const c = (cell==null?"":String(cell));
    return /[",;\n]/.test(c) ? `"${c.replace(/"/g,'""')}"` : c;
  }).join(";")).join("\n");

  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "margen_ventas.csv";    // Abrible en Excel
  document.body.appendChild(a); a.click(); a.remove();
});
