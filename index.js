const cache = {};

const { WSv2 } = require('bitfinex-api-node');
const ws_client = new WSv2({ transform: true });
const { WebSocketServer } = require( 'ws');
const wss = new WebSocketServer({ port: 8080 });

ws_client.open();
ws_client.on('error', (err) => console.log(err));


const pairs = ['tBTCUSD','tETHUSD','tLTCUSD'];
const clients = new Map();


ws_client.on('open', () => {
    pairs.forEach( ( pair )=> {
        ws_client.subscribeTicker(pair);
        ws_client.onTicker({ symbol: pair }, (ticker) => {                    
            
            cache[pair] = ticker.toJS();                    
            [...clients.keys()].forEach((client) => {
                
                const sub = clients.get(client)                
                if (sub.ticker[pair]) client.send(JSON.stringify(cache[pair]));
              });        

        });    
    })    
});

wss.on('connection', function connection(ws) {  
    clients.set(ws,{ticker:{}})


    ws.on('message', function message(data) {
      try {
          const client_data = JSON.parse(data);
          console.log('received:',client_data)
          if ( client_data.event == 'ticker' ) {
              const current_sub = clients.get(ws);
              current_sub.ticker[client_data.pair] = true;            
              clients.set(ws, current_sub);
          }


      } catch (error) {
          console.log(error);
          ws.send('Error client data not JSON parsable');
      }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Client disconnected');
    });

  
});

