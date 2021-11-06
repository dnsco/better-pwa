import { Api, ApiPromise, apiPromiseSuccess } from "./base";
import { ApiActivity } from "./responseTypes";
import { Activity, SyncStatus } from "../state/myActivities";

export const nullApi: Api = {
  myActivities(): ApiPromise<ApiActivity[]> {
    return apiPromiseSuccess([]);
  },

  createActivity(a: Activity): ApiPromise<ApiActivity> {
    return apiPromiseSuccess({
      ...a,
      status: SyncStatus.SYNCED,
    });
  },
};
