// F11b — marcador estable de un destino de la barra inferior.
// Las pantallas reales declaran `testID="screen-<id>"` en su raíz; los marcos
// de F11 usan `destination-<id>` (DestinationFrame). El e2e espera cualquiera
// de los dos, así que sustituir un marco por su pantalla ya no rompe `shell.cjs`.
// El convenio lo vigila apps/mobile/tests/screens/destinationMarkers.test.ts.
module.exports = {
  /** RegExp para getByTestId: coincide con el marcador de pantalla o de marco. */
  destinationMarker(id) {
    return new RegExp(`^(screen|destination)-${id}$`);
  },
};
