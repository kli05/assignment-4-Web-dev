import React, { useState, useEffect, useCallback } from "react";
import PageTitle from "../components/PageTitle";
import Notice from "../components/Notice";
import BookEditor from "../components/BookEditor";
import BookTable from "../components/BookTable";
import { fetchBooks, createBook, editBook, removeBook } from "../serverApi";

function CatalogPage(props) {
  const [books, setBooks] = useState([]);
  const [bookBeingEdited, setBookBeingEdited] = useState(null);
  const [noticeKind, setNoticeKind] = useState("success");
  const [noticeText, setNoticeText] = useState("");

  const flash = useCallback(function (type, text) {
    setNoticeKind(type);
    setNoticeText(text);
  }, []);

  const refreshBooks = useCallback(
    async function () {
      try {
        const bookList = await fetchBooks();
        setBooks(bookList);
      } catch (error) {
        flash("error", error.message);
      }
    },
    [flash],
  );

  useEffect(
    function () {
      refreshBooks();
    },
    [refreshBooks],
  );

  const dismissNotice = useCallback(function () {
    setNoticeText("");
  }, []);

  async function submitBook(bookData) {
    try {
      if (bookBeingEdited !== null) {
        await editBook(bookBeingEdited.id, bookData);
        flash("success", '"' + bookData.title + '" was updated.');
        setBookBeingEdited(null);
      } else {
        await createBook(bookData, props.activeUser.id);
        flash("success", '"' + bookData.title + '" was added to the library.');
      }
      await refreshBooks();
      return true;
    } catch (error) {
      flash("error", error.message);
      return false;
    }
  }

  function beginEdit(book) {
    setBookBeingEdited(book);
    setNoticeText("");
    window.scrollTo(0, 0);
  }

  async function confirmDelete(book) {
    const confirmed = window.confirm('Are you sure you want to delete "' + book.title + '"?');
    if (confirmed === false) {
      return;
    }
    try {
      await removeBook(book.id);
      await refreshBooks();
      if (bookBeingEdited !== null && bookBeingEdited.id === book.id) {
        setBookBeingEdited(null);
      }
      flash("success", '"' + book.title + '" was deleted.');
    } catch (error) {
      flash("error", error.message);
    }
  }

  function stopEditing() {
    setBookBeingEdited(null);
  }

  return (
    <div>
      <PageTitle title="Catalog" />

      <Notice type={noticeKind} text={noticeText} onDismiss={dismissNotice} />

      <BookEditor
        bookBeingEdited={bookBeingEdited}
        books={books}
        onCommit={submitBook}
        onAbort={stopEditing}
      />

      <div className="box">
        <h2>All Books ({books.length})</h2>
        <BookTable books={books} onEdit={beginEdit} onRemove={confirmDelete} />
      </div>
    </div>
  );
}

export default CatalogPage;
