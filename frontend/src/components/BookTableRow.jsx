import React from "react";
import StockTag from "./StockTag";
import { stockRowClass } from "../libraryUtils";

function BookTableRow(props) {
  const book = props.book;

  function beginEdit() {
    props.onEdit(book);
  }

  function confirmDelete() {
    props.onRemove(book);
  }
  const rowClass = stockRowClass(book.quantity);

  return (
    <tr className={rowClass}>
      <td>{book.title}</td>
      <td>{book.author}</td>
      <td>{book.genre}</td>
      <td>{book.isbn}</td>
      <td>
        {book.quantity} <StockTag quantity={book.quantity} />
      </td>
      <td>
        <div className="row-actions">
          <button type="button" onClick={beginEdit}>
            Update
          </button>
          <button className="is-danger" type="button" onClick={confirmDelete}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default BookTableRow;
