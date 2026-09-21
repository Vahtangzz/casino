const $=id=>document.getElementById(id);
const fmt=n=>Math.floor(n).toLocaleString("en-US");
let state=JSON.parse(localStorage.getItem("velvetCasino")||"null")||{balance:10000,games:0,wins:0,losses:0,profit:0};
let bj={deck:[],player:[],dealer:[],active:false,bet:0};
let rouletteChoice=null,coinChoice=null;

function save(){localStorage.setItem("velvetCasino",JSON.stringify(state));renderStats()}
function renderStats(){$("balance").textContent=fmt(state.balance);$("games").textContent=state.games;$("wins").textContent=state.wins;$("losses").textContent=state.losses;$("profit").textContent=(state.profit>=0?"+":"")+fmt(state.profit)}
function validBet(input){let b=Number(input.value);if(!Number.isFinite(b)||b<10||b>1000||b>state.balance)return null;return Math.floor(b)}

document.querySelectorAll(".nav-btn").forEach(btn=>btn.onclick=()=>{document.querySelectorAll(".nav-btn").forEach(x=>x.classList.remove("active"));btn.classList.add("active");document.querySelectorAll(".game").forEach(x=>x.classList.remove("active-game"));$(btn.dataset.game).classList.add("active-game")});
$("resetBtn").onclick=()=>{if(confirm("Reset virtual balance and stats?")){state={balance:10000,games:0,wins:0,losses:0,profit:0};save();}};
function settle(bet,payout,resultEl,message){state.balance-=bet;state.games++;if(payout>0){state.balance+=payout;state.wins++;state.profit+=payout-bet;resultEl.className="result win"}else{state.losses++;state.profit-=bet;resultEl.className="result lose"}resultEl.textContent=message;save()}

const symbols=["🍒","🍒","🍒","🍋","🍋","🍊","🔔","💎","7️⃣"];
$("spinBtn").onclick=()=>{let bet=validBet($("slotBet"));if(!bet)return $("slotResult").textContent="Bet must be 10–1000 credits and within your balance.";let reels=[$("reel1"),$("reel2"),$("reel3")];reels.forEach(r=>r.classList.add("spin"));let a=[...Array(3)].map(()=>symbols[Math.floor(Math.random()*symbols.length)]);setTimeout(()=>{reels.forEach((r,i)=>{r.textContent=a[i];r.classList.remove("spin")});let counts={};a.forEach(x=>counts[x]=(counts[x]||0)+1);let max=Math.max(...Object.values(counts));let mult=max===3?(a[0]==="7️⃣"?25:a[0]==="💎"?15:a[0]==="🍒"?8:5):max===2?2:0;settle(bet,mult?bet*mult:0,$("slotResult"),mult?`WIN! ${mult}x payout = ${fmt(bet*mult)} credits`:"No match. Better luck next spin.");},550)};

function newDeck(){let suits=["♠","♥","♦","♣"],ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"],d=[];for(let s of suits)for(let r of ranks)d.push({s,r});return d.sort(()=>Math.random()-.5)}
function val(cards){let t=0,a=0;cards.forEach(c=>{if(c.r==="A"){t+=11;a++}else t+=["J","Q","K"].includes(c.r)?10:Number(c.r)});while(t>21&&a)t-=10,a--;return t}
function cardHTML(c){let red=c.s==="♥"||c.s==="♦";return `<div class="card ${red?"red":""}">${c.r}${c.s}</div>`}
function renderBJ(hide=true){$("playerCards").innerHTML=bj.player.map(cardHTML).join("");$("dealerCards").innerHTML=(hide?[`<div class="card">?</div>`]:bj.dealer.map(cardHTML)).join("");$("playerScore").textContent=val(bj.player);$("dealerScore").textContent=hide?"?":val(bj.dealer)}
function endBJ(msg,win,payout=0){bj.active=false;settle(bj.bet,payout,$("blackjackResult"),msg);$("hitBtn").disabled=true;$("standBtn").disabled=true;$("dealBtn").disabled=false;renderBJ(false)}
$("dealBtn").onclick=()=>{if(bj.active)return;let bet=validBet($("blackjackBet"));if(!bet)return $("blackjackResult").textContent="Invalid bet.";bj={deck:newDeck(),player:[],dealer:[],active:true,bet};bj.player.push(bj.deck.pop(),bj.deck.pop());bj.dealer.push(bj.deck.pop(),bj.deck.pop());$("hitBtn").disabled=false;$("standBtn").disabled=false;$("dealBtn").disabled=true;$("blackjackResult").className="result";$("blackjackResult").textContent="Your move.";renderBJ();if(val(bj.player)===21)setTimeout(()=>endBJ("BLACKJACK! 2.5x payout.",true,bet*2.5),200)};
$("hitBtn").onclick=()=>{bj.player.push(bj.deck.pop());renderBJ();if(val(bj.player)>21)endBJ("Bust! You went over 21.",false);else if(val(bj.player)===21)$("blackjackResult").textContent="21! Stand.";};
$("standBtn").onclick=()=>{while(val(bj.dealer)<17)bj.dealer.push(bj.deck.pop());let p=val(bj.player),d=val(bj.dealer);if(d>21||p>d)endBJ(`You win! Dealer: ${d}.`,true,bj.bet*2);else if(p===d)endBJ(`Push. Both have ${p}.`,true,bj.bet);else endBJ(`Dealer wins with ${d}.`,false)};

for(let n=0;n<=36;n++){let b=document.createElement("button");b.textContent=n;b.className=n===0?"green":([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n)?"red":"black");b.onclick=()=>selectRoulette(String(n),b);$("numberGrid").appendChild(b)}
function selectRoulette(c,el){rouletteChoice=c;document.querySelectorAll(".bet-choice,.number-grid button").forEach(x=>x.classList.remove("selected"));el.classList.add("selected");$("rouletteChoice").textContent="Selected: "+c}
document.querySelectorAll(".bet-choice").forEach(b=>b.onclick=()=>{rouletteChoice=b.dataset.choice;document.querySelectorAll(".bet-choice,.number-grid button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");$("rouletteChoice").textContent="Selected: "+b.dataset.choice.toUpperCase()});
$("rouletteSpin").onclick=()=>{let bet=validBet($("rouletteBet"));if(!bet||rouletteChoice===null)return $("rouletteResult").textContent="Select a bet and enter a valid amount.";let n=Math.floor(Math.random()*37),red=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n),color=n===0?"green":red?"red":"black";$("rouletteNumber").textContent=n;$("rouletteColor").textContent=color.toUpperCase();let win=rouletteChoice===String(n),mult=win?35:(rouletteChoice===color?color==="green"?14:2:0);settle(bet,mult?bet*mult:0,$("rouletteResult"),mult?`WIN! ${mult}x payout.`:`Ball landed on ${n} ${color}. You lost.`)};

document.querySelectorAll(".coin-choice").forEach(b=>b.onclick=()=>{coinChoice=b.dataset.choice;document.querySelectorAll(".coin-choice").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");$("coinChoice").textContent="Selected: "+coinChoice.toUpperCase()});
$("flipBtn").onclick=()=>{let bet=validBet($("coinBet"));if(!bet||!coinChoice)return $("coinResult").textContent="Choose heads or tails and enter a valid bet.";let coin=$("coin");coin.classList.add("flipping");setTimeout(()=>{let result=Math.random()<.5?"heads":"tails";coin.classList.remove("flipping");coin.textContent=result==="heads"?"H":"T";settle(bet,result===coinChoice?bet*2:0,$("coinResult"),result===coinChoice?`WIN! It was ${result}. 2x payout.`:`It was ${result}. You lost.`)},700)};
renderStats();
