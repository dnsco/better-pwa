import React, { useRef } from "react";
import { useRecoilState } from "recoil";
import "./App.css";
import {
  Activity,
  apiState,
  localMyActivities,
  SyncStatus,
} from "../state/myActivities";
import { Frequency } from "../api/responseTypes";
import { OauthApi } from "../api/oauthApi";
import { nullApi } from "../api/nullApi";

export function ActivitiesForm(): JSX.Element {
  const [activities, setActivities] = useRecoilState(localMyActivities);
  const [_, setApiState] = useRecoilState(apiState);

  const oauthTokenInput = useRef<HTMLInputElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  const setOauthToken = () => {
    const token = oauthTokenInput.current?.value;
    const newApi = token ? new OauthApi(token) : nullApi;

    setApiState(newApi);
  };

  const createNewActivity = () => {
    const activity: Activity = {
      frequency: Frequency.DAILY,
      uuid: "asdlkj", // todo make actual uuid here
      name: nameInput.current?.value ?? "New Activity",
      status: SyncStatus.NEW,
    };

    setActivities(activities.concat(activity));
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
