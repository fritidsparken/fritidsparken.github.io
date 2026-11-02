const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('js/four-in-row.js','utf8').replace('window.FPConnectFour={gallery,start,destroy};','window.test={winner,landing,chooseMove,setBoard:b=>board=b,gallery};');
const c={window:{}};vm.createContext(c);vm.runInContext(code,c);const t=c.window.test,empty=()=>Array.from({length:6},()=>Array(7).fill(0));
let wins=0;for(const [dy,dx] of [[0,1],[1,0],[1,1],[1,-1]])for(let r=0;r<6;r++)for(let col=0;col<7;col++){if(r+3*dy>5||col+3*dx<0||col+3*dx>6)continue;for(const p of [1,2]){const b=empty();for(let i=0;i<4;i++)b[r+i*dy][col+i*dx]=p;assert.equal(t.winner(b).p,p);wins++;}}
for(let col=0;col<7;col++){const b=empty();for(let row=5;row>=0;row--){assert.equal(t.landing(col,b),row);b[row][col]=row%2+1;}assert.equal(t.landing(col,b),-1);}
let b=empty();b[5]=[2,2,2,0,1,0,1];t.setBoard(b);assert.equal(t.chooseMove(),3);b=empty();b[5]=[1,1,1,0,2,0,0];t.setBoard(b);assert.equal(t.chooseMove(),3);
b=Array.from({length:6},(_,r)=>Array.from({length:7},(_,c)=>(Math.floor(c/2)+r)%2+1));assert.equal(t.winner(b),null);for(let c=0;c<7;c++)assert.equal(t.landing(c,b),-1);
assert.equal((t.gallery().match(/fill="black"/g)||[]).length,42);
console.log(`${wins} winning arrangements, all columns/full columns, AI win/block, full draw board and 42 holes passed.`);
