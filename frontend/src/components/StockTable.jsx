import React from "react";
import CheckoutButton from "./CheckoutButton";
import StockTag from "./StockTag";
import { stockRowClass } from "../libraryUtils";

function StockTable(props) {
  const rows = [];
  for (let i = 0; i < props.books.length; i = i + 1) {
    const book = props.books[i];
    const rowClass = stockRowClass(book.quantity);
    let borrowCell = null;
    if (props.allowCheckout === true) {
      borrowCell = (
        <td>
          <div className="row-actions">
            <CheckoutButton book={book} heldBookIds={props.heldBookIds} onCheckout={props.onCheckout} />
          </div>
        </td>
      );
    }
    rows.push(
      <tr key={book.id} className={rowClass}>
        <td>{book.title}</td>
        <td>{book.author}</td>
        <td>{book.genre}</td>
        <td>{book.isbn}</td>
        <td>{book.quantity}</td>
        <td>
          <StockTag quantity={book.quantity} />
        </td>
        {borrowCell}
      </tr>,
    );
  }
  let borrowHeading = null;
  if (props.allowCheckout === true) {
    borrowHeading = <th>Action</th>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>ISBN</th>
            <th>Quantity</th>
            <th>Status</th>
            {borrowHeading}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

export default StockTable;
