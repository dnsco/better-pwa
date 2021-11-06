import { Api, ApiPromise, apiPromiseSuccess } from "./base";
import { ApiActivity, Frequency } from "./responseTypes";
import { Activity, SyncStatus } from "../state/myActivities";

function newActivity(name: string): Activity {
  return {
    frequency: Frequency.DAILY,
    name,
    status: SyncStatus.SYNCED,
    uuid: `asdlkajsd-${new Date().valueOf()}`,
  };
}

export const nullApi: Api = {
  myActivities(): ApiPromise<ApiActivity[]> {
    return apiPromiseSuccess([newActivity("Think"), newActivity("Live")]);
  },

  createActivity(a: Activity): ApiPromise<ApiActivity> {
    return apiPromiseSuccess({
      ...a,
      status: SyncStatus.SYNCED,
    });
  },
};
