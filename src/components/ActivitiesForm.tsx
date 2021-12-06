import React, { useRef } from "react";
import { useRecoilState } from "recoil";
import "./App.css";
import { useMergedActivities } from "../state/hooks/useMergedActivities";
import { oauthState } from "../state/oauthState";
import { useActivityFactory } from "../state/hooks/useActivityFactory";
import { Frequency } from "../api/base";
import { Activity } from "../state/myActivities";
import {
  ActivityCompletion,
  useActivityCompletions,
} from "../state/hooks/useActivityCompletions";

export function ActivitiesForm(): JSX.Element {
  const activities = useMergedActivities();
  const addNewActivity = useActivityFactory();
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
              <ActivitySection activity={a} key={a.uuid} />
            ))}
          </div>
        </div>
      </header>
    </div>
  );
}

const ActivitySection: React.FC<{ activity: Activity }> = ({ activity }) => {
  const completions = useActivityCompletions(activity.uuid);

  return (
    <div data-testid={`activity-${activity.name}`} data-uuid={activity.uuid}>
      {activity.name}
      <ol>
        {completions.map((c) => (
          <li key={c.uuid}>{c.doneAt.toISOString()}</li>
        ))}
      </ol>
    </div>
  );
};
