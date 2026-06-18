import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatPatientAddress } from "./curasana-api";

const TEAL=[13,148,136],TEAL_DARK=[15,118,110],TEAL_LIGHT=[204,251,241];
const DARK=[15,23,42],GRAY=[100,116,139],LIGHT_GRAY=[241,245,249],WHITE=[255,255,255];
const GREEN=[22,163,74],AMBER=[217,119,6],RED=[220,38,38];
const MARGIN=15,PAGE_W=210,CONTENT_W=PAGE_W-MARGIN*2;

async function loadLogo(){
  try{
    const r=await fetch("/logo.png");
    if(!r.ok)throw new Error("no logo");
    const blob=await r.blob();
    return new Promise((res)=>{const rd=new FileReader();rd.onloadend=()=>res(rd.result);rd.readAsDataURL(blob);});
  }catch{return null;}
}

function fmt(d){if(!d)return"--";const dt=new Date(d);if(isNaN(dt))return String(d);return dt.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});}
function sevLabel(s){if(typeof s==="string")return s.charAt(0).toUpperCase()+s.slice(1);if(typeof s==="number"){if(s<=3)return"Mild";if(s<=6)return"Moderate";return"Severe";}return"--";}
function scoreInfo(sc){
  if(sc>=80)return{label:"Excellent",color:GREEN,desc:"Your overall health indicators are in great shape. Continue your current health routine and maintain regular check-ups."};
  if(sc>=60)return{label:"Good",color:TEAL,desc:"Your health profile is solid with some areas to monitor. Stay consistent with your care plan and follow up on flagged items."};
  if(sc>=40)return{label:"Fair",color:AMBER,desc:"Some health metrics need attention. We recommend consulting your healthcare provider to discuss the highlighted concerns."};
  return{label:"Needs Attention",color:RED,desc:"Several indicators require prompt follow-up. Please schedule an appointment with your doctor at your earliest convenience."};
}
function calcBMI(h,w){if(!h||!w||h<=0||w<=0)return null;const m=h/100,v=w/(m*m);let c="Normal";if(v<18.5)c="Underweight";else if(v<25)c="Normal";else if(v<30)c="Overweight";else c="Obese";return{value:v.toFixed(1),category:c};}
function pgBreak(doc,y,n=40){if(y+n>270){doc.addPage();drawHeader(doc,doc._curasanaLogo);return 38;}return y;}

function drawHeader(doc,logo){
  doc.setFillColor(...TEAL);doc.rect(0,0,PAGE_W,28,"F");
  doc.setFillColor(...TEAL_DARK);doc.rect(0,26,PAGE_W,2,"F");
  if(logo){try{doc.addImage(logo,"PNG",MARGIN+1,4,18,18);}catch{drawFallbackLogo(doc);}}
  else{drawFallbackLogo(doc);}
  const lx=MARGIN+23;
  doc.setTextColor(...WHITE);doc.setFont("helvetica","bold");doc.setFontSize(14);doc.text("CURASANA",lx,13);
  doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(204,251,241);doc.text("HEALTH PLATFORM",lx,18);
  doc.setFontSize(5.5);doc.text("www.curasana.ca",lx,22.5);
}

function drawFallbackLogo(doc){
  doc.setFillColor(255,255,255);doc.roundedRect(MARGIN+1,4,18,18,4,4,"F");
  doc.setTextColor(...TEAL);doc.setFont("helvetica","bold");doc.setFontSize(14);doc.text("C",MARGIN+7,16);
}

function secHead(doc,y,title,sub){
  y=pgBreak(doc,y,22);
  doc.setFillColor(...TEAL);doc.roundedRect(MARGIN,y,4,14,1.5,1.5,"F");
  doc.setTextColor(...DARK);doc.setFont("helvetica","bold");doc.setFontSize(12);doc.text(title,MARGIN+9,y+6);
  if(sub){doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(...GRAY);doc.text(sub,MARGIN+9,y+12);}
  return y+19;
}

function card(doc,x,y,w,h,col){doc.setFillColor(...col);doc.roundedRect(x,y,w,h,3,3,"F");}

function addWatermark(doc){
  const pages=doc.internal.getNumberOfPages();
  for(let i=1;i<=pages;i++){
    doc.setPage(i);doc.saveGraphicsState();
    doc.setGState(new doc.GState({opacity:0.03}));
    doc.setTextColor(...TEAL);doc.setFont("helvetica","bold");doc.setFontSize(72);
    doc.text("CURASANA",PAGE_W/2,160,{align:"center",angle:35});
    doc.restoreGraphicsState();
  }
}

function addFooters(doc,ts){
  const pages=doc.internal.getNumberOfPages();
  const fmtTs=fmt(ts)+" "+new Date(ts).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"});
  for(let i=1;i<=pages;i++){
    doc.setPage(i);
    doc.setFillColor(...TEAL);doc.rect(MARGIN,285,CONTENT_W,0.6,"F");
    doc.setTextColor(...GRAY);doc.setFont("helvetica","normal");doc.setFontSize(6);
    doc.text("Curasana Health Platform  |  Confidential Medical Document  |  Generated "+fmtTs,MARGIN,290);
    doc.text("Page "+i+" of "+pages,PAGE_W-MARGIN,290,{align:"right"});
  }
}

function drawScoreRing(doc,cx,cy,r,score){
  const startAngle=-90;const endAngle=startAngle+(score/100)*360;
  doc.setDrawColor(220,220,220);doc.setLineWidth(2.5);doc.circle(cx,cy,r,"S");
  const si=scoreInfo(score);doc.setDrawColor(...si.color);doc.setLineWidth(2.5);
  for(let a=startAngle;a<endAngle;a+=2){
    const r1=a*Math.PI/180,r2=(a+2)*Math.PI/180;
    doc.line(cx+r*Math.cos(r1),cy+r*Math.sin(r1),cx+r*Math.cos(r2),cy+r*Math.sin(r2));
  }
  doc.setTextColor(...DARK);doc.setFont("helvetica","bold");doc.setFontSize(18);doc.text(String(score),cx,cy+2,{align:"center"});
  doc.setFontSize(7);doc.setFont("helvetica","normal");doc.setTextColor(...GRAY);doc.text("out of 100",cx,cy+7,{align:"center"});
}

export async function generateHealthReportPdf(data){
  const{report,health_score,symptoms=[],medications=[],patient={}}=data;
  const doc=new jsPDF({unit:"mm",format:"a4"});
  const genAt=report?.generated_at||new Date().toISOString();
  const rid=String(report?.id||"").slice(0,8).toUpperCase()||"N/A";
  const logo=await loadLogo();
  doc._curasanaLogo=logo;

  drawHeader(doc,logo);
  doc.setFillColor(...TEAL_DARK);doc.roundedRect(PAGE_W-MARGIN-28,6,27,9,3,3,"F");
  doc.setTextColor(...WHITE);doc.setFont("helvetica","bold");doc.setFontSize(6.5);
  doc.text("Report #"+rid,PAGE_W-MARGIN-14.5,12,{align:"center"});

  let y=38;

  card(doc,MARGIN,y,CONTENT_W,22,LIGHT_GRAY);
  doc.setDrawColor(...TEAL);doc.setLineWidth(0.5);doc.roundedRect(MARGIN,y,CONTENT_W,22,3,3,"S");
  doc.setTextColor(...DARK);doc.setFont("helvetica","bold");doc.setFontSize(16);
  doc.text(report?.title||"Health Report",MARGIN+6,y+9);
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(...GRAY);
  doc.text(fmt(report?.date_range_start)+"  to  "+fmt(report?.date_range_end),MARGIN+6,y+15);
  doc.setFontSize(7);doc.text("Generated "+fmt(genAt),MARGIN+6,y+20);
  if(report?.recipient){
    doc.setFillColor(...TEAL_LIGHT);doc.roundedRect(PAGE_W-MARGIN-55,y+3,53,16,2,2,"F");
    doc.setTextColor(...TEAL_DARK);doc.setFont("helvetica","bold");doc.setFontSize(6);
    doc.text("PREPARED FOR",PAGE_W-MARGIN-28.5,y+8,{align:"center"});
    doc.setFont("helvetica","normal");doc.setFontSize(7.5);
    doc.text(report.recipient,PAGE_W-MARGIN-28.5,y+14,{align:"center"});
  }
  y+=28;

  y=secHead(doc,y,"PATIENT INFORMATION","Demographics & biometric data");
  const bmi=calcBMI(patient.height_cm,patient.weight_kg);
  const pFields=[
    ["Full Name",[patient.first_name,patient.last_name].filter(Boolean).join(" ")||"--"],
    ["Email",patient.email||patient.users?.email||"--"],
    ["Date of Birth",patient.date_of_birth?fmt(patient.date_of_birth):"--"],
    ["Blood Type",patient.blood_type||"--"],
    ["Height",patient.height_cm?patient.height_cm+" cm":"--"],
    ["Weight",patient.weight_kg?patient.weight_kg+" kg":"--"],
    ["Location",formatPatientAddress(patient.location)],
    ["BMI",bmi?bmi.value+" ("+bmi.category+")":"--"],
  ];
  const cW=CONTENT_W/4,cH=15;
  card(doc,MARGIN,y,CONTENT_W,cH*2+2,LIGHT_GRAY);
  doc.setDrawColor(220,225,230);doc.setLineWidth(0.2);
  doc.line(MARGIN,y+cH,MARGIN+CONTENT_W,y+cH);
  for(let c=1;c<4;c++)doc.line(MARGIN+c*cW,y,MARGIN+c*cW,y+cH*2+2);
  pFields.forEach((f,i)=>{
    const col=i%4,row=Math.floor(i/4),fx=MARGIN+4+col*cW,fy=y+4+row*cH;
    doc.setTextColor(140,150,160);doc.setFont("helvetica","normal");doc.setFontSize(6);doc.text(f[0].toUpperCase(),fx,fy);
    doc.setTextColor(...DARK);doc.setFont("helvetica","bold");doc.setFontSize(8.5);doc.text(String(f[1]),fx,fy+6);
  });
  y+=cH*2+8;

  y=pgBreak(doc,y,45);y=secHead(doc,y,"HEALTH SCORE","Overall wellness assessment for this period");
  const sc=health_score?.score??75;const si=scoreInfo(sc);
  card(doc,MARGIN,y,CONTENT_W,36,TEAL_LIGHT);
  doc.setDrawColor(...TEAL);doc.setLineWidth(0.3);doc.roundedRect(MARGIN,y,CONTENT_W,36,3,3,"S");
  drawScoreRing(doc,MARGIN+25,y+18,12,sc);
  doc.setFillColor(...si.color);doc.roundedRect(MARGIN+42,y+8,24,9,3,3,"F");
  doc.setTextColor(...WHITE);doc.setFont("helvetica","bold");doc.setFontSize(8);doc.text(si.label,MARGIN+54,y+14,{align:"center"});
  doc.setTextColor(...TEAL_DARK);doc.setFont("helvetica","normal");doc.setFontSize(8);
  doc.text(doc.splitTextToSize(si.desc,CONTENT_W-78),MARGIN+70,y+10);
  y+=42;

  y=pgBreak(doc,y,24);
  const sw=(CONTENT_W-8)/3;
  const pDays=(()=>{if(!report?.date_range_start||!report?.date_range_end)return"--";return Math.ceil((new Date(report.date_range_end)-new Date(report.date_range_start))/86400000)+" days";})();
  [{l:"Symptoms Logged",v:String(symptoms.length),c:TEAL},{l:"Active Medications",v:String(medications.filter(m=>m.status==="active"||m.active).length||medications.length),c:GREEN},{l:"Report Period",v:pDays,c:AMBER}].forEach((s,i)=>{
    const sx=MARGIN+i*(sw+4);
    card(doc,sx,y,sw,20,WHITE);
    doc.setDrawColor(...s.c);doc.setLineWidth(0.4);doc.roundedRect(sx,y,sw,20,2,2,"S");
    doc.setFillColor(...s.c);doc.roundedRect(sx,y,sw,3,2,0,"F");
    doc.setTextColor(...DARK);doc.setFont("helvetica","bold");doc.setFontSize(14);doc.text(s.v,sx+sw/2,y+12,{align:"center"});
    doc.setFont("helvetica","normal");doc.setFontSize(6);doc.setTextColor(...GRAY);doc.text(s.l,sx+sw/2,y+17.5,{align:"center"});
  });
  y+=26;

  if((report?.sections||[]).includes("symptoms")){
    y=pgBreak(doc,y,30);y=secHead(doc,y,"SYMPTOMS & PAIN LOG",symptoms.length+" entries recorded during this period");
    if(symptoms.length===0){
      card(doc,MARGIN,y,CONTENT_W,14,LIGHT_GRAY);
      doc.setTextColor(...GRAY);doc.setFont("helvetica","italic");doc.setFontSize(8);
      doc.text("No symptoms logged during this period.",MARGIN+CONTENT_W/2,y+8.5,{align:"center"});y+=20;
    }else{
      autoTable(doc,{
        startY:y,margin:{left:MARGIN,right:MARGIN},
        head:[["Date","Symptom","Severity","Pain Scale","Notes"]],
        body:symptoms.map(s=>[fmt(s.logged_at||s.date),s.name||s.event_title||"--",sevLabel(s.severity),typeof s.pain_scale==="number"?s.pain_scale+"/10":"--",s.notes||"--"]),
        headStyles:{fillColor:TEAL,textColor:WHITE,fontSize:7.5,fontStyle:"bold",cellPadding:3.5,lineWidth:0},
        bodyStyles:{fontSize:7,textColor:DARK,cellPadding:3,lineColor:[230,230,230],lineWidth:0.2},
        alternateRowStyles:{fillColor:[248,250,252]},
        columnStyles:{0:{cellWidth:28},1:{fontStyle:"bold"},2:{cellWidth:22},3:{cellWidth:22}},
        didParseCell:(d)=>{if(d.section==="body"&&d.column.index===2){const v=d.cell.raw;if(v==="Mild")d.cell.styles.textColor=GREEN;else if(v==="Severe")d.cell.styles.textColor=RED;else if(v==="Moderate")d.cell.styles.textColor=AMBER;}},
      });
      y=doc.lastAutoTable.finalY+10;
    }
  }

  if((report?.sections||[]).includes("medications")){
    y=pgBreak(doc,y,30);y=secHead(doc,y,"MEDICATIONS",medications.length+" prescriptions on file");
    if(medications.length===0){
      card(doc,MARGIN,y,CONTENT_W,14,LIGHT_GRAY);
      doc.setTextColor(...GRAY);doc.setFont("helvetica","italic");doc.setFontSize(8);
      doc.text("No medications recorded.",MARGIN+CONTENT_W/2,y+8.5,{align:"center"});y+=20;
    }else{
      autoTable(doc,{
        startY:y,margin:{left:MARGIN,right:MARGIN},
        head:[["Medication","Dosage","Frequency","Prescribed By","Status"]],
        body:medications.map(m=>[m.name||m.medication_name||"--",m.dosage||m.dose||"--",m.frequency||"--",m.prescribed_by||"--",m.active!==false&&m.status!=="inactive"?"Active":"Inactive"]),
        headStyles:{fillColor:TEAL,textColor:WHITE,fontSize:7.5,fontStyle:"bold",cellPadding:3.5,lineWidth:0},
        bodyStyles:{fontSize:7,textColor:DARK,cellPadding:3,lineColor:[230,230,230],lineWidth:0.2},
        alternateRowStyles:{fillColor:[248,250,252]},
        columnStyles:{0:{fontStyle:"bold"}},
        didParseCell:(d)=>{if(d.section==="body"&&d.column.index===4){d.cell.styles.textColor=d.cell.raw==="Active"?GREEN:GRAY;d.cell.styles.fontStyle="bold";}},
      });
      y=doc.lastAutoTable.finalY+10;
    }
  }

  y=pgBreak(doc,y,40);y=secHead(doc,y,"KEY FINDINGS & INSIGHTS","Automated analysis of your health data");
  const ins=[];
  if(symptoms.length>0){
    const fr={};symptoms.forEach(s=>{const n=s.name||s.event_title||"Unknown";fr[n]=(fr[n]||0)+1;});
    const top=Object.entries(fr).sort((a,b)=>b[1]-a[1])[0];
    if(top)ins.push("Most reported symptom: "+top[0]+" ("+top[1]+" occurrence"+(top[1]>1?"s":"")+")");
    const sevs=symptoms.map(s=>typeof s.pain_scale==="number"?s.pain_scale:typeof s.severity==="number"?s.severity:null).filter(v=>v!==null);
    if(sevs.length>0)ins.push("Average pain/severity level: "+(sevs.reduce((a,b)=>a+b,0)/sevs.length).toFixed(1)+"/10");
  }else{ins.push("No symptoms logged during this reporting period -- excellent!");}
  const actM=medications.filter(m=>m.active!==false&&m.status!=="inactive");
  if(medications.length>0)ins.push(actM.length+" active medication"+(actM.length!==1?"s":"")+" on current plan");
  else ins.push("No medications currently on record.");
  if(bmi)ins.push("BMI: "+bmi.value+" -- classified as \""+bmi.category+"\"");
  ins.push("Report covers "+pDays+" of health data.");

  ins.forEach(txt=>{
    y=pgBreak(doc,y,12);
    card(doc,MARGIN,y,CONTENT_W,10,LIGHT_GRAY);
    doc.setDrawColor(220,225,230);doc.setLineWidth(0.2);doc.roundedRect(MARGIN,y,CONTENT_W,10,2,2,"S");
    doc.setFillColor(...TEAL);doc.circle(MARGIN+6,y+5,2,"F");
    doc.setTextColor(...DARK);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text(txt,MARGIN+12,y+6.5);
    y+=13;
  });
  y+=4;

  y=pgBreak(doc,y,28);
  doc.setFillColor(250,250,250);doc.roundedRect(MARGIN,y,CONTENT_W,24,2,2,"F");
  doc.setDrawColor(200,200,200);doc.setLineWidth(0.3);doc.roundedRect(MARGIN,y,CONTENT_W,24,2,2,"S");
  doc.setFillColor(...TEAL);doc.circle(MARGIN+7,y+6,3,"F");
  doc.setTextColor(...TEAL_DARK);doc.setFont("helvetica","bold");doc.setFontSize(7);doc.text("CONFIDENTIALITY NOTICE",MARGIN+14,y+7);
  doc.setTextColor(140,140,140);doc.setFont("helvetica","normal");doc.setFontSize(6);
  doc.text(doc.splitTextToSize("This document contains protected health information (PHI) intended solely for the individual(s) named above. Unauthorized disclosure is prohibited under applicable privacy legislation.",CONTENT_W-10),MARGIN+5,y+12);
  doc.text(doc.splitTextToSize("This report was automatically generated by Curasana Health Platform for informational purposes only. It does not constitute medical advice. Please consult a qualified healthcare provider.",CONTENT_W-10),MARGIN+5,y+19);

  addWatermark(doc);
  addFooters(doc,genAt);
  doc.save("Curasana-Health-Report-"+rid+".pdf");
  return "Curasana-Health-Report-"+rid+".pdf";
}