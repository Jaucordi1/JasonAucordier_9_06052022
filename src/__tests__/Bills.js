/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import { screen, waitFor, fireEvent, queryByAttribute, getByTestId } from "@testing-library/dom";
import BillsUI                        from "../views/BillsUI.js";
import { ROUTES_PATH }                from "../constants/routes.js";
import { localStorageMock }           from "../__mocks__/localStorage.js";
import mockStore                      from "../__mocks__/store.js";
import { bills }                      from "../fixtures/bills.js";
import router                         from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);

const setup = async () => {
  localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
  const root = document.createElement("div");
  root.setAttribute("id", "root");
  document.body.append(root);
  router();
  return root;
};

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem("user", JSON.stringify({
        type: "Employee"
      }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");

      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
      // expect(windowIcon).toHaveClass("active-icon");
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates             = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
        .map(a => a.innerHTML);
      const antiChrono        = (a, b) => ((a < b) ? 1 : -1);
      const datesSorted       = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "a@a" }));
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      const getSpy  = jest.spyOn(mockStore, "bills");
      const bills   = await mockStore.bills().list();
      const content = await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(content).toBeTruthy();
      expect(getSpy).toBeCalled();
      expect(bills).toHaveLength(4);
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(
          window,
          "localStorage",
          { value: localStorageMock }
        );
        window.localStorage.setItem("user", JSON.stringify({
          type: "Employee",
          email: "a@a"
        }));
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("fetches bills from an API and fails with 404 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            }
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      test("fetches messages from an API and fails with 500 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            }
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
    describe("When I click on 'new bill' button", () => {
      it("Should redirect me on NewBill page", async () => {
        await setup();

        // Go to Bills page
        window.onNavigate(ROUTES_PATH.Bills);

        // Click on New Bill button
        const newBillBtn = screen.getByTestId("btn-new-bill");

        expect(window.location.hash).toBe(ROUTES_PATH.Bills);
        fireEvent["click"](newBillBtn);
        expect(window.location.hash).toBe(ROUTES_PATH.NewBill);
      });
    });
    describe("When I click on an eye icon", () => {
      test("Modal should open", async () => {
        const root = await setup();
        window.onNavigate(ROUTES_PATH.Bills);
        // Page loaded

        // At least 1 bill
        const eyeIcons = screen.getAllByTestId("icon-eye");
        const icon = eyeIcons[0];

        // Modal
        const modal = queryByAttribute("id", root, "modaleFile");
        const modalBody = queryByAttribute("class", modal, "modal-body");

        expect(modal).not.toBeVisible();
        // fireEvent["click"](icon);
        // expect(modal).toBeVisible();

        // Assertions
/*        expect(modalBody.innerHTML.trim()).toBe("");
        fireEvent["click"](icon);
        expect(modalBody.innerHTML.trim()).not.toBe("");*/
      });
    });
  });
});
