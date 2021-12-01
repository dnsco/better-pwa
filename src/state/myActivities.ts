import { atom, AtomEffect, atomFamily } from "recoil";
import { recoilPersist } from "recoil-persist";
import { ApiActivity, Frequency, UUID } from "../api/responseTypes";
import { apiState } from "./oauthState";
import { SUCCESS } from "../api/base";

export interface Activity extends Omit<ApiActivity, "id"> {
  status: SyncStatus;
  id?: number | undefined;
}

export enum SyncStatus {
  NEW = "new",
  SYNCED = "synced",
}

const { persistAtom } = recoilPersist({ key: "recoil-my-activities" });

export const storedActivities = atomFamily<Activity, UUID>({
  key: "myActivities",
  default: (uuid) => ({ ...DEFAULT_ACTIVITY, uuid }),
  effects_UNSTABLE: (uuid): AtomEffect<Activity>[] => {
    return [persistAtom, createNew(uuid)];
  },
});

const createNew: (uuid: UUID) => AtomEffect<Activity> =
  (_: UUID) =>
  ({ setSelf, getLoadable, onSet }) => {
    onSet((newValue) => {
      // if oldValue === null && newValue.state === NEW
      const api = getLoadable(apiState).valueOrThrow();

      if (newValue.status === SyncStatus.NEW) {
        api.createActivity(newValue).then((resp) => {
          if (resp.kind === SUCCESS) {
            setSelf({ ...newValue, ...resp.data, status: SyncStatus.SYNCED });
          } else {
            // todo: better error handling on response, but that's for later.
            // eslint-disable-next-line no-console
            console.error(resp.error);
          }
        });
      }
    });
  };

const DEFAULT_ACTIVITY: Omit<Activity, "uuid"> = {
  frequency: Frequency.DAILY,
  name: "New Default",
  status: SyncStatus.SYNCED,
};

export const storedIds = atom<UUID[]>({
  key: "localActivityIds",
  default: [],
  effects_UNSTABLE: [persistAtom],
});
