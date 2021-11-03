import React, { useRef } from "react";
import { useRecoilState } from "recoil";
import "./App.css";
import { localMyActivities } from "../state/myActivities";

export function ActivitiesForm(): JSX.Element {
  const [activities, setActivities] = useRecoilState(localMyActivities);
  const inputEl = useRef<HTMLInputElement>(null);
  return (
    <div className="App">
      <header className="App-header">
        <div>
          <input ref={inputEl} type="text" aria-label="name" />
          <button
            onClick={() =>
              setActivities(
                activities.concat({
                  name: inputEl.current?.value ?? "New Activity",
                })
              )
            }
            aria-label="create"
            type="button"
          >
            Create
          </button>
          <div>
            {activities.map((a) => (
              <div data-testid={`activity-${a.name}`} key={a.name}>
                {a.name}
              </div>
            ))}
          </div>
        </div>
      </header>
    </div>
  );
}
