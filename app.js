const net=require('net');
const {WebSocket,createWebSocketStream}=require('ws');
const axios = require('axios');
const projectPageURL = `https://tangy-innovative-spot.glitch.me`;// 替换为你的项目域名
const { TextDecoder } = require('util');
const logcb= (...args)=>console.log.bind(this,...args);
const errcb= (...args)=>console.error.bind(this,...args);

const uuid= (process.env.UUID||'abb31f09-0000-49f5-a513-6a89bc097634').replace(/-/g, "");
const port= process.env.PORT||3000;

const wss=new WebSocket.Server({port},logcb('listen:', port));
wss.on('connection', ws=>{
    console.log("on connection")
    ws.once('message', msg=>{
        const [VERSION]=msg;
        const id=msg.slice(1, 17);
        if(!id.every((v,i)=>v==parseInt(uuid.substr(i*2,2),16))) return;
        let i = msg.slice(17, 18).readUInt8()+19;
        const port = msg.slice(i, i+=2).readUInt16BE(0);
        const ATYP = msg.slice(i, i+=1).readUInt8();
        const host= ATYP==1? msg.slice(i,i+=4).join('.')://IPV4
            (ATYP==2? new TextDecoder().decode(msg.slice(i+1, i+=1+msg.slice(i,i+1).readUInt8()))://domain
                (ATYP==3? msg.slice(i,i+=16).reduce((s,b,i,a)=>(i%2?s.concat(a.slice(i-1,i+1)):s), []).map(b=>b.readUInt16BE(0).toString(16)).join(':'):''));//ipv6

        logcb('conn:', host,port);
        ws.send(new Uint8Array([VERSION, 0]));
        const duplex=createWebSocketStream(ws);
        net.connect({host,port}, function(){
            this.write(msg.slice(i));
            duplex.on('error',errcb('E1:')).pipe(this).on('error',errcb('E2:')).pipe(duplex);
        }).on('error',errcb('Conn-Err:',{host,port}));
    }).on('error',errcb('EE:'));
});

// 定义访问间隔时间（2分钟）
const intervalInMilliseconds = 2 * 60 * 1000;

async function visitProjectPage() {
  try {
    // console.log(`Visiting project page: ${projectPageURL}`);
    await axios.get(projectPageURL);
    console.log('Page visited successfully.');
  } catch (error) {
    console.error('Error visiting project page:', error.message);
  }
}

setInterval(visitProjectPage, intervalInMilliseconds);
visitProjectPage();
