const KEY='fp-origami-studio-v1';
export function loadProgress(id,max) {
  try {const p=JSON.parse(localStorage.getItem(KEY)||'{}')[id];
    if(!p||!Number.isInteger(p.step)||p.step<0||p.step>=max)return null;
    return {step:p.step,color:/^#[0-9a-f]{6}$/i.test(p.color)?p.color:null};
  }catch{return null;}
}
export function saveProgress(id,step,color) {
  try {let data;try{data=JSON.parse(localStorage.getItem(KEY)||'{}');}catch{data={};}
    if(!data||typeof data!=='object'||Array.isArray(data))data={};data[id]={step,color};localStorage.setItem(KEY,JSON.stringify(data));return true;
  }catch{return false;}
}
