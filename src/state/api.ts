import { Activity } from "./myActivities";

export enum ResponseKind {
  SUCCESS = "success",
  ERROR = "error",
}

export const { SUCCESS, ERROR } = ResponseKind;

export type SuccessResponse<T> = { kind: typeof SUCCESS; data: T };
export type ErrorResponse = { kind: typeof ERROR; error: Error };

export type ApiPromise<T> = Promise<SuccessResponse<T> | ErrorResponse>;

export interface Api {
  myActivities(): ApiPromise<Activity[]>;
}

export const nullApi: Api = {
  myActivities(): ApiPromise<Activity[]> {
    return Promise.resolve({ kind: SUCCESS, data: [] });
  },
};
