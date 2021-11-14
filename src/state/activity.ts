import { SetterOrUpdater } from "recoil";
import { v4 } from "uuid";
import { ApiActivity } from "../api/responseTypes";

export interface Activity extends ApiActivity {
  status: SyncStatus;
}

export enum SyncStatus {
  NEW = "new",
  SYNCED = "synced",
}

export type CreateActivityProps = Omit<Activity, "uuid" | "status">;
export type ActivityFactory = (activity: CreateActivityProps) => void;

export function createActivityFactory(
  setActivities: SetterOrUpdater<Activity[]>
): ActivityFactory {
  return (props) => {
    const activity: Activity = {
      ...props,
      uuid: v4(),
      status: SyncStatus.NEW,
    };
    setActivities([activity]);
  };
}

// export const createActivityEffect: AtomEffect<Activity[]> = ({
//   onSet,
//   setSelf,
//   getLoadable,
// }) => {
//   onSet((newValue) => {
//     // eslint-disable-next-line no-console
//     console.log("DOING IT");
//     const newActivities = newValue.filter((a) => a.status === SyncStatus.NEW);
//     const api = getLoadable(apiState).valueOrThrow();
//     newActivities.forEach((a) => {
//       api.createActivity(a).then(() => {
//         // todo sync from response
//         const activity: Activity = { ...a, status: SyncStatus.SYNCED };
//         setSelf([activity]);
//       });
//     });
//   });
// };
