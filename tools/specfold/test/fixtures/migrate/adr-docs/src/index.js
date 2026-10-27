import { listOrders } from "./orders.js";

export function handle(path) {
  return path === "/orders" ? listOrders() : null;
}
