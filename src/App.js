import './App.css';
import {useState, useEffect} from 'react'
import * as RC from './RoomComponents.js'
import { ThemeProvider } from './ThemeContext.js';
import Navbar from './Navbar.js'
import About from './about.js'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { io } from 'socket.io-client';

/*const BACKEND_URL = process.env.REACT_APP_MODE === 'PROD' ? 'https://live-order-book-backend-287349709563.us-central1.run.app' : 'http://127.0.0.1:8080';*/
const BACKEND_URL = 'https://live-order-book-backend-287349709563.us-central1.run.app';
/*const BACKEND_URL = 'http://127.0.0.1:8080';*/

function LoginForm({setIsLoggedIn, setUserData}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (username.trim() !== '' && password.trim() !== '') {
      
      const response = await fetch(`${BACKEND_URL}/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: username, password: password})
      });
      const data = await response.json();
      
      if (data.status) {
        console.log(data);
        setUserData(data);
        setIsLoggedIn(true);
      }
      else {
        setLoginMessage('Username taken / Wrong password');
      }
    }
  }

  return (
    <div>
      <h2>Login</h2>
      <p>If the username is found, you will be logged in. Otherwise, a new account will be created.</p> 
      <form onSubmit={handleSubmit}>
        <input type="text" value={username} placeholder="Username" onChange={(e)=>setUsername(e.target.value)}/><br/>
        <input type="password" value={password} placeholder="Password" onChange={(e)=>setPassword(e.target.value)}/><br/>
        <button type="submit">Submit</button>
      </form>
      {loginMessage}
    </div>
  )
}

function LoggedInView({setIsLoggedIn, setUserData, userData}) {
  const [socket, setSocket] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);
  const [roomUserData, setRoomUserData] = useState('');
  const [bboHistory, setBBOHistory] = useState([]);
  const [lastDones, setLastDones] = useState([]);
  const [orderData, setOrderData] = useState({ bids: {}, asks: {} });
  const [playerData, setPlayerData] = useState([]);

  const joinRoomState = {roomInfo, roomUserData, bboHistory, lastDones, orderData, playerData};
  const joinRoomSetters = {setRoomInfo, setRoomUserData, setBBOHistory, setLastDones, setOrderData, setPlayerData};

  useEffect(() => {
    const socketio = io(BACKEND_URL, {
        transports: ['websocket'], 
        auth: {token: userData.token, profile_id: userData.profile_id}
      });

    socketio.on('update_user_data', (data) => {
      setUserData(prev => ({...prev, ...data}));
    })

    socketio.on('update_roomuser_data', (data) => {
      setRoomUserData(data);
    })

    socketio.on('update_bbo_history', (data) => {
      setBBOHistory(prev => [...prev, data]);
    })

    socketio.on('update_ld_history', (data) => {
      setLastDones(prev => [...prev, data]);
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

    socketio.on('update_player_data', (data) => {
      setPlayerData(prev => ({...prev, ...{[data.username]:data}}));
    })

    setSocket(socketio);

    return () => {
      socketio.off('update_user_data');
      socketio.off('update_roomuser_data');
      socketio.off('update_bbo_history');
      socketio.off('update_ld_history');
      socketio.off('update_order_book');
      socketio.off('update_player_data');
      socketio.disconnect();
    }
  }, []);

  return (
    roomInfo ? (
      <RoomView socket={socket} joinRoomState={joinRoomState} setRoomInfo={setRoomInfo}/>
    ) : (
      <SelectRoomView socket={socket} userData={userData} setIsLoggedIn={setIsLoggedIn} joinRoomSetters={joinRoomSetters}/>
    )
  )
}

function SelectRoomView({
    socket, userData, setIsLoggedIn, joinRoomSetters
  }) 
{
  const {setRoomInfo, setRoomUserData, setBBOHistory, setLastDones, setOrderData, setPlayerData} = joinRoomSetters;
  const [createRoomName, setCreateRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [yourRoomSelection, setYourRoomSelection] = useState('');
  const [message, setMessage] = useState('');

  function joinRoom(join_code) {
    socket.emit('join-room', join_code.trim(), response => {
      if (response.status) {
        setRoomUserData(response.user_data)
        setBBOHistory(response.bbo_history)
        setLastDones(response.ld_history)
        setOrderData(response.order_book)
        setPlayerData(response.player_data)
        setRoomInfo(response.room_info)
      } else {
        setMessage('Could not find room ID')
      }
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
    <option value={room.join_code}>
      {room.join_code}: {room.room_name}
    </option>
  )
  return (
    <div className="container1col">
      <button style={{width:'12%', minWidth:'85px', float: 'right'}} onClick={() => setIsLoggedIn(false)}>Logout</button>
      <h2>Create room</h2>
      <form onSubmit={createRoomSubmit}>
        <input type="text" value={createRoomName} 
        placeholder="Room Name" onChange={(e)=>setCreateRoomName(e.target.value)} />
        <button type="submit">Go!</button>
      </form>
      <h2>Join room</h2>
      <form onSubmit={joinRoomSubmit}>
        <input type="text" value={joinRoomId} 
        placeholder="Room ID" onChange={(e)=>setJoinRoomId(e.target.value)} />
        <button type="submit">Go!</button>
      </form>
      {message}
      <h2>Your rooms</h2>
      <form onSubmit={yourRoomsSubmit}>
        <select value={yourRoomSelection} onChange={(e)=>setYourRoomSelection(e.target.value)}>
          <option value="" selected disabled>Select a room</option>
          {yourRoomsList}
        </select>
        <button type="submit">Go!</button>
      </form>
    </div>
  )
}

function RoomView({socket, joinRoomState, setRoomInfo}) {
  const {roomInfo, roomUserData, bboHistory, lastDones, orderData, playerData} = joinRoomState;
  const [popupOpen, setPopupOpen] = useState(0);

  function handleExit() {
    socket.emit('exit-room');
    setRoomInfo(null);
  }

  return (
    <div className='room-layout'>
      <RC.RoomMenu handleExit={handleExit} setPopupOpen={setPopupOpen}/>
      <div className='container2col'>
        <RC.UserDataPanel roomUserData={roomUserData} />
        <div>
          <RC.BuyForm socket={socket} />
          <RC.SellForm socket={socket} />
        </div>
        <RC.OrderBook socket={socket} orderData={orderData} ownVolume={roomUserData.orders}/>
      </div>

      {popupOpen == 1 && (
        <RC.Popup popupOpen={popupOpen} setPopupOpen={setPopupOpen}>
          <RC.PriceHistory bboHistory={bboHistory} lastDones={lastDones}/>
        </RC.Popup>
      )}

      {popupOpen == 2 && (
        <RC.Popup popupOpen={popupOpen} setPopupOpen={setPopupOpen}>
          <RC.Orders socket={socket} orders={roomUserData.orders}/>
        </RC.Popup>
      )}

      {popupOpen == 3 && (
        <RC.Popup popupOpen={popupOpen} setPopupOpen={setPopupOpen}>
          <RC.Trades trades={roomUserData.trades}/>
        </RC.Popup>
      )}

      {popupOpen == 4 && (
        <RC.Popup popupOpen={popupOpen} setPopupOpen={setPopupOpen}>
          <RC.RoomInfo roomInfo={roomInfo} playerData={playerData}/>
        </RC.Popup>
      )}
    </div>
  )
}

function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(''); /* {status, profile_id, token, rooms={join_code, room_name, creation_time}} */
  
  return (
    <div className='App'>
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
    <ThemeProvider>
      <Router>
        <Navbar/>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
