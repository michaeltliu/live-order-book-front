import { Link } from "react-router-dom";
import {ThemeButton} from "./ThemeContext"

export default function Navbar() {
  return (
    <div class="navbar">
      <Link to="/" style={{padding: "8px 10px"}}>Home</Link>
      <Link to="/about" style={{padding: "8px 10px"}}>About</Link>
      <ThemeButton/>
    </div>
  )
}