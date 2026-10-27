import React from "react";
import CheckoutButton from "./CheckoutButton";
import StockTag from "./StockTag";
import { stockTileClass } from "../libraryUtils";

function BookTile(props) {
  const book = props.book;
  const cardClass = stockTileClass(book.quantity);
  let borrowArea = null;
  if (props.allowCheckout === true) {
    borrowArea = (
      <div className="tile-action row-actions">
        <CheckoutButton book={book} heldBookIds={props.heldBookIds} onCheckout={props.onCheckout} />
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <span className="tile-genre">{book.genre}</span>
      <h3>{book.title}</h3>
      <p className="tile-author">by {book.author}</p>
      <p className="tile-isbn">ISBN: {book.isbn}</p>
      <div className="tile-foot">
        <span className="tile-count">
          {book.quantity}
          <small> in stock</small>
        </span>
        <StockTag quantity={book.quantity} />
      </div>
      {borrowArea}
    </div>
  );
}

export default BookTile;
