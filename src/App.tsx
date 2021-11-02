import React from "react";
import { useRecoilState } from "recoil";
import "./App.css";
import { counterState } from "./state";

export function App(): JSX.Element {
  const [count, setCount] = useRecoilState(counterState);

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <p>Counter: {count}</p>
          <button onClick={() => setCount(count + 1)} type="button">
            Increase
          </button>
          <button onClick={() => setCount(count - 1)} type="button">
            Decrease
          </button>
        </div>
      </header>
    </div>
  );
}
