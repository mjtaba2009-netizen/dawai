---
name: Dawai order flow
description: How the Dawai (دوائي) marketplace order/checkout/Kanban loop is wired and what is intentionally NOT enforced server-side.
---

**Checkout creates N orders** — Cart submits one `POST /api/orders` per line item (no order_items table, no multi-line order). Partial failure keeps failed lines in the cart and removes only succeeded ones.

**Gates are client-only (by design for the demo).** `PrescriptionModal` blocks checkout for Rx items in the UI, but `POST /api/orders` does **not** verify `requiresPrescription`, stock, or quantity, and patient order routes are hardcoded to `userId: 1` with forgeable base64 `id:phone` tokens. Direct API calls bypass the Rx gate and can oversell.
**Why:** this is a prototype with demo credentials; real auth/middleware, transactional stock decrement, and server-side Rx enforcement were explicitly out of scope. Treat these as the first hardening steps before any real deployment — don't assume they exist.

**OrderAutomationContext is wired but dormant.** It makes real backend calls (incl. a ~15s `POST /api/orders/timeout` reroute) and `OrderAutomationManager` is mounted in `App.tsx`, but nothing triggers it after the cart refactor (neither Cart nor Home calls `useOrderAutomation`). 
**How to apply:** if you re-enable automation, it will auto-change order status and **race the manual pharmacy Kanban** (OrdersBoard advances pending→confirmed→ready via `PUT /api/pharmacy/orders/:id/status`, polling 5s). Reconcile the two before turning it on.
