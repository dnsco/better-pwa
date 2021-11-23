import React, { useRef } from "react";
import { useRecoilState } from "recoil";
import "./App.css";
import { Frequency } from "../api/responseTypes";
import { useMyActivities } from "../state/useMyActivities";
import { oauthState } from "../state/oauthState";

export function ActivitiesForm(): JSX.Element {
  const [activities, addNewActivity] = useMyActivities();
  const [oauthToken, setOauth] = useRecoilState(oauthState);

  const oauthTokenInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  const createNewActivity = () => {
    addNewActivity({
      name: nameInput.current?.value ?? "New Activity",
      frequency: Frequency.DAILY,
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <div>
            <input
              ref={oauthTokenInput}
              value={oauthToken}
              type="text"
              aria-label="oauth"
              placeholder="oauth token"
              onChange={() => setOauth(oauthTokenInput.current?.value)}
            />
          </div>

          <input
            ref={nameInput}
            type="text"
            aria-label="name"
            placeholder="name"
          />
          <button onClick={createNewActivity} aria-label="create" type="button">
            Create
          </button>
          <div>
            {activities.map((a) => (
              <div
                data-testid={`activity-${a.name}`}
                data-uuid={a.uuid}
                key={a.uuid}
              >
                {a.name}
              </div>
            ))}
          </div>
        </div>
      </header>
    </div>
  );
}
