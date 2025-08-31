const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const DONOR_STORAGE_KEY = "donors";
const PATIENT_STORAGE_KEY = "patients";

/* --- LocalStorage helpers --- */
function getDonors() { return JSON.parse(localStorage.getItem(DONOR_STORAGE_KEY)) || []; }
function setDonors(d) { localStorage.setItem(DONOR_STORAGE_KEY, JSON.stringify(d)); }
function getPatients() { return JSON.parse(localStorage.getItem(PATIENT_STORAGE_KEY)) || []; }
function setPatients(p) { localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(p)); }

/* --- Toast --- */
function showToast(msg, type="success") {
  const container=document.getElementById("toast-container"); if(!container) return;
  const el=document.createElement("div");
  el.className="toast"+(type==="error"?" error":type==="warn"?" warn":"");
  el.textContent=msg;
  container.appendChild(el);
  setTimeout(()=>{ el.style.opacity="0"; el.style.transform="translateY(-6px)"; setTimeout(()=>el.remove(),300); },1600);
}

/* --- Dashboard --- */
function renderDashboard(){
  const donors=getDonors();
  const patients=getPatients();
  const counts={}; BLOOD_GROUPS.forEach(g=>counts[g]=0);
  donors.forEach(d=>{ const u=Number(d.units)||0; if(counts.hasOwnProperty(d.bloodGroup)) counts[d.bloodGroup]+=u; });
  patients.forEach(p=>{ const u=Number(p.units)||0; if(counts.hasOwnProperty(p.bloodGroup)) counts[p.bloodGroup]-=u; });
  BLOOD_GROUPS.forEach(g=>{ const el=document.getElementById(g); if(el){ const span=el.querySelector("span"); if(span) span.textContent=Math.max(0,counts[g]); }});
  const totalUnitsEl=document.getElementById("total-units"), totalDonorsEl=document.getElementById("total-donors"), totalPatientsEl=document.getElementById("total-patients"), mostGroupEl=document.getElementById("most-group");
  const totalUnits=Object.values(counts).reduce((a,b)=>a+b,0);
  if(totalUnitsEl) totalUnitsEl.textContent=Math.max(0,totalUnits);
  if(totalDonorsEl) totalDonorsEl.textContent=donors.length;
  if(totalPatientsEl) totalPatientsEl.textContent=patients.length;
  if(mostGroupEl){ const max=Math.max(...Object.values(counts)); mostGroupEl.textContent=max>0? `${BLOOD_GROUPS.find(g=>counts[g]===max)} (${max})`:"—"; }
}

/* --- Add Donor --- */
function initAddDonor(){
  const form=document.getElementById("addDonorForm"); if(!form) return;
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const name=(document.getElementById("name").value||"").trim();
    const bloodGroup=(document.getElementById("bloodGroup").value||"").trim();
    const units=parseInt(document.getElementById("units").value,10);
    const contact=(document.getElementById("contact").value||"").trim();
    if(!name){ showToast("Name cannot be empty.","error"); return; }
    if(!bloodGroup){ showToast("Select blood group.","error"); return; }
    if(isNaN(units)||units<=0){ showToast("Units must be positive.","error"); return; }
    const donors=getDonors();
    donors.push({id:Date.now(),name,bloodGroup,units,contact});
    setDonors(donors);
    form.reset(); showToast("Donor added successfully!"); renderDashboard();
  });
}

/* --- Add Patient --- */
function initAddPatient(){
  const form=document.getElementById("addPatientForm"); if(!form) return;
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const name=(document.getElementById("pname").value||"").trim();
    const bloodGroup=(document.getElementById("pbloodGroup").value||"").trim();
    const units=parseInt(document.getElementById("punits").value,10);
    const contact=(document.getElementById("pcontact").value||"").trim();
    const hospital=(document.getElementById("hospital").value||"").trim();
    if(!name){ showToast("Patient name cannot be empty.","error"); return; }
    if(!bloodGroup){ showToast("Select blood group.","error"); return; }
    if(isNaN(units)||units<=0){ showToast("Units must be positive.","error"); return; }
    if(!hospital){ showToast("Hospital cannot be empty.","error"); return; }
    const patients=getPatients();
    patients.push({id:Date.now(),name,bloodGroup,units,contact,hospital});
    setPatients(patients);
    form.reset(); showToast("Patient added successfully!");
    document.getElementById("addPatientForm").style.display="none";
    document.getElementById("checkAvailabilityForm").style.display="block";
    renderDashboard();
  });
}

/* --- Check Availability for Patient --- */
function initCheckAvailability(){
  const checkForm=document.getElementById("checkAvailabilityForm");
  if(!checkForm) return;
  checkForm.addEventListener("submit",e=>{
    e.preventDefault();
    const bloodGroup=document.getElementById("reqBloodGroup").value;
    const units=parseInt(document.getElementById("reqUnits").value,10);
    if(!bloodGroup){ showToast("Select blood group.","error"); return; }
    if(isNaN(units)||units<=0){ showToast("Units must be positive.","error"); return; }
    const donors=getDonors();
    const patients=getPatients();
    let available=0;
    donors.forEach(d=>{ if(d.bloodGroup===bloodGroup) available+=Number(d.units); });
    patients.forEach(p=>{ if(p.bloodGroup===bloodGroup) available-=Number(p.units); });
    if(available>=units){
      showToast(`Blood available!`, "success");
      document.getElementById("checkAvailabilityForm").style.display="none";
      const f=document.getElementById("addPatientForm");
      f.style.display="block";
      document.getElementById("pbloodGroup").value=bloodGroup;
      document.getElementById("punits").value=units;
    } else {
      showToast("Required blood not available.", "success");
    }
  });
}

/* --- View Donors Table --- */
function renderDonorTable(){
  const tbody=document.querySelector("#donorTable tbody"); if(!tbody) return;
  const donors=getDonors();
  const q=(document.getElementById("searchInput")?.value||"").trim().toLowerCase();
  const filtered=q? donors.filter(d=>d.name.toLowerCase().includes(q)||d.bloodGroup.toLowerCase().includes(q)): donors.slice();
  tbody.innerHTML="";
  filtered.forEach(d=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${d.name}</td><td>${d.bloodGroup}</td><td>${d.units}</td><td>${d.contact||""}</td>
      <td><button class="remove-btn" onclick="removeDonor(${d.id})">Remove</button></td>`;
    tbody.appendChild(tr);
  });
}

/* --- Remove Donor --- */
function removeDonor(id){
  if(!confirm("Are you sure to remove donor?")) return;
  const donors=getDonors().filter(d=>d.id!==id);
  setDonors(donors); renderDonorTable(); renderDashboard(); showToast("Donor removed.","warn");
}

/* --- View Patients Table --- */
function renderPatientTable(){
  const tbody=document.querySelector("#patientTable tbody"); if(!tbody) return;
  const patients=getPatients();
  const q=(document.getElementById("searchPatientInput")?.value||"").trim().toLowerCase();
  const filtered=q? patients.filter(p=>p.name.toLowerCase().includes(q)||p.bloodGroup.toLowerCase().includes(q)): patients.slice();
  tbody.innerHTML="";
  filtered.forEach(p=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${p.name}</td><td>${p.bloodGroup}</td><td>${p.units}</td><td>${p.contact||""}</td><td>${p.hospital}</td>`;
    tbody.appendChild(tr);
  });
}

/* --- Init All --- */
document.addEventListener("DOMContentLoaded",()=>{
  renderDashboard();
  initAddDonor();
  initAddPatient();
  initCheckAvailability();
  renderDonorTable();
  renderPatientTable();
  document.getElementById("searchInput")?.addEventListener("input", renderDonorTable);
  document.getElementById("searchPatientInput")?.addEventListener("input", renderPatientTable);
});
