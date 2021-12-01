import {
  Api,
  ApiActivity,
  ApiActivityCompletion,
  ApiPromise,
  ERROR,
  ErrorResponse,
  SUCCESS,
  UUID,
} from "./base";
import { Activity } from "../state/myActivities";

enum HTTPMethod {
  GET = "GET",
  POST = "POST",
}
const { GET, POST } = HTTPMethod;

export class OauthApi implements Api {
  oauthToken: string;

  constructor(oauthToken: string) {
    this.oauthToken = oauthToken;
  }

  myActivities(): ApiPromise<ApiActivity[]> {
    const url = "https://better.ngrok.io/api/v0/activities";
    return this.parseResponse(url);
  }

  createActivity(activity: Activity): ApiPromise<ApiActivity> {
    return this.parseResponse(
      "https://better.ngrok.io/api/v0/activities",
      POST,
      { activity }
    );
  }

  activityCompletions({
    activityId,
  }: {
    activityId: UUID;
  }): ApiPromise<ApiActivityCompletion[]> {
    return this.parseResponse(this.completionsUrl(activityId));
  }

  completeActivity(
    activityId: UUID,
    params: { doneAt: Date; uuid: UUID }
  ): ApiPromise<ApiActivityCompletion> {
    return this.parseResponse(this.completionsUrl(activityId), POST, {
      completion: {
        done_at: params.doneAt,
        uuid: params.uuid,
      },
    });
  }

  completionsUrl = (activityId: string): string =>
    `https://better.ngrok.io/api/v0/activities/${activityId}/completions`;

  private parseResponse<T, B>(
    url: string,
    method: HTTPMethod = GET,
    postBody?: B
  ): ApiPromise<T> {
    const token = this.oauthToken;
    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    if (postBody) {
      options.body = JSON.stringify(postBody);
    }

    return fetch(url, options)
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
