const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {spawn,execFileSync}=require('node:child_process');
const {mkdtempSync}=require('node:fs');
const {tmpdir}=require('node:os');
const {join}=require('node:path');
const root=join(__dirname,'../..');
const server=spawn('python3',['-m','http.server','18766','--directory',root],{stdio:'ignore'});
after(()=>server.kill());
async function open(){
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const page=await browser.newPage({acceptDownloads:true});
 await page.goto('http://127.0.0.1:18766/puratos-bakery-report/',{waitUntil:'networkidle'});
 return {browser,page};
}
test('fixed ingredient has six independent weighed checkboxes; variable ingredient has one',async()=>{
 const {browser,page}=await open();
 try{
  const fixed=page.locator('#fixedIngContainer .ingredient-row').first();
  assert.equal(await fixed.locator('input[type=checkbox][aria-label*="נשקל בניסוי"]').count(),6);
  await fixed.locator('input[aria-label*="נשקל בניסוי 2"]').check();
  await fixed.locator('input[aria-label*="נשקל בניסוי 5"]').check();
  assert.deepEqual(await page.evaluate(()=>collectData('draft').fixedIngredients[0].weighedByExperiment),{'2':true,'5':true});
  const variable=page.locator('#varIngContainer .ingredient-row').first();
  assert.equal(await variable.locator('input[type=checkbox][aria-label*="נשקל"]').count(),1);
  await variable.locator('input[aria-label*="נשקל"]').check();
  assert.equal(await page.evaluate(()=>collectData('draft').variableIngredients[1][0].weighed),true);
  await page.locator('#varExpTabs [data-exp="2"]').click();
  assert.equal(await page.locator('#varIngContainer .ingredient-row').first().locator('input[aria-label*="נשקל"]').isChecked(),false);
  await page.locator('#varExpTabs [data-exp="1"]').click();
  assert.equal(await page.locator('#varIngContainer .ingredient-row').first().locator('input[aria-label*="נשקל"]').isChecked(),true);
 }finally{await browser.close()}
});
test('annex composition belongs only to selected experiment and survives switching tabs',async()=>{
 const {browser,page}=await open();
 try{
  await page.locator('#annexTabs [data-exp="3"]').click();
  await page.locator('#addAnnex').click();
  await page.locator('#annexRows input[data-field="ingredient"]').first().fill('משפר אפייה');
  await page.locator('#annexRows input[data-field="quantity"]').first().fill('3.5');
  await page.locator('#annexRows select[data-field="unit"]').first().selectOption('גרם');
  await page.locator('#annexRows input[data-field="notes"]').first().fill('תערובת א');
  await page.locator('#annexTabs [data-exp="1"]').click();
  assert.equal(await page.locator('#annexRows input').count(),0);
  await page.locator('#annexTabs [data-exp="3"]').click();
  assert.equal(await page.locator('#annexRows input[data-field="ingredient"]').first().inputValue(),'משפר אפייה');
  const saved=await page.evaluate(()=>collectData('draft').variableConditions[3].bakingAnnex.rows[0]);
  assert.deepEqual(saved,{ingredient:'משפר אפייה',quantity:'3.5',unit:'גרם',notes:'תערובת א'});
 }finally{await browser.close()}
});
test('camera and computer photo inputs use same persistent report photo list',async()=>{
 const {browser,page}=await open();
 try{
  assert.equal(await page.locator('#cameraInput').getAttribute('capture'),'environment');
  assert.equal(await page.locator('#photoInput').getAttribute('capture'),null);
  await page.locator('#photoInput').setInputFiles(join(root,'puratos-bakery-report/icon-192.png'));
  await page.waitForFunction(()=>collectData('draft').photos.length===1);
  assert.match(await page.evaluate(()=>collectData('draft').photos[0]),/^data:image\//);
  assert.equal(await page.locator('#photoGrid img').count(),1);
  await page.locator('#cameraInput').setInputFiles(join(root,'puratos-bakery-report/icon-192.png'));
  await page.waitForFunction(()=>collectData('draft').photos.length===2);
  assert.equal(await page.locator('#photoGrid img').count(),2);
 }finally{await browser.close()}
});
test('saved old reports stay loadable; new weighed flags, annex and photos round-trip through save endpoint',async()=>{
 const {browser,page}=await open();
 try{
  let body;
  await page.route('**/functions/saveBakeryReport',async route=>{
   if(route.request().method()==='POST'){
    body=route.request().postDataJSON();
    await route.fulfill({json:{success:true,id:'test-draft'}});
   }else{
    await route.fulfill({json:{data:[{id:'test-draft',project_name:body.projectName,
      fixed_ingredients:JSON.stringify(body.fixedIngredients),variable_ingredients:JSON.stringify(body.variableIngredients),
      variable_conditions:JSON.stringify(body.variableConditions),process_metrics:JSON.stringify(body.processMetrics),
      photos:JSON.stringify(body.photos),fixed_conditions:JSON.stringify(body.fixedConditions)}]}});
   }
  });
  await page.locator('#projectName').fill('דוח בדיקה');
  await page.locator('#fixedIngContainer .ingredient-row').first().locator('input[aria-label*="נשקל בניסוי 4"]').check();
  await page.locator('#annexTabs [data-exp="2"]').click();
  await page.locator('#addAnnex').click();
  await page.locator('#annexRows input[data-field="ingredient"]').first().fill('משפר א');
  await page.locator('#photoInput').setInputFiles(join(root,'puratos-bakery-report/icon-192.png'));
  await page.waitForFunction(()=>collectData('draft').photos.length===1);
  await page.locator('button[onclick="saveDraft()"]').click();
  await page.waitForFunction(()=>currentReportId==='test-draft');
  assert.equal(body.fixedIngredients[0].weighedByExperiment['4'],true);
  assert.equal(body.variableConditions[2].bakingAnnex.rows[0].ingredient,'משפר א');
  assert.equal(body.photos.length,1);
  page.once('dialog',dialog=>dialog.accept());
  await page.evaluate(()=>clearForm());
  await page.evaluate(()=>loadReport('test-draft'));
  await page.waitForFunction(()=>currentReportId==='test-draft' && photos.length===1);
  assert.equal(await page.locator('#fixedIngContainer .ingredient-row').first().locator('input[aria-label*="נשקל בניסוי 4"]').isChecked(),true);
  await page.locator('#annexTabs [data-exp="2"]').click();
  assert.equal(await page.locator('#annexRows input[data-field="ingredient"]').first().inputValue(),'משפר א');
 }finally{await browser.close()}
});
test('Excel export includes weighed markers and annex composition outside original print area',async()=>{
 const {browser,page}=await open();
 try{
  await page.locator('#fixedIngContainer .ingredient-row').first().locator('input[aria-label*="נשקל בניסוי 4"]').check();
  await page.locator('#annexTabs [data-exp="2"]').click();
  await page.locator('#addAnnex').click();
  await page.locator('#annexRows input[data-field="ingredient"]').first().fill('משפר נבדק');
  await page.locator('#annexRows input[data-field="quantity"]').first().fill('4');
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#exportExcelButton').click()]);
  const path=join(mkdtempSync(join(tmpdir(),'bakery-annex-')),download.suggestedFilename());
  await download.saveAs(path);
  const data=JSON.parse(execFileSync('python3',[join(__dirname,'inspect_export.py'),path,'bakery'],{encoding:'utf8'}));
  assert.match(data.supplemental,/ניסוי 4.*נשקל/);
  assert.match(data.supplemental,/משפר נבדק/);
  assert.doesNotMatch(data.supplemental,/\[object Object\]/);
 }finally{await browser.close()}
});
test('old reports without weighed or annex fields remain editable with unchecked defaults',async()=>{
 const {browser,page}=await open();
 try{
  await page.route('**/functions/saveBakeryReport',route=>route.fulfill({json:{data:[{
   id:'old-draft',project_name:'דוח ישן',fixed_ingredients:JSON.stringify([{name:'קמח',gram:'500',isFlour:true}]),
   variable_ingredients:JSON.stringify({1:[{name:'מים',gram:'250',isFlour:false}]}),
   variable_conditions:JSON.stringify({1:{actualKneadTime:'10'}}),photos:'[]'
  }]}}));
  await page.evaluate(()=>loadReport('old-draft'));
  await page.waitForFunction(()=>currentReportId==='old-draft');
  assert.equal(await page.locator('#fixedIngContainer .ingredient-row').first().locator('input[aria-label*="נשקל בניסוי"]').count(),6);
  assert.equal(await page.locator('#fixedIngContainer .ingredient-row').first().locator('input[aria-label*="נשקל בניסוי"]:checked').count(),0);
  await page.locator('#annexTabs [data-exp="6"]').click();
  assert.equal(await page.locator('#annexRows input').count(),0);
 }finally{await browser.close()}
});
test('clearing a report also resets annex and leaves an export template selected',async()=>{
 const {browser,page}=await open();
 try{
  await page.selectOption('#excelTemplate','ta');
  await page.locator('#annexTabs [data-exp="3"]').click();
  await page.locator('#addAnnex').click();
  page.once('dialog',dialog=>dialog.accept());
  await page.evaluate(()=>clearForm());
  assert.equal(await page.locator('#excelTemplate').inputValue(),'bakery');
  assert.equal(await page.locator('#annexRows input').count(),0);
  assert.equal(await page.evaluate(()=>collectData('draft').variableConditions[3].bakingAnnex),undefined);
 }finally{await browser.close()}
});
test('print view includes every experiment annex, not only the currently selected tab',async()=>{
 const {browser,page}=await open();
 try{
  await page.locator('#annexTabs [data-exp="2"]').click();
  await page.locator('#addAnnex').click();
  await page.locator('#annexRows input[data-field="ingredient"]').first().fill('משפר שני');
  await page.locator('#annexTabs [data-exp="3"]').click();
  await page.locator('#addAnnex').click();
  await page.locator('#annexRows input[data-field="ingredient"]').first().fill('משפר שלישי');
  assert.match(await page.locator('#annexPrint').textContent(),/משפר שני/);
  assert.match(await page.locator('#annexPrint').textContent(),/משפר שלישי/);
 }finally{await browser.close()}
});
test('large camera photo is reduced enough to store six photos without oversized report payload',async()=>{
 const {browser,page}=await open();
 try{
  const size=await page.evaluate(async()=>{
   const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1600;
   const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(1600,1600);
   for(let i=0;i<pixels.data.length;i+=4){pixels.data[i]=(i*13)%251;pixels.data[i+1]=(i*17)%239;pixels.data[i+2]=(i*23)%233;pixels.data[i+3]=255;}
   ctx.putImageData(pixels,0,0);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.96));
   return (await resizePhoto(new File([blob],'large.jpg',{type:'image/jpeg'}))).length;
  });
  assert.ok(size<=650000,`compressed image size ${size} exceeds budget`);
 }finally{await browser.close()}
});
