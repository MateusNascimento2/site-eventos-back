const LAYOUTS = [
  { id: 'basico', name: 'Básico' },
  { id: 'praia', name: 'Praia' },
  { id: 'luz', name: 'Luz' },
  { id: 'infantil', name: 'Infantil' },
  { id: 'corporativo', name: 'Corporativo' },
];

const LAYOUT_PADRAO = LAYOUTS[0].id;

function layoutExiste(id) {
  return LAYOUTS.some((layout) => layout.id === id);
}

// Evento antigo com layout que não existe mais volta para o padrão
function layoutOuPadrao(id) {
  return layoutExiste(id) ? id : LAYOUT_PADRAO;
}

module.exports = { LAYOUTS, LAYOUT_PADRAO, layoutExiste, layoutOuPadrao };
