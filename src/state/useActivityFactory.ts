import { DefaultValue, selector, useSetRecoilState } from "recoil";
import { v4 } from "uuid";
import {
  Activity,
  storedActivities,
  storedIds,
  SyncStatus,
} from "./myActivities";

export type CreateActivityProps = Omit<Activity, "uuid" | "status">;
type ActivityFactory = (activity: CreateActivityProps) => void;
export const useActivityFactory = (): ActivityFactory => {
  const create = useSetRecoilState(newActivity);

  return (props) => create(props);
};

const newActivity = selector<CreateActivityProps | null>({
  key: "newActivitySelector",
  get: () => null,
  set: ({ get, set }, props) => {
    if (!props || props instanceof DefaultValue) return;
    const uuid = v4();
    const idsWithNew = Array.from(new Set([...get(storedIds), uuid])).sort();

    set(storedIds, idsWithNew);
    set(storedActivities(uuid), {
      ...props,
      uuid,
      status: SyncStatus.NEW,
    });
  },
});
