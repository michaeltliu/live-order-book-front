import './App.css';
import {useState, useEffect} from 'react'
import Plot from 'react-plotly.js'
import { io } from 'socket.io-client';


async function requestOrderBook(setOrderData) {
  const response = await fetch("https://live-order-book-backend-287349709563.us-central1.run.app/order-book");
  const data = await response.json();
  setOrderData(data);
}

async function requestRoomUserData(room_id, user_id, setRoomUserData) {
  const response = await fetch(`https://live-order-book-backend-287349709563.us-central1.run.app/user-data/${room_id}/${user_id}`);
  const data = await response.json();
  setRoomUserData(data);
}

function LoginForm({setIsLoggedIn, setUserData}) {
  const [input, setInput] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (input.trim() !== "") {
      
      const response = await fetch(`https://live-order-book-backend-287349709563.us-central1.run.app/login/${input}`);
      const data = await response.json();
      setUserData(data);
      setIsLoggedIn(true);
    }
  }

  return (
    <header className="App-header">
      <form onSubmit={handleSubmit}>
        <input type="text" value={input} placeholder="Username" onChange={(e)=>setInput(e.target.value)}>
        </input>
        <button type="submit">Submit</button>
      </form>
    </header>
  )
}

function BuyForm({socket}) {
  const [limitInput, setLimitInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (limitInput.trim() !== "" && quantityInput.trim() !== "") {
      socket.emit('buy', limitInput, quantityInput, response => {
        setMessage(response);
      })
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input type="text" value={limitInput} name="limit" 
        placeholder="Limit Price" onChange={(e)=>setLimitInput(e.target.value)}/><br/>
        <input type="text" value={quantityInput} name="quantity" 
        placeholder="Quantity" onChange={(e)=>setQuantityInput(e.target.value)} /><br/>
        <button type="submit">Buy</button>
      </form>
      {message}
    </>
  )
}

function SellForm({socket}) {
  const [limitInput, setLimitInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (limitInput.trim() !== "" && quantityInput.trim() !== "") {
      socket.emit('sell', limitInput, quantityInput, response => {
        setMessage(response);
      })
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input type="text" value={limitInput} name="limit" 
        placeholder="Limit Price" onChange={(e)=>setLimitInput(e.target.value)}/><br/>
        <input type="text" value={quantityInput} name="quantity" 
        placeholder="Quantity" onChange={(e)=>setQuantityInput(e.target.value)} /><br/>
        <button type="submit">Sell</button>
      </form>
      {message}
    </>
  )
}

function UserDataPanel({socket, roomUserData, setRoomId}) {

  function handleDeleteOrder(order_id) {
    socket.emit('delete', order_id);
  }

  function handleExit() {
    socket.emit('exit-room');
    setRoomId('');
  }

  const orderList = roomUserData.orders.map(order => 
    <p>
      {order.order_id}: {order.side} {order.quantity} @ {order.limit} 
      <button onClick={() => handleDeleteOrder(order.order_id)}>Delete Order</button>
    </p>
  );

  const tradeList = roomUserData.trades.map(trade => 
    <p>{trade.buyer_name} {trade.seller_name} {trade.volume} LOTS @ {trade.price}</p>
  );

  return (
    <>
      <p>Username: {roomUserData.username}</p>
      <p>User ID: {roomUserData.user_id}</p>
      <p>Cash: {roomUserData.cash}</p>
      <p>Position: {roomUserData.position}</p>
      Orders: <ul>{orderList}</ul>
      Trades: <ul>{tradeList}</ul>
      <button onClick={() => handleExit()}>Exit Room</button>
    </>
  )
}

function OrderBook({socket, orderData, ownVolume, volume}) {
  
  function sendBid(limit) {
    socket.emit('buy', limit, volume || "0")
  }

  function sendAsk(limit) {
    socket.emit('sell', limit, volume || "0")
  }
  
  let ownBidVolume = {}
  let ownAskVolume = {}
  ownVolume.forEach(e => {
    if (e.side == 'BUY') {
      ownBidVolume[Math.floor(e.limit)] = (ownBidVolume[Math.floor(e.limit)] || 0) + e.quantity
    }
    else if (e.side == 'SELL') {
      ownAskVolume[Math.floor(e.limit)] = (ownAskVolume[Math.floor(e.limit)] || 0) + e.quantity
    }
  });

  const rows = Array(100).fill().map((_,i) =>
    <tr>
      <td>{ownBidVolume[i] || ""}</td>
      <td onClick={() => sendBid(i)}>{(orderData.bids[i]==null || orderData.bids[i]==0) ? "" : orderData.bids[i]}</td>
      <td>{i}</td>
      <td onClick={() => sendAsk(i)}>{(orderData.asks[i]==null || orderData.asks[i]==0) ? "" : orderData.asks[i]}</td>
      <td>{ownAskVolume[i] || ""}</td>
    </tr>
  )

  return (
    <table>
      <thead>
        <tr>
          <th>Own Bid</th>
          <th>Bid Volume</th>
          <th>Price</th>
          <th>Ask Volume</th>
          <th>Own Ask</th>
        </tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </table>
  )
}

function PriceHistory({bboHistory, lastDones}) {
  
  return (
    <Plot 
      data={[
        {
          x: lastDones.buy_t.map((d) => new Date(d)),
          y: lastDones.buy_p,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'green', symbol: 'triangle-up', size: 9},
          name: 'Last done buy aggressor',
        },
        {
          x: lastDones.sell_t.map((d) => new Date(d)),
          y: lastDones.sell_p,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'red', symbol: 'triangle-down', size: 9},
          name: 'Last done sell aggressor'
        },
        {
          x: bboHistory.bb_t.map((d) => new Date(d)),
          y: bboHistory.bb_p,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'purple'},
          name: 'Best bid'
        },
        {
          x: bboHistory.bo_t.map((d) => new Date(d)),
          y: bboHistory.bo_p,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'purple'},
          name: 'Best offer'
        },
        {
          x: bboHistory.bt.map((d) => new Date(d)),
          y: bboHistory.bp,
          type: 'scatter',
          mode: 'lines',
          marker: {color: 'purple'},
          showlegend: false,
          hoverinfo: 'skip'
        },
        {
          x: bboHistory.ot.map((d) => new Date(d)),
          y: bboHistory.op,
          type: 'scatter',
          mode: 'lines',
          marker: {color: 'purple'},
          showlegend: false,
          hoverinfo: 'skip'
        }
      ]}
      layout={{
        title: 'Price History',
        uirevision: true,
        xaxis: {
          title: 'Time'
        },
        yaxis: {
          title: 'Price'
        }
      }}
    />
  )
}

function LoggedInView({setIsLoggedIn, setUserData, userData}) {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [roomUserData, setRoomUserData] = useState('');
  const [bboHistory, setBBOHistory] = useState(
    {
      bb_t:[], bb_p:[], bo_t:[], bo_p:[], /* Actual data points */
      bt:[], bp:[], ot:[], op:[], /* Contains extra points to aid graphing */
    });
  const [lastDones, setLastDones] = useState(
    {buy_t:[], buy_p:[], sell_t:[], sell_p:[]}
  );
  const [orderData, setOrderData] = useState(
    {
      bids:{}, 
      asks:{}
    });

  useEffect(() => {
    const socketio = io('https://live-order-book-backend-287349709563.us-central1.run.app/');

    socketio.on('update_user_data', (data) => {
      setUserData(data);
    })

    socketio.on('update_roomuser_data', (data) => {
      setRoomUserData(data);
    })

    socketio.on('update_bbo_history', (data) => {
      setBBOHistory(prev => {
        return {
          bb_t: prev.bb_t.concat(data.bb_t),
          bb_p: prev.bb_p.concat(data.bb_p),
          bo_t: prev.bo_t.concat(data.bo_t),
          bo_p: prev.bo_p.concat(data.bo_p),
          bt: prev.bt.concat(data.bt),
          bp: prev.bp.concat(data.bp),
          ot: prev.ot.concat(data.ot),
          op: prev.op.concat(data.op),
        };
      });
    })

    socketio.on('update_ld_history', (data) => {
      setLastDones(prev => ({
        buy_t:[...prev.buy_t, ...data.buy_t],
        buy_p:[...prev.buy_p, ...data.buy_p],
        sell_t:[...prev.sell_t, ...data.sell_t],
        sell_p:[...prev.sell_p, ...data.sell_p]
      }));
    })

    socketio.on('update_order_book', (data) => {
      setOrderData(prev => {
        let d = {...prev}
        d.bids = {...d.bids}
        d.asks = {...d.asks}
        if (data.side) {
          d.bids[data.limit] = (d.bids[data.limit] || 0) + data.quantity
        }
        else {
          d.asks[data.limit] = (d.asks[data.limit] || 0) + data.quantity
        }
        return d;
      })
    })

    setSocket(socketio);

    return () => {
      socketio.off('update_user_data');
      socketio.off('update_bbo_history');
      socketio.off('update_ld_history');
      socketio.off('update_order_book');
      socketio.disconnect();
    }
  }, []);

  return (
    roomId ? (
      <RoomView socket={socket} roomUserData={roomUserData} bboHistory={bboHistory} 
      lastDones={lastDones} orderData={orderData} setRoomId={setRoomId}/>
    ) : (
      <SelectRoomView socket={socket} userData={userData} setIsLoggedIn={setIsLoggedIn} setRoomId={setRoomId} 
      setRoomUserData={setRoomUserData} setBBOHistory={setBBOHistory} setLastDones={setLastDones} setOrderData={setOrderData}/>
    )
  )
}

function SelectRoomView({
    socket, userData, setIsLoggedIn, setRoomId, setRoomUserData, setBBOHistory, setLastDones, setOrderData
  }) 
{
  const [createRoomName, setCreateRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [yourRoomSelection, setYourRoomSelection] = useState('');

  function joinRoom(room_id) {
    socket.emit('join-room', room_id, userData.user_id, response => {
      setRoomUserData(response.user_data)
      setBBOHistory(response.bbo_history)
      setLastDones(response.ld_history)
      setOrderData(response.order_book)
      setRoomId(response.room_id)
    })
  }

  function yourRoomsSubmit(e) {
    e.preventDefault();
    if (yourRoomSelection !== '') {
      joinRoom(yourRoomSelection);
    }
  }

  function joinRoomSubmit(e) {
    e.preventDefault();
    if (joinRoomId.trim() !== "") {
      joinRoom(joinRoomId);
    }
  }
  
  function createRoomSubmit(e) {
    e.preventDefault();
    if (createRoomName.trim() !== "") {
      socket.emit('create-room', createRoomName, response => {
        joinRoom(response);
      });
    }
  } 

  const yourRoomsList = userData.rooms.map(room => 
    <option value={room}>
      {room}
    </option>
  )
  return (
    <div className="row">
      <div className="column">
        <h3>Create room</h3>
        <form onSubmit={createRoomSubmit}>
          <input type="text" value={createRoomName} 
          placeholder="Room Name" onChange={(e)=>setCreateRoomName(e.target.value)} /> <br></br>
          <button type="submit">Go!</button>
        </form>
      </div>
      <div className="column">
        <h3>Join room</h3>
        <form onSubmit={joinRoomSubmit}>
          <input type="text" value={joinRoomId} 
          placeholder="Room ID" onChange={(e)=>setJoinRoomId(e.target.value)} /> <br></br>
          <button type="submit">Go!</button>
        </form>
      </div>
      <div className="column">
        <h3>Your rooms</h3>
        <button onClick={() => setIsLoggedIn(false)}>Logout</button>
        <form onSubmit={yourRoomsSubmit}>
          <label>Select a room:</label>
          <select value={yourRoomSelection} onChange={(e)=>setYourRoomSelection(e.target.value)}>
            <option value=""></option>
            {yourRoomsList}
          </select> <br></br>
          <button type="submit">Go!</button>
        </form>
      </div>
    </div>
  )
}

function RoomView({socket, roomUserData, bboHistory, lastDones, orderData, setRoomId}) {
  const [quickSendVolume, setQuickSendVolume] = useState(1);
  return (
    <>
    <div className="row">
      <div className="column">
        <UserDataPanel socket={socket} roomUserData={roomUserData} setRoomId={setRoomId} />
      </div>
      <div className="column">
        <BuyForm socket={socket} />
        <br></br>
        <SellForm socket={socket} />
        <br></br>
        <PriceHistory bboHistory={bboHistory} lastDones={lastDones}/>
      </div>
      <div className="column">
      </div>
    </div>
    <div className="row">
      <div className="wrapper">
        <input type="text" value={quickSendVolume} placeholder="Volume" onChange={(e)=>setQuickSendVolume(e.target.value)} />
        <OrderBook socket={socket} orderData={orderData} ownVolume={roomUserData.orders} volume={quickSendVolume}/>
      </div>
    </div>
    </>
  )
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(''); /* {user_id, rooms} */

  return (
    <div className="App">
      {
        isLoggedIn ? (
          <LoggedInView setIsLoggedIn={setIsLoggedIn} setUserData={setUserData} userData={userData}/>
        ) : (
          <LoginForm setIsLoggedIn={setIsLoggedIn} setUserData={setUserData}/>
        )
      }
    </div>
  );
}

export default App;
