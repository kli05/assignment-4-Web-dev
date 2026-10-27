import React, { useState } from "react";
import InputField from "./InputField";
import DropdownField from "./DropdownField";

function StockAdjustForm(props) {
  const [bookId, setBookId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [memberId, setMemberId] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  function handleBookChange(event) {
    setBookId(event.target.value);
  }

  function handleQuantityChange(event) {
    setQuantity(event.target.value);
  }

  function handleMemberChange(event) {
    setMemberId(event.target.value);
  }

  function pickedBook() {
    for (let i = 0; i < props.books.length; i = i + 1) {
      if (props.books[i].id === bookId) {
        return props.books[i];
      }
    }

    return null;
  }

  function checkFields(type) {
    const problems = {};
    const selectedBook = pickedBook();
    if (bookId === "" || selectedBook === null) {
      problems.bookId = "Please choose a book.";
    }
    if (quantity === "") {
      problems.quantity = "Please enter a quantity.";
    } else if (Number.isInteger(Number(quantity)) === false) {
      problems.quantity = "The quantity must be a whole number.";
    } else if (Number(quantity) < 1) {
      problems.quantity = "The quantity must be at least 1.";
    } else if (type === "deduct" && selectedBook !== null && Number(quantity) > selectedBook.quantity) {
      problems.quantity = "Only " + selectedBook.quantity + " copies are in stock.";
    }
    setFieldErrors(problems);
    const problemKeys = Object.keys(problems);
    if (problemKeys.length === 0) {
      return true;
    }

    return false;
  }

  async function submitStockChange(type) {
    const fieldsOk = checkFields(type);
    if (fieldsOk === false) {
      return;
    }
    let memberForSave = "";
    if (type === "deduct") {
      memberForSave = memberId;
    }
    const succeeded = await props.onStockChange(bookId, type, Number(quantity), memberForSave);
    if (succeeded === true) {
      setQuantity("");
    }
  }

  function handleAddPress() {
    submitStockChange("add");
  }

  function handleDeductPress() {
    submitStockChange("deduct");
  }

  function submitForm(event) {
    event.preventDefault();
  }
  const bookChoices = [
    {
      value: "",
      label: "Choose a book",
    },
  ];
  for (let i = 0; i < props.books.length; i = i + 1) {
    const book = props.books[i];
    bookChoices.push({
      value: book.id,
      label: book.title + " (in stock: " + book.quantity + ")",
    });
  }
  const memberChoices = [
    {
      value: "",
      label: "Borrowed by (optional, for deductions)",
    },
  ];
  for (let j = 0; j < props.members.length; j = j + 1) {
    const member = props.members[j];
    memberChoices.push({
      value: member.id,
      label: member.name + " (" + member.membershipId + ")",
    });
  }

  return (
    <div className="box">
      <h2>Add or Deduct Stock</h2>
      <p className="box-note">
        Use <strong>Add Stock</strong> when new copies arrive. Use <strong>Deduct Stock</strong> when copies
        leave the shelf. If you choose a member, the book is checked out to them and shows up in Borrow
        Records.
      </p>
      <form onSubmit={submitForm} noValidate>
        <div className="fields-grid">
          <DropdownField
            id="bookId"
            label="Book"
            value={bookId}
            onChange={handleBookChange}
            options={bookChoices}
            error={fieldErrors.bookId}
          />
          <InputField
            id="quantity"
            label="Quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={handleQuantityChange}
            placeholder="Quantity"
            error={fieldErrors.quantity}
          />
          <DropdownField
            id="memberId"
            label="Borrowed by (optional, for deductions)"
            value={memberId}
            onChange={handleMemberChange}
            options={memberChoices}
          />
        </div>
        <div className="form-actions">
          <button className="act" type="button" onClick={handleAddPress}>
            Add Stock
          </button>
          <button className="act act-danger" type="button" onClick={handleDeductPress}>
            Deduct Stock
          </button>
        </div>
      </form>
    </div>
  );
}

export default StockAdjustForm;
