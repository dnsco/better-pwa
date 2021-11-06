import React, { useRef } from "react";
import { useRecoilState } from "recoil";
import "./App.css";
import {
  Activity,
  allActivities,
  apiState,
  SyncStatus,
} from "../state/myActivities";
import { Frequency } from "../api/responseTypes";
import { OauthApi } from "../api/oauthApi";
import { nullApi } from "../api/nullApi";

export function ActivitiesForm(): JSX.Element {
  const [activities, addNewActivity] = useRecoilState(allActivities);
  const [_, setApiState] = useRecoilState(apiState);

  const oauthTokenInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  const setOauthToken = () => {
    const token = oauthTokenInput.current?.value;
    const newApi = token ? new OauthApi(token) : nullApi;

    setApiState(newApi);
  };

  const createNewActivity = () => {
    const name = nameInput.current?.value ?? "New Activity";

    const activity: Activity = {
      frequency: Frequency.DAILY,
      uuid: `asdlkj-${name}-${new Date().valueOf()}`, // todo make actual uuid here
      name,
      status: SyncStatus.NEW,
    };

    addNewActivity([activity]);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <div>
            <input
              ref={oauthTokenInput}
              type="text"
              aria-label="oauth"
              placeholder="oauth token"
              onChange={setOauthToken}
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
