import {useState} from 'react'
import Plot from 'react-plotly.js'
import * as util from './util.js'

export function BuyForm({socket}) {
  const [limitInput, setLimitInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e) {
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

export function SellForm({socket}) {
  const [limitInput, setLimitInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e) {
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

export function UserDataPanel({socket, roomUserData}) {

  function handleDeleteOrder(side, order_id) {
    socket.emit('delete', side, order_id);
  }

  const orderList = roomUserData.orders.map(order => 
    <p>
      {order.creation_time}: {order.side} {order.quantity} @ {order.limit_price} 
      <button onClick={() => handleDeleteOrder(order.side, order.id)}>Delete Order</button>
    </p>
  );

  const tradeList = roomUserData.trades.map(trade => 
    <p>{trade.buyer_id} {trade.seller_id} {trade.volume} LOTS @ {trade.price}</p>
  );

  return (
    <>
      <p>Username: {roomUserData.username}</p>
      <p>User ID: {roomUserData.user_id}</p>
      <p>Cash: {roomUserData.cash}</p>
      <p>Position: {roomUserData.position}</p>
      Orders: <ul>{orderList}</ul>
      Trades: <ul>{tradeList}</ul>
    </>
  )
}

export function OrderBook({socket, orderData, ownVolume, volume}) {
  
  function sendBid(limit) {
    socket.emit('buy', limit, volume || "0")
  }

  function sendAsk(limit) {
    socket.emit('sell', limit, volume || "0")
  }
  
  let ownBidVolume = {}
  let ownAskVolume = {}
  ownVolume.forEach(e => {
    if (e.side == 'B') {
      ownBidVolume[Math.floor(e.limit_price)] = (ownBidVolume[Math.floor(e.limit_price)] || 0) + e.quantity
    }
    else if (e.side == 'S') {
      ownAskVolume[Math.floor(e.limit_price)] = (ownAskVolume[Math.floor(e.limit_price)] || 0) + e.quantity
    }
  });

  const rows = Array(100).fill().map((_,ind) => { 
    let i = 99 - ind;
    return (
    <tr>
      <td>{ownBidVolume[i] || ""}</td>
      <td onClick={() => sendBid(i)}>{(orderData.bids[i]==null || orderData.bids[i]==0) ? "" : orderData.bids[i]}</td>
      <td>{i}</td>
      <td onClick={() => sendAsk(i)}>{(orderData.asks[i]==null || orderData.asks[i]==0) ? "" : orderData.asks[i]}</td>
      <td>{ownAskVolume[i] || ""}</td>
    </tr>
    )
  }
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

export function PriceHistory({bboHistory, lastDones}) {
  console.log(bboHistory);
  const ld = util.reduceLastDones(lastDones);
  const bbo = util.reduceBBOHistory(bboHistory);
  const line_t = util.repeatElements(bbo.t)

  return (
    <Plot 
      data={[
        {
          x: ld.buy_t,
          y: ld.buy_p,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'green', symbol: 'triangle-up', size: 9},
          name: 'Last done buy aggressor',
        },
        {
          x: ld.sell_t,
          y: ld.sell_p,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'red', symbol: 'triangle-down', size: 9},
          name: 'Last done sell aggressor'
        },
        {
          x: bbo.t,
          y: bbo.bp,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'purple'},
          name: 'Best bid'
        },
        {
          x: bbo.t,
          y: bbo.op,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'purple'},
          name: 'Best offer'
        },
        {
          x: line_t.slice(1),
          y: util.repeatElements(bbo.bp).slice(0, -1),
          type: 'scatter',
          mode: 'lines',
          marker: {color: 'purple'},
          showlegend: false,
          hoverinfo: 'skip'
        },
        {
          x: line_t.slice(1),
          y: util.repeatElements(bbo.op).slice(0, -1),
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
