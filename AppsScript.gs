// Reemplazo inofensivo de firebase/firestore.
// Permite que App.tsx siga usando collection/onSnapshot/doc/setDoc sin conectarse
// a ninguna base de datos. Todo lo relativo a Firestore queda neutralizado.

export const collection = (..._args: any[]): any => ({ __stub: "collection" });

export const doc = (..._args: any[]): any => ({ __stub: "doc" });

export const setDoc = async (..._args: any[]): Promise<void> => {
  // No hace nada: el envío real va a Google Sheets vía Apps Script.
  return;
};

// onSnapshot: no emite datos y devuelve una función de desuscripción vacía.
export const onSnapshot = (
  _ref: any,
  _onNext?: (snap: any) => void,
  _onError?: (err: any) => void
): (() => void) => {
  return () => {};
};
