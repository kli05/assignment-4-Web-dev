import React from "react";

function CheckoutButton(props) {
  const book = props.book;
  let alreadyBorrowed = false;
  for (let i = 0; i < props.heldBookIds.length; i = i + 1) {
    if (props.heldBookIds[i] === book.id) {
      alreadyBorrowed = true;
    }
  }

  function handleClick() {
    props.onCheckout(book);
  }
  let buttonText = "Borrow";
  let isDisabled = false;
  if (alreadyBorrowed === true) {
    buttonText = "Already Borrowed";
    isDisabled = true;
  } else if (book.quantity <= 0) {
    buttonText = "Unavailable";
    isDisabled = true;
  }

  return (
    <button type="button" disabled={isDisabled} onClick={handleClick}>
      {buttonText}
    </button>
  );
}

export default CheckoutButton;
