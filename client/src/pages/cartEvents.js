// src/cartEvents.js
export const cartEvent = new EventTarget();

export const emitCartUpdate = () => {
  cartEvent.dispatchEvent(new Event("cartUpdated"));
};
