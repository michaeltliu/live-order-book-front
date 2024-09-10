import './App.css';
import {useState, useEffect} from 'react'
import {BuyForm, SellForm, UserDataPanel, OrderBook, PriceHistory} from './RoomComponents.js'
import About from './about.js'
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import { io } from 'socket.io-client';

const BACKEND_URL = 'https://live-order-book-backend-287349709563.us-central1.run.app'
/* const BACKEND_URL = 'http://127.0.0.1:8080' */

async function requestOrderBook(setOrderData) {
  const response = await fetch(`${BACKEND_URL}/order-book`);
  const data = await response.json();
  setOrderData(data);
}

async function requestRoomUserData(room_id, user_id, setRoomUserData) {
  const response = await fetch(`${BACKEND_URL}/user-data/${room_id}/${user_id}`);
  const data = await response.json();
  setRoomUserData(data);
}

function LoginForm({setIsLoggedIn, setUserData}) {
  const [input, setInput] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (input.trim() !== "") {
      
      const response = await fetch(`${BACKEND_URL}/login/${input}`);
      const data = await response.json();
      setUserData(data);
      setIsLoggedIn(true);
    }
  }

  return (
    <header className="App-header">
      <Link to="/about">About</Link>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" value={input} placeholder="Username" onChange={(e)=>setInput(e.target.value)}>
        </input>
        <button type="submit">Submit</button>
      </form>
    </header>
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
    const [gameInfo, setGameInfo] = useState(

    )

  useEffect(() => {
    const socketio = io(BACKEND_URL);

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
    if (joinRoomId.trim() !== '') {
      joinRoom(joinRoomId);
    }
  }
  
  function createRoomSubmit(e) {
    e.preventDefault();
    if (createRoomName.trim() !== '') {
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

function Home() {
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Router>
  );
}

export default App;
