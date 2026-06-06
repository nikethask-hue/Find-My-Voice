const steps = [
  { id: 'range', q: 'What is your vocal range?', type: 'options', opts: ['low/bass','medium/alto or tenor','high/soprano'] },
  { id: 'tone', q: 'How would you describe your tone?', type: 'options', opts: ['raspy','smooth','breathy','powerful','nasal'] },
  { id: 'genre', q: 'What genre do you naturally sing?', type: 'options', opts: ['pop','R&B','rock','country','jazz','indie'] },
  { id: 'highs', q: 'How do you handle high notes?', type: 'options', opts: ['belt them out','go falsetto','avoid them','mix both'] },
  { id: 'desc', q: 'Describe your voice in your own words', type: 'text' }
];

const state = { values: {} };

const stepper = document.getElementById('stepper');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const cardsEl = document.getElementById('cards');

let current = 0;

function renderSteps(){
  stepper.innerHTML = '';
  steps.forEach((s,idx)=>{
    const el = document.createElement('div');
    el.className = 'step' + (idx===current? ' active':'');
    el.dataset.id = s.id;
    const q = document.createElement('div'); q.className='question'; q.textContent = s.q;
    el.appendChild(q);

    if(s.type === 'options'){
      const opts = document.createElement('div'); opts.className='options';
      s.opts.forEach(opt=>{
        const b = document.createElement('button');
        b.type='button'; b.className='option'; b.textContent = opt;
        if(state.values[s.id] === opt) b.classList.add('selected');
        b.addEventListener('click', ()=>{
          state.values[s.id] = opt;
          [...opts.children].forEach(c=>c.classList.remove('selected'));
          b.classList.add('selected');
        });
        opts.appendChild(b);
      });
      el.appendChild(opts);
    } else if(s.type === 'text'){
      const ta = document.createElement('textarea'); ta.className='textarea'; ta.placeholder = s.q;
      ta.value = state.values[s.id] || '';
      ta.addEventListener('input', ()=> state.values[s.id] = ta.value);
      el.appendChild(ta);
    }

    stepper.appendChild(el);
  });

  prevBtn.style.display = current === 0 ? 'none' : '';
  nextBtn.style.display = current === steps.length -1 ? 'none' : '';
  submitBtn.style.display = current === steps.length -1 ? '' : 'none';
}

prevBtn.addEventListener('click', ()=>{ if(current>0){ current--; renderSteps(); } });
nextBtn.addEventListener('click', ()=>{ if(current<steps.length-1){ current++; renderSteps(); } });

submitBtn.addEventListener('click', async ()=>{
  // Ensure required fields
  for(const s of steps){ if(!state.values[s.id] || state.values[s.id].toString().trim()===''){
    alert('Please answer: ' + s.q); return;
  }}

  const payload = {
    range: state.values.range,
    tone: state.values.tone,
    genre: state.values.genre,
    highs: state.values.highs,
    desc: state.values.desc
  };

  try{
    showLoading(true);
    const res = await callServer(payload);
    renderMatches(res.matches);
  }catch(err){
    console.error(err);
    alert('Error getting matches: '+ (err.message||err));
  }finally{ showLoading(false); }
});

function showLoading(v){ loading.classList.toggle('hidden', !v); }

function renderMatches(list){
  cardsEl.innerHTML = '';
  const tpl = document.getElementById('cardTpl');
  for(const item of list.slice(0,5)){
    const clone = tpl.content.cloneNode(true);
    clone.querySelector('.artist').textContent = item.name || 'Unknown artist';
    clone.querySelector('.why').textContent = item.why || '';
    clone.querySelector('.songName').textContent = item.song || '';
    cardsEl.appendChild(clone);
  }
}

async function callServer(profile){
  const r = await fetch('/api/match', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(profile)
  });
  if(!r.ok){
    const text = await r.text();
    throw new Error(`Server error ${r.status}: ${text}`);
  }
  return await r.json();
}

// initial render
renderSteps();
