import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { RecoilRoot } from "recoil";
import { ActivitiesForm } from "./ActivitiesForm";
import { Activity } from "../state";

describe("THE APP", () => {
  test("you can create a thing and it goes in local storage", () => {
    const app = render(
      <RecoilRoot>
        <ActivitiesForm />
      </RecoilRoot>
    );

    const name = app.getByLabelText("name") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "YES" } });
    fireEvent.click(app.getByLabelText("create"));
    expect(screen.getByTestId("activity-YES")).toBeInTheDocument();

    const { activities = [] } = recoilLocalStorage();
    expect(activities[0]?.name).toBe("YES");
  });
});

function recoilLocalStorage(): { activities?: Activity[] } {
  return JSON.parse(localStorage.getItem("recoil-persist") || "{}");
}
