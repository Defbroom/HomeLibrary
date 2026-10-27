/** Разрешение ссылок для страницы. Исходные записи и справочники не изменяются. */
(function () {
  const library = window.LIBRARY;
  const kinds = ["authors", "cabinets", "shelves", "rows", "positions", "series"];
  const indexes = {};
  kinds.forEach((kind) => {
    indexes[kind] = new Map(library[kind].map((entry) => [entry.id, entry]));
    if (indexes[kind].size !== library[kind].length) {
      throw new Error(`Повторяющиеся идентификаторы в справочнике ${kind}`);
    }
  });

  function entity(kind, id) {
    if (id === null) return null;
    const value = indexes[kind].get(id);
    if (!value) throw new Error(`Не найдена ссылка ${kind}: ${id}`);
    return value;
  }

  const bookIds = new Set();
  library.catalog = library.books.map((book) => {
    if (!book.id || bookIds.has(book.id)) throw new Error("Некорректный идентификатор книги");
    bookIds.add(book.id);
    const author = entity("authors", book.authorId);
    const cabinet = entity("cabinets", book.cabinetId);
    const shelf = entity("shelves", book.shelfId);
    const row = entity("rows", book.rowId);
    const position = entity("positions", book.positionId);
    const series = entity("series", book.seriesId);
    if (!cabinet) throw new Error(`Не указан шкаф книги ${book.id}`);
    return {
      ...book,
      author: author ? author.name : "",
      cabinet: cabinet.name,
      shelf: shelf ? shelf.name : "",
      row: row ? row.id : "",
      position: position ? position.id : "",
      series: series ? series.name : "",
    };
  });
})();
