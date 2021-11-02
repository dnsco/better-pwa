import React from 'react';
import logo from './logo.svg';
import './App.css';
import { useRecoilState} from 'recoil'
import {counterState} from "./state";


function App() {
    const [count, setCount] = useRecoilState(counterState)

    return (
            <div className="App">
                <header className="App-header">
                    <img src={logo} className="App-logo" alt="logo"/>
                    <p>
                        Counter: {count}
                        <button onClick={() => setCount(count + 1)}>Increase</button>
                        <button onClick={() => setCount(count - 1)}>Decrease</button>
                    </p>
                    <a
                        className="App-link"
                        href="https://reactjs.org"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Learn React
                    </a>
                </header>
            </div>
    );
}

export default App;
