/* Excel export retains the user's original artwork, layout and page settings. */
(function (global) {
  'use strict';
  const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const MODES = {
    bakery: {fixed: [9, 23], variable: [27, 37], metrics: [41, 42, 43, 44], conclusions: 46, steps: 47},
    patisserie: {fixed: [9, 22], variable: [26, 43], metrics: [45, 46, 47, 48], conclusions: 50, steps: 51},
    ta: {variable: [10, 21], metrics: [32, 33, 34, 35], conclusions: 37, steps: 38},
  };
  const expColumns = ['C', 'E', 'G', 'I', 'K', 'M'];
  const pctColumns = ['D', 'F', 'H', 'J', 'L', 'N'];
  const text = value => value == null ? '' : String(value).trim();
  const grams = value => value === '' || value == null ? null : Number(value);
  const date = value => /^\d{4}-\d\d-\d\d$/.test(text(value)) ? text(value).split('-').reverse().join('.') : text(value);
  const unique = list => Array.from(new Set(list.map(x => text(x.name)).filter(Boolean)));
  const match = (list, name) => (list || []).filter(x => text(x.name) === name);
  const amount = (list, name) => match(list, name).reduce((total, ing) => total + (grams(ing.gram) || 0), 0);
  const nonempty = (list, name) => match(list, name).some(ing => grams(ing.gram) !== null);
  const putAmounts = (cell, list, name, col, row) => {
    if (nonempty(list,name)) cell(`${col}${row}`, amount(list,name));
  };
  function mappings(report, mode) {
    const layout = MODES[mode];
    if (!layout) throw new Error('תבנית Excel אינה מוכרת');
    const fixed = (report.fixedIngredients || []).filter(x => text(x.name));
    const varies = report.variableIngredients || {};
    const names = unique(Object.values(varies).flat());
    const cells = [];
    const put = (ref,value) => {
      if (value === '' || value === null || value === undefined) return;
      if(String(value).length>32767) throw new Error(`הטקסט בתא ${ref} ארוך ממגבלת Excel. יש לקצר אותו לפני הייצוא.`);
      cells.push({ref,value});
    };
    const formula = (ref,expression,cached) => cells.push({ref,formula:expression,cached});
    put('B3', 'שם המאשר: ' + text(report.approver));
    put('E3', 'תאריך עדכון: ' + text(report.updateDate));
    put('B4', 'שם הפרויקט: ' + text(report.projectName));
    put('B5', 'מטרת הניסוי: ' + text(report.expPurpose));
    put('B6', (mode==='ta' ? 'שם מבצע וחתימה: ' : 'שם החוקר/ת: ') + text(report.researcher));
    put('I6', 'תאריך ביצוע: ' + date(report.execDate));
    put(`C${layout.conclusions}`,report.conclusions);
    put(`C${layout.steps}`,report.nextSteps);
    const c = report.fixedConditions || {};
    const conditions = report.variableConditions || {};
    const metrics = report.processMetrics || {};
    const display = (key,source) => {
      const entries=expColumns.map((_,i) => text((source[i+1] || {})[key])).map((value,i)=>value?`נ${i+1}: ${value}`:'').filter(Boolean);
      return entries.length ? entries.join('; ') : '';
    };
    if (mode === 'bakery') {
      for(const [ref,val] of Object.entries({J9:c.kneadTimeEst,J10:c.doughTemp,J11:c.bulkFerment,J13:c.moulder,J16:display('fermentTemp',conditions),J17:display('fermentHumidity',conditions),J20:c.ovenType,J21:c.bakingProgram,J22:c.steam})) put(ref,val);
    } else if (mode === 'patisserie') {
      // Bakery's kneading time, dough weight and temperature are not equivalent to patisserie-specific fields.
      put('J14',c.ovenType); put('J15',c.bakingProgram);
    } else {
      for(const [ref,val] of Object.entries({F24:c.kneadTimeEst,F25:c.bulkFerment,F26:c.doughWeight,F28:c.moulder,M24:display('fermentTemp',conditions),M25:display('fermentHumidity',conditions),M29:c.steam})) put(ref,val);
    }
    if (mode !== 'ta') {
      const fixedNames=unique(fixed);
      const fixedSlots=layout.fixed[1]-layout.fixed[0]+1;
      if(fixedNames.length > fixedSlots) throw new Error(`בתבנית ${mode} יש מקום ל־${fixedSlots} חומרי גלם קבועים, אך בדוח יש ${fixedNames.length}. אין לייצא חלק מהחומרים.`);
      const fixedFlourRefs=[];
      for(const [i,name] of fixedNames.entries()) {
        const row=layout.fixed[0]+i;
        put(`B${row}`,name);
        putAmounts(put,fixed,name,'E',row);
        if(match(fixed,name).some(x=>x.isFlour)) fixedFlourRefs.push(`$E$${row}`);
      }
      const fixedFlour = fixed.filter(x=>x.isFlour).reduce((n,x)=>n+(grams(x.gram)||0),0);
      if(fixedFlour>0) fixedNames.forEach((name,i)=>{
        const row=layout.fixed[0]+i;
        if(nonempty(fixed,name)) formula(`F${row}`,`IFERROR(E${row}/SUM(${fixedFlourRefs.join(',')})*100,0)`,amount(fixed,name)/fixedFlour*100);
      });
      // Bakery reserves the final two recipe rows for yeast and water.
      const reserved=mode==='bakery' ? {'שמרים':38,'מים':39} : {};
      const general=names.filter(name=>!Object.prototype.hasOwnProperty.call(reserved,name));
      const capacity=layout.variable[1]-layout.variable[0]+1;
      if(general.length > capacity) throw new Error(`בתבנית ${mode} יש מקום ל־${capacity} חומרי גלם משתנים נוספים, אך בדוח יש ${general.length}. אין לייצא חלק מהחומרים.`);
      const rowFor=Object.fromEntries(general.map((name,i)=>[name,layout.variable[0]+i]));
      Object.assign(rowFor,reserved);
      for(const name of general) put(`B${rowFor[name]}`,name);
      for(let i=1;i<=6;i++) {
        const col=expColumns[i-1], pctCol=pctColumns[i-1];
        const list=varies[i]||[];
        const flourRows=names.filter(name=>match(list,name).some(x=>x.isFlour)).map(name=>`${col}${rowFor[name]}`);
        const denominator=[...fixedFlourRefs,...flourRows];
        const flourTotal=fixedFlour+list.filter(x=>x.isFlour).reduce((n,x)=>n+(grams(x.gram)||0),0);
        for(const name of names){
          const row=rowFor[name];
          if(row===undefined) continue;
          putAmounts(put,list,name,col,row);
          if(flourTotal>0 && nonempty(list,name)) formula(`${pctCol}${row}`,`IFERROR(${col}${row}/SUM(${denominator.join(',')})*100,0)`,amount(list,name)/flourTotal*100);
        }
      }
    } else {
      // TA has one consolidated ingredient list: fixed grams repeat across experiments.
      const combinedNames=Array.from(new Set([...unique(fixed),...names]));
      const capacity=layout.variable[1]-layout.variable[0]+1;
      if(combinedNames.length>capacity) throw new Error(`בתבנית TA יש מקום ל־${capacity} חומרי גלם, אך בדוח יש ${combinedNames.length}. אין לייצא חלק מהחומרים.`);
      const rowFor=Object.fromEntries(combinedNames.map((name,i)=>[name,layout.variable[0]+i]));
      combinedNames.forEach(name=>put(`B${rowFor[name]}`,name));
      for(let i=1;i<=6;i++) {
        const list=varies[i]||[];
        const col=expColumns[i-1],pctCol=pctColumns[i-1];
        const flourNames=combinedNames.filter(name=>[...match(fixed,name),...match(list,name)].some(x=>x.isFlour));
        const flourRefs=flourNames.map(name=>`${col}${rowFor[name]}`);
        const flourTotal=flourNames.reduce((n,name)=>n+amount(fixed,name)+amount(list,name),0);
        for(const name of combinedNames){
          const row=rowFor[name];
          if(nonempty(fixed,name)||nonempty(list,name)) {
            const value=amount(fixed,name)+amount(list,name);
            put(`${col}${row}`,value);
            if(flourTotal>0) formula(`${pctCol}${row}`,`IFERROR(${col}${row}/SUM(${flourRefs.join(',')})*100,0)`,value/flourTotal*100);
          }
        }
      }
    }
    for(let i=1;i<=6;i++){
      const col=expColumns[i-1];
      const m=metrics[i]||{}, v=conditions[i]||{};
      const rowValues=mode==='patisserie'
        ? ['', '', m.doughTexture,'']
        : [m.actualDoughTemp,m.doughTexture,m.actualFermentTime || v.finalFermentTime,m.volumeStability];
      layout.metrics.forEach((row,j)=>put(`${col}${row}`,rowValues[j]));
    }
    // Unmatched fields remain accessible outside the original printable B:N template.
    const extras=[
      ['שיוך לדוח קודם',report.linkedReportId],['תגיות',report.tags],
      ['משקל יחידת בצק',c.doughWeight],['זמן לישה משוער',c.kneadTimeEst],
      ["טמפ' בצק רצויה",c.doughTemp],['תפיחה ב-Bulk',c.bulkFerment],
      ['נתוני מולדר',c.moulder],['סוג תנור',c.ovenType],['תוכנית אפייה',c.bakingProgram],['קיטור',c.steam],
      ['מספר תמונות מצורפות בדוח המקורי (לא מוטמעות בקובץ Excel)',(report.photos||[]).length || ''],
    ];
    for(let i=1;i<=6;i++){
      const v=conditions[i]||{},m=metrics[i]||{};
      for(const [name,value] of Object.entries({...v,...m})) {
        if(name!=='bakingAnnex') extras.push([`ניסוי ${i}: ${name}`,value]);
      }
      for(const ing of fixed){
        if(ing.weighedByExperiment) extras.push([`ניסוי ${i}: ${text(ing.name)} (חומר קבוע) נשקל`,ing.weighedByExperiment[i]?'כן':'לא']);
      }
      for(const ing of varies[i]||[]){
        if(text(ing.name) && typeof ing.weighed==='boolean') extras.push([`ניסוי ${i}: ${text(ing.name)} (חומר משתנה) נשקל`,ing.weighed?'כן':'לא']);
      }
      for(const [rowIndex,row] of (v.bakingAnnex?.rows||[]).entries()){
        const detail=[text(row.ingredient),text(row.quantity),text(row.unit),text(row.notes)].filter(Boolean).join(' | ');
        if(detail)extras.push([`ניסוי ${i}: נספח הרכב שורה ${rowIndex+1}`,detail]);
      }
    }
    put('P2','פרטים נוספים מהדוח (מחוץ לאזור ההדפסה)');
    let next=3;
    for(const [key,value] of extras) if(text(value)){ put(`P${next}`,key);put(`Q${next}`,value);next++; }
    return cells;
  }
  async function build(template, report, mode) {
    const patches=mappings(report,mode); // Reject capacity overflow before touching the file.
    const zip=await global.JSZip.loadAsync(template);
    const file=zip.file('xl/worksheets/sheet1.xml');
    if(!file) throw new Error('לא נמצא גיליון בתבנית');
    const xml=await file.async('text');
    const doc=new DOMParser().parseFromString(xml,'application/xml');
    if(doc.getElementsByTagName('parsererror').length) throw new Error('תבנית Excel אינה תקינה');
    const rows=new Map(Array.from(doc.getElementsByTagNameNS(NS,'row')).map(row=>[Number(row.getAttribute('r')),row]));
    const cells=new Map(Array.from(doc.getElementsByTagNameNS(NS,'c')).map(cell=>[cell.getAttribute('r'),cell]));
    const columnNumber=ref=>ref.match(/^[A-Z]+/)[0].split('').reduce((n,letter)=>n*26+letter.charCodeAt(0)-64,0);
    const sheetData=doc.getElementsByTagNameNS(NS,'sheetData')[0];
    const originalDimension=doc.getElementsByTagNameNS(NS,'dimension')[0];
    let maxRow=0,maxColumn=0;
    for(const patch of patches){
      let c=cells.get(patch.ref);
      if(!c){
        const rowIndex=Number(patch.ref.match(/\d+$/)[0]);
        let row=rows.get(rowIndex);
        if(!row){
          row=doc.createElementNS(NS,'row');row.setAttribute('r',String(rowIndex));
          const nextRow=Array.from(sheetData.children).find(item=>item.localName==='row' && Number(item.getAttribute('r'))>rowIndex);
          sheetData.insertBefore(row,nextRow||null);rows.set(rowIndex,row);
        }
        c=doc.createElementNS(NS,'c'); c.setAttribute('r',patch.ref);
        const nextCell=Array.from(row.children).find(item=>item.localName==='c' && columnNumber(item.getAttribute('r'))>columnNumber(patch.ref));
        row.insertBefore(c,nextCell||null);cells.set(patch.ref,c);
      }
      maxRow=Math.max(maxRow,Number(patch.ref.match(/\d+$/)[0]));
      maxColumn=Math.max(maxColumn,columnNumber(patch.ref));
      for(const child of Array.from(c.children)) if(['v','f','is'].includes(child.localName)) c.removeChild(child);
      if(patch.formula){
        c.removeAttribute('t');
        const f=doc.createElementNS(NS,'f');f.textContent=patch.formula;c.appendChild(f);
        const v=doc.createElementNS(NS,'v');v.textContent=String(patch.cached);c.appendChild(v);
      } else if(typeof patch.value==='number' && Number.isFinite(patch.value)) {
        c.setAttribute('t','n');const v=doc.createElementNS(NS,'v');v.textContent=String(patch.value);c.appendChild(v);
      } else {
        c.setAttribute('t','inlineStr');
        const is=doc.createElementNS(NS,'is'),t=doc.createElementNS(NS,'t');
        t.setAttribute('xml:space','preserve');t.textContent=String(patch.value);is.appendChild(t);c.appendChild(is);
      }
    }
    if(originalDimension){
      const current=originalDimension.getAttribute('ref').split(':').pop();
      const previousRow=Number(current.match(/\d+$/)[0]);
      const previousColumn=columnNumber(current);
      const newCol=Math.max(previousColumn,maxColumn);
      let n=newCol,letters='';while(n){n--;letters=String.fromCharCode(65+(n%26))+letters;n=Math.floor(n/26);}
      originalDimension.setAttribute('ref',`B2:${letters}${Math.max(previousRow,maxRow)}`);
    }
    zip.file('xl/worksheets/sheet1.xml',new XMLSerializer().serializeToString(doc));
    return zip.generateAsync({type:'blob',compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }
  global.BakeryXlsxExporter={build,mappings};
})(window);
