import { Api, ApiPromise, apiPromiseSuccess } from "./base";
import { ApiActivity, UUID } from "./responseTypes";

export const nullApi: Api = {
  myActivities(): ApiPromise<ApiActivity[]> {
    return apiPromiseSuccess([]);
  },

  createActivity(
    _name: string,
    _uuid: UUID,
    _frequency: number
  ): ApiPromise<ApiActivity> {
    return new Promise(() => {
      throw Error("Failed to create activitiy in NullApi");
    }); // return a pending promise.
  },
};
