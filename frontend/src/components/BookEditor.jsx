import React, { useState, useEffect } from "react";
import InputField from "./InputField";
import { isbnInUse } from "../libraryUtils";

function BookEditor(props) {
  const bookBeingEdited = props.bookBeingEdited;
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [isbn, setIsbn] = useState("");
  const [quantity, setQuantity] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(
    function () {
      if (bookBeingEdited !== null) {
        setTitle(bookBeingEdited.title);
        setAuthor(bookBeingEdited.author);
        setGenre(bookBeingEdited.genre);
        setIsbn(bookBeingEdited.isbn);
        setQuantity(String(bookBeingEdited.quantity));
      } else {
        setTitle("");
        setAuthor("");
        setGenre("");
        setIsbn("");
        setQuantity("");
      }
      setFieldErrors({});
    },
    [bookBeingEdited],
  );

  function handleTitleChange(event) {
    setTitle(event.target.value);
  }

  function handleAuthorChange(event) {
    setAuthor(event.target.value);
  }

  function handleGenreChange(event) {
    setGenre(event.target.value);
  }

  function handleIsbnChange(event) {
    setIsbn(event.target.value);
  }

  function handleQuantityChange(event) {
    setQuantity(event.target.value);
  }

  function checkFields() {
    const problems = {};
    if (title.trim() === "") {
      problems.title = "Please enter the book title.";
    }
    if (author.trim() === "") {
      problems.author = "Please enter the author's name.";
    }
    if (genre.trim() === "") {
      problems.genre = "Please enter the genre.";
    }
    if (isbn.trim() === "") {
      problems.isbn = "Please enter the ISBN.";
    } else {
      let digitsOnly = isbn.replace(/-/g, "");
      digitsOnly = digitsOnly.replace(/ /g, "");
      const isTenDigits = /^[0-9]{9}[0-9Xx]$/.test(digitsOnly);
      const isThirteenDigits = /^[0-9]{13}$/.test(digitsOnly);
      if (isTenDigits === false && isThirteenDigits === false) {
        problems.isbn = "An ISBN must have 10 or 13 digits (dashes are allowed).";
      } else {
        let ignoreId = null;
        if (bookBeingEdited !== null) {
          ignoreId = bookBeingEdited.id;
        }
        if (isbnInUse(props.books || [], isbn, ignoreId)) {
          problems.isbn = "Another book already uses this ISBN.";
        }
      }
    }
    if (bookBeingEdited === null) {
      if (quantity === "") {
        problems.quantity = "Please enter the quantity.";
      } else if (Number.isInteger(Number(quantity)) === false) {
        problems.quantity = "The quantity must be a whole number.";
      } else if (Number(quantity) < 0) {
        problems.quantity = "The quantity cannot be below 0.";
      }
    }
    setFieldErrors(problems);
    const problemKeys = Object.keys(problems);
    if (problemKeys.length === 0) {
      return true;
    }

    return false;
  }

  async function submitForm(event) {
    event.preventDefault();
    const fieldsOk = checkFields();
    if (fieldsOk === false) {
      return;
    }
    let quantityToStore = Number(quantity);
    if (bookBeingEdited !== null) {
      quantityToStore = bookBeingEdited.quantity;
    }
    const bookData = {
      title: title.trim(),
      author: author.trim(),
      genre: genre.trim(),
      isbn: isbn.trim(),
      quantity: quantityToStore,
    };
    const stored = await props.onCommit(bookData);
    if (stored === true && bookBeingEdited === null) {
      setTitle("");
      setAuthor("");
      setGenre("");
      setIsbn("");
      setQuantity("");
      setFieldErrors({});
    }
  }
  let heading = "Add a New Book";
  let quantityLabel = "Initial Quantity";
  let submitText = "Add Book";
  let cancelButton = null;
  let quantityLocked = false;
  let quantityHint = "";
  if (bookBeingEdited !== null) {
    heading = "Update Book Details";
    quantityLabel = "Quantity in Stock";
    quantityLocked = true;
    quantityHint = "Locked. Change stock on the Transactions page so it is recorded in the history.";
    submitText = "Save Changes";
    cancelButton = (
      <button className="act act-quiet" type="button" onClick={props.onAbort}>
        Cancel
      </button>
    );
  }

  return (
    <div className="box">
      <h2>{heading}</h2>
      <form onSubmit={submitForm} noValidate>
        <div className="fields-grid">
          <InputField
            id="title"
            label="Title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Title"
            error={fieldErrors.title}
          />
          <InputField
            id="author"
            label="Author"
            type="text"
            value={author}
            onChange={handleAuthorChange}
            placeholder="Author"
            error={fieldErrors.author}
          />
          <InputField
            id="genre"
            label="Genre"
            type="text"
            value={genre}
            onChange={handleGenreChange}
            placeholder="Genre"
            error={fieldErrors.genre}
          />
          <InputField
            id="isbn"
            label="ISBN"
            type="text"
            value={isbn}
            onChange={handleIsbnChange}
            placeholder="ISBN"
            error={fieldErrors.isbn}
          />
          <InputField
            id="quantity"
            label={quantityLabel}
            type="number"
            min="0"
            value={quantity}
            onChange={handleQuantityChange}
            placeholder="Quantity"
            disabled={quantityLocked}
            hint={quantityHint}
            error={fieldErrors.quantity}
          />
        </div>
        <div className="form-actions">
          <button className="act" type="submit">
            {submitText}
          </button>
          {cancelButton}
        </div>
      </form>
    </div>
  );
}

export default BookEditor;
