import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import PageTitle from "../components/PageTitle";
import MetricCard from "../components/MetricCard";
import Notice from "../components/Notice";
import BookTile from "../components/BookTile";
import StockTable from "../components/StockTable";
import { fetchBooks, fetchAccounts, fetchLoans, checkoutBook } from "../serverApi";
import { LOW_STOCK_THRESHOLD, LOAN_LIMIT, LOAN_PERIOD_DAYS, stockLevel, loanState } from "../libraryUtils";

function OverviewPage(props) {
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [records, setRecords] = useState([]);
  const [layoutMode, setLayoutMode] = useState("tiles");
  const [queryText, setQueryText] = useState("");
  const [noticeKind, setNoticeKind] = useState("success");
  const [noticeText, setNoticeText] = useState("");
  const isMember = props.activeUser.role === "member";

  async function refreshAll() {
    try {
      const bookList = await fetchBooks();
      const userList = await fetchAccounts();
      const recordList = await fetchLoans();
      setBooks(bookList);
      setUsers(userList);
      setRecords(recordList);
    } catch (error) {
      setNoticeKind("error");
      setNoticeText(error.message);
    }
  }

  useEffect(function () {
    refreshAll();
  }, []);

  const dismissNotice = useCallback(function () {
    setNoticeText("");
  }, []);

  function handleQueryChange(event) {
    setQueryText(event.target.value);
  }

  function switchToTiles() {
    setLayoutMode("tiles");
  }

  function switchToTable() {
    setLayoutMode("table");
  }

  async function handleCheckout(book) {
    try {
      const result = await checkoutBook(book.id, props.activeUser.id, 1, props.activeUser.id);
      setNoticeKind("success");
      setNoticeText(result.message);
    } catch (error) {
      setNoticeKind("error");
      setNoticeText(error.message);
    }
    await refreshAll();
  }
  let totalCopies = 0;
  let lowStockCount = 0;
  const lowStockBooks = [];
  for (let i = 0; i < books.length; i = i + 1) {
    totalCopies = totalCopies + books[i].quantity;
    if (stockLevel(books[i].quantity) !== "ok") {
      lowStockCount = lowStockCount + 1;
      lowStockBooks.push(books[i]);
    }
  }
  let memberCount = 0;
  for (let j = 0; j < users.length; j = j + 1) {
    if (users[j].role === "member") {
      memberCount = memberCount + 1;
    }
  }
  let booksOnLoan = 0;
  let overdueCount = 0;
  let myLoanCount = 0;
  let myOverdueCount = 0;
  const myHeldBookIds = [];
  for (let r = 0; r < records.length; r = r + 1) {
    const record = records[r];
    if (record.returnedAt === null) {
      booksOnLoan = booksOnLoan + 1;
      if (loanState(record) === "overdue") {
        overdueCount = overdueCount + 1;
      }
      if (record.userId === props.activeUser.id) {
        myLoanCount = myLoanCount + 1;
        myHeldBookIds.push(record.bookId);
        if (loanState(record) === "overdue") {
          myOverdueCount = myOverdueCount + 1;
        }
      }
    }
  }
  const search = queryText.trim().toLowerCase();
  const shownBooks = [];
  for (let k = 0; k < books.length; k = k + 1) {
    const book = books[k];
    const allText = (book.title + " " + book.author + " " + book.genre + " " + book.isbn).toLowerCase();
    if (search === "" || allText.indexOf(search) !== -1) {
      shownBooks.push(book);
    }
  }
  let lowStockBanner = null;
  if (isMember === false && lowStockBooks.length > 0) {
    let warningText = "";
    for (let m = 0; m < lowStockBooks.length; m = m + 1) {
      warningText = warningText + lowStockBooks[m].title + " (" + lowStockBooks[m].quantity + " left)";
      if (m < lowStockBooks.length - 1) {
        warningText = warningText + ", ";
      }
    }
    lowStockBanner = (
      <div className="notice notice-warning">
        <strong>Running low:</strong> {warningText}
      </div>
    );
  }
  let overdueBanner = null;
  if (isMember === false && overdueCount > 0) {
    overdueBanner = (
      <div className="notice notice-error">
        <strong>{overdueCount} book(s) are overdue.</strong> <Link to="/records">See who has them</Link>
      </div>
    );
  }
  if (isMember === true && myOverdueCount > 0) {
    overdueBanner = (
      <div className="notice notice-error">
        <strong>You have {myOverdueCount} overdue book(s).</strong> Please return them on the{" "}
        <Link to="/my-books">My Books</Link> page. You cannot borrow until they are back.
      </div>
    );
  }
  let metricCards = null;
  if (isMember === true) {
    let loansLeft = LOAN_LIMIT - myLoanCount;
    if (loansLeft < 0) {
      loansLeft = 0;
    }
    metricCards = (
      <div className="metrics">
        <MetricCard value={books.length} label="Book titles in the library" />
        <MetricCard value={myLoanCount} label="Books you have borrowed" />
        <MetricCard value={loansLeft} label={"Borrows left (limit is " + LOAN_LIMIT + ")"} />
        <MetricCard value={myOverdueCount} label="Your overdue books" flagged={myOverdueCount > 0} />
      </div>
    );
  } else {
    metricCards = (
      <div className="metrics">
        <MetricCard value={books.length} label="Book titles" />
        <MetricCard value={totalCopies} label="Copies in stock" />
        <MetricCard value={lowStockCount} label="Low or out of stock" flagged={lowStockCount > 0} />
        <MetricCard value={booksOnLoan} label="Books on loan" />
        <MetricCard value={overdueCount} label="Overdue books" flagged={overdueCount > 0} />
        <MetricCard value={memberCount} label="Members" />
      </div>
    );
  }
  let bookView = null;
  if (books.length === 0) {
    bookView = <p className="empty-note">No books have been added to the library yet.</p>;
  } else if (shownBooks.length === 0) {
    bookView = <p className="empty-note">No books match your search.</p>;
  } else if (layoutMode === "table") {
    bookView = (
      <StockTable
        books={shownBooks}
        allowCheckout={isMember}
        heldBookIds={myHeldBookIds}
        onCheckout={handleCheckout}
      />
    );
  } else {
    const cards = [];
    for (let n = 0; n < shownBooks.length; n = n + 1) {
      cards.push(
        <BookTile
          key={shownBooks[n].id}
          book={shownBooks[n]}
          allowCheckout={isMember}
          heldBookIds={myHeldBookIds}
          onCheckout={handleCheckout}
        />,
      );
    }
    bookView = <div className="tile-grid">{cards}</div>;
  }
  let tilesButtonClass = "segment";
  let tableButtonClass = "segment";
  if (layoutMode === "tiles") {
    tilesButtonClass = "segment segment-on";
  } else {
    tableButtonClass = "segment segment-on";
  }
  let headerSubtitle =
    "Here is what is on the shelves right now. Books with " +
    LOW_STOCK_THRESHOLD +
    " or fewer copies are highlighted.";
  if (isMember === true) {
    headerSubtitle =
      "Browse the library and borrow up to " +
      LOAN_LIMIT +
      " books at a time. Each loan lasts " +
      LOAN_PERIOD_DAYS +
      " days.";
  }

  return (
    <div>
      <PageTitle title={isMember === true ? "Browse Books" : "Overview"} />

      {metricCards}

      <Notice type={noticeKind} text={noticeText} onDismiss={dismissNotice} />
      {overdueBanner}
      {lowStockBanner}

      <div className="box">
        <div className="box-head">
          <h2>Book Availability</h2>
          <div className="tools">
            <input
              className="search-box"
              type="text"
              placeholder="Search title, author or genre"
              value={queryText}
              onChange={handleQueryChange}
              aria-label="Search books"
            />
            <div className="segmented">
              <button className={tilesButtonClass} type="button" onClick={switchToTiles}>
                Tiles
              </button>
              <button className={tableButtonClass} type="button" onClick={switchToTable}>
                Table
              </button>
            </div>
          </div>
        </div>
        <p className="box-note">{headerSubtitle}</p>
        {bookView}
      </div>
    </div>
  );
}

export default OverviewPage;
