export enum ResponseKind {
  SUCCESS = "success",
  ERROR = "error",
}

export const { SUCCESS, ERROR } = ResponseKind;

export type SuccessResponse<T> = { kind: typeof SUCCESS; data: T };
export type ErrorResponse = { kind: typeof ERROR; error: Error };

export type ApiPromise<T> = Promise<SuccessResponse<T> | ErrorResponse>;

export interface Api {
  myActivities(): ApiPromise<ApiActivity[]>;
}

export const nullApi: Api = {
  myActivities(): ApiPromise<ApiActivity[]> {
    return Promise.resolve({ kind: SUCCESS, data: [] });
  },
};

export interface ApiActivity {
  name: string;
}
export class OauthApi implements Api {
  oauthToken: string;

  constructor(oauthToken: string) {
    this.oauthToken = oauthToken;
  }

  myActivities(): ApiPromise<ApiActivity[]> {
    const url = "https://better.ngrok.io/api/v0/activities";
    return this.parseResponse(url);
  }

  private parseResponse<T>(url: string): ApiPromise<T> {
    const token = this.oauthToken;
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (resp) => {
        if (resp.ok) {
          return resp.json();
        }
        throw resp;
      })
      .then(
        (json) => ({ kind: SUCCESS, data: json }),
        (e): ErrorResponse => ({ kind: ERROR, error: e })
      );
  }
}
