const steps = [
  { id: 'range', q: 'What is your vocal range?', type: 'options', opts: ['low/bass','medium/alto or tenor','high/soprano'] },
  { id: 'tone', q: 'How would you describe your tone?', type: 'options', opts: ['raspy','smooth','breathy','powerful','nasal'] },
  { id: 'genre', q: 'What genre do you naturally sing?', type: 'options', opts: ['pop','R&B','rock','country','jazz','indie'] },
  { id: 'highs', q: 'How do you handle high notes?', type: 'options', opts: ['belt them out','go falsetto','avoid them','mix both'] },
  { id: 'desc', q: 'Describe your voice in your own words', type: 'text' }
];

const state = { values: {}, apiKey: '' };

const stepper = document.getElementById('stepper');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const apiKeyInput = document.getElementById('apiKey');
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
apiKeyInput.addEventListener('input', e=> state.apiKey = e.target.value.trim());

submitBtn.addEventListener('click', async ()=>{
  if(!state.apiKey){ alert('Please paste your Anthropic API key at the top.'); return; }
  // Ensure required fields
  for(const s of steps){ if(!state.values[s.id] || state.values[s.id].toString().trim()===''){
    alert('Please answer: ' + s.q); return;
  }}

  // build prompt for Claude to return strict JSON
  const prompt = `You are a helpful music assistant. Given a singer profile, return a JSON array of 3-5 artist match objects. Each object must contain: name (artist name), why (one-sentence reason why they match based on the profile), song (a single song suggestion to try). Do not include any extra text, only return valid JSON.

Profile:\nVocal range: ${state.values.range}\nTone: ${state.values.tone}\nGenre: ${state.values.genre}\nHigh note approach: ${state.values.highs}\nDescription: ${state.values.desc}`;

  try{
    showLoading(true);
    const res = await callClaude(state.apiKey, prompt);
    const text = extractTextFromResponse(res);
    const json = extractJson(text);
    renderMatches(json);
  }catch(err){
    console.error(err);
    alert('Error getting matches: '+ (err.message||err));
  }finally{ showLoading(false); }
});

function showLoading(v){ loading.classList.toggle('hidden', !v); }

function extractTextFromResponse(data){
  if(!data) return '';
  if(typeof data === 'string') return data;
  if(data.completion) return data.completion;
  if(data.output && data.output[0] && typeof data.output[0].content === 'string') return data.output[0].content;
  if(data.choices && data.choices[0] && data.choices[0].message) return data.choices[0].message.content;
  if(data.message && data.message.content) return data.message.content;
  // fallback to stringified
  return JSON.stringify(data);
}

function extractJson(text){
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if(start===-1 || end===-1) throw new Error('Response did not include a JSON array');
  const chunk = text.slice(start, end+1);
  return JSON.parse(chunk);
}

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

async function callClaude(key, prompt){
  const url = 'https://api.anthropic.com/v1/messages';
  const body = {
    model: 'claude-opus-4-6',
    messages: [ { role: 'user', content: prompt } ],
    max_tokens_to_sample: 800
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify(body)
  });
  if(!r.ok){
    const txt = await r.text();
    throw new Error(`API error ${r.status}: ${txt}`);
  }
  return await r.json();
}

// initial render
renderSteps();
