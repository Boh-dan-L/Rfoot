const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const version = JSON.parse(fs.readFileSync(path.join(root, 'analytics/GTM-Rfoot-import.json'))).containerVersion;
const pixel = '1467134061942781';
let checks = 0;
function check(name, fn) { fn(); checks++; console.log('PASS', name); }
function runTag(name, hostname='rfoot.pro') {
  const tag = version.tag.find(t => t.name === name);
  const html = tag.parameter.find(p => p.key === 'html').value;
  const calls = [];
  const values = {'DLV - value':370,'DLV - currency':'UAH','DLV - event_id':'test-purchase',
    'DLV - order_ref':'RFOOT-test','DLV - checkout.event_id':'test-checkout',
    'DLV - checkout.value':370,'DLV - checkout.currency':'UAH'};
  const code = html.match(/<script>([\s\S]*?)<\/script>/)[1]
    .replace(/'\{\{([^}]+)\}\}'/g, (_, key) => JSON.stringify(values[key]))
    .replace(/\{\{([^}]+)\}\}/g, (_, key) => JSON.stringify(values[key]));
  const context = {location:{hostname},fbq:(...a)=>calls.push(a),console:{log(){}},document:{}};
  context.window = context;
  vm.runInNewContext(code, context);
  return calls;
}
check('PageView uses only new Pixel, without fake advanced matching', () => {
  const calls = runTag('Fb pixel');
  assert.deepEqual(calls[0], ['init', pixel]);
  assert.deepEqual(calls[1], ['trackSingle', pixel, 'PageView']);
});
check('Purchase destination and shared event ID', () => {
  const call = runTag('Meta - Browser Purchase')[0];
  assert.deepEqual(call.slice(0,3), ['trackSingle',pixel,'Purchase']);
  assert.equal(call[4].eventID, 'test-purchase');
  assert.equal(call[3].value,370);
});
check('InitiateCheckout destination and event ID', () => {
  const call = runTag('Meta InitiateCheckout tag')[0];
  assert.deepEqual(call.slice(0,3), ['trackSingle',pixel,'InitiateCheckout']);
  assert.equal(call[4].eventID,'test-checkout');
});
check('Old domain and localhost fire no Meta tags', () => {
  for (const host of ['bohdan.pro','bogdan92.pro','localhost','evil.example'])
    for (const tag of ['Fb pixel','Meta - Browser Purchase','Meta InitiateCheckout tag'])
      assert.equal(runTag(tag,host).length,0);
});
check('Clarity paused and isolated placeholder, template retained', () => {
  const tag=version.tag.find(t=>t.name==='Microsoft Clarity - Official');
  assert.equal(tag.paused,true);
  assert.equal(tag.parameter.find(p=>p.key==='projectId').value,'newclarityprojectid');
  assert.equal(version.customTemplate.length,1);
});
check('No old Meta/TikTok/Clarity destinations in deployable artifacts', () => {
  const main=fs.readFileSync(path.join(root,'docs/foot/index.html'),'utf8');
  const thanks=fs.readFileSync(path.join(root,'docs/foot/thank-you/index.html'),'utf8');
  const tags=JSON.stringify(version.tag);
  for (const old of ['930226716181107','GTM-PFHVJTZL','D3O0ND3C77U53GBVNA70','y89x6z792r'])
    assert.equal((main+thanks+tags).includes(old),false);
  assert(main.includes('payments_enabled: false'));
  assert(main.includes('data-product-id="rfoot_370"'));
  assert(main.includes('GTM-WLRCGQ6M'));
});
check('Thank-you event ID and reload guard; no query means no Purchase', () => {
  const html=fs.readFileSync(path.join(root,'docs/foot/thank-you/index.html'),'utf8');
  const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  function simulate(search) {
    const storage=new Map(); const context={URLSearchParams,sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};
    context.window={location:{search},APP_CONFIG:{landing_id:'rfoot-thank-you',pixel_key:'pixel_rfoot'},dataLayer:[]};
    vm.runInNewContext(scripts.at(-1),context);
    vm.runInNewContext(scripts.at(-1),context);
    return context.window.dataLayer;
  }
  assert.equal(simulate('').length,0);
  const events=simulate('?event_id=test-purchase&order_ref=RFOOT-test&value=370&currency=UAH');
  assert.equal(events.length,1);
  assert.equal(events[0].purchase.event_id,'test-purchase');
  assert.equal(events[0].pixel_key,'pixel_rfoot');
});
check('Original Telegram course link retained', () => {
  const html=fs.readFileSync(path.join(root,'docs/foot/thank-you/index.html'),'utf8');
  assert(html.includes('https://telegram.me/FootRehabBot?start=26fot'));
});
console.log(`${checks} offline checks passed; no network requests were made.`);
