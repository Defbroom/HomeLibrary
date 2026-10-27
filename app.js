const ROW_LABEL = Object.fromEntries(window.LIBRARY.rows.map((row) => [row.id, row.name]));
const POSITION_LABEL = Object.fromEntries(window.LIBRARY.positions.map((position) => [position.id, position.name]));

const books = window.LIBRARY.catalog;
const state = { query: "", authorId: "", cabinetId: "", shelfId: "", rowId: "", positionId: "", seriesId: "" };

const queryInput = document.getElementById("query");
const filtersEl = document.getElementById("filters");
const resultsEl = document.getElementById("results");
const countEl = document.getElementById("count");

function labelRow(value) {
  return ROW_LABEL[value] || value;
}

function labelPosition(value) {
  return POSITION_LABEL[value] || value;
}

function matches(book) {
  const q = state.query.trim().toLowerCase();
  const haystack = [book.title, book.author, book.cabinet, book.shelf, book.notes, book.series]
    .join(" ")
    .toLowerCase();
  if (q && !haystack.includes(q)) return false;
  for (const key of ["authorId", "cabinetId", "shelfId", "rowId", "positionId", "seriesId"]) {
    if (state[key] && book[key] !== state[key]) return false;
  }
  return true;
}

function bookCount(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} книга`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} книги`;
  return `${n} книг`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), "ru")
  );
}

function renderFilters() {
  const fields = [
    { key: "authorId", kind: "authors", label: "Автор", all: "Все авторы" },
    { key: "cabinetId", kind: "cabinets", label: "Шкаф", all: "Все места хранения" },
    { key: "shelfId", kind: "shelves", label: "Полка", all: "Все полки" },
    { key: "rowId", kind: "rows", label: "Ряд", all: "Все ряды" },
    { key: "positionId", kind: "positions", label: "Положение", all: "Все положения" },
    { key: "seriesId", kind: "series", label: "Серия", all: "Все серии" },
  ];
  filtersEl.innerHTML = "";
  fields.forEach((field) => {
    const label = document.createElement("label");
    label.className = "filter-field";
    const caption = document.createElement("span");
    caption.textContent = field.label;
    const select = document.createElement("select");
    select.id = `filter-${field.key}`;
    const all = document.createElement("option");
    all.value = "";
    all.textContent = field.all;
    select.appendChild(all);
    [...window.LIBRARY[field.kind]]
      .sort((a, b) => a.name.localeCompare(b.name, "ru", { numeric: true }))
      .forEach((entity) => {
        const option = document.createElement("option");
        option.value = entity.id;
        option.textContent = entity.name;
        select.appendChild(option);
      });
    select.value = state[field.key];
    select.addEventListener("change", () => {
      state[field.key] = select.value;
      render();
    });
    label.appendChild(caption);
    label.appendChild(select);
    filtersEl.appendChild(label);
  });
  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "reset-filters";
  reset.textContent = "Сбросить фильтры";
  reset.addEventListener("click", () => {
    Object.keys(state).forEach((key) => { state[key] = ""; });
    queryInput.value = "";
    renderFilters();
    render();
  });
  filtersEl.appendChild(reset);
}

function card(book) {
  const article = document.createElement("article");
  article.className = "card";
  article.innerHTML = `
    <h4></h4>
    <p class="author"></p>
    <div class="place">
      <span></span><span></span><span></span><span></span>
    </div>
  `;
  article.querySelector("h4").textContent = book.title;
  article.querySelector(".author").textContent = book.author || "Автор не указан";
  const places = article.querySelectorAll(".place span");
  places[0].textContent = book.cabinet;
  places[1].textContent = book.shelf || "Полка не указана";
  places[2].textContent = book.row ? labelRow(book.row) : "Ряд не указан";
  places[3].textContent = book.position ? labelPosition(book.position) : "Положение не указано";
  const details = [
    book.series && `Серия: ${book.series}`,
    book.notes && `Примечание: ${book.notes}`,
    book.rare && "Раритет",
  ].filter(Boolean);
  details.forEach((text) => {
    const detail = document.createElement("p");
    detail.className = "detail";
    detail.textContent = text;
    article.appendChild(detail);
  });
  return article;
}

function render() {
  const found = books.filter(matches);
  countEl.textContent = "";
  if (books.length) {
    const number = document.createElement("strong");
    number.textContent = String(found.length);
    countEl.appendChild(number);
    countEl.appendChild(document.createTextNode(bookCount(found.length).slice(String(found.length).length)));
  } else {
    countEl.textContent = "пока пусто";
  }
  resultsEl.innerHTML = "";

  if (!found.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = books.length
      ? "Ничего не нашлось. Попробуйте другое название или снимите фильтр."
      : "Каталог пуст. Назовите книгу в чате: название, автор, шкаф, полка, ряд и положение.";
    resultsEl.appendChild(empty);
    return;
  }

  const cabinets = unique(found.map((book) => book.cabinet));
  cabinets.forEach((cabinet) => {
    const group = document.createElement("section");
    group.className = "group";
    const heading = document.createElement("h2");
    heading.textContent = cabinet;
    group.appendChild(heading);

    const shelves = unique(
      found.filter((book) => book.cabinet === cabinet).map((book) => book.shelf || "Полка не указана")
    );
    shelves.forEach((shelf) => {
      const block = document.createElement("div");
      block.className = "shelf";
      const shelfHeading = document.createElement("h3");
      shelfHeading.textContent = shelf;
      block.appendChild(shelfHeading);
      const list = document.createElement("div");
      list.className = "cards";
      found
        .filter((book) => book.cabinet === cabinet && (book.shelf || "Полка не указана") === shelf)
        .forEach((book) => list.appendChild(card(book)));
      block.appendChild(list);
      group.appendChild(block);
    });

    resultsEl.appendChild(group);
  });
}

queryInput.addEventListener("input", () => {
  state.query = queryInput.value;
  render();
});

renderFilters();
render();
