# The Little Bridge Challenge — Formulario (versión para AI Studio, sin Firebase)

Proyecto React + Vite listo para **subir a Google AI Studio como proyecto nuevo**
(no requiere Remix del proyecto anterior).

## Qué cambió respecto del original
- **Se quitó Firebase por completo.** Ya no intenta conectarse a Firestore
  (era la causa de que las respuestas no se guardaran).
- Las respuestas se envían **directamente a Google Sheets** mediante un
  Google Apps Script, cuya URL ya está incrustada en `src/App.tsx`.
- El bundle es más liviano y no pide login de Google ni base de datos.

## Cómo usarlo en AI Studio
1. En AI Studio: crear proyecto nuevo e **importar/subir este ZIP**.
2. Abrir el **Preview**. El formulario ya funciona y envía a la planilla.
3. Para probar: completar una respuesta y revisar la planilla de Google
   (debería aparecer la hoja "Respuestas" con la fila, y una hoja "LOG").

## Requisito del lado de la planilla (una sola vez)
El Apps Script debe estar implementado como **Aplicación web** en la planilla,
con "Ejecutar como: Yo" y "Quién tiene acceso: Cualquier usuario". La URL
/exec de esa implementación debe coincidir con la que está en src/App.tsx
(constante ENV_SHEETS_WEBHOOK_URL). Si cambia, actualizar esa línea.

## Cambiar la URL del Apps Script (si hiciera falta)
Editar src/App.tsx, buscar ENV_SHEETS_WEBHOOK_URL y reemplazar la URL
entre comillas por la nueva.

## El Apps Script
El script que va en la planilla está incluido aparte como
AppsScript.gs (junto a este ZIP en la entrega).

## Nota
Las funciones de Firebase quedaron como "stubs" inofensivos en
src/lib/firebase.ts, src/lib/googleSheets.ts y src/lib/firestoreStub.ts
solo para no romper imports. No se conectan a ningún servicio.
