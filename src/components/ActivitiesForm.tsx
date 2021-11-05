import React, { useRef } from "react";
import { useRecoilState } from "recoil";
import "./App.css";
import { Activity, localMyActivities, SyncStatus } from "../state/myActivities";
import { Frequency } from "../api/responseTypes";

export function ActivitiesForm(): JSX.Element {
  const [activities, setActivities] = useRecoilState(localMyActivities);
  const inputEl = useRef<HTMLInputElement>(null);

  const createNewActivity = () => {
    const activity: Activity = {
      frequency: Frequency.DAILY,
      uuid: "asdlkj", // todo make actual uuid here
      name: inputEl.current?.value ?? "New Activity",
      status: SyncStatus.NEW,
    };

    setActivities(activities.concat(activity));
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <input ref={inputEl} type="text" aria-label="name" />
          <button onClick={createNewActivity} aria-label="create" type="button">
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
