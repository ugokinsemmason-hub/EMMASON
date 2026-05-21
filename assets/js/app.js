/* ╔══════════════════════════════════════════════╗
   ║  LOCKED CONSTANTS — EDIT FROM VS CODE ONLY   ║
   ╚══════════════════════════════════════════════╝ */
const COMPANY_NAME = 'ETS – UGOKINS EMMASON';
const COMPANY_LOGO_SRC = 'logo.png';
const SIGNATURE_SRC = 'signature.png';
const SEAL_SRC = 'company_seal.jpg';
const FOOTER_IMAGES = [
  'img_1.png', // image 1
  'img_2.png', // image 2
  'img_3.png', // image 3
  'img_4.png', // image 4
  'img_5.png', // image 5
  'img_6.png', // image 6
  'img_7.png', // image 7
  'img_8.png', // image 8
];

/* ══ Init ══ */
['lockedNameDisplay','logoNameLabel','topbarName'].forEach(id=>{
  const el=document.getElementById(id);if(el)el.textContent=COMPANY_NAME;
});
document.title=COMPANY_NAME+' | Business Suite';
if(COMPANY_LOGO_SRC){
  const li=document.getElementById('logoImg');
  if(li){li.src=COMPANY_LOGO_SRC;li.style.display='block';}
  const lp=document.getElementById('logoPlaceholder');if(lp)lp.style.display='none';
  document.getElementById('topbarLogoWrap').innerHTML=`<img src="${COMPANY_LOGO_SRC}" class="topbar-logo">`;
  document.getElementById('rcptLogoWrap').innerHTML=`<img src="${COMPANY_LOGO_SRC}" class="logo-img">`;
}
const fpWrap=document.getElementById('footerImgsPreview');
FOOTER_IMAGES.forEach((src,i)=>{
  const b=document.createElement('div');b.className='footer-img-box';
  b.innerHTML=src?`<img src="${src}" alt="F${i+1}">`:`<span style="font-size:1.2rem;">🖼️</span><span>Image ${i+1}</span>`;
  fpWrap.appendChild(b);
});

/* ══ PWA: Register Service Worker ══ */
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js')
      .then(reg=>console.log('SW registered'))
      .catch(err=>console.log('SW error:',err));
  });
}

/* ══ PWA: Install Button ══ */
let deferredPrompt;
window.addEventListener('beforeinstallprompt',(e)=>{
  e.preventDefault();
  deferredPrompt=e;
  const btn=document.getElementById('installBtn');
  if(btn)btn.style.display='inline-block';
});

function installApp(){
  if(!deferredPrompt)return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(()=>{deferredPrompt=null;});
}

/* ══ Tabs ══ */
function switchTab(name){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t=>t.classList.remove('active'));
  const map={invoice:0,receipt:1,'inv-records':2,'rcpt-records':3,stock:4};
  document.querySelectorAll('.tab')[map[name]].classList.add('active');
  document.getElementById('tab-'+name).classList.add('active');
  if(name==='inv-records')renderInvRecords();
  if(name==='rcpt-records')renderRcptRecords();
  if(name==='stock')renderStock();
}

/* ══ Invoice / Receipt numbers ══ */
function genNo(pfx){const n=new Date();return`${pfx}-${String(n.getFullYear()).slice(2)}${String(n.getMonth()+1).padStart(2,'0')}${String(n.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*900)+100}`;}
const INVOICE_NO=genNo('INV'),RECEIPT_NO=genNo('RCPT');
const TODAY=new Date(),TODAY_STR=TODAY.toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
document.getElementById('invNoDisplay').textContent=INVOICE_NO;
document.getElementById('invDateDisplay').textContent=TODAY_STR;
document.getElementById('rcptNoDisplay').textContent=RECEIPT_NO;
document.getElementById('rcptDateDisplay').textContent=TODAY_STR;
const qv=new Date();qv.setDate(qv.getDate()+30);
document.getElementById('quoteValid').value=qv.toISOString().split('T')[0];
document.getElementById('rcptDate').value=new Date().toISOString().split('T')[0];

/* ══ Image resize ══ */
function resizeImg(file,cb){
  const r=new FileReader();
  r.onload=e=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=200;c.height=200;const ctx=c.getContext('2d');const s=Math.max(200/img.width,200/img.height);const w=img.width*s,h=img.height*s;ctx.fillStyle='#fff';ctx.fillRect(0,0,200,200);ctx.drawImage(img,(200-w)/2,(200-h)/2,w,h);cb(c.toDataURL('image/jpeg',.85));};img.src=e.target.result;};
  r.readAsDataURL(file);
}

/* ══ Product rows ══ */
let rowCount=0;const imgStore={};

function getStockOptions(){
  const stock=getStock();
  return stock.map((p,i)=>`<option value="${i}">${p.name} (${p.code}) — ${p.qty} ${p.unit} @ $${p.price}</option>`).join('');
}

function addRow(){
  rowCount++;const id=rowCount;imgStore[id]=[];
  const tr=document.createElement('tr');tr.id=`row-${id}`;
  tr.innerHTML=`
    <td style="font-weight:800;color:#2563eb;text-align:center;vertical-align:middle;">${id}</td>
    <td><div class="img-cell"><div class="img-thumbs" id="imgThumbs-${id}"></div><div class="img-add-btn" onclick="document.getElementById('imgFile-${id}').click()">📷 Add</div><div class="img-count" id="imgCount-${id}">0</div></div><input type="file" id="imgFile-${id}" accept="image/*" multiple style="display:none" onchange="loadImgs(${id},this)"></td>
    <td>
      <select id="stockSel-${id}" onchange="fillFromStock(${id},this)" style="margin-bottom:4px;font-size:.78rem;">
        <option value="">— Select from stock or type below —</option>${getStockOptions()}
      </select>
      <textarea id="desc-${id}" placeholder="Product name & description..."></textarea>
    </td>
    <td><input type="text" id="size-${id}" placeholder="e.g. 1000×2100"></td>
    <td><select id="unit-${id}"><option>SET</option><option>PCS</option><option>M²</option><option>M</option><option>LOT</option><option>KG</option></select></td>
    <td style="vertical-align:middle;"><input type="number" id="qty-${id}" value="1" min="1" oninput="calcRow(${id})" style="width:48px;"></td>
    <td style="vertical-align:middle;"><input type="number" id="price-${id}" value="0" min="0" step="0.01" oninput="calcRow(${id})" style="width:78px;"></td>
    <td id="total-${id}" style="font-weight:800;color:#1a3a6b;vertical-align:middle;">$0.00</td>
    <td style="vertical-align:middle;"><button class="btn btn-danger btn-sm" onclick="removeRow(${id})">🗑</button></td>`;
  document.getElementById('productBody').appendChild(tr);calcSubtotal();
}

function fillFromStock(id,sel){
  if(!sel.value&&sel.value!=='0')return;
  const stock=getStock();
  const p=stock[parseInt(sel.value)];if(!p)return;
  document.getElementById(`desc-${id}`).value=p.name+(p.desc?'\n'+p.desc:'');
  document.getElementById(`size-${id}`).value=p.code;
  document.getElementById(`unit-${id}`).value=p.unit;
  document.getElementById(`price-${id}`).value=p.price;
  calcRow(id);
}

function loadImgs(id,input){
  if(!input.files||!input.files.length)return;
  Array.from(input.files).forEach(f=>resizeImg(f,b64=>{imgStore[id].push(b64);renderThumbs(id);}));
  input.value='';
}
function renderThumbs(id){
  document.getElementById(`imgThumbs-${id}`).innerHTML=imgStore[id].map((b,i)=>`<img src="${b}" class="img-thumb" onclick="openLB('${b}')" oncontextmenu="removeImg(event,${id},${i})" title="Click=view|Right-click=remove">`).join('');
  document.getElementById(`imgCount-${id}`).textContent=`${imgStore[id].length}`;
}
function removeImg(e,rid,idx){e.preventDefault();imgStore[rid].splice(idx,1);renderThumbs(rid);}
function calcRow(id){
  const q=parseFloat(document.getElementById(`qty-${id}`)?.value)||0;
  const p=parseFloat(document.getElementById(`price-${id}`)?.value)||0;
  document.getElementById(`total-${id}`).textContent='$'+(q*p).toLocaleString('en-US',{minimumFractionDigits:2});
  calcSubtotal();
}
function removeRow(id){document.getElementById(`row-${id}`)?.remove();delete imgStore[id];calcSubtotal();}
function calcSubtotal(){
  let t=0;
  document.querySelectorAll('#productBody tr').forEach(tr=>{
    const id=tr.id.replace('row-','');
    t+=(parseFloat(document.getElementById(`qty-${id}`)?.value)||0)*(parseFloat(document.getElementById(`price-${id}`)?.value)||0);
  });
  document.getElementById('grandTotal').textContent='$'+t.toLocaleString('en-US',{minimumFractionDigits:2});
  return t;
}
addRow();

/* ══ Receipt calc ══ */
function calcRcpt(){
  const tot=parseFloat(document.getElementById('rcptTotalDue').value)||0;
  const rec=parseFloat(document.getElementById('rcptAmtReceived').value)||0;
  document.getElementById('rcptBalDue').value=Math.max(0,tot-rec).toFixed(2);
}

/* ══ Lightbox ══ */
function openLB(src){document.getElementById('lightboxImg').src=src;document.getElementById('lightbox').classList.add('show');}
function closeLB(){document.getElementById('lightbox').classList.remove('show');}
function closeOv(id){document.getElementById(id).style.display='none';document.body.style.overflow='';}

/* ══ Co header HTML ══ */
function coHdrHTML(co){
  const lg=co.logo?`<img src="${co.logo}" style="height:60px;max-width:135px;object-fit:contain;border-radius:8px;">`:`<div style="width:54px;height:48px;background:#dbeafe;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;">⚙️</div>`;
  return`<div class="prev-top"><div class="prev-co" style="display:flex;align-items:flex-start;gap:12px;">${lg}<div><h3>${co.name}</h3><p>📞 ${co.phone}<br>✉️ ${co.email}<br>📍 ${co.address}</p></div></div></div>`;
}

/* ══ Sig/Seal HTML ══ */
function sigSealHTML(mode){
  const ss=mode==='sig'||mode==='both',sc=mode==='seal'||mode==='both';
  if(!ss&&!sc)return'';
  let h='<div class="sig-seal-prev">';
  if(ss&&SIGNATURE_SRC)h+=`<div class="sig-prev"><img src="${SIGNATURE_SRC}"><p>Authorized Signature</p></div>`;
  if(sc&&SEAL_SRC)h+=`<div class="seal-prev"><img src="${SEAL_SRC}"><p>Company Seal</p></div>`;
  return h+'</div>';
}

/* ══ Footer images HTML ══ */
function footerHTML(){
  return`<div class="prev-footer-sec"><div class="prev-footer-lbl">Our Products</div><div style="display:flex;gap:7px;flex-wrap:wrap;">${FOOTER_IMAGES.map((src,i)=>src?`<img src="${src}" style="width:72px;height:58px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;">`:`<div style="width:72px;height:58px;background:#f1f5f9;border-radius:6px;border:1.5px dashed #cbd5e1;display:flex;align-items:center;justify-content:center;font-size:.58rem;color:#94a3b8;text-align:center;">🖼️<br>Img ${i+1}</div>`).join('')}</div></div>`;
}

/* ══ Gather invoice data ══ */
function gatherInv(){
  const rows=[];
  document.querySelectorAll('#productBody tr').forEach((tr,i)=>{
    const id=tr.id.replace('row-','');
    const qty=parseFloat(document.getElementById(`qty-${id}`)?.value)||0;
    const price=parseFloat(document.getElementById(`price-${id}`)?.value)||0;
    const stockIdx=document.getElementById(`stockSel-${id}`)?.value;
    rows.push({no:i+1,desc:document.getElementById(`desc-${id}`)?.value||'',size:document.getElementById(`size-${id}`)?.value||'',unit:document.getElementById(`unit-${id}`)?.value||'SET',qty,price,total:qty*price,imgs:imgStore[id]||[],stockIdx:stockIdx!==''?parseInt(stockIdx):null});
  });
  return{invoiceNo:INVOICE_NO,date:TODAY_STR,quoteValid:document.getElementById('quoteValid').value,
    company:{name:COMPANY_NAME,logo:COMPANY_LOGO_SRC,phone:document.getElementById('companyPhone').value,email:document.getElementById('companyEmail').value,address:document.getElementById('companyAddress').value},
    client:{name:document.getElementById('clientName').value,phone:document.getElementById('clientPhone').value,email:document.getElementById('clientEmail').value,address:document.getElementById('clientAddress').value},
    notes:document.getElementById('invoiceNotes').value,rows,subtotal:calcSubtotal()};
}

/* ══ Gather receipt data ══ */
function gatherRcpt(){
  const methods=[];
  if(document.getElementById('pmCash').checked)methods.push('Cash');
  if(document.getElementById('pmCheque').checked)methods.push('Cheque');
  if(document.getElementById('pmOther').checked)methods.push(document.getElementById('pmOtherTxt').value||'Other');
  const tot=parseFloat(document.getElementById('rcptTotalDue').value)||0;
  const rec=parseFloat(document.getElementById('rcptAmtReceived').value)||0;
  return{receiptNo:RECEIPT_NO,date:document.getElementById('rcptDate').value||TODAY_STR,
    company:{name:COMPANY_NAME,logo:COMPANY_LOGO_SRC,phone:document.getElementById('rcptCoPhone').value,email:document.getElementById('rcptCoEmail').value,address:document.getElementById('rcptCoAddress').value},
    clientName:document.getElementById('rcptClientName').value,description:document.getElementById('rcptDesc').value,
    totalDue:tot,amountReceived:rec,balanceDue:Math.max(0,tot-rec),methods:methods.join(', ')||'—',notes:document.getElementById('rcptNotes').value};
}

/* ══ INVOICE PREVIEW ══ */
function showInvPreview(){
  const d=gatherInv();
  document.getElementById('invWM').innerHTML=d.company.logo?`<img src="${d.company.logo}">`:`<div class="wm-txt">${d.company.name}</div>`;
  const rowsHTML=d.rows.map(r=>`<tr><td style="text-align:center;font-weight:800;color:#2563eb;">${r.no}</td><td>${r.imgs.length?`<div class="prev-imgs">${r.imgs.map(b=>`<img src="${b}" onclick="openLB('${b}')" style="cursor:pointer;">`).join('')}</div>`:'📷'}</td><td>${r.desc.replace(/\n/g,'<br>')}</td><td>${r.size}</td><td style="text-align:center;">${r.unit}</td><td style="text-align:center;">${r.qty}</td><td style="text-align:right;">$${r.price.toLocaleString('en-US',{minimumFractionDigits:2})}</td><td style="font-weight:800;text-align:right;">$${r.total.toLocaleString('en-US',{minimumFractionDigits:2})}</td></tr>`).join('');
  document.getElementById('invPrevInner').innerHTML=`${coHdrHTML(d.company)}
    <div style="background:#1a3a6b;color:#fff;text-align:center;padding:8px;border-radius:8px;font-weight:800;letter-spacing:1px;font-size:.9rem;margin-bottom:14px;">PROFORMA INVOICE &nbsp;|&nbsp; ${d.invoiceNo} &nbsp;|&nbsp; ${d.date}</div>
    <div class="to-from"><div><div class="to-lbl">TO (Client)</div><h4>${d.client.name||'—'}</h4><p>📞 ${d.client.phone||'—'}<br>✉️ ${d.client.email||'—'}<br>📍 ${d.client.address||'—'}</p></div><div><div class="to-lbl">FROM (Supplier)</div><h4>${d.company.name}</h4><p>📞 ${d.company.phone}<br>✉️ ${d.company.email}<br>📍 ${d.company.address}</p></div></div>
    <table class="prev-tbl"><thead><tr><th>#</th><th>Images</th><th>Description</th><th>Size/Code</th><th>Unit</th><th>Qty</th><th>Unit Price</th><th>Sub Total</th></tr></thead><tbody>${rowsHTML}</tbody><tfoot><tr class="sub-row"><td colspan="7" style="text-align:right;padding:9px;">GRAND TOTAL</td><td style="padding:9px;text-align:right;">$${d.subtotal.toLocaleString('en-US',{minimumFractionDigits:2})}</td></tr></tfoot></table>
    ${d.notes?`<div class="prev-notes"><strong>📝 Notes:</strong> ${d.notes}</div>`:''}
    ${sigSealHTML('plain')}${footerHTML()}`;
  document.getElementById('invPreviewOverlay').style.display='block';
  document.body.style.overflow='hidden';
}

/* ══ RECEIPT PREVIEW ══ */
function showRcptPreview(){
  const d=gatherRcpt();
  document.getElementById('rcptWM').innerHTML=d.company.logo?`<img src="${d.company.logo}">`:`<div class="wm-txt">${d.company.name}</div>`;
  document.getElementById('rcptPrevInner').innerHTML=buildRcptHTML(d,'plain');
  document.getElementById('rcptPreviewOverlay').style.display='block';
  document.body.style.overflow='hidden';
}

function buildRcptHTML(d,mode){
  const isPaid=d.balanceDue<=0;
  return`${coHdrHTML(d.company)}
    <div style="background:#1a3a6b;color:#fff;text-align:center;padding:8px;border-radius:8px;font-weight:800;letter-spacing:1px;font-size:.9rem;margin-bottom:14px;">CASH RECEIPT &nbsp;|&nbsp; ${d.receiptNo} &nbsp;|&nbsp; ${d.date}</div>
    <div style="background:#f8faff;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin-bottom:12px;">
      <div class="grid2" style="gap:10px;margin-bottom:10px;"><div><div style="font-size:.67rem;font-weight:800;color:#2563eb;text-transform:uppercase;margin-bottom:3px;">Cash Received From</div><div style="font-weight:800;font-size:.92rem;color:#1a2b4a;">${d.clientName||'—'}</div></div><div><div style="font-size:.67rem;font-weight:800;color:#2563eb;text-transform:uppercase;margin-bottom:3px;">Payment Date</div><div style="font-weight:700;color:#1a2b4a;">${d.date}</div></div></div>
      <div style="margin-bottom:10px;"><div style="font-size:.67rem;font-weight:800;color:#2563eb;text-transform:uppercase;margin-bottom:3px;">For</div><div style="color:#334155;font-size:.86rem;">${d.description||'—'}</div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
        <div style="background:#1a3a6b;border-radius:8px;padding:9px;text-align:center;"><div style="font-size:.67rem;color:rgba(255,255,255,.75);font-weight:700;text-transform:uppercase;">Total Due</div><div style="font-size:1.05rem;font-weight:800;color:#fff;margin-top:3px;">$${d.totalDue.toLocaleString('en-US',{minimumFractionDigits:2})}</div></div>
        <div style="background:#16a34a;border-radius:8px;padding:9px;text-align:center;"><div style="font-size:.67rem;color:rgba(255,255,255,.75);font-weight:700;text-transform:uppercase;">Amount Received</div><div style="font-size:1.05rem;font-weight:800;color:#fff;margin-top:3px;">$${d.amountReceived.toLocaleString('en-US',{minimumFractionDigits:2})}</div></div>
        <div style="background:${isPaid?'#16a34a':'#dc2626'};border-radius:8px;padding:9px;text-align:center;"><div style="font-size:.67rem;color:rgba(255,255,255,.75);font-weight:700;text-transform:uppercase;">Balance Due</div><div style="font-size:1.05rem;font-weight:800;color:#fff;margin-top:3px;">$${d.balanceDue.toLocaleString('en-US',{minimumFractionDigits:2})}</div></div>
      </div>
      <div><div style="font-size:.67rem;font-weight:800;color:#2563eb;text-transform:uppercase;margin-bottom:3px;">Payment Method</div><div style="font-size:.86rem;color:#334155;font-weight:600;">${d.methods}</div></div>
    </div>
    ${d.notes?`<div class="prev-notes"><strong>📝 Notes:</strong> ${d.notes}</div>`:''}
    ${isPaid?'<div style="text-align:center;margin:12px 0;"><div class="fully-paid-stamp">✅ FULLY PAID</div></div>':''}
    ${sigSealHTML(mode)}${footerHTML()}`;
}

/* ══ SAVE INVOICE RECORD ══ */
function saveInvRecord(){
  const d=gatherInv();
  if(!d.client.name){alert('Please enter a client name before saving.');return;}
  const stock=getStock();
  let deductLog=[];
  d.rows.forEach(r=>{
    if(r.stockIdx!==null&&r.stockIdx!==undefined&&stock[r.stockIdx]){
      const p=stock[r.stockIdx];
      if(p.qty<r.qty){alert(`⚠️ Warning: Insufficient stock for "${p.name}".\nAvailable: ${p.qty} ${p.unit}\nRequired: ${r.qty} ${p.unit}\n\nInvoice saved but stock not deducted for this item.`);return;}
      p.qty-=r.qty;
      p.history=p.history||[];
      p.history.push({type:'sale',qty:-r.qty,date:TODAY_STR,ref:d.invoiceNo});
      deductLog.push(`${p.name}: -${r.qty}`);
    }
  });
  saveStock(stock);
  const records=dbGetCached('inv_records');
  records.unshift({id:d.invoiceNo,date:d.date,clientName:d.client.name,clientPhone:d.client.phone,clientEmail:d.client.email,clientAddress:d.client.address,subtotal:d.subtotal,notes:d.notes,rowCount:d.rows.length,savedAt:new Date().toISOString()});
  dbSave('inv_records', records);
  const msg=deductLog.length?`✅ Invoice ${d.invoiceNo} saved!\n\nStock deducted:\n${deductLog.join('\n')}`:`✅ Invoice ${d.invoiceNo} saved to records!`;
  alert(msg);closeOv('invPreviewOverlay');
}

/* ══ SAVE RECEIPT RECORD ══ */
function saveRcptRecord(){
  const d=gatherRcpt();
  if(!d.clientName){alert('Please enter a client name before saving.');return;}
  const records=dbGetCached('rcpt_records');
  const existing=records.find(r=>r.clientName.toLowerCase()===d.clientName.toLowerCase());
  const payment={receiptNo:d.receiptNo,date:d.date,amountReceived:d.amountReceived,method:d.methods,description:d.description,notes:d.notes,savedAt:new Date().toISOString()};
  if(existing){
    existing.payments.push(payment);
    existing.totalPaid=(existing.totalPaid||0)+d.amountReceived;
    existing.totalDue=d.totalDue;
    existing.balanceDue=Math.max(0,d.totalDue-existing.totalPaid);
    existing.lastUpdated=new Date().toISOString();
  } else {
    records.unshift({clientName:d.clientName,totalDue:d.totalDue,totalPaid:d.amountReceived,balanceDue:d.balanceDue,payments:[payment],createdAt:new Date().toISOString(),lastUpdated:new Date().toISOString()});
  }
  dbSave('rcpt_records', records);
  alert(`✅ Payment saved for ${d.clientName}!`);
  closeOv('rcptPreviewOverlay');renderRcptRecords();
}

/* ══ RENDER INVOICE RECORDS ══ */
function renderInvRecords(){
  const records=dbGetCached('inv_records');
  const q=(document.getElementById('invSearch').value||'').toLowerCase();
  const filtered=records.filter(r=>r.clientName.toLowerCase().includes(q));
  const wrap=document.getElementById('invRecordsList');
  if(!filtered.length){wrap.innerHTML='<div class="empty-state"><div>📄</div><p>No invoices found.</p></div>';return;}
  wrap.innerHTML=filtered.map(r=>`<div class="record-card">
    <div class="record-card-hdr">
      <div><div class="record-title">${r.clientName}</div><div class="record-sub">📄 ${r.id} &nbsp;|&nbsp; 📅 ${r.date} &nbsp;|&nbsp; ${r.rowCount} item(s)</div></div>
      <div style="display:flex;align-items:center;gap:8px;"><div style="font-weight:800;color:#1a3a6b;">$${r.subtotal.toLocaleString('en-US',{minimumFractionDigits:2})}</div>
      <button class="btn btn-danger btn-sm" onclick="delInvRecord('${r.id}')">🗑</button></div>
    </div>
    ${r.notes?`<div style="font-size:.76rem;color:#64748b;margin-top:4px;">📝 ${r.notes}</div>`:''}
  </div>`).join('');
}

function delInvRecord(id){
  if(!confirm('Delete this invoice record?'))return;
  const r=dbGetCached('inv_records').filter(x=>x.id!==id);
  dbSave('inv_records',r);renderInvRecords();
}

/* ══ RENDER RECEIPT RECORDS ══ */
function renderRcptRecords(){
  const records=dbGetCached('rcpt_records');
  const q=(document.getElementById('rcptSearch').value||'').toLowerCase();
  const filtered=records.filter(r=>r.clientName.toLowerCase().includes(q));
  const wrap=document.getElementById('rcptRecordsList');
  if(!filtered.length){wrap.innerHTML='<div class="empty-state"><div>💰</div><p>No payment records found.</p></div>';return;}
  wrap.innerHTML=filtered.map((r,ri)=>{
    const isPaid=r.balanceDue<=0;
    const badge=isPaid?'badge-paid':r.totalPaid>0?'badge-partial':'badge-unpaid';
    const badgeTxt=isPaid?'FULLY PAID':r.totalPaid>0?'PARTIAL':'UNPAID';
    const paymentsHTML=r.payments.map((p,pi)=>`<tr><td>${pi+1}</td><td>${p.receiptNo}</td><td>${p.date}</td><td style="font-weight:700;color:#16a34a;">$${p.amountReceived.toLocaleString('en-US',{minimumFractionDigits:2})}</td><td>${p.method}</td><td><button class="btn btn-success btn-sm" onclick="exportPartPDF(${ri},${pi},'plain')">📄</button><button class="btn btn-sig btn-sm" onclick="exportPartPDF(${ri},${pi},'sig')">✍️</button><button class="btn btn-both btn-sm" onclick="exportPartPDF(${ri},${pi},'both')">📄✍️</button></td></tr>`).join('');
    return`<div class="record-card">
      <div class="record-card-hdr">
        <div><div class="record-title">${r.clientName}</div><div class="record-sub">${r.payments.length} payment(s) &nbsp;|&nbsp; Last: ${new Date(r.lastUpdated).toLocaleDateString()}</div></div>
        <div style="display:flex;align-items:center;gap:8px;"><span class="rec-badge ${badge}">${badgeTxt}</span><button class="btn btn-danger btn-sm" onclick="delRcptRecord(${ri})">🗑</button></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:8px 0;font-size:.8rem;">
        <div style="background:#f1f5f9;border-radius:8px;padding:7px 10px;text-align:center;"><div style="color:#64748b;font-size:.68rem;font-weight:700;">TOTAL DUE</div><div style="font-weight:800;color:#1a3a6b;">$${r.totalDue.toLocaleString('en-US',{minimumFractionDigits:2})}</div></div>
        <div style="background:#dcfce7;border-radius:8px;padding:7px 10px;text-align:center;"><div style="color:#166534;font-size:.68rem;font-weight:700;">TOTAL PAID</div><div style="font-weight:800;color:#166534;">$${r.totalPaid.toLocaleString('en-US',{minimumFractionDigits:2})}</div></div>
        <div style="background:${isPaid?'#dcfce7':'#fee2e2'};border-radius:8px;padding:7px 10px;text-align:center;"><div style="color:${isPaid?'#166534':'#991b1b'};font-size:.68rem;font-weight:700;">BALANCE</div><div style="font-weight:800;color:${isPaid?'#166534':'#991b1b'};">$${r.balanceDue.toLocaleString('en-US',{minimumFractionDigits:2})}</div></div>
      </div>
      <div style="overflow-x:auto;"><table class="ph-tbl"><thead><tr><th>#</th><th>Receipt No</th><th>Date</th><th>Amount Paid</th><th>Method</th><th>Export</th></tr></thead><tbody>${paymentsHTML}</tbody></table></div>
      <div class="actions" style="margin-top:10px;">
        ${!isPaid?`<button class="btn btn-amber btn-sm" onclick="addNewPayment(${ri})">➕ Add New Payment</button>`:''}
        ${isPaid?`<button class="btn btn-success btn-sm" onclick="showHistPreview(${ri})">📜 View Full History</button><button class="btn btn-both btn-sm" onclick="exportFullHistPDF(${ri},'both')">📄✍️ Export Full</button>`:''}
      </div>
    </div>`;
  }).join('');
}

function delRcptRecord(idx){
  if(!confirm('Delete this payment record?'))return;
  const r=dbGetCached('rcpt_records');r.splice(idx,1);dbSave('rcpt_records',r);renderRcptRecords();
}

function addNewPayment(idx){
  const records=dbGetCached('rcpt_records');
  const r=records[idx];
  switchTab('receipt');
  document.getElementById('rcptClientName').value=r.clientName;
  document.getElementById('rcptTotalDue').value=r.totalDue.toFixed(2);
  document.getElementById('rcptBalDue').value=r.balanceDue.toFixed(2);
  document.getElementById('rcptAmtReceived').value='';
  alert(`Client "${r.clientName}" loaded.\nBalance remaining: $${r.balanceDue.toFixed(2)}\n\nEnter the new amount received and save.`);
}

function exportPartPDF(ri,pi,mode){
  const records=dbGetCached('rcpt_records');
  const r=records[ri],p=r.payments[pi];
  const cumPaid=r.payments.slice(0,pi+1).reduce((s,x)=>s+x.amountReceived,0);
  const d={receiptNo:p.receiptNo,date:p.date,company:{name:COMPANY_NAME,logo:COMPANY_LOGO_SRC,phone:document.getElementById('rcptCoPhone').value,email:document.getElementById('rcptCoEmail').value,address:document.getElementById('rcptCoAddress').value},clientName:r.clientName,description:p.description||'',totalDue:r.totalDue,amountReceived:p.amountReceived,balanceDue:Math.max(0,r.totalDue-cumPaid),methods:p.method,notes:p.notes||''};
  buildRcptPDFAndSave(d,mode);
}

/* ══ HISTORY PREVIEW ══ */
function showHistPreview(idx){
  const records=dbGetCached('rcpt_records');
  const r=records[idx];
  const co={name:COMPANY_NAME,logo:COMPANY_LOGO_SRC,phone:document.getElementById('rcptCoPhone').value,email:document.getElementById('rcptCoEmail').value,address:document.getElementById('rcptCoAddress').value};
  document.getElementById('histWM').innerHTML=co.logo?`<img src="${co.logo}">`:`<div class="wm-txt">${co.name}</div>`;
  document.getElementById('histPrevInner').innerHTML=buildHistHTML(r,co);
  document.getElementById('histOvFooter').innerHTML=`<button class="btn btn-success" onclick="exportFullHistPDF(${idx},'plain')">📄 PDF</button><button class="btn btn-sig" onclick="exportFullHistPDF(${idx},'sig')">✍️ Sig</button><button class="btn btn-seal" onclick="exportFullHistPDF(${idx},'seal')">🔏 Seal</button><button class="btn btn-both" onclick="exportFullHistPDF(${idx},'both')">📄✍️ Both</button><button class="btn btn-outline" onclick="closeOv('histPreviewOverlay')">✕ Close</button>`;
  document.getElementById('histPreviewOverlay').style.display='block';
  document.body.style.overflow='hidden';
}

function buildHistHTML(r,co){
  const rows=r.payments.map((p,i)=>{const cum=r.payments.slice(0,i+1).reduce((s,x)=>s+x.amountReceived,0);const bal=Math.max(0,r.totalDue-cum);return`<tr><td style="text-align:center;">${i+1}</td><td>${p.receiptNo}</td><td>${p.date}</td><td style="font-weight:700;color:#16a34a;">$${p.amountReceived.toLocaleString('en-US',{minimumFractionDigits:2})}</td><td>${p.method}</td><td style="color:${bal<=0?'#16a34a':'#dc2626'};font-weight:700;">$${bal.toLocaleString('en-US',{minimumFractionDigits:2})}</td></tr>`;}).join('');
  return`${coHdrHTML(co)}
    <div style="background:#1a3a6b;color:#fff;text-align:center;padding:8px;border-radius:8px;font-weight:800;letter-spacing:1px;font-size:.9rem;margin-bottom:14px;">COMPLETE PAYMENT HISTORY RECEIPT</div>
    <div style="background:#f8faff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:12px;">
      <div class="grid2" style="gap:10px;">
        <div><div class="to-lbl">Client</div><div style="font-weight:800;color:#1a2b4a;">${r.clientName}</div></div>
        <div><div class="to-lbl">Account Summary</div><div style="font-size:.8rem;color:#334155;">Due: <strong>$${r.totalDue.toLocaleString('en-US',{minimumFractionDigits:2})}</strong> | Paid: <strong>$${r.totalPaid.toLocaleString('en-US',{minimumFractionDigits:2})}</strong> | Balance: <strong style="color:#16a34a;">$${r.balanceDue.toLocaleString('en-US',{minimumFractionDigits:2})}</strong></div></div>
      </div>
    </div>
    <table class="prev-tbl"><thead><tr><th>#</th><th>Receipt No</th><th>Date</th><th>Amount Paid</th><th>Method</th><th>Balance After</th></tr></thead><tbody>${rows}</tbody><tfoot><tr class="sub-row"><td colspan="3" style="text-align:right;padding:9px;">TOTAL PAID</td><td style="padding:9px;">$${r.totalPaid.toLocaleString('en-US',{minimumFractionDigits:2})}</td><td colspan="2"></td></tr></tfoot></table>
    <div style="text-align:center;margin:14px 0;"><div class="fully-paid-stamp">✅ FULLY PAID</div><div style="font-size:.78rem;color:#64748b;margin-top:6px;">This document certifies all payments have been received in full.</div></div>
    ${sigSealHTML('plain')}${footerHTML()}`;
}

/* ══ STOCK MANAGEMENT ══ */
function getStock(){ return dbGetCached('stock_products'); }
function saveStock(s){ dbSave('stock_products', s); }

function stockStatus(p){
  if(p.qty<=0)return{label:'OUT',cls:'badge-out',rowCls:'stock-row-out'};
  if(p.qty<=p.threshold)return{label:'LOW',cls:'badge-low',rowCls:'stock-row-low'};
  return{label:'OK',cls:'badge-ok',rowCls:'stock-row-ok'};
}

function renderStock(){
  const stock=getStock();
  const q=(document.getElementById('stockSearch')?.value||'').toLowerCase();
  const filtered=stock.map((p,i)=>({...p,_idx:i})).filter(p=>p.name.toLowerCase().includes(q)||p.code.toLowerCase().includes(q));
  const tbody=document.getElementById('stockBody');
  let totalVal=0;let ok=0,low=0,out=0;
  stock.forEach(p=>{const st=stockStatus(p);if(st.label==='OK')ok++;else if(st.label==='LOW')low++;else out++;totalVal+=p.qty*p.price;});
  document.getElementById('statTotal').textContent=stock.length;
  document.getElementById('statOk').textContent=ok;
  document.getElementById('statLow').textContent=low;
  document.getElementById('statOut').textContent=out;
  document.getElementById('stockTotalValue').textContent='$'+totalVal.toLocaleString('en-US',{minimumFractionDigits:2});
  if(!filtered.length){tbody.innerHTML='<tr><td colspan="10" style="text-align:center;padding:20px;color:#94a3b8;">No products found.</td></tr>';return;}
  tbody.innerHTML=filtered.map((p,i)=>{
    const st=stockStatus(p);
    return`<tr class="${st.rowCls}">
      <td style="text-align:center;font-weight:700;">${p._idx+1}</td>
      <td><div style="font-weight:700;color:#1a2b4a;">${p.name}</div>${p.desc?`<div style="font-size:.72rem;color:#64748b;">${p.desc}</div>`:''}</td>
      <td>${p.code}</td><td>${p.unit}</td>
      <td style="font-weight:800;font-size:1rem;text-align:center;color:${p.qty<=0?'#dc2626':p.qty<=p.threshold?'#d97706':'#16a34a'};">${p.qty}</td>
      <td style="text-align:right;">$${parseFloat(p.price).toLocaleString('en-US',{minimumFractionDigits:2})}</td>
      <td style="text-align:right;font-weight:700;">$${(p.qty*p.price).toLocaleString('en-US',{minimumFractionDigits:2})}</td>
      <td style="text-align:center;">${p.threshold}</td>
      <td><span class="rec-badge ${st.cls}">${st.label}</span></td>
      <td><div style="display:flex;gap:4px;flex-wrap:wrap;">
        <button class="btn btn-outline btn-sm" onclick="editStock(${p._idx})">✏️</button>
        <button class="btn btn-purple btn-sm" onclick="openRestock(${p._idx})">📦</button>
        <button class="btn btn-danger btn-sm" onclick="delStock(${p._idx})">🗑</button>
      </div></td>
    </tr>`;
  }).join('');
}

function saveStockProduct(){
  const name=document.getElementById('stkName').value.trim();
  if(!name){alert('Please enter a product name.');return;}
  const stock=getStock();
  const editId=document.getElementById('editingStockId').value;
  const product={name,code:document.getElementById('stkCode').value.trim(),unit:document.getElementById('stkUnit').value,qty:parseFloat(document.getElementById('stkQty').value)||0,price:parseFloat(document.getElementById('stkPrice').value)||0,threshold:parseFloat(document.getElementById('stkThreshold').value)||5,desc:document.getElementById('stkDesc').value.trim(),history:[],createdAt:new Date().toISOString()};
  if(editId!==''){
    const old=stock[parseInt(editId)];product.history=old.history||[];product.createdAt=old.createdAt;stock[parseInt(editId)]=product;alert(`✅ Product "${name}" updated!`);
  } else {stock.push(product);alert(`✅ Product "${name}" added to stock!`);}
  saveStock(stock);clearStockForm();renderStock();
}

function clearStockForm(){
  ['stkName','stkCode','stkQty','stkPrice','stkThreshold','stkDesc'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('stkUnit').value='SET';
  document.getElementById('editingStockId').value='';
  document.getElementById('stockFormTitle').textContent='Add New Product to Stock';
}

function editStock(idx){
  const stock=getStock(),p=stock[idx];
  document.getElementById('stkName').value=p.name;
  document.getElementById('stkCode').value=p.code;
  document.getElementById('stkUnit').value=p.unit;
  document.getElementById('stkQty').value=p.qty;
  document.getElementById('stkPrice').value=p.price;
  document.getElementById('stkThreshold').value=p.threshold;
  document.getElementById('stkDesc').value=p.desc||'';
  document.getElementById('editingStockId').value=idx;
  document.getElementById('stockFormTitle').textContent='Edit Product';
  document.getElementById('stockFormCard').scrollIntoView({behavior:'smooth'});
}

function delStock(idx){
  if(!confirm('Delete this product from stock?'))return;
  const stock=getStock();stock.splice(idx,1);saveStock(stock);renderStock();
}

let currentRestockIdx=null;
function openRestock(idx){
  currentRestockIdx=idx;const stock=getStock();
  document.getElementById('restockProductName').textContent=`Product: ${stock[idx].name} (Current stock: ${stock[idx].qty} ${stock[idx].unit})`;
  document.getElementById('restockQty').value='';
  document.getElementById('restockDate').value=new Date().toISOString().split('T')[0];
  document.getElementById('restockNote').value='';
  document.getElementById('restockCard').style.display='block';
  document.getElementById('restockCard').scrollIntoView({behavior:'smooth'});
}

function confirmRestock(){
  const qty=parseFloat(document.getElementById('restockQty').value)||0;
  if(qty<=0){alert('Please enter a valid quantity to restock.');return;}
  const stock=getStock();const p=stock[currentRestockIdx];
  p.qty+=qty;p.history=p.history||[];
  p.history.push({type:'restock',qty:qty,date:document.getElementById('restockDate').value,note:document.getElementById('restockNote').value,savedAt:new Date().toISOString()});
  saveStock(stock);
  alert(`✅ ${qty} ${p.unit} added to "${p.name}".\nNew stock: ${p.qty} ${p.unit}`);
  document.getElementById('restockCard').style.display='none';currentRestockIdx=null;renderStock();
}

/* ══ STOCK PDF ══ */
function exportStockPDF(){
  const stock=getStock();if(!stock.length){alert('No stock products to export.');return;}
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  const pw=doc.internal.pageSize.getWidth(),ph=doc.internal.pageSize.getHeight();
  doc.setFillColor(26,58,107);doc.rect(0,0,pw,32,'F');
  const tx=COMPANY_LOGO_SRC?44:14;
  if(COMPANY_LOGO_SRC){try{doc.addImage(COMPANY_LOGO_SRC,'JPEG',12,4,22,22);}catch(e){}}
  doc.setTextColor(255,255,255);doc.setFontSize(13);doc.setFont('helvetica','bold');doc.text(COMPANY_NAME,tx,12);
  doc.setFontSize(7);doc.setFont('helvetica','normal');doc.text(`Tel: ${document.getElementById('companyPhone').value}`,tx,18);doc.text(`Email: ${document.getElementById('companyEmail').value}`,tx,23);
  doc.setFontSize(9);doc.setFont('helvetica','bold');doc.text('STOCK INVENTORY REPORT',pw/2,12,{align:'center'});
  doc.setFontSize(7.5);doc.setFont('helvetica','normal');doc.text(`Generated: ${TODAY_STR}`,pw-12,12,{align:'right'});
  doc.setFillColor(37,99,235);doc.rect(0,32,pw,8,'F');doc.setTextColor(255,255,255);doc.setFontSize(9);doc.setFont('helvetica','bold');doc.text('CURRENT STOCK LIST',pw/2,37.5,{align:'center'});
  let totalVal=0;
  const tableBody=stock.map((p,i)=>{const st=stockStatus(p);const val=p.qty*p.price;totalVal+=val;return[i+1,p.name,p.code,p.unit,p.qty,`$${parseFloat(p.price).toFixed(2)}`,`$${val.toFixed(2)}`,p.threshold,st.label];});
  tableBody.push(['','','','','','TOTAL VALUE',`$${totalVal.toFixed(2)}`,'','']);
  doc.autoTable({startY:44,head:[['#','Product Name','Code/Size','Unit','Qty in Stock','Unit Price','Total Value','Low Alert','Status']],body:tableBody,theme:'grid',headStyles:{fillColor:[26,58,107],textColor:255,fontStyle:'bold',fontSize:8},bodyStyles:{fontSize:7.5,textColor:[30,30,30]},alternateRowStyles:{fillColor:[248,250,255]},
    columnStyles:{0:{cellWidth:10,halign:'center'},1:{cellWidth:60},2:{cellWidth:28},3:{cellWidth:16,halign:'center'},4:{cellWidth:20,halign:'center'},5:{cellWidth:22,halign:'right'},6:{cellWidth:26,halign:'right'},7:{cellWidth:20,halign:'center'},8:{cellWidth:20,halign:'center'}},
    didParseCell:(data)=>{if(data.section==='body'){if(data.row.index===tableBody.length-1){data.cell.styles.fillColor=[26,58,107];data.cell.styles.textColor=255;data.cell.styles.fontStyle='bold';}if(data.column.index===8&&data.section==='body'&&data.row.index<stock.length){const st=stockStatus(stock[data.row.index]);if(st.label==='OUT')data.cell.styles.textColor=[220,38,38];else if(st.label==='LOW')data.cell.styles.textColor=[217,119,6];else data.cell.styles.textColor=[22,163,74];data.cell.styles.fontStyle='bold';}}}});
  doc.setFontSize(7);doc.setTextColor(180,180,180);doc.setFont('helvetica','italic');doc.text(`${COMPANY_NAME}  |  Stock Report  |  ${TODAY_STR}`,pw/2,ph-6,{align:'center'});
  savePDF(doc,`Stock_Report_${TODAY_STR.replace(/ /g,'_')}.pdf`);
}

/* ══ STOCK EXCEL ══ */
function exportStockExcel(){
  const stock=getStock();if(!stock.length){alert('No stock products to export.');return;}
  const wb=XLSX.utils.book_new();
  const header=[[COMPANY_NAME],[`Stock Inventory Report — Generated: ${TODAY_STR}`],[''],['#','Product Name','Code/Size','Unit','Qty in Stock','Unit Price ($)','Total Value ($)','Low Alert Threshold','Status']];
  let totalVal=0;
  const rows=stock.map((p,i)=>{const val=p.qty*p.price;totalVal+=val;const st=stockStatus(p);return[i+1,p.name,p.code,p.unit,p.qty,parseFloat(p.price).toFixed(2),val.toFixed(2),p.threshold,st.label];});
  rows.push(['','','','','','TOTAL VALUE',(totalVal).toFixed(2),'','']);
  const wsData=[...header,...rows];
  const ws=XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols']=[{wch:5},{wch:40},{wch:18},{wch:8},{wch:12},{wch:14},{wch:14},{wch:16},{wch:10}];
  XLSX.utils.book_append_sheet(wb,ws,'Stock Report');
  const histData=[['Product Name','Type','Quantity','Date','Note/Reference']];
  stock.forEach(p=>(p.history||[]).forEach(h=>histData.push([p.name,h.type,h.qty,h.date,h.note||h.ref||''])));
  const wsHist=XLSX.utils.aoa_to_sheet(histData);
  wsHist['!cols']=[{wch:35},{wch:10},{wch:10},{wch:15},{wch:30}];
  XLSX.utils.book_append_sheet(wb,wsHist,'History');
  saveExcel(wb,`Stock_Report_${TODAY_STR.replace(/ /g,'_')}.xlsx`);
}

/* ══ SHARED PDF HELPERS ══ */
function buildPDFHdr(doc,pw,ph,co,title,ref,date,valid){
  if(co.logo){try{doc.saveGraphicsState();doc.setGState(new doc.GState({opacity:.06}));doc.addImage(co.logo,'JPEG',pw/2-44,ph/2-44,88,88);doc.restoreGraphicsState();}catch(e){}}
  else{doc.saveGraphicsState();doc.setGState(new doc.GState({opacity:.05}));doc.setTextColor(37,99,235);doc.setFontSize(28);doc.setFont('helvetica','bold');doc.text(co.name,pw/2,ph/2,{align:'center',angle:20});doc.restoreGraphicsState();}
  doc.setFillColor(26,58,107);doc.rect(0,0,pw,40,'F');
  const tx=co.logo?44:14;
  if(co.logo){try{doc.addImage(co.logo,'JPEG',12,5,25,25);}catch(e){}}
  doc.setTextColor(255,255,255);doc.setFontSize(13);doc.setFont('helvetica','bold');doc.text(co.name,tx,13);
  doc.setFontSize(7.5);doc.setFont('helvetica','normal');doc.text(`Tel: ${co.phone}`,tx,19);doc.text(`Email: ${co.email}`,tx,24);doc.text(`Address: ${co.address}`,tx,29);
  doc.setFontSize(8);doc.setFont('helvetica','bold');doc.text(ref,pw-12,12,{align:'right'});
  doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.text(`Date: ${date}`,pw-12,18,{align:'right'});
  if(valid)doc.text(`Quote Valid: ${valid}`,pw-12,23,{align:'right'});
  doc.setFillColor(37,99,235);doc.rect(0,40,pw,9,'F');doc.setTextColor(255,255,255);doc.setFontSize(10);doc.setFont('helvetica','bold');doc.text(title,pw/2,46.5,{align:'center'});
}

function addSigSeal(doc,pw,ph,y,mode){
  const ss=mode==='sig'||mode==='both',sc=mode==='seal'||mode==='both';
  if(!ss&&!sc)return y;
  if(y+42>ph-40){doc.addPage();y=15;}
  if(ss&&sc){try{doc.addImage(SIGNATURE_SRC,'PNG',14,y,54,23);}catch(e){}doc.setDrawColor(180,180,180);doc.line(14,y+26,68,y+26);doc.setFontSize(7);doc.setTextColor(120,120,120);doc.setFont('helvetica','normal');doc.text('Authorized Signature',14,y+31);try{doc.addImage(SEAL_SRC,'JPEG',pw-57,y-4,41,41);}catch(e){}doc.text('Company Seal',pw-57,y+31);}
  else if(ss){try{doc.addImage(SIGNATURE_SRC,'PNG',14,y,54,23);}catch(e){}doc.setDrawColor(180,180,180);doc.line(14,y+26,68,y+26);doc.setFontSize(7);doc.setTextColor(120,120,120);doc.text('Authorized Signature',14,y+31);}
  else{try{doc.addImage(SEAL_SRC,'JPEG',pw/2-20,y-4,41,41);}catch(e){}doc.setFontSize(7);doc.setTextColor(120,120,120);doc.text('Company Seal',pw/2-20,y+31);}
  return y+42;
}

function addFooterImgs(doc,pw,ph){
  const valid=FOOTER_IMAGES.filter(s=>s&&s.length>0);if(!valid.length)return;
  const y=ph-26;doc.setDrawColor(226,232,240);doc.line(12,y,pw-12,y);
  doc.setFontSize(6.5);doc.setTextColor(150,150,150);doc.setFont('helvetica','bold');doc.text('OUR PRODUCTS',12,y+3);
  const imgW=(pw-28)/8-1.5;
  FOOTER_IMAGES.forEach((src,i)=>{if(!src)return;try{doc.addImage(src,'JPEG',12+i*(imgW+1.5),y+5,imgW,imgW*0.72);}catch(e){} });
}

/* ══ INVOICE PDF ══ */
function exportInvPDF(mode){
  try{
  const d=gatherInv();const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const pw=doc.internal.pageSize.getWidth(),ph=doc.internal.pageSize.getHeight();
  buildPDFHdr(doc,pw,ph,d.company,'PROFORMA INVOICE',d.invoiceNo,d.date,d.quoteValid);
  let y=56;
  doc.setFillColor(248,250,255);doc.roundedRect(12,y,pw-24,28,3,3,'F');doc.setDrawColor(226,232,240);doc.roundedRect(12,y,pw-24,28,3,3,'S');
  doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(37,99,235);doc.text('TO (CLIENT)',16,y+5);doc.text('FROM (SUPPLIER)',pw/2+2,y+5);
  doc.setFont('helvetica','bold');doc.setTextColor(26,58,107);doc.setFontSize(8.5);doc.text(d.client.name||'—',16,y+11);doc.text(d.company.name,pw/2+2,y+11);
  doc.setFont('helvetica','normal');doc.setTextColor(100,116,139);doc.setFontSize(7.5);
  doc.text(`Tel: ${d.client.phone||'—'}`,16,y+16);doc.text(`Email: ${d.client.email||'—'}`,16,y+21);doc.text(`Address: ${d.client.address||'—'}`,16,y+26,{maxWidth:pw/2-20});
  doc.text(`Tel: ${d.company.phone}`,pw/2+2,y+16);doc.text(`Email: ${d.company.email}`,pw/2+2,y+21);doc.text(`Address: ${d.company.address}`,pw/2+2,y+26,{maxWidth:pw/2-16});
  y+=34;
  const IS=17,IG=2;
  const tb=d.rows.map(r=>[r.no,'',r.desc,r.size,r.unit,r.qty,'$'+r.price.toLocaleString('en-US',{minimumFractionDigits:2}),'$'+r.total.toLocaleString('en-US',{minimumFractionDigits:2})]);
  tb.push(['','','','','','','GRAND TOTAL','$'+d.subtotal.toLocaleString('en-US',{minimumFractionDigits:2})]);
  const rh=d.rows.map(r=>{const n=r.imgs.length||0;return n?Math.max(18,Math.ceil(n/3)*(IS+IG)+4):18;});
  doc.autoTable({startY:y,head:[['#','Images','Description','Size/Code','Unit','Qty','Unit Price','Sub Total']],body:tb,theme:'grid',
    headStyles:{fillColor:[26,58,107],textColor:255,fontStyle:'bold',fontSize:8,cellPadding:3},bodyStyles:{fontSize:7.5,textColor:[30,30,30],cellPadding:2},alternateRowStyles:{fillColor:[248,250,255]},
    columnStyles:{0:{cellWidth:8,halign:'center'},1:{cellWidth:38},2:{cellWidth:52},3:{cellWidth:20},4:{cellWidth:12,halign:'center'},5:{cellWidth:10,halign:'center'},6:{cellWidth:22,halign:'right'},7:{cellWidth:22,halign:'right'}},
    didParseCell:(data)=>{if(data.section==='body'){if(data.row.index<d.rows.length)data.cell.styles.minCellHeight=rh[data.row.index];if(data.row.index===tb.length-1){data.cell.styles.fillColor=[26,58,107];data.cell.styles.textColor=255;data.cell.styles.fontStyle='bold';data.cell.styles.fontSize=9;}}},
    didDrawCell:(data)=>{if(data.section==='body'&&data.column.index===1&&data.row.index<d.rows.length){const imgs=d.rows[data.row.index].imgs;if(!imgs||!imgs.length)return;imgs.forEach((b,i)=>{try{const col=i%3,row=Math.floor(i/3);doc.addImage(b,'JPEG',data.cell.x+2+col*(IS+IG),data.cell.y+2+row*(IS+IG),IS,IS);}catch(e){}});}}});
  y=doc.lastAutoTable.finalY+8;
  if(d.notes){if(y+18>ph-55){doc.addPage();y=15;}doc.setFillColor(255,251,235);doc.roundedRect(12,y,pw-24,14,2,2,'F');doc.setDrawColor(252,211,77);doc.roundedRect(12,y,pw-24,14,2,2,'S');doc.setFontSize(7.5);doc.setFont('helvetica','bold');doc.setTextColor(120,53,15);doc.text('Notes:',15,y+5);doc.setFont('helvetica','normal');doc.text(d.notes,28,y+5,{maxWidth:pw-44});y+=18;}
  y=addSigSeal(doc,pw,ph,y,mode);addFooterImgs(doc,pw,ph);
  doc.setFontSize(7);doc.setTextColor(180,180,180);doc.setFont('helvetica','italic');doc.text(`${d.company.name}  |  ${d.invoiceNo}  |  ${d.date}`,pw/2,ph-8,{align:'center'});
  const sfx=mode==='plain'?'':mode==='sig'?'_Signed':mode==='seal'?'_Sealed':'_Signed_Sealed';
  savePDF(doc,`${d.invoiceNo}${sfx}.pdf`);
  }catch(e){console.error('Invoice PDF error:',e);alert('❌ PDF failed: '+e.message);}
}

/* ══ RECEIPT PDF ══ */
function exportRcptPDF(mode){buildRcptPDFAndSave(gatherRcpt(),mode);}

function buildRcptPDFAndSave(d,mode){
  try{
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const pw=doc.internal.pageSize.getWidth(),ph=doc.internal.pageSize.getHeight();
  buildPDFHdr(doc,pw,ph,d.company,'CASH RECEIPT',d.receiptNo,d.date,'');
  let y=52;
  doc.setFillColor(248,250,255);doc.roundedRect(12,y,pw-24,36,3,3,'F');doc.setDrawColor(226,232,240);doc.roundedRect(12,y,pw-24,36,3,3,'S');
  doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(37,99,235);doc.text('CASH RECEIVED FROM',16,y+5);doc.text('FOR',pw/2+2,y+5);
  doc.setFont('helvetica','bold');doc.setTextColor(26,58,107);doc.setFontSize(9);doc.text(d.clientName||'—',16,y+11);
  doc.setFont('helvetica','normal');doc.setTextColor(51,65,85);doc.setFontSize(7.5);doc.text(doc.splitTextToSize(d.description||'—',pw/2-18),pw/2+2,y+11);
  doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(37,99,235);doc.text('PAYMENT DATE',16,y+20);doc.text('PAYMENT METHOD',pw/2+2,y+20);
  doc.setFont('helvetica','normal');doc.setTextColor(51,65,85);doc.setFontSize(8);doc.text(d.date,16,y+26);doc.text(d.methods,pw/2+2,y+26);
  y+=42;
  const bw=(pw-28)/3;
  [[26,58,107],[22,163,74],d.balanceDue<=0?[22,163,74]:[220,38,38]].forEach((color,i)=>{
    const labels=['TOTAL AMOUNT DUE','AMOUNT RECEIVED','BALANCE DUE'];
    const vals=['$'+d.totalDue.toFixed(2),'$'+d.amountReceived.toFixed(2),'$'+d.balanceDue.toFixed(2)];
    doc.setFillColor(...color);doc.roundedRect(12+i*(bw+2),y,bw,20,3,3,'F');
    doc.setTextColor(255,255,255);doc.setFontSize(7);doc.setFont('helvetica','bold');doc.text(labels[i],12+i*(bw+2)+bw/2,y+6,{align:'center'});
    doc.setFontSize(11);doc.text(vals[i],12+i*(bw+2)+bw/2,y+15,{align:'center'});
  });
  y+=26;
  if(d.notes){doc.setFillColor(255,251,235);doc.roundedRect(12,y,pw-24,12,2,2,'F');doc.setDrawColor(252,211,77);doc.roundedRect(12,y,pw-24,12,2,2,'S');doc.setFontSize(7.5);doc.setFont('helvetica','bold');doc.setTextColor(120,53,15);doc.text('Notes:',15,y+5);doc.setFont('helvetica','normal');doc.text(d.notes,28,y+5,{maxWidth:pw-44});y+=16;}
  if(d.balanceDue<=0){doc.setDrawColor(22,163,74);doc.setLineWidth(1.5);doc.roundedRect(pw/2-30,y,60,14,3,3,'S');doc.setFontSize(11);doc.setFont('helvetica','bold');doc.setTextColor(22,163,74);doc.text('FULLY PAID',pw/2,y+9,{align:'center'});y+=20;}
  y=addSigSeal(doc,pw,ph,y,mode);addFooterImgs(doc,pw,ph);
  doc.setFontSize(7);doc.setTextColor(180,180,180);doc.setFont('helvetica','italic');doc.text(`${d.company.name}  |  ${d.receiptNo}  |  ${TODAY_STR}`,pw/2,ph-8,{align:'center'});
  const sfx=mode==='plain'?'':mode==='sig'?'_Signed':mode==='seal'?'_Sealed':'_Signed_Sealed';
  savePDF(doc,`${d.receiptNo}${sfx}.pdf`);
  }catch(e){console.error('Receipt PDF error:',e);alert('❌ PDF failed: '+e.message);}
}

/* ══ FULL HISTORY PDF ══ */
function exportFullHistPDF(idx,mode){
  const records=dbGetCached('rcpt_records'),r=records[idx];
  const co={name:COMPANY_NAME,logo:COMPANY_LOGO_SRC,phone:document.getElementById('rcptCoPhone').value,email:document.getElementById('rcptCoEmail').value,address:document.getElementById('rcptCoAddress').value};
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const pw=doc.internal.pageSize.getWidth(),ph=doc.internal.pageSize.getHeight();
  buildPDFHdr(doc,pw,ph,co,'COMPLETE PAYMENT HISTORY','HIST-'+r.clientName.substring(0,8).toUpperCase(),TODAY_STR,'');
  let y=56;
  doc.setFillColor(248,250,255);doc.roundedRect(12,y,pw-24,16,3,3,'F');doc.setDrawColor(226,232,240);doc.roundedRect(12,y,pw-24,16,3,3,'S');
  doc.setFontSize(8.5);doc.setFont('helvetica','bold');doc.setTextColor(26,58,107);doc.text(r.clientName,16,y+7);
  doc.setFont('helvetica','normal');doc.setTextColor(100,116,139);doc.setFontSize(7.5);doc.text(`Total Due: $${r.totalDue.toFixed(2)}  |  Total Paid: $${r.totalPaid.toFixed(2)}  |  Balance: $${r.balanceDue.toFixed(2)}`,16,y+13);
  y+=22;
  const tb=r.payments.map((p,i)=>{const cum=r.payments.slice(0,i+1).reduce((s,x)=>s+x.amountReceived,0);const bal=Math.max(0,r.totalDue-cum);return[i+1,p.receiptNo,p.date,'$'+p.amountReceived.toFixed(2),p.method,'$'+bal.toFixed(2)];});
  tb.push(['','','','TOTAL PAID','$'+r.totalPaid.toFixed(2),'']);
  doc.autoTable({startY:y,head:[['#','Receipt No','Date','Amount Paid','Method','Balance After']],body:tb,theme:'grid',headStyles:{fillColor:[26,58,107],textColor:255,fontStyle:'bold',fontSize:8},bodyStyles:{fontSize:7.5},alternateRowStyles:{fillColor:[248,250,255]},
    didParseCell:(d)=>{if(d.section==='body'&&d.row.index===tb.length-1){d.cell.styles.fillColor=[26,58,107];d.cell.styles.textColor=255;d.cell.styles.fontStyle='bold';}}});
  y=doc.lastAutoTable.finalY+10;
  doc.setDrawColor(22,163,74);doc.setLineWidth(1.5);doc.roundedRect(pw/2-30,y,60,14,3,3,'S');doc.setFontSize(11);doc.setFont('helvetica','bold');doc.setTextColor(22,163,74);doc.text('FULLY PAID',pw/2,y+9,{align:'center'});
  doc.setFontSize(7.5);doc.setFont('helvetica','normal');doc.setTextColor(100,116,139);doc.text('This document certifies that all payments have been received in full.',pw/2,y+18,{align:'center'});y+=24;
  y=addSigSeal(doc,pw,ph,y,mode);addFooterImgs(doc,pw,ph);
  doc.setFontSize(7);doc.setTextColor(180,180,180);doc.setFont('helvetica','italic');doc.text(`${COMPANY_NAME}  |  Full Payment History — ${r.clientName}  |  ${TODAY_STR}`,pw/2,ph-8,{align:'center'});
  savePDF(doc,`FULL_HISTORY_${r.clientName.replace(/\s/g,'-')}.pdf`);
}

/* ══ MOBILE-COMPATIBLE SAVE SYSTEM ══ */
function isMobile(){
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

function savePDF(doc, filename){
  try{
    if(isMobile()){
      const blob = doc.output('blob');
      const file = new File([blob], filename, {type:'application/pdf'});
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
        navigator.share({files:[file], title:filename, text:'ETS – UGOKINS EMMASON'})
          .catch(()=>blobDownload(blob, filename, 'application/pdf'));
      } else {
        blobDownload(blob, filename, 'application/pdf');
      }
    } else {
      doc.save(filename);
    }
  } catch(e){
    console.error(e);
    try{doc.save(filename);}catch(e2){alert('PDF ready: '+filename);}
  }
}

function saveExcel(wb, filename){
  try{
    const wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
    const blob = new Blob([wbout], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    if(isMobile()){
      const file = new File([blob], filename, {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      if(navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
        navigator.share({files:[file], title:filename, text:'ETS Stock Report'})
          .catch(()=>blobDownload(blob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'));
      } else {
        blobDownload(blob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }
    } else {
      XLSX.writeFile(wb, filename);
    }
  } catch(e){
    console.error(e);
    try{XLSX.writeFile(wb, filename);}catch(e2){alert('Excel ready: '+filename);}
  }
}

function blobDownload(blob, filename, type){
  try{
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download=filename; a.target='_blank'; a.style.display='none';
    document.body.appendChild(a);a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},2000);
  } catch(e){
    console.error(e);alert('File ready: '+filename+'. Please try again.');
  }
}