const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {spawn,execFileSync}=require('node:child_process');
const {mkdtempSync}=require('node:fs');
const {tmpdir}=require('node:os');
const {join}=require('node:path');
const root=join(__dirname,'../..');
const server=spawn('python3',['-m','http.server','18765','--directory',root],{stdio:'ignore'});
after(()=>server.kill());
const templateNames={bakery:'Bakery',patisserie:'Patisserie',ta:'TA'};
async function launch(){
 const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const page=await browser.newPage({acceptDownloads:true});
 await page.goto('http://127.0.0.1:18765/puratos-bakery-report/',{waitUntil:'networkidle'});
 return {browser,page};
}
for(const variant of Object.keys(templateNames)){
 test(`export ${variant} as actual populated single-template xlsx with original logo`,async()=>{
  const {browser,page}=await launch();
  try{
   assert.equal(await page.locator('#excelTemplate').count(),1);
   await page.selectOption('#excelTemplate',variant);
   await page.locator('#projectName').fill('פרויקט ניסוי ייחודי');
   await page.locator('#expPurpose').fill('מטרה ברורה');
   await page.locator('#execDate').fill('2026-09-23');
   await page.locator('#conclusions').fill('מסקנות מעניינות');
   await page.locator('#nextSteps').fill('בדיקה נוספת');
   await page.evaluate(()=>{
    document.querySelector('#approver').value='מאשרת בדיקה';
    document.querySelector('#updateDate').value='23.09.26';
    document.querySelector('#researcher').value='ליאור סופר';
    fixedIngs=[{name:'קמח מלא',gram:'1000',isFlour:true},{name:'שמרים',gram:'50',isFlour:false}];
    varIngs[1]=[{name:'מים',gram:'500',isFlour:false}];
    varIngs[2]=[{name:'מים',gram:'600',isFlour:false}];
    varConditions[1].actualKneadTime='12';
    processMetrics[1].actualDoughTemp='26';
    processMetrics[1].doughTexture='גמיש';
   });
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#exportExcelButton').click()]);
   assert.match(download.suggestedFilename(),/\.xlsx$/);
   const target=join(mkdtempSync(join(tmpdir(),'bakery-export-')),download.suggestedFilename());
   await download.saveAs(target);
   const result=JSON.parse(execFileSync('python3',[join(__dirname,'inspect_export.py'),target,variant],{encoding:'utf8'}));
   assert.equal(result.sheets,1);
   assert.equal(result.images,1);
   assert.match(result.project,/פרויקט ניסוי ייחודי/);
   assert.match(result.researcher,/ליאור סופר/);
   assert.equal(result.conclusions,'מסקנות מעניינות');
   assert.equal(result.nextSteps,'בדיקה נוספת');
   assert.equal(result.firstGram,1000);
   assert.equal(result.secondExperiment,600);
   assert.equal(result.errors,0);
   assert.equal(result.sortedCellOrder,true);
   assert.equal(result.creator,'Puratos Israel R&D');
   assert.match(result.printArea,/\$B\$2:\$N\$/);
   assert.match(result.percentFormula,/^=IFERROR\(/);
   assert.equal(result.percentCached,100);
   assert.equal(result.merged,{bakery:79,patisserie:68,ta:62}[variant]);
  }finally{await browser.close()}
 });
}
test('does not silently drop ingredients beyond template capacity',async()=>{
 const {browser,page}=await launch();
 try{
  assert.equal(await page.locator('#excelTemplate').count(),1);
  await page.selectOption('#excelTemplate','ta');
  await page.evaluate(()=>{fixedIngs=Array.from({length:13},(_,i)=>({name:'חומר '+i,gram:'1',isFlour:false}));});
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#exportExcelButton').click();
  await page.waitForFunction(()=>/12|מכיל|מקום/.test(document.querySelector('#excelExportStatus').textContent));
  const status=await page.locator('#excelExportStatus').innerText();
  assert.match(status,/12|מכיל|מקום/);
 }finally{await browser.close()}
});
test('refuses to silently truncate a conclusion beyond the Excel cell limit',async()=>{
 const {browser,page}=await launch();
 try{
  await page.locator('#conclusions').fill('א'.repeat(33000));
  await page.locator('#exportExcelButton').click();
  await page.waitForFunction(()=>document.querySelector('#excelExportStatus').textContent.includes('ארוך'));
  assert.match(await page.locator('#excelExportStatus').innerText(),/ארוך/);
 }finally{await browser.close()}
});
test('exports all supplemental fields even when they extend below the original print area',async()=>{
 const {browser,page}=await launch();
 try{
  await page.selectOption('#excelTemplate','ta');
  await page.evaluate(()=>{
   document.querySelector('#projectName').value='ניסוי עם הרבה נתונים';
   document.querySelector('#linkedReport').value='דו"ח מקושר';
   for(let i=1;i<=6;i++){
    varConditions[i]={actualKneadTime:'10',finalFermentTime:'30',fermentTemp:'28',fermentHumidity:'65'};
    processMetrics[i]={actualDoughTemp:'25',doughTexture:'מלא',actualFermentTime:'30',volumeStability:'יציב'};
   }
  });
  const [download]=await Promise.all([page.waitForEvent('download',{timeout:10000}),page.locator('#exportExcelButton').click()]);
  const dest=join(mkdtempSync(join(tmpdir(),'bakery-full-')),download.suggestedFilename());
  await download.saveAs(dest);
  const data=JSON.parse(execFileSync('python3',[join(__dirname,'inspect_export.py'),dest,'ta'],{encoding:'utf8'}));
  assert.equal(data.lastSupplementalValue,'יציב');
 }finally{await browser.close()}
});
