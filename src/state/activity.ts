import { SetterOrUpdater } from "recoil";
import { v4 } from "uuid";
import { ApiActivity } from "../api/responseTypes";

export interface Activity extends Omit<ApiActivity, "id"> {
  status: SyncStatus;
  id?: number | undefined;
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
